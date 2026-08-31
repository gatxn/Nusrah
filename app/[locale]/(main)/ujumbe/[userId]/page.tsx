import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { getThreadMessages, getSendPermission } from "@/lib/messages";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import ThreadView from "@/components/ujumbe/ThreadView";
import ReportUserModal from "@/components/wanachama/ReportUserModal";

export default async function UjumbeThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewerId = await getSessionUserId();
  if (!viewerId) redirect("/ingia");
  const { userId: otherUserId } = await params;

  const [tier, viewer, target] = await Promise.all([
    getEffectiveTier(viewerId),
    prisma.profile.findUnique({ where: { userId: viewerId }, select: { gender: true } }),
    prisma.profile.findUnique({
      where: { userId: otherUserId },
      select: { gender: true, photoUpdatedAt: true, user: { select: { name: true } } },
    }),
  ]);

  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) notFound();
  if (await isBlocked(viewerId, otherUserId)) notFound();

  const [messages, permission] = await Promise.all([
    getThreadMessages(viewerId, otherUserId),
    getSendPermission(viewerId, otherUserId, tier),
  ]);

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              {target.photoUpdatedAt ? (
                // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route
                <img
                  src={`/api/profiles/${otherUserId}/photo`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarIllustration name={target.user.name} className="h-10 w-10" />
              )}
            </div>
            <h1 className="text-lg font-bold text-navy">{target.user.name}</h1>
          </div>
          <ReportUserModal userId={otherUserId} userName={target.user.name} />
        </div>

        <ThreadView
          viewerId={viewerId}
          otherUserId={otherUserId}
          canSend={permission.canSend}
          blockedReason={permission.reason}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
