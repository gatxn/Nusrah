import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getConversations } from "@/lib/messages";
import { UNAUTHENTICATED } from "@/lib/api";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const conversations = await getConversations(userId);
  return NextResponse.json({ conversations });
}
