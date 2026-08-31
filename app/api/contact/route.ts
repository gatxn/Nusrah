import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { contactFormSchema } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { formatTicketNumber } from "@/lib/support";

const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "contact"), 5, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError("Umetuma ujumbe mara nyingi mno. Jaribu tena baadaye.", 429);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Data si sahihi", 400);

  const parsed = contactFormSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") || undefined,
    category: form.get("category") || undefined,
    subject: form.get("subject") || undefined,
    body: form.get("body"),
  });
  if (!parsed.success) return zodError(parsed.error);

  let attachmentEnc: Uint8Array<ArrayBuffer> | undefined;
  let attachmentMimeType: string | undefined;
  const attachment = form.get("attachment");
  if (attachment instanceof File && attachment.size > 0) {
    if (!ALLOWED_ATTACHMENT_TYPES.includes(attachment.type)) {
      return jsonError("Aina ya faili si sahihi", 400);
    }
    if (attachment.size > MAX_ATTACHMENT_BYTES) {
      return jsonError("Faili ni kubwa mno", 400);
    }
    attachmentEnc = Buffer.from(await attachment.arrayBuffer());
    attachmentMimeType = attachment.type;
  }

  const userId = await getSessionUserId();

  const created = await prisma.contactMessage.create({
    data: {
      userId: userId ?? undefined,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      category: parsed.data.category || undefined,
      subject: parsed.data.subject || undefined,
      body: parsed.data.body,
      attachmentEnc,
      attachmentMimeType,
    },
  });

  return NextResponse.json(
    {
      message: "Ujumbe wako umepokelewa. Tutakujibu hivi karibuni.",
      ticketNumber: formatTicketNumber(created.ticketSeq),
    },
    { status: 201 }
  );
}
