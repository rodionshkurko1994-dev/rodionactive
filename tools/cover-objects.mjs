// Бібліотека власних SVG-ілюстрацій для обкладинок (viewBox 0 0 400 400) і вибір предмета за темою статті.
// Усі малюнки — оригінальні, у фірмовій палітрі: білий/лавандовий, помаранчевий #ff6e27, темно-синій.

export const DEFS = `
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c7cbe6"/></linearGradient>
<linearGradient id="w2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f2fb"/><stop offset="1" stop-color="#a3a9d0"/></linearGradient>
<linearGradient id="ws" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bedf"/><stop offset="1" stop-color="#8a90bd"/></linearGradient>
<linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffa36b"/><stop offset="1" stop-color="#e6531a"/></linearGradient>
<linearGradient id="od" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2581f"/><stop offset="1" stop-color="#b5400f"/></linearGradient>
<linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#343a68"/><stop offset="1" stop-color="#1a1e3a"/></linearGradient>
<linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a5290"/><stop offset=".55" stop-color="#262b52"/><stop offset="1" stop-color="#ff6e27" stop-opacity=".55"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be7b8"/><stop offset="1" stop-color="#3fae6e"/></linearGradient>
<linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a9c63"/><stop offset="1" stop-color="#2a7a4c"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset=".5" stop-color="#ffa53d"/><stop offset="1" stop-color="#e9741c"/></linearGradient>
<linearGradient id="goldd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9731c"/><stop offset="1" stop-color="#a9520f"/></linearGradient>
<radialGradient id="shine" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

const rotor = (x, y) => `
<rect x="${x - 13}" y="${y - 4}" width="26" height="24" rx="7" fill="url(#ws)"/>
<ellipse cx="${x}" cy="${y - 6}" rx="74" ry="16" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
<rect x="${x - 58}" y="${y - 10}" width="116" height="7" rx="3.5" fill="#fff" transform="rotate(-8 ${x} ${y - 6})"/>
<circle cx="${x}" cy="${y - 6}" r="7" fill="url(#o)"/>`;

const BRAIN_L = "M200 76 C172 54 122 62 112 100 C78 108 66 148 82 174 C60 200 66 244 98 256 C102 292 140 314 170 302 C184 318 200 314 200 314 Z";
const BRAIN_R = "M200 76 C228 54 278 62 288 100 C322 108 334 148 318 174 C340 200 334 244 302 256 C298 292 260 314 230 302 C216 318 200 314 200 314 Z";
const PAD = "M120 136 H280 C330 136 350 200 360 260 C368 312 326 332 298 302 L268 272 H132 L102 302 C74 332 32 312 40 260 C50 200 70 136 120 136 Z";
const TAG = "M112 108 H252 L326 200 L252 292 H112 Q92 292 92 272 V128 Q92 108 112 108 Z";

const O = {
  drone: `
<path d="M200 205 L100 150 M200 205 L300 150 M200 210 L82 268 M200 210 L318 268" stroke="url(#n)" stroke-width="15" stroke-linecap="round"/>
${rotor(100, 150)}${rotor(300, 150)}
<path d="M168 238 l-14 34 M232 238 l14 34" stroke="url(#ws)" stroke-width="8" stroke-linecap="round"/>
<path d="M136 196 Q200 160 264 196 L254 236 Q200 258 146 236 Z" fill="url(#w)"/>
<path d="M150 200 Q200 176 250 200" stroke="#ff6e27" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="200" cy="250" r="22" fill="url(#n)"/><circle cx="200" cy="250" r="11" fill="url(#o)"/><circle cx="196" cy="246" r="3.5" fill="#fff"/>
${rotor(82, 268)}${rotor(318, 268)}`,

  money: `
<g transform="rotate(-10 200 200)">
<rect x="70" y="150" width="250" height="130" rx="14" fill="url(#gd)"/>
<rect x="80" y="130" width="250" height="130" rx="14" fill="url(#gd)" opacity=".9"/>
<rect x="90" y="108" width="250" height="130" rx="14" fill="url(#g)"/>
<rect x="104" y="122" width="222" height="102" rx="9" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
<circle cx="215" cy="173" r="34" fill="#fff" fill-opacity=".25"/>
<text x="215" y="189" text-anchor="middle" font-family="U" font-size="44" fill="#fff">$</text>
<circle cx="128" cy="140" r="6" fill="#fff" opacity=".7"/><circle cx="302" cy="206" r="6" fill="#fff" opacity=".7"/>
</g>
<g transform="translate(250 250)">
<ellipse cx="0" cy="56" rx="62" ry="20" fill="url(#goldd)"/><rect x="-62" y="36" width="124" height="20" fill="url(#goldd)"/>
<ellipse cx="0" cy="36" rx="62" ry="20" fill="url(#gold)"/>
<ellipse cx="0" cy="26" rx="62" ry="20" fill="url(#goldd)"/><rect x="-62" y="6" width="124" height="20" fill="url(#goldd)"/>
<ellipse cx="0" cy="6" rx="62" ry="20" fill="url(#gold)"/><ellipse cx="0" cy="6" rx="40" ry="12" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
</g>`,

  coin: `
<ellipse cx="200" cy="222" rx="140" ry="140" fill="url(#goldd)"/>
<circle cx="200" cy="200" r="140" fill="url(#gold)"/>
<circle cx="200" cy="200" r="110" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="6"/>
<g stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path d="M200 128 L262 164 L262 236 L200 272 L138 236 L138 164 Z"/>
<path d="M200 128 L200 200 L262 236 M200 200 L138 236"/>
</g>
<g fill="#fff"><circle cx="200" cy="128" r="11"/><circle cx="262" cy="164" r="11"/><circle cx="262" cy="236" r="11"/><circle cx="200" cy="272" r="11"/><circle cx="138" cy="236" r="11"/><circle cx="138" cy="164" r="11"/><circle cx="200" cy="200" r="13" fill="#e9741c" stroke="#fff" stroke-width="5"/></g>
<circle cx="200" cy="200" r="140" fill="url(#shine)"/>`,

  chip: `
<g fill="url(#ws)">${[0, 1, 2, 3, 4, 5].map(i => {
    const p = 118 + i * 33;
    return `<rect x="${p - 6}" y="48" width="12" height="40" rx="4"/><rect x="${p - 6}" y="312" width="12" height="40" rx="4"/><rect x="48" y="${p - 6}" width="40" height="12" rx="4"/><rect x="312" y="${p - 6}" width="40" height="12" rx="4"/>`;
  }).join("")}</g>
<rect x="80" y="92" width="240" height="240" rx="28" fill="#141830" opacity=".6"/>
<rect x="80" y="80" width="240" height="240" rx="28" fill="url(#n)"/>
<rect x="80" y="80" width="240" height="240" rx="28" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="3"/>
<rect x="132" y="132" width="136" height="136" rx="16" fill="url(#o)"/>
<rect x="132" y="132" width="136" height="136" rx="16" fill="url(#shine)"/>
<text x="200" y="222" text-anchor="middle" font-family="U" font-size="58" fill="#fff">AI</text>
<g stroke="#ff6e27" stroke-opacity=".6" stroke-width="3" fill="none"><path d="M108 108 h16 v16 M292 108 h-16 v16 M108 292 h16 v-16 M292 292 h-16 v-16"/></g>`,

  robot: `
<line x1="200" y1="62" x2="200" y2="102" stroke="url(#ws)" stroke-width="10"/>
<circle cx="200" cy="56" r="17" fill="url(#o)"/>
<rect x="64" y="176" width="32" height="76" rx="14" fill="url(#ws)"/><rect x="304" y="176" width="32" height="76" rx="14" fill="url(#ws)"/>
<rect x="88" y="100" width="224" height="210" rx="56" fill="url(#w)"/>
<rect x="114" y="150" width="172" height="96" rx="40" fill="url(#n)"/>
<ellipse cx="164" cy="198" rx="20" ry="22" fill="#ff6e27"/><ellipse cx="236" cy="198" rx="20" ry="22" fill="#ff6e27"/>
<circle cx="158" cy="190" r="6" fill="#fff"/><circle cx="230" cy="190" r="6" fill="#fff"/>
<path d="M172 278 Q200 292 228 278" stroke="#8a90bd" stroke-width="7" fill="none" stroke-linecap="round"/>
<rect x="88" y="100" width="224" height="210" rx="56" fill="url(#shine)"/>`,

  spark: `
<path d="M180 50 C190 140 210 160 300 170 C210 180 190 200 180 290 C170 200 150 180 60 170 C150 160 170 140 180 50 Z" fill="url(#o)"/>
<path d="M180 50 C190 140 210 160 300 170 C210 180 190 200 180 290 C170 200 150 180 60 170 C150 160 170 140 180 50 Z" fill="url(#shine)"/>
<path d="M300 230 C305 272 314 281 356 286 C314 291 305 300 300 342 C295 300 286 291 244 286 C286 281 295 272 300 230 Z" fill="url(#w)"/>
<path d="M290 50 C293 74 298 79 322 82 C298 85 293 90 290 114 C287 90 282 85 258 82 C282 79 287 74 290 50 Z" fill="url(#w)"/>`,

  phone: `
<g transform="rotate(12 200 200)">
<rect x="124" y="46" width="170" height="320" rx="34" fill="#141830" opacity=".55" transform="translate(10 12)"/>
<rect x="116" y="40" width="170" height="320" rx="34" fill="url(#w2)"/>
<rect x="128" y="52" width="146" height="296" rx="24" fill="url(#scr)"/>
<rect x="176" y="62" width="50" height="14" rx="7" fill="#141830"/>
<rect x="148" y="104" width="106" height="64" rx="12" fill="#fff" fill-opacity=".9"/>
<rect x="148" y="182" width="48" height="48" rx="12" fill="#ff6e27"/><rect x="206" y="182" width="48" height="48" rx="12" fill="#fff" fill-opacity=".35"/>
<rect x="148" y="240" width="48" height="48" rx="12" fill="#fff" fill-opacity=".35"/><rect x="206" y="240" width="48" height="48" rx="12" fill="#fff" fill-opacity=".6"/>
<rect x="128" y="52" width="146" height="296" rx="24" fill="url(#shine)"/>
</g>`,

  laptop: `
<path d="M86 92 Q86 76 102 76 H298 Q314 76 314 92 V262 H86 Z" fill="url(#w2)"/>
<rect x="100" y="90" width="200" height="160" rx="8" fill="url(#scr)"/>
<g stroke-linecap="round" stroke-width="9"><path d="M122 124 h60" stroke="#ff6e27"/><path d="M140 148 h90" stroke="#fff" stroke-opacity=".75"/><path d="M140 172 h54" stroke="#fff" stroke-opacity=".5"/><path d="M122 196 h104" stroke="#fff" stroke-opacity=".75"/><path d="M140 220 h40" stroke="#ff6e27" stroke-opacity=".8"/></g>
<path d="M40 268 H360 L336 300 Q330 308 318 308 H82 Q70 308 64 300 Z" fill="url(#w)"/>
<path d="M40 268 H360 L356 274 H44 Z" fill="#8a90bd"/>
<rect x="170" y="276" width="60" height="9" rx="4" fill="#a3a9d0"/>`,

  passport: `
<g transform="rotate(-8 200 200)">
<rect x="104" y="58" width="200" height="290" rx="20" fill="#141830" opacity=".5" transform="translate(10 14)"/>
<rect x="100" y="54" width="200" height="290" rx="20" fill="url(#n)"/>
<rect x="100" y="54" width="22" height="290" rx="10" fill="#141830" opacity=".5"/>
<circle cx="211" cy="170" r="54" fill="none" stroke="#ffa36b" stroke-width="5"/>
<path d="M157 170 h108 M211 116 v108 M211 116 q-34 54 0 108 M211 116 q34 54 0 108" stroke="#ffa36b" stroke-width="4" fill="none"/>
<rect x="160" y="252" width="102" height="10" rx="5" fill="#ffa36b"/>
<rect x="176" y="274" width="70" height="8" rx="4" fill="#ffa36b" opacity=".6"/>
</g>
<g transform="rotate(10 280 270)">
<rect x="196" y="206" width="180" height="116" rx="14" fill="url(#w)"/>
<rect x="210" y="222" width="54" height="66" rx="8" fill="#c7cbe6"/>
<circle cx="237" cy="246" r="13" fill="#8a90bd"/><path d="M215 286 q22 -30 44 0" fill="#8a90bd"/>
<rect x="276" y="228" width="84" height="9" rx="4" fill="#8a90bd"/><rect x="276" y="248" width="60" height="9" rx="4" fill="#a3a9d0"/><rect x="276" y="268" width="72" height="9" rx="4" fill="#a3a9d0"/>
<rect x="210" y="300" width="150" height="8" rx="4" fill="#a3a9d0" opacity=".7"/>
<circle cx="352" cy="300" r="24" fill="none" stroke="#ff6e27" stroke-width="5" opacity=".9"/>
</g>`,

  shield: `
<path d="M200 46 L326 92 V196 C326 274 268 330 200 358 C132 330 74 274 74 196 V92 Z" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<path d="M200 46 L326 92 V196 C326 274 268 330 200 358 C132 330 74 274 74 196 V92 Z" fill="url(#w)"/>
<path d="M200 46 L326 92 V196 C326 274 268 330 200 358 Z" fill="#a3a9d0" opacity=".35"/>
<path d="M200 82 L294 116 V198 C294 258 252 300 200 322 C148 300 106 258 106 198 V116 Z" fill="url(#n)"/>
<rect x="156" y="190" width="88" height="74" rx="14" fill="url(#o)"/>
<path d="M172 190 V166 a28 28 0 0 1 56 0 V190" fill="none" stroke="#ffa36b" stroke-width="12"/>
<circle cx="200" cy="220" r="10" fill="#fff"/><rect x="195" y="222" width="10" height="24" rx="4" fill="#fff"/>`,

  energy: `
<rect x="132" y="56" width="136" height="300" rx="30" fill="#141830" opacity=".45" transform="translate(10 12)"/>
<rect x="170" y="36" width="60" height="30" rx="8" fill="url(#ws)"/>
<rect x="132" y="56" width="136" height="300" rx="30" fill="url(#w)"/>
<rect x="150" y="160" width="100" height="178" rx="16" fill="url(#o)"/>
<rect x="150" y="76" width="100" height="74" rx="16" fill="#c7cbe6"/>
<path d="M214 104 L168 220 H204 L186 314 L246 184 H208 L230 104 Z" fill="#fff" stroke="#1a1e3a" stroke-opacity=".15" stroke-width="3" stroke-linejoin="round"/>
<rect x="132" y="56" width="136" height="300" rx="30" fill="url(#shine)"/>`,

  chart: `
<rect x="70" y="252" width="56" height="88" rx="10" fill="url(#ws)"/>
<rect x="144" y="196" width="56" height="144" rx="10" fill="url(#w2)"/>
<rect x="218" y="144" width="56" height="196" rx="10" fill="url(#w)"/>
<rect x="292" y="86" width="56" height="254" rx="10" fill="url(#o)"/>
<path d="M60 230 L150 160 L210 186 L330 70" stroke="#ff6e27" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M286 64 L340 58 L334 112" stroke="#ff6e27" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="56" y="340" width="300" height="10" rx="5" fill="#a3a9d0"/>`,

  megaphone: `
<path d="M120 170 L300 80 V320 L120 230 Z" fill="url(#w)"/>
<path d="M120 200 L300 200 V320 L120 230 Z" fill="#a3a9d0" opacity=".35"/>
<ellipse cx="300" cy="200" rx="34" ry="120" fill="url(#ws)"/>
<ellipse cx="300" cy="200" rx="22" ry="96" fill="url(#n)"/>
<rect x="64" y="162" width="66" height="76" rx="16" fill="url(#o)"/>
<path d="M120 236 L150 236 L170 318 Q172 330 160 330 H140 Q130 330 128 320 Z" fill="url(#od)"/>
<g stroke="#ff6e27" stroke-width="10" stroke-linecap="round" fill="none"><path d="M350 130 l26 -22"/><path d="M360 200 h32"/><path d="M350 270 l26 22"/></g>`,

  headphones: `
<path d="M86 230 V196 a114 114 0 0 1 228 0 V230" fill="none" stroke="url(#w)" stroke-width="26" stroke-linecap="round"/>
<rect x="62" y="206" width="76" height="132" rx="32" fill="url(#n)"/>
<rect x="262" y="206" width="76" height="132" rx="32" fill="url(#n)"/>
<rect x="104" y="220" width="52" height="104" rx="22" fill="url(#o)"/>
<rect x="244" y="220" width="52" height="104" rx="22" fill="url(#o)"/>
<g fill="#fff"><path d="M196 236 v-60 l44 -10 v58" stroke="#fff" stroke-width="8" fill="none" stroke-linejoin="round"/><circle cx="188" cy="238" r="13"/><circle cx="232" cy="226" r="13"/></g>`,

  tv: `
<rect x="60" y="72" width="280" height="196" rx="20" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="60" y="72" width="280" height="196" rx="20" fill="url(#w2)"/>
<rect x="74" y="86" width="252" height="168" rx="10" fill="url(#scr)"/>
<path d="M180 136 L236 170 L180 204 Z" fill="#fff"/>
<circle cx="200" cy="170" r="54" fill="none" stroke="#ff6e27" stroke-width="6"/>
<rect x="74" y="86" width="252" height="168" rx="10" fill="url(#shine)"/>
<path d="M170 268 L156 318 H244 L230 268 Z" fill="url(#ws)"/>
<rect x="120" y="314" width="160" height="16" rx="8" fill="url(#w)"/>`,

  books: `
<rect x="70" y="268" width="260" height="56" rx="10" fill="url(#n)"/><rect x="84" y="280" width="232" height="10" rx="5" fill="#ff6e27" opacity=".8"/>
<rect x="90" y="214" width="236" height="54" rx="10" fill="url(#o)"/><rect x="104" y="226" width="208" height="9" rx="4" fill="#fff" opacity=".6"/>
<rect x="80" y="162" width="226" height="52" rx="10" fill="url(#w)"/><rect x="92" y="174" width="200" height="8" rx="4" fill="#8a90bd" opacity=".6"/>
<path d="M200 70 L330 116 L200 162 L70 116 Z" fill="url(#n)"/>
<path d="M130 136 V170 Q200 200 270 170 V136 L200 162 Z" fill="#262b52"/>
<path d="M200 116 L300 130 V182" stroke="#ff6e27" stroke-width="6" fill="none"/><circle cx="300" cy="190" r="12" fill="#ff6e27"/>
`,

  mic: `
<rect x="136" y="44" width="128" height="196" rx="64" fill="url(#w)"/>
<g stroke="#a3a9d0" stroke-width="6" stroke-linecap="round"><path d="M160 96 h80 M156 124 h88 M156 152 h88 M160 180 h80"/></g>
<rect x="136" y="44" width="128" height="196" rx="64" fill="url(#shine)"/>
<path d="M104 180 v12 a96 96 0 0 0 192 0 v-12" fill="none" stroke="url(#o)" stroke-width="16" stroke-linecap="round"/>
<rect x="190" y="288" width="20" height="48" fill="url(#ws)"/>
<rect x="136" y="332" width="128" height="20" rx="10" fill="url(#n)"/>`,

  rocket: `
<g transform="rotate(38 200 200)">
<path d="M200 26 C254 76 268 160 254 270 H146 C132 160 146 76 200 26 Z" fill="url(#w)"/>
<path d="M200 26 C254 76 268 160 254 270 H200 Z" fill="#a3a9d0" opacity=".35"/>
<path d="M200 26 C222 46 238 72 246 100 H154 C162 72 178 46 200 26 Z" fill="url(#o)"/>
<circle cx="200" cy="160" r="30" fill="url(#n)" stroke="#c7cbe6" stroke-width="8"/><circle cx="192" cy="152" r="8" fill="#fff" opacity=".5"/>
<path d="M146 210 L100 270 L104 300 L150 270 Z" fill="url(#od)"/><path d="M254 210 L300 270 L296 300 L250 270 Z" fill="url(#od)"/>
<path d="M166 272 H234 L222 300 H178 Z" fill="url(#ws)"/>
<path d="M178 302 Q200 390 222 302 Z" fill="url(#o)"/><path d="M190 302 Q200 350 210 302 Z" fill="#ffe1c2"/>
</g>`,

  satellite: `
<g transform="rotate(-24 200 200)">
<rect x="20" y="166" width="120" height="68" rx="6" fill="url(#n)" stroke="#8a90bd" stroke-width="3"/>
<path d="M60 166 v68 M100 166 v68 M20 200 h120" stroke="#ff6e27" stroke-opacity=".7" stroke-width="3"/>
<rect x="260" y="166" width="120" height="68" rx="6" fill="url(#n)" stroke="#8a90bd" stroke-width="3"/>
<path d="M300 166 v68 M340 166 v68 M260 200 h120" stroke="#ff6e27" stroke-opacity=".7" stroke-width="3"/>
<rect x="140" y="194" width="120" height="12" fill="url(#ws)"/>
<rect x="160" y="150" width="80" height="100" rx="16" fill="url(#w)"/>
<rect x="172" y="168" width="56" height="28" rx="6" fill="url(#o)"/>
<path d="M200 150 V118" stroke="url(#ws)" stroke-width="8"/>
<path d="M160 118 Q200 70 240 118 Z" fill="url(#w2)"/><circle cx="200" cy="106" r="7" fill="#ff6e27"/>
</g>
<g stroke="#fff" stroke-opacity=".7" stroke-width="7" fill="none" stroke-linecap="round"><path d="M110 92 a40 40 0 0 1 40 -40"/><path d="M84 92 a66 66 0 0 1 66 -66"/></g>`,

  briefcase: `
<path d="M156 108 V86 Q156 70 172 70 H228 Q244 70 244 86 V108" fill="none" stroke="url(#ws)" stroke-width="16"/>
<rect x="60" y="114" width="280" height="210" rx="26" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="60" y="104" width="280" height="220" rx="26" fill="url(#o)"/>
<path d="M60 130 Q60 104 86 104 H314 Q340 104 340 130 V196 Q200 236 60 196 Z" fill="#ffa36b" opacity=".55"/>
<rect x="176" y="186" width="48" height="40" rx="9" fill="url(#w)"/>
<rect x="60" y="104" width="280" height="220" rx="26" fill="url(#shine)"/>`,

  card: `
<g transform="rotate(-12 200 200)">
<rect x="70" y="96" width="270" height="170" rx="20" fill="url(#n)" transform="translate(20 34)"/>
<rect x="70" y="96" width="270" height="170" rx="20" fill="url(#w2)" transform="translate(20 34)" opacity=".25"/>
<rect x="46" y="70" width="270" height="170" rx="20" fill="url(#o)"/>
<rect x="46" y="104" width="270" height="30" fill="#1a1e3a" opacity=".8"/>
<rect x="70" y="156" width="46" height="34" rx="7" fill="url(#gold)"/>
<path d="M70 168 h46 M70 178 h46 M93 156 v34" stroke="#a9520f" stroke-width="2"/>
<g fill="#fff" opacity=".85"><rect x="70" y="208" width="44" height="10" rx="5"/><rect x="124" y="208" width="44" height="10" rx="5"/><rect x="178" y="208" width="44" height="10" rx="5"/><rect x="232" y="208" width="44" height="10" rx="5"/></g>
<circle cx="268" cy="168" r="18" fill="#fff" opacity=".55"/><circle cx="288" cy="168" r="18" fill="#fff" opacity=".35"/>
<rect x="46" y="70" width="270" height="170" rx="20" fill="url(#shine)"/>
</g>`,

  search: `
<path d="M248 248 L338 338" stroke="url(#n)" stroke-width="44" stroke-linecap="round"/>
<path d="M262 262 L330 330" stroke="url(#o)" stroke-width="26" stroke-linecap="round"/>
<circle cx="172" cy="172" r="112" fill="url(#w)"/>
<circle cx="172" cy="172" r="84" fill="url(#scr)"/>
<path d="M120 196 L150 160 L176 182 L222 128" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="172" cy="172" r="84" fill="url(#shine)"/>`,

  chat: `
<path d="M60 90 Q60 60 90 60 H270 Q300 60 300 90 V200 Q300 230 270 230 H150 L96 274 L104 230 H90 Q60 230 60 200 Z" fill="url(#w)"/>
<g fill="#8a90bd"><circle cx="130" cy="146" r="14"/><circle cx="180" cy="146" r="14"/><circle cx="230" cy="146" r="14"/></g>
<path d="M170 196 Q170 176 190 176 H320 Q340 176 340 196 V280 Q340 300 320 300 H310 L316 340 L270 300 H190 Q170 300 170 280 Z" fill="url(#o)"/>
<g stroke="#fff" stroke-width="10" stroke-linecap="round"><path d="M200 222 h110"/><path d="M200 252 h70"/></g>`,

  dna: `
<path d="M229.6 50.7 H170.4" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M276.0 72.0 H124.0" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M289.5 93.3 H110.5" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M264.3 114.6 H135.7" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M211.3 135.9 H188.7" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M153.4 157.3 H246.6" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M115.6 178.6 H284.4" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M114.4 199.9 H285.6" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M150.2 221.2 H249.8" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M207.5 242.5 H192.5" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M261.6 263.9 H138.4" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M289.0 285.2 H111.0" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M277.9 306.5 H122.1" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/><path d="M233.1 327.8 H166.9" stroke="#ff6e27" stroke-width="9" stroke-linecap="round"/><path d="M174.0 349.1 H226.0" stroke="#c7cbe6" stroke-width="9" stroke-linecap="round"/>
<path d="M200.0 40.0 L215.0 45.3 L229.6 50.7 L243.4 56.0 L255.9 61.3 L266.9 66.7 L276.0 72.0 L283.0 77.3 L287.6 82.6 L289.8 88.0 L289.5 93.3 L286.7 98.6 L281.4 104.0 L273.9 109.3 L264.3 114.6 L252.9 120.0 L240.0 125.3 L226.0 130.6 L211.3 135.9 L196.2 141.3 L181.3 146.6 L166.9 151.9 L153.4 157.3 L141.2 162.6 L130.7 167.9 L122.1 173.2 L115.6 178.6 L111.6 183.9 L110.0 189.2 L111.0 194.6 L114.4 199.9 L120.2 205.2 L128.3 210.6 L138.4 215.9 L150.2 221.2 L163.4 226.6 L177.6 231.9 L192.5 237.2 L207.5 242.5 L222.4 247.9 L236.6 253.2 L249.8 258.5 L261.6 263.9 L271.7 269.2 L279.8 274.5 L285.6 279.9 L289.0 285.2 L290.0 290.5 L288.4 295.8 L284.4 301.2 L277.9 306.5 L269.3 311.8 L258.8 317.2 L246.6 322.5 L233.1 327.8 L218.7 333.1 L203.8 338.5 L188.7 343.8 L174.0 349.1 L160.0 354.5 L147.1 359.8" stroke="url(#o)" stroke-width="20" fill="none" stroke-linecap="round"/>
<path d="M200.0 40.0 L185.0 45.3 L170.4 50.7 L156.6 56.0 L144.1 61.3 L133.1 66.7 L124.0 72.0 L117.0 77.3 L112.4 82.6 L110.2 88.0 L110.5 93.3 L113.3 98.6 L118.6 104.0 L126.1 109.3 L135.7 114.6 L147.1 120.0 L160.0 125.3 L174.0 130.6 L188.7 135.9 L203.8 141.3 L218.7 146.6 L233.1 151.9 L246.6 157.3 L258.8 162.6 L269.3 167.9 L277.9 173.2 L284.4 178.6 L288.4 183.9 L290.0 189.2 L289.0 194.6 L285.6 199.9 L279.8 205.2 L271.7 210.6 L261.6 215.9 L249.8 221.2 L236.6 226.6 L222.4 231.9 L207.5 237.2 L192.5 242.5 L177.6 247.9 L163.4 253.2 L150.2 258.5 L138.4 263.9 L128.3 269.2 L120.2 274.5 L114.4 279.9 L111.0 285.2 L110.0 290.5 L111.6 295.8 L115.6 301.2 L122.1 306.5 L130.7 311.8 L141.2 317.2 L153.4 322.5 L166.9 327.8 L181.3 333.1 L196.2 338.5 L211.3 343.8 L226.0 349.1 L240.0 354.5 L252.9 359.8" stroke="url(#w)" stroke-width="20" fill="none" stroke-linecap="round"/>`,

  globe: `
<circle cx="200" cy="200" r="140" fill="url(#n)"/>
<g fill="url(#o)"><path d="M120 108 q40 -20 70 6 q-10 30 18 40 q20 30 -14 52 q-30 -6 -36 26 q-34 -24 -40 -64 q-14 -30 2 -60z"/><path d="M236 92 q44 6 72 50 q-30 4 -40 30 q-26 -10 -24 -40 q-20 -18 -8 -40z"/><path d="M240 230 q40 -14 66 10 q-6 46 -50 74 q-20 -20 -10 -46 q-14 -18 -6 -38z"/></g>
<circle cx="200" cy="200" r="140" fill="url(#shine)"/>
<ellipse cx="200" cy="200" rx="186" ry="54" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" transform="rotate(-18 200 200)"/>
<circle cx="370" cy="146" r="12" fill="#fff"/>`,

  brain: `
<g transform="translate(8 12)" fill="#141830" opacity=".45"><path d="${BRAIN_L}"/><path d="${BRAIN_R}"/></g>
<path d="${BRAIN_L}" fill="url(#w)"/>
<path d="${BRAIN_R}" fill="url(#o)"/>
<g stroke="#a3a9d0" stroke-width="8" stroke-linecap="round" fill="none"><path d="M150 112 q24 12 16 40"/><path d="M100 186 q34 -8 50 18"/><path d="M128 262 q12 -30 44 -28"/><path d="M178 172 q-6 30 16 48"/></g>
<g stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M200 130 h44 v-24"/><path d="M200 200 h76"/><path d="M200 262 h34 v-30 h44"/></g>
<g fill="#fff"><circle cx="244" cy="102" r="10"/><circle cx="282" cy="200" r="10"/><circle cx="284" cy="232" r="10"/></g>
<path d="M200 74 V316" stroke="#1a1e3a" stroke-opacity=".35" stroke-width="5"/>
<path d="${BRAIN_L}" fill="url(#shine)"/>`,

  network: (() => {
    const L = [[100, [120, 200, 280]], [200, [80, 160, 240, 320]], [300, [140, 260]]];
    const hot = new Set(["100,200", "200,160", "300,140", "200,240", "100,120"]);
    let lines = "", nodes = "";
    for (let i = 0; i < 2; i++) for (const a of L[i][1]) for (const b of L[i + 1][1]) {
      const h = hot.has(`${L[i][0]},${a}`) && hot.has(`${L[i + 1][0]},${b}`);
      lines += `<path d="M${L[i][0]} ${a} L${L[i + 1][0]} ${b}" stroke="${h ? "#ff6e27" : "#fff"}" stroke-opacity="${h ? 1 : .3}" stroke-width="${h ? 7 : 4}"/>`;
    }
    for (const [x, ys] of L) for (const y of ys) {
      const h = hot.has(`${x},${y}`);
      nodes += `<circle cx="${x + 5}" cy="${y + 7}" r="27" fill="#141830" opacity=".45"/><circle cx="${x}" cy="${y}" r="27" fill="url(#${h ? "o" : "w"})"/><circle cx="${x}" cy="${y}" r="10" fill="${h ? "#fff" : "url(#n)"}"/>`;
    }
    return `<g stroke-linecap="round">${lines}</g>${nodes}`;
  })(),

  server: `
<rect x="112" y="78" width="200" height="262" rx="22" fill="#141830" opacity=".5"/>
${[70, 154, 238].map((y, i) => `
<rect x="100" y="${y}" width="200" height="74" rx="16" fill="url(#w2)"/>
<rect x="116" y="${y + 16}" width="118" height="42" rx="9" fill="url(#n)"/>
<g stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"><path d="M132 ${y + 30} h86 M132 ${y + 44} h56"/></g>
<circle cx="258" cy="${y + 37}" r="10" fill="${i === 1 ? "url(#o)" : "url(#g)"}"/><circle cx="282" cy="${y + 37}" r="6" fill="#a3a9d0"/>`).join("")}
<rect x="150" y="312" width="100" height="22" rx="8" fill="url(#ws)"/>`,

  cloud: `
<g fill="#141830" opacity=".45" transform="translate(8 12)"><circle cx="140" cy="226" r="56"/><circle cx="212" cy="186" r="80"/><circle cx="286" cy="234" r="50"/><rect x="140" y="226" width="146" height="58"/></g>
<g fill="url(#w)"><circle cx="140" cy="226" r="56"/><circle cx="212" cy="186" r="80"/><circle cx="286" cy="234" r="50"/><rect x="140" y="226" width="146" height="58"/></g>
<circle cx="212" cy="186" r="80" fill="url(#shine)"/>
<circle cx="212" cy="236" r="38" fill="url(#o)"/>
<path d="M212 256 V216 M194 232 l18 -18 l18 18" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<g fill="#ff6e27"><circle cx="150" cy="322" r="8"/><circle cx="212" cy="334" r="8" opacity=".7"/><circle cx="274" cy="322" r="8" opacity=".45"/></g>`,

  key: `
<g transform="rotate(-35 200 200)">
<g transform="translate(8 12)" fill="#141830" opacity=".45"><circle cx="120" cy="200" r="66"/><rect x="170" y="184" width="186" height="32" rx="12"/><rect x="296" y="200" width="24" height="52" rx="6"/><rect x="330" y="200" width="20" height="36" rx="6"/></g>
<rect x="170" y="184" width="186" height="32" rx="12" fill="url(#gold)"/>
<rect x="296" y="200" width="24" height="52" rx="6" fill="url(#goldd)"/><rect x="330" y="200" width="20" height="36" rx="6" fill="url(#goldd)"/>
<circle cx="120" cy="200" r="66" fill="url(#gold)"/>
<circle cx="120" cy="200" r="48" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5"/>
<circle cx="106" cy="200" r="20" fill="url(#n)"/>
<circle cx="120" cy="200" r="66" fill="url(#shine)"/>
</g>`,

  radar: `
<circle cx="200" cy="200" r="152" fill="url(#w2)"/>
<circle cx="200" cy="200" r="136" fill="url(#n)"/>
<g stroke="#fff" stroke-opacity=".22" stroke-width="3" fill="none"><circle cx="200" cy="200" r="96"/><circle cx="200" cy="200" r="54"/><path d="M64 200 H336 M200 64 V336"/></g>
<path d="M200 200 L200 64 A136 136 0 0 1 318 132 Z" fill="url(#o)" opacity=".55"/>
<path d="M200 200 L318 132" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
<g fill="#ff6e27"><circle cx="262" cy="118" r="18" opacity=".3"/><circle cx="262" cy="118" r="9"/><circle cx="140" cy="270" r="8" opacity=".8"/><circle cx="118" cy="146" r="6" opacity=".6"/></g>
<circle cx="200" cy="200" r="12" fill="#fff"/>
<circle cx="200" cy="200" r="152" fill="url(#shine)"/>`,

  ship: `
<path d="M54 262 H346 L312 318 Q306 326 294 326 H104 Q94 326 88 318 Z" fill="#141830" opacity=".45" transform="translate(6 10)"/>
<rect x="96" y="200" width="56" height="62" rx="5" fill="url(#o)"/><rect x="156" y="200" width="56" height="62" rx="5" fill="url(#w)"/><rect x="96" y="150" width="56" height="48" rx="5" fill="url(#w)"/><rect x="156" y="150" width="56" height="48" rx="5" fill="url(#od)"/>
<g stroke="#1a1e3a" stroke-opacity=".25" stroke-width="3"><path d="M110 206 v50 M124 206 v50 M138 206 v50 M170 156 v40 M184 156 v40 M198 156 v40"/></g>
<rect x="230" y="150" width="76" height="112" rx="8" fill="url(#w2)"/>
<rect x="222" y="132" width="92" height="30" rx="8" fill="url(#n)"/>
<g fill="#ff6e27"><rect x="234" y="140" width="16" height="12" rx="3"/><rect x="260" y="140" width="16" height="12" rx="3"/><rect x="286" y="140" width="16" height="12" rx="3"/></g>
<path d="M268 132 V92" stroke="#b9bedf" stroke-width="7" stroke-linecap="round"/><circle cx="268" cy="88" r="9" fill="url(#o)"/>
<path d="M54 262 H346 L312 318 Q306 326 294 326 H104 Q94 326 88 318 Z" fill="url(#n)"/>
<path d="M66 278 H334" stroke="#ff6e27" stroke-width="8" stroke-linecap="round"/>
<path d="M40 348 q20 -14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-opacity=".55" stroke-width="7" fill="none" stroke-linecap="round"/>`,

  gavel: `
<rect x="80" y="300" width="190" height="44" rx="12" fill="url(#ws)"/>
<rect x="80" y="290" width="190" height="26" rx="12" fill="url(#w)"/>
<g transform="rotate(-38 200 190)">
<rect x="186" y="150" width="28" height="200" rx="14" fill="#141830" opacity=".45" transform="translate(8 8)"/>
<rect x="186" y="150" width="28" height="200" rx="14" fill="url(#w2)"/>
<rect x="104" y="74" width="192" height="92" rx="20" fill="#141830" opacity=".45" transform="translate(8 10)"/>
<rect x="104" y="74" width="192" height="92" rx="20" fill="url(#n)"/>
<rect x="128" y="70" width="26" height="100" rx="8" fill="url(#o)"/><rect x="246" y="70" width="26" height="100" rx="8" fill="url(#o)"/>
<rect x="104" y="74" width="192" height="92" rx="20" fill="url(#shine)"/>
</g>`,

  parcel: `
<path d="M200 206 L332 140 V276 L200 342 L68 276 V140 Z" fill="#141830" opacity=".45" transform="translate(6 10)"/>
<path d="M200 74 L332 140 L200 206 L68 140 Z" fill="#ffb98f"/>
<path d="M68 140 L200 206 V342 L68 276 Z" fill="url(#o)"/>
<path d="M200 206 L332 140 V276 L200 342 Z" fill="url(#od)"/>
<path d="M120 114 L146 101 L278 167 L252 180 Z" fill="#fff" fill-opacity=".85"/>
<path d="M252 180 L278 167 V297 L252 310 Z" fill="#fff" fill-opacity=".7"/>
<path d="M92 214 L150 243 V275 L92 246 Z" fill="#fff" fill-opacity=".9"/>
<g stroke="url(#n)" stroke-width="4"><path d="M102 230 l38 19 M102 242 l26 13"/></g>`,

  bag: `
<path d="M116 146 H296 L318 346 H96 Z" fill="#141830" opacity=".45" transform="translate(4 8)"/>
<path d="M156 166 V124 a44 44 0 0 1 88 0 V166" stroke="url(#n)" stroke-width="15" stroke-linecap="round" fill="none"/>
<path d="M110 140 H290 L312 340 H88 Z" fill="url(#o)"/>
<path d="M290 140 L312 340 H270 Z" fill="#b5400f" opacity=".35"/>
<circle cx="156" cy="170" r="9" fill="#1a1e3a"/><circle cx="244" cy="170" r="9" fill="#1a1e3a"/>
<path d="M156 172 V140 M244 172 V140" stroke="#262b52" stroke-width="15" stroke-linecap="round"/>
<circle cx="200" cy="256" r="50" fill="#fff" fill-opacity=".92"/>
<path d="M178 282 L222 230" stroke="#e2581f" stroke-width="10" stroke-linecap="round"/>
<circle cx="180" cy="236" r="11" fill="#e2581f"/><circle cx="220" cy="276" r="11" fill="#e2581f"/>
<path d="M110 140 H290 L312 340 H88 Z" fill="url(#shine)"/>`,

  bulb: `
<g stroke="#ff6e27" stroke-width="9" stroke-linecap="round"><path d="M200 22 V42 M80 70 l14 14 M320 70 l-14 14 M40 168 h20 M340 168 h20 M86 266 l14 -14 M314 266 l-14 -14"/></g>
<circle cx="200" cy="164" r="98" fill="url(#gold)"/>
<path d="M146 236 Q160 262 160 286 H240 Q240 262 254 236 Z" fill="url(#gold)"/>
<path d="M176 240 V206 q0 -16 12 -16 q12 0 12 16 q0 -16 12 -16 q12 0 12 16 V240" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<circle cx="200" cy="164" r="98" fill="url(#shine)"/>
<rect x="160" y="284" width="80" height="18" rx="8" fill="url(#w2)"/>
<rect x="160" y="306" width="80" height="18" rx="8" fill="url(#ws)"/>
<path d="M174 328 H226 L216 348 H184 Z" fill="url(#n)"/>`,

  calendar: `
<rect x="80" y="92" width="240" height="236" rx="28" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="80" y="92" width="240" height="236" rx="28" fill="url(#w)"/>
<path d="M80 120 Q80 92 108 92 H292 Q320 92 320 120 V164 H80 Z" fill="url(#o)"/>
<rect x="128" y="66" width="22" height="56" rx="11" fill="url(#n)"/><rect x="250" y="66" width="22" height="56" rx="11" fill="url(#n)"/>
<g fill="#c7cbe6">${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${106 + c * 50}" y="${184 + r * 44}" width="38" height="30" rx="8"/>`).join("")).join("")}</g>
<rect x="206" y="228" width="38" height="30" rx="8" fill="url(#o)"/>
<path d="M214 243 l8 8 l14 -16" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,

  newspaper: `
<g transform="rotate(-6 200 200)">
<rect x="118" y="88" width="220" height="268" rx="16" fill="url(#ws)"/>
<rect x="92" y="64" width="226" height="272" rx="16" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="92" y="64" width="226" height="272" rx="16" fill="url(#w)"/>
<rect x="114" y="86" width="182" height="30" rx="7" fill="url(#n)"/>
<rect x="114" y="134" width="88" height="78" rx="9" fill="url(#o)"/>
<g stroke-linecap="round" stroke-width="8"><path d="M218 140 h78 M218 162 h78 M218 184 h56 M218 206 h70" stroke="#a3a9d0"/><path d="M114 236 h182 M114 258 h182 M114 280 h150 M114 302 h120" stroke="#a3a9d0"/></g>
</g>`,

  camera: `
<rect x="70" y="128" width="260" height="184" rx="34" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="138" y="96" width="104" height="56" rx="16" fill="url(#ws)"/>
<rect x="70" y="128" width="260" height="184" rx="34" fill="url(#w2)"/>
<rect x="70" y="190" width="260" height="22" fill="#8a90bd" opacity=".35"/>
<rect x="94" y="110" width="42" height="22" rx="8" fill="url(#o)"/>
<rect x="266" y="146" width="40" height="20" rx="6" fill="#ffd27a"/>
<circle cx="200" cy="220" r="76" fill="url(#n)"/>
<circle cx="200" cy="220" r="56" fill="url(#scr)"/>
<circle cx="200" cy="220" r="26" fill="#1a1e3a"/>
<circle cx="182" cy="200" r="11" fill="#fff" opacity=".85"/>
<circle cx="200" cy="220" r="76" fill="none" stroke="#ff6e27" stroke-width="5" stroke-dasharray="14 10"/>`,

  gamepad: `
<path d="${PAD}" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<path d="${PAD}" fill="url(#w)"/>
<rect x="96" y="186" width="62" height="20" rx="6" fill="url(#n)"/><rect x="117" y="165" width="20" height="62" rx="6" fill="url(#n)"/>
<circle cx="276" cy="168" r="14" fill="url(#o)"/><circle cx="304" cy="196" r="14" fill="url(#n)"/><circle cx="248" cy="196" r="14" fill="url(#n)"/><circle cx="276" cy="224" r="14" fill="url(#o)"/>
<rect x="174" y="176" width="22" height="10" rx="5" fill="#a3a9d0"/><rect x="204" y="176" width="22" height="10" rx="5" fill="#a3a9d0"/>
<circle cx="160" cy="250" r="20" fill="url(#ws)"/><circle cx="240" cy="250" r="20" fill="url(#ws)"/>
<path d="${PAD}" fill="url(#shine)"/>`,

  car: `<g transform="translate(-30 -40) scale(1.15)">
<ellipse cx="206" cy="312" rx="160" ry="14" fill="#141830" opacity=".45"/>
<path d="M56 252 Q60 214 100 208 L140 166 Q152 154 174 154 H250 Q272 154 286 168 L320 206 Q352 212 354 248 V264 Q354 276 342 276 H68 Q56 276 56 264 Z" fill="url(#o)"/>
<path d="M150 204 L176 174 H210 V204 Z" fill="url(#scr)"/>
<path d="M222 204 V174 H250 Q262 174 270 182 L292 204 Z" fill="url(#scr)"/>
<rect x="332" y="222" width="18" height="12" rx="5" fill="#fff"/><rect x="58" y="226" width="16" height="12" rx="5" fill="#ffd27a"/>
<path d="M212 220 l-14 22 h14 l-8 20 l22 -28 h-14 l8 -14 z" fill="#fff"/>
<path d="M56 252 Q60 214 100 208 L140 166 Q152 154 174 154 H250 Q272 154 286 168 L320 206 Q352 212 354 248" fill="url(#shine)"/>
<circle cx="122" cy="276" r="36" fill="url(#n)"/><circle cx="122" cy="276" r="15" fill="url(#w2)"/>
<circle cx="288" cy="276" r="36" fill="url(#n)"/><circle cx="288" cy="276" r="15" fill="url(#w2)"/></g>`,

  house: `
<ellipse cx="204" cy="334" rx="150" ry="12" fill="#141830" opacity=".45"/>
<rect x="252" y="104" width="30" height="70" rx="5" fill="url(#ws)"/><rect x="246" y="98" width="42" height="14" rx="5" fill="url(#n)"/>
<rect x="100" y="176" width="200" height="156" rx="6" fill="url(#w)"/>
<rect x="282" y="176" width="18" height="156" fill="#8a90bd" opacity=".4"/>
<path d="M58 206 L200 84 L342 206" stroke="#141830" stroke-opacity=".45" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(0 10)"/>
<path d="M100 190 L200 104 L300 190 Z" fill="url(#w2)"/>
<path d="M58 206 L200 84 L342 206" stroke="url(#o)" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<circle cx="200" cy="158" r="20" fill="url(#n)"/><circle cx="200" cy="158" r="8" fill="#ffd27a"/>
<rect x="176" y="252" width="48" height="80" rx="8" fill="url(#n)"/><circle cx="214" cy="294" r="4" fill="#ff6e27"/>
<rect x="120" y="216" width="42" height="40" rx="6" fill="#ffd27a"/><rect x="238" y="216" width="42" height="40" rx="6" fill="#ffd27a"/>
<path d="M141 216 v40 M120 236 h42 M259 216 v40 M238 236 h42" stroke="#fff" stroke-width="4"/>`,

  factory: `
<ellipse cx="200" cy="334" rx="160" ry="12" fill="#141830" opacity=".45"/>
<g fill="#fff" fill-opacity=".55"><circle cx="292" cy="92" r="16"/><circle cx="312" cy="66" r="21"/><circle cx="342" cy="46" r="26"/></g>
<rect x="266" y="104" width="44" height="228" rx="6" fill="url(#n)"/>
<rect x="266" y="128" width="44" height="14" fill="url(#o)"/><rect x="266" y="160" width="44" height="14" fill="url(#o)"/>
<path d="M50 332 V214 L116 176 V214 L182 176 V214 L248 176 V332 Z" fill="url(#w2)"/>
<path d="M116 176 V214 L50 214 Z M182 176 V214 L116 214 Z M248 176 V214 L182 214 Z" fill="#8a90bd" opacity=".35"/>
<rect x="240" y="226" width="110" height="106" rx="4" fill="url(#w)"/>
<g fill="url(#o)">${[0, 1, 2].map(i => `<rect x="${70 + i * 58}" y="238" width="36" height="28" rx="5"/>`).join("")}</g>
<g fill="#ffd27a">${[0, 1, 2].map(i => `<rect x="${70 + i * 58}" y="282" width="36" height="28" rx="5"/>`).join("")}<rect x="258" y="246" width="30" height="24" rx="4"/><rect x="302" y="246" width="30" height="24" rx="4"/></g>
<rect x="272" y="288" width="48" height="44" rx="4" fill="url(#n)"/>`,

  tag: `
<g transform="rotate(-22 200 200)">
<path d="${TAG}" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<path d="${TAG}" fill="url(#o)"/>
<path d="${TAG}" fill="url(#shine)"/>
<circle cx="282" cy="200" r="17" fill="url(#n)"/>
<path d="M144 228 L196 168" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
<circle cx="148" cy="174" r="15" fill="none" stroke="#fff" stroke-width="9"/><circle cx="192" cy="222" r="15" fill="none" stroke="#fff" stroke-width="9"/>
</g>
<path d="M300 140 Q338 70 300 40" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-opacity=".8"/>`,

  watch: `
<rect x="148" y="32" width="104" height="336" rx="40" fill="url(#n)"/>
<g fill="#fff" fill-opacity=".12"><rect x="164" y="48" width="72" height="10" rx="5"/><rect x="164" y="342" width="72" height="10" rx="5"/></g>
<rect x="290" y="168" width="18" height="44" rx="7" fill="url(#ws)"/>
<rect x="104" y="104" width="192" height="192" rx="52" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="104" y="104" width="192" height="192" rx="52" fill="url(#w2)"/>
<rect x="120" y="120" width="160" height="160" rx="40" fill="#141830"/>
<path d="M136 206 h26 l12 -30 l18 62 l16 -48 l10 16 h46" stroke="#ff6e27" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M200 140 a60 60 0 0 1 52 30" stroke="url(#g)" stroke-width="7" stroke-linecap="round" fill="none"/>
<rect x="120" y="120" width="160" height="160" rx="40" fill="url(#shine)"/>`,

  eye: `
<g stroke="#ff6e27" stroke-width="8" stroke-linecap="round" fill="none"><path d="M54 92 V60 H86 M346 92 V60 H314 M54 308 V340 H86 M346 308 V340 H314"/></g>
<path d="M46 200 Q200 66 354 200 Q200 334 46 200 Z" fill="#141830" opacity=".45" transform="translate(6 10)"/>
<path d="M46 200 Q200 66 354 200 Q200 334 46 200 Z" fill="url(#w)"/>
<circle cx="200" cy="200" r="74" fill="url(#o)"/>
<circle cx="200" cy="200" r="74" fill="none" stroke="#b5400f" stroke-width="4" stroke-opacity=".5"/>
<circle cx="200" cy="200" r="36" fill="url(#n)"/>
<circle cx="180" cy="180" r="13" fill="#fff"/>
<path d="M46 200 Q200 66 354 200" stroke="#a3a9d0" stroke-width="6" fill="none"/>`,

  code: `
<rect x="56" y="76" width="288" height="248" rx="26" fill="#141830" opacity=".5" transform="translate(8 12)"/>
<rect x="56" y="76" width="288" height="248" rx="26" fill="url(#n)"/>
<path d="M56 102 Q56 76 82 76 H318 Q344 76 344 102 V120 H56 Z" fill="url(#w2)"/>
<circle cx="88" cy="98" r="9" fill="#ff6e27"/><circle cx="116" cy="98" r="9" fill="#ffd27a"/><circle cx="144" cy="98" r="9" fill="url(#g)"/>
<g stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M150 176 L106 220 L150 264" stroke="url(#o)" stroke-width="18"/><path d="M250 176 L294 220 L250 264" stroke="url(#o)" stroke-width="18"/><path d="M222 164 L178 276" stroke="#fff" stroke-width="15"/></g>
<rect x="56" y="76" width="288" height="248" rx="26" fill="url(#shine)"/>`,

  target: `
<circle cx="194" cy="210" r="140" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<circle cx="194" cy="210" r="140" fill="url(#w)"/>
<circle cx="194" cy="210" r="106" fill="url(#o)"/>
<circle cx="194" cy="210" r="72" fill="url(#w)"/>
<circle cx="194" cy="210" r="38" fill="url(#o)"/>
<circle cx="194" cy="210" r="140" fill="url(#shine)"/>
<path d="M194 210 L322 82" stroke="url(#n)" stroke-width="11" stroke-linecap="round"/>
<path d="M322 82 L318 50 L300 68 L304 100 Z M322 82 L354 86 L336 104 L304 100 Z" fill="#ff6e27"/>
<path d="M322 82 L304 100" stroke="#fff" stroke-width="3"/>
<circle cx="194" cy="210" r="9" fill="#1a1e3a"/>`,

  trophy: `
<path d="M128 104 H86 Q78 186 142 200" stroke="url(#goldd)" stroke-width="15" fill="none" stroke-linecap="round"/>
<path d="M272 104 H314 Q322 186 258 200" stroke="url(#goldd)" stroke-width="15" fill="none" stroke-linecap="round"/>
<path d="M118 76 H282 V150 Q282 232 200 244 Q118 232 118 150 Z" fill="url(#gold)"/>
<path d="M200 118 l13 27 l29 4 l-21 20 l5 29 l-26 -14 l-26 14 l5 -29 l-21 -20 l29 -4 z" fill="#fff"/>
<path d="M118 76 H282 V150 Q282 232 200 244 Q118 232 118 150 Z" fill="url(#shine)"/>
<rect x="184" y="242" width="32" height="44" fill="url(#goldd)"/>
<rect x="136" y="292" width="128" height="48" rx="10" fill="#141830" opacity=".45" transform="translate(6 10)"/>
<rect x="150" y="280" width="100" height="18" rx="6" fill="url(#goldd)"/>
<rect x="136" y="292" width="128" height="48" rx="10" fill="url(#n)"/>
<rect x="168" y="306" width="64" height="18" rx="4" fill="url(#gold)"/>`,

  envelope: `
<g transform="rotate(-6 200 200)">
<rect x="66" y="112" width="268" height="190" rx="22" fill="#141830" opacity=".45" transform="translate(8 12)"/>
<rect x="66" y="112" width="268" height="190" rx="22" fill="url(#w)"/>
<path d="M72 292 L176 204 M328 292 L224 204" stroke="#a3a9d0" stroke-width="7" stroke-linecap="round"/>
<path d="M72 124 L200 222 L328 124" stroke="url(#ws)" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
<path d="M72 120 L200 216 L328 120" stroke="#fff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
</g>
<circle cx="322" cy="112" r="40" fill="url(#o)"/>
<circle cx="322" cy="112" r="40" fill="none" stroke="#383e65" stroke-width="6"/>
<path d="M314 100 l10 -8 v42" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
};

// Ключові слова: корені з межею зліва (щоб "ші" не ловило "інші").
const KEYS = {
  drone: ["дрон", "бпла", "безпілот", "drone", "fpv", "рій", "swarm", "оборон", "defense", "військов", "сво[ії]м[ау]? дрон"],
  money: ["гроші", "грош", "долар", "\\$", "зарплат", "дохід", "доход", "заробі", "заробл", "виторг", "фінанс", "економ", "гривн", "бюджет", "мільйон", "мільярд", "інвест"],
  coin: ["крипт", "біткоїн", "bitcoin", "блокчейн", "токен", "стейблкоїн", "ethereum", "web3"],
  chip: ["чип", "процесор", "nvidia", "напівпровідн", "gpu", "суперкомп", "дата-центр", "датацентр", "h200", "tsmc", "залізо"],
  robot: ["робот", "агент", "автоматиз", "гуманоїд"],
  spark: ["ші", "ai", "штучн", "нейромереж", "llm", "gpt", "chatgpt", "claude", "gemini", "openai", "anthropic", "генеративн", "модел"],
  phone: ["смартфон", "iphone", "телефон", "android", "застосун", "додат", "xiaomi", "samsung", "galaxy", "pixel"],
  laptop: ["ноутбук", "macbook", "комп'ютер", "програміст", "розробник", "фронтенд", "бекенд", "айті", "іт-", "ітішн", "вакансі"],
  passport: ["паспорт", "документ", "посвідч", "kyc", "ідентиф", "фейков", "підроб", "верифікац"],
  shield: ["хакер", "злам", "кібер", "безпек", "шахра", "вразлив", "парол", "захист", "прошивк", "дроп", "шкідлив"],
  energy: ["енерг", "світл", "генератор", "електр", "батаре", "акумулятор", "блекаут", "відключен", "сонячн"],
  chart: ["ринок", "ринк", "зростан", "бульбашк", "акці", "оцінк", "капіталіз", "статистик", "тренд", "аналітик", "падін", "біржа"],
  megaphone: ["маркетинг", "реклам", "бренд", "smm", "просуван", "соцмереж", "instagram", "tiktok", "аудитор", "увагу"],
  headphones: ["музик", "spotify", "трек", "пісн", "deezer", "аудіо", "подкаст", "артист"],
  tv: ["телевізор", "екран", "відео", "youtube", "стрім", "netflix", "фільм", "серіал"],
  books: ["англійськ", "ielts", "toefl", "вивчен", "вивчит", "уроки? англ", "навчан", "школ", "учн", "студент", "словник", "мов[аиу]", "граматик"],
  mic: ["виступ", "публічн", "говорит", "презентац", "промов", "розмов", "спікер"],
  rocket: ["стартап", "запуск", "ракет", "космос", "spacex", "раунд", "венчур", "єдиноріг"],
  satellite: ["супутник", "starlink", "starshield", "орбіт", "зв'язок", "інтернет-зв"],
  briefcase: ["бізнес", "фоп", "компані", "кар'єр", "роботодав", "найм", "офіс", "податк", "підприєм", "ринок праці", "тендер", "закупівл"],
  card: ["банк", "картк", "переказ", "ліміт", "платіж", "платеж", "рахун", "фінмоніторинг", "monobank", "privat"],
  search: ["seo", "пошук", "google", "дослідж", "перевірк", "розслідуван", "аналіз"],
  chat: ["чат", "месендж", "повідомлен", "бот", "telegram", "діалог", "ввічлив"],
  dna: ["біотех", "днк", "ген[иіо]", "генетик", "вірус", "медиц", "здоров", "лік[иа]", "біолог", "клітин"],
  globe: ["світ", "міжнарод", "країн", "експорт", "санкці", "китай", "сша", "європ", "глобальн"],
  brain: ["мозок", "мозк", "мислен", "свідоміст", "розум", "інтелект", "когнітив", "пам'ят", "психолог"],
  network: ["нейрон", "нейромереж", "алгоритм", "датасет", "дата-сет", "навчанн[яі] модел", "мереж[аі](?![а-яіїєґ])"],
  server: ["сервер", "хостинг", "бекап", "резервн", "баз[аиу] даних", "витік", "витоку", "зли[вл]", "дата-центр", "датацентр"],
  cloud: ["хмар", "cloud", "aws", "azure", "saas", "синхроніз", "icloud", "google drive", "підписк"],
  key: ["ключ", "сертифікат", "ssl", "tls", "https", "шифруван", "доступ", "авторизац", "логін", "2fa", "двофактор"],
  radar: ["ппо", "протиповітр", "радар", "шахед", "герань", "балістик", "перехопл", "обстріл", "збит", "ракет"],
  ship: ["корабл", "корвет", "флот", "судн", "морськ", "порт(?:у|и|і|ом|ах)?(?![а-яіїєґ])", "контейнер", "логістик", "танкер", "підводн"],
  gavel: ["суд(?!н)", "закон", "кримінал", "штраф", "заборон", "регулюв", "верховн", "постанов", "позов", "правоохорон", "поліці", "кіберполіц", "податков"],
  parcel: ["посилк", "доставк", "нова пошта", "нової пошти", "новій пошті", "укрпошт", "meest", "кур'єр", "маркетплейс", "rozetka", "amazon", "temu", "aliexpress"],
  bag: ["покуп", "магазин", "шопінг", "black friday", "чорн[аоу]? п'ятниц", "olx", "продаж", "продавц", "розпродаж", "e-commerce"],
  bulb: ["ідея", "ідеї", "ідей", "порад", "лайфхак", "принцип", "інновац", "винахід", "винайш", "креатив"],
  calendar: ["календар", "дедлайн", "з 1 січня", "з нового року", "щороку", "розклад"],
  newspaper: ["журнал", "газет", "змі(?![а-яіїєґ])", "медіа", "новин", "economist", "редакц", "видання"],
  camera: ["камер", "фото", "знімк", "об'єктив", "gopro"],
  gamepad: ["ігор", "ігр[аиоуі]", "гр[аиуі](?![а-яіїєґ])", "геймер", "гейм", "gta", "playstation", "xbox", "nintendo", "steam", "консол", "кіберспорт"],
  car: ["авто", "машин(?!н)", "tesla", "електромоб", "електрокар", "автопілот", "водій", "водії", "таксі", "uber", "bolt"],
  house: ["дім(?![а-яіїєґ])", "дом[іуа](?![а-яіїєґ])", "будин", "квартир", "нерухом", "житл", "оренд", "іпотек", "автономн"],
  factory: ["завод", "виробни", "фабрик", "комбінат", "промисл", "індустр", "цех", "руд[аиі](?![а-яіїєґ])"],
  tag: ["ціна", "ціни", "цін[уіа]", "подорож", "дешев", "вартіст", "коштує", "коштуват", "знижк", "прайс", "тариф"],
  watch: ["годинник", "watch", "фітнес", "трекер", "пульс", "носим"],
  eye: ["стеж", "спостереж", "приватн", "конфіденц", "шпигу", "трекінг", "відстеж"],
  code: ["код(?![а-яіїєґ]*екс)", "кодинг", "вайбкод", "програмуван", "програміст", "розробник", "github", "open source", "api", "javascript", "python"],
  target: ["ціль", "цілі", "мет[аиу](?![а-яіїєґ])", "kpi", "стратегі", "план(?:и|ів|у)?(?![а-яіїєґ])", "результат", "конверс", "лід(?:и|ів|ам)?(?![а-яіїєґ])"],
  trophy: ["перемог", "переможц", "рейтинг", "топ-", "найкращ", "лідер", "премі", "нагород", "рекорд", "чемпіон"],
  envelope: ["email", "e-mail", "імейл", "розсилк", "лист(?:и|а|ів|ом)?(?![а-яіїєґ])", "спам", "gmail", "outlook", "електронн[аоуі] пошт"],
};
// Схожі предмети: якщо головний щойно був на обкладинці, беремо іншого з родини.
const FAMILIES = [
  ["spark", "brain", "network", "chip", "robot"],
  ["drone", "radar", "rocket", "satellite", "ship"],
  ["money", "coin", "card", "tag"],
  ["shield", "key", "eye"],
  ["server", "cloud", "code", "laptop"],
  ["bag", "parcel", "tag"],
  ["newspaper", "tv", "camera", "megaphone"],
  ["phone", "watch", "camera"],
  ["briefcase", "chart", "factory", "target"],
  ["energy", "house"],
  ["books", "bulb", "mic"],
  ["chat", "envelope", "phone"],
  ["gavel", "passport", "key"],
];
const TAG_FALLBACK = {
  AI: ["spark", "brain", "network", "robot"],
  "технології": ["chip", "laptop", "phone", "code", "server"],
  "маркетинг": ["megaphone", "target", "bag"],
  "навички": ["mic", "bulb", "trophy", "books"],
  "англійська": ["books", "bulb", "chat"],
  "бізнес": ["briefcase", "chart", "factory", "target"],
};
const L = "a-zа-яіїєґ'’";
const RX = Object.fromEntries(Object.entries(KEYS).map(([k, words]) =>
  [k, new RegExp(`(?<![${L}])(?:${words.join("|")})`, "giu")]));

export const OBJECT_NAMES = Object.keys(O);

const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.codePointAt(0)) >>> 0, 7);
const pickFrom = (list, seed, avoid) => {
  const free = list.filter(x => !avoid.includes(x));
  const pool = free.length ? free : list;
  return pool[hash(seed) % pool.length];
};

// recent — предмети з кількох останніх обкладинок, щоб не повторюватися поспіль.
export function pickObject({ title = "", lead = "", text = "", tags = [], recent = [] } = {}) {
  const norm = s => String(s).toLowerCase().replace(/[’ʼ`]/g, "'");
  const count = (k, s) => (norm(s).match(RX[k]) || []).length;
  const ranked = OBJECT_NAMES
    .map(k => [k, count(k, title) * 6 + count(k, lead) * 3 + Math.min(count(k, text), 8)])
    .filter(([, sc]) => sc >= 3)
    .sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return pickFrom(TAG_FALLBACK[tags[0]] || TAG_FALLBACK.AI, title, recent);
  const [best, top] = ranked[0];
  if (!recent.includes(best)) return best;
  const next = ranked.find(([k, sc]) => !recent.includes(k) && sc >= top * 0.5);
  if (next) return next[0];
  const fam = FAMILIES.find(f => f.includes(best));
  return fam ? pickFrom(fam.filter(k => k !== best), title, recent) : best;
}

export const objectSvg = name => O[name] || O.spark;
