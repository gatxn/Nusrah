const PALETTES = [
  ["#b03a5b", "#8f2c47"],
  ["#101b33", "#1c2c4d"],
  ["#c8952e", "#a8781f"],
  ["#7c4dbd", "#5f3893"],
  ["#7c8aa5", "#5c6a86"],
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

export default function AvatarIllustration({
  name,
  className = "w-14 h-14",
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const [from, to] = paletteFor(name);

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={name}>
      <defs>
        <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#grad-${name})`} />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        fontWeight="700"
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui"
      >
        {initials}
      </text>
    </svg>
  );
}
