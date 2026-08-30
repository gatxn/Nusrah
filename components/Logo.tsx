import Image from "next/image";
import LocaleLink from "@/components/LocaleLink";

export default function Logo({ tagline }: { tagline: { line1: string; line2: string } }) {
  return (
    <LocaleLink href="/" className="flex items-center gap-3 shrink-0">
      <Image
        src="/images/nusrah-logo.png"
        alt=""
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 object-contain"
        priority
      />
      <span className="flex flex-col gap-px leading-none">
        <span className="font-heading text-2xl font-bold tracking-tight text-navy">Nusrah</span>
        <span className="text-[11px] leading-tight tracking-wide text-muted">{tagline.line1}</span>
        <span className="text-[11px] leading-tight tracking-wide text-muted">{tagline.line2}</span>
      </span>
    </LocaleLink>
  );
}
