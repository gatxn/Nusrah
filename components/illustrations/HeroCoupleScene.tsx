/**
 * Flat-illustration, non-photorealistic, non-identifiable couple scene for
 * the hero visual. Built as separate layered <g> groups (watermark, ground,
 * each figure's head/hijab/kanzu/body/arm, decorative accents) — no raster
 * image, no photo. Motion around it (floating hearts, sakura petals) is
 * handled by the parent (see components/HeroAnimated.tsx); this scene
 * itself is static so it reads cleanly through the arch-shaped mask.
 */
export default function HeroCoupleScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 420"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Mchoro wa wanandoa wa Kiislamu wakiwa wamesimama kwa heshima, mbali kidogo, wakitabasamu"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbe6ea" />
          <stop offset="100%" stopColor="#f5cdd6" />
        </linearGradient>
        <linearGradient id="femaleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c85678" />
          <stop offset="100%" stopColor="#8f2c47" />
        </linearGradient>
        <linearGradient id="femaleHijabGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b03a5b" />
          <stop offset="100%" stopColor="#7a2440" />
        </linearGradient>
        <linearGradient id="maleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2c4d" />
          <stop offset="100%" stopColor="#101b33" />
        </linearGradient>
        <radialGradient id="groundGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8b8c4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e8b8c4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="240" cy="210" r="200" fill="url(#bgGrad)" />

      {/* Faint arabesque + mosque-silhouette watermark */}
      <g opacity="0.16">
        <circle cx="240" cy="210" r="155" fill="none" stroke="#b03a5b" strokeWidth="1.5" />
        <circle cx="240" cy="210" r="122" fill="none" stroke="#b03a5b" strokeWidth="1.5" />
        <path d="M240 55 L240 365 M85 210 L395 210" stroke="#b03a5b" strokeWidth="1.2" />
        <path
          d="M170 118c0-16 13-29 29-29s29 13 29 29v6h-58v-6Z"
          fill="none"
          stroke="#101b33"
          strokeWidth="1.4"
        />
        <rect x="165" y="124" width="68" height="10" fill="none" stroke="#101b33" strokeWidth="1.4" />
        <rect x="152" y="100" width="6" height="34" fill="none" stroke="#101b33" strokeWidth="1.2" />
        <rect x="242" y="100" width="6" height="34" fill="none" stroke="#101b33" strokeWidth="1.2" />
      </g>

      {/* Soft ground platform the two figures stand on */}
      <ellipse cx="240" cy="352" rx="150" ry="26" fill="url(#groundGrad)" />

      {/* Female figure */}
      <g transform="translate(128,108)">
        <path d="M18 118c-10 14-14 34-12 66h16c0-30 4-48 12-60Z" fill="url(#femaleGrad)" />
        <path d="M20 132c0-32 62-32 62 0v22c27 7 42 32 42 74v96H-2v-96c0-42 15-67 42-74Z" fill="url(#femaleGrad)" />
        <path d="M20 132c0-16 15-25 31-27v220H-2v-96c0-42 15-67 42-74Z" fill="#000000" opacity="0.08" />
        <path
          d="M22 40c8-24 62-24 68 4 16 8 22 28 18 46-4 20-16 30-49 28-33-2-52-14-53-38-1-16 6-30 16-40Z"
          fill="url(#femaleHijabGrad)"
        />
        <circle cx="51" cy="50" r="27" fill="#f3d3ba" />
        <circle cx="42" cy="50" r="2.4" fill="#3a2418" />
        <circle cx="60" cy="50" r="2.4" fill="#3a2418" />
        <path d="M42 60c5 6 15 6 20 0" stroke="#3a2418" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* Male figure */}
      <g transform="translate(250,100)">
        <path d="M92 118c10 14 14 34 12 66H88c0-30-4-48-12-60Z" fill="url(#maleGrad)" />
        <path d="M35 128c0-30 58-30 58 0v16c26 9 39 34 39 78v100H-4v-100c0-44 13-69 39-78Z" fill="url(#maleGrad)" />
        <path d="M64 128c0-14-14-22-29-24v226H-4v-100c0-44 13-69 39-78Z" fill="#ffffff" opacity="0.06" />
        <rect x="52" y="118" width="20" height="14" rx="4" fill="#0c1526" />
        <circle cx="62" cy="42" r="26" fill="#e8bf9e" />
        <circle cx="54" cy="42" r="2.3" fill="#2a1c10" />
        <circle cx="70" cy="42" r="2.3" fill="#2a1c10" />
        <path d="M53 52c5 5 14 5 19 0" stroke="#2a1c10" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* Small decorative sparkles */}
      <path d="M118 88c8 0 8 8 16 8-8 0-8 8-16 8 0-8 0-8-8-8 8 0 8 0 8-8Z" fill="#b03a5b" />
      <path d="M356 150c7 0 7 7 14 7-7 0-7 7-14 7 0-7 0-7-7-7 7 0 7 0 7-7Z" fill="#c8952e" />

      {/* Crescent moon — Islamic motif */}
      <g transform="translate(370,72)">
        <path d="M18 0a18 18 0 1 0 0 36 14 14 0 1 1 0-36Z" fill="#c8952e" />
      </g>
    </svg>
  );
}
