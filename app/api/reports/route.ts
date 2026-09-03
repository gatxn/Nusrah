import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { createReportCreateSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

const ALLOWED_EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const t = await apiErrors(request);

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError(t.invalidFormData, 400);

  const v = await validationMessages(request);
  const parsed = createReportCreateSchema(v).safeParse({
    reportedUserId: form.get("reportedUserId"),
    reason: form.get("reason"),
    description: form.get("description"),
    blockAfterSubmit: form.get("blockAfterSubmit"),
  });
  if (!parsed.success) return zodError(parsed.error);
  const { reportedUserId, reason, description, blockAfterSubmit } = parsed.data;

  if (reportedUserId === userId) {
    return jsonError(t.cannotReportSelf, 400);
  }

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: reportedUserId }, select: { gender: true } }),
  ]);
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND(request);

  let evidenceEnc: Uint8Array<ArrayBuffer> | undefined;
  let evidenceMimeType: string | undefined;
  const evidence = form.get("evidence");
  if (evidence instanceof File && evidence.size > 0) {
    if (!ALLOWED_EVIDENCE_TYPES.includes(evidence.type)) {
      return jsonError(t.invalidFileType, 400);
    }
    if (evidence.size > MAX_EVIDENCE_BYTES) {
      return jsonError(t.fileTooLarge, 400);
    }
    evidenceEnc = Buffer.from(await evidence.arrayBuffer());
    evidenceMimeType = evidence.type;
  }

  await prisma.report.create({
    data: {
      reporterId: userId,
      reportedUserId,
      reason,
      description,
      evidenceEnc,
      evidenceMimeType,
    },
  });

  if (blockAfterSubmit) {
    try {
      await prisma.block.create({ data: { blockerId: userId, blockedUserId: reportedUserId } });
    } catch (error) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isDuplicate) throw error;
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
