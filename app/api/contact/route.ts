import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { contactFormSchema } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "contact"), 5, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError("Umetuma ujumbe mara nyingi mno. Jaribu tena baadaye.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const userId = await getSessionUserId();

  await prisma.contactMessage.create({
    data: {
      userId: userId ?? undefined,
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || undefined,
      body: parsed.data.body,
    },
  });

  return NextResponse.json(
    { message: "Ujumbe wako umepokelewa. Tutakujibu hivi karibuni." },
    { status: 201 }
  );
}
