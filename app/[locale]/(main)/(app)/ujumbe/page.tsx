import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getConversations } from "@/lib/messages";
import { formatRelativeSw } from "@/lib/dates";
import { getDictionary } from "@/app/[locale]/dictionaries";
import LocaleLink from "@/components/LocaleLink";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { BellIcon } from "@/components/icons";

export default async function UjumbeePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [conversations, dict] = await Promise.all([getConversations(userId), getDictionary()]);
  const t = dict.ujumbe.list;
  const unreadChats = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">{t.pageHeading}</h1>
          {unreadChats > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-blush-50 px-3 py-1 text-sm font-bold text-primary">
              <BellIcon className="h-4 w-4" />
              {unreadChats > 9 ? t.unreadCap : unreadChats}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>

        {conversations.length === 0 ? (
          <p className="mt-14 text-center text-sm text-neutral-500">{t.emptyState}</p>
        ) : (
          <div className="mt-6 space-y-2">
            {conversations.map((c) => (
              <LocaleLink
                key={c.otherUserId}
                href={`/ujumbe/${c.otherUserId}`}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  {c.otherUserHasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route
                    <img
                      src={`/api/profiles/${c.otherUserId}/photo`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarIllustration name={c.otherUserName} className="h-12 w-12" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate font-semibold ${c.unreadCount > 0 ? "text-navy" : "text-neutral-700"}`}
                    >
                      {c.otherUserName}
                    </p>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {formatRelativeSw(new Date(c.lastMessageAt))}
                    </span>
                  </div>
                  <p
                    className={`truncate text-sm ${
                      c.unreadCount > 0 ? "font-medium text-navy" : "text-neutral-500"
                    }`}
                  >
                    {c.lastMessageWasMine ? t.youPrefix : ""}
                    {c.lastMessageBody}
                  </p>
                </div>

                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                    {c.unreadCount > 9 ? t.unreadCap : c.unreadCount}
                  </span>
                )}
              </LocaleLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
