export function renderKoalaSVG({ name, stage, color }, { big=false } = {}) {
  // stage influences size/decoration very lightly (kid sees it)
  const size = big ? 260 : 160;
  const faceScale = stage === 1 ? 0.92 : stage === 2 ? 0.98 : stage === 3 ? 1.04 : stage === 4 ? 1.08 : 1.12;

  const palette = {
    lavender: { bg:"#C8B9FF", hi:"#ffffff", line:"rgba(15,23,42,.20)" },
    mint:     { bg:"#BFE8C6", hi:"#ffffff", line:"rgba(15,23,42,.20)" },
    sky:      { bg:"#A7D8FF", hi:"#ffffff", line:"rgba(15,23,42,.20)" }
  }[color] || { bg:"#C8B9FF", hi:"#ffffff", line:"rgba(15,23,42,.20)" };

  // very cute, clear koala. Eyes blink with CSS class.
  return `
  <div class="koalaAnim" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
    <svg viewBox="0 0 200 200" width="${size}" height="${size}" aria-label="${escapeHtml(name||"Koala")}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${palette.bg}" stop-opacity="1"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity=".75"/>
        </linearGradient>
      </defs>

      <!-- soft backdrop -->
      <rect x="20" y="20" width="160" height="160" rx="34" fill="url(#bg)" opacity=".55"/>

      <!-- ears -->
      <g transform="translate(0,0)">
        <circle cx="60" cy="72" r="30" fill="rgba(255,255,255,.28)" stroke="${palette.line}" stroke-width="4"/>
        <circle cx="140" cy="72" r="30" fill="rgba(255,255,255,.28)" stroke="${palette.line}" stroke-width="4"/>
        <circle cx="60" cy="72" r="16" fill="rgba(15,23,42,.10)"/>
        <circle cx="140" cy="72" r="16" fill="rgba(15,23,42,.10)"/>
      </g>

      <!-- head -->
      <g transform="translate(100,110) scale(${faceScale}) translate(-100,-110)">
        <ellipse cx="100" cy="118" rx="62" ry="58" fill="rgba(255,255,255,.22)" stroke="${palette.line}" stroke-width="4"/>
        <!-- cheeks -->
        <circle cx="72" cy="130" r="10" fill="rgba(255,120,170,.18)"/>
        <circle cx="128" cy="130" r="10" fill="rgba(255,120,170,.18)"/>

        <!-- eyes -->
        <g class="eyeBlink">
          <circle cx="82" cy="108" r="7" fill="rgba(15,23,42,.86)"/>
          <circle cx="118" cy="108" r="7" fill="rgba(15,23,42,.86)"/>
          <circle cx="79" cy="105" r="2.4" fill="rgba(255,255,255,.85)"/>
          <circle cx="115" cy="105" r="2.4" fill="rgba(255,255,255,.85)"/>
        </g>

        <!-- nose -->
        <path d="M100 116
                 C86 116 78 126 78 139
                 C78 156 89 169 100 169
                 C111 169 122 156 122 139
                 C122 126 114 116 100 116 Z"
              fill="rgba(15,23,42,.22)"/>
        <circle cx="94" cy="128" r="3" fill="rgba(255,255,255,.55)"/>
        <circle cx="106" cy="128" r="3" fill="rgba(255,255,255,.55)"/>

        <!-- stage crown for stage 5 -->
        ${stage >= 5 ? `
          <text x="100" y="70" text-anchor="middle" font-size="26">👑</text>
        ` : ``}
      </g>
    </svg>
  </div>
  `;
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
