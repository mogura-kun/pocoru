import { useState, useRef, useEffect } from "react";

const font = "'Hiragino Maru Gothic Pro','Noto Sans JP',sans-serif";

// ── HSL ↔ RGB ────────────────────────────────────────────────────────────────
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
}
function rgbToHex(r, g, b) {
  return "#" + [r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
}

// ── SVG モチーフ ──────────────────────────────────────────────────────────────
const MOTIF_SVG = {
  flower: `<ellipse cx="12" cy="6" rx="2.2" ry="3.8"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(120 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(180 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(240 12 12)"/><ellipse cx="12" cy="6" rx="2.2" ry="3.8" transform="rotate(300 12 12)"/><circle cx="12" cy="12" r="3.8"/>`,
  bird:   `<path d="M12 7C9.5 7 7 8 5 10C6.5 9.5 8 9.5 9.5 10.5C8 10.5 6.5 11.5 6 13C7.5 12 9.5 12 11 13C10.5 14.5 10.5 16 11.5 17L12 15.5L12.5 17C13.5 16 13.5 14.5 13 13C14.5 12 16.5 12 18 13C17.5 11.5 16 10.5 14.5 10.5C16 9.5 17.5 9.5 19 10C17 8 14.5 7 12 7Z"/>`,
  fish:   `<ellipse cx="10" cy="12" rx="6.5" ry="4"/><path d="M16.5 12L22 8.5V15.5Z"/><circle cx="8" cy="11" r="1" fill="white"/>`,
  cloud:  `<path d="M18 17H6C4.1 17 2.5 15.4 2.5 13.5C2.5 11.8 3.7 10.3 5.4 10C5.1 9.4 5 8.7 5 8C5 5.5 7 3.5 9.5 3.5C10.9 3.5 12.2 4.1 13.1 5.1C13.6 4.9 14.3 4.7 15 4.7C17.5 4.7 19.5 6.7 19.5 9.2C19.5 9.4 19.5 9.6 19.4 9.7C20.7 10.2 21.5 11.4 21.5 12.8C21.5 15.1 19.9 17 18 17Z"/>`,
  plane:  `<path d="M22 12L4 5L8 12L4 19L22 12Z"/>`,
  music:  `<path d="M9 17C9 18.7 7.7 20 6 20C4.3 20 3 18.7 3 17C3 15.3 4.3 14 6 14C6.8 14 7.5 14.3 8 14.8V6L20 3V13C20 14.7 18.7 16 17 16C15.3 16 14 14.7 14 13C14 11.3 15.3 10 17 10C17.8 10 18.5 10.3 19 10.8V5.8L9 8.1V17Z"/>`,
  sparkle:`<path d="M12 2L13.8 9L21 11L13.8 13L12 20L10.2 13L3 11L10.2 9Z"/><path d="M19 2L19.8 4.8L22.5 5.5L19.8 6.2L19 9L18.2 6.2L15.5 5.5L18.2 4.8Z"/>`,
  bread:  `<path d="M4.5 12C4.5 8 7.8 5.5 12 5.5C16.2 5.5 19.5 8 19.5 12C19.5 14.5 18 16.5 15.5 17.5L12 18.5L8.5 17.5C6 16.5 4.5 14.5 4.5 12Z"/><path d="M8.5 10C9.5 8.8 10.7 8.2 12 8.2C13.3 8.2 14.5 8.8 15.5 10" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
};

const CATEGORIES = [
  {value:"flower",  label:"花"},
  {value:"bird",    label:"鳥"},
  {value:"fish",    label:"魚"},
  {value:"cloud",   label:"雲"},
  {value:"plane",   label:"飛行機"},
  {value:"music",   label:"音符"},
  {value:"sparkle", label:"きらめき"},
  {value:"bread",   label:"パン"},
];

// 4月の季節知識
const SEASON_TIPS = {
  flower:  "今はハナミズキが空を向いて咲く季節ですね 🌸",
  bird:    "数千キロ旅をしたツバメが戻ってくる頃です 🐦",
  fish:    "春の川では魚たちが産卵のために動き出す頃です 🐟",
  cloud:   "刷毛で掃いたような巻雲は、天気が変わるサインかも ☁️",
  plane:   "春の澄んだ空は飛行機雲がよく見える季節です ✈️",
  music:   "春は鳥のさえずりが豊かになり、自然の音楽が聞こえます 🎵",
  sparkle: "春の光は柔らかく、木漏れ日がきらめく季節です ✨",
  bread:   "春の小麦が芽吹く頃、パン屋さんも新しい季節を迎えます 🍞",
};

// 地図上に置くアイコンのサンプル配置
const MAP_PINS = [
  {id:1, motif:"flower",  color:"#e06080", x:18, y:28},
  {id:2, motif:"bird",    color:"#4a9cc7", x:62, y:18},
  {id:3, motif:"sparkle", color:"#f5b942", x:78, y:55},
  {id:4, motif:"music",   color:"#9b72cc", x:40, y:65},
  {id:5, motif:"cloud",   color:"#7ab0d4", x:22, y:72},
  {id:6, motif:"bread",   color:"#c9813a", x:68, y:80},
];

// ── FloatingIcon: 浮き出し立体アイコン ──────────────────────────────────────
function FloatingIcon({ motif, color, size = 36, onTap }) {
  const [pop, setPop] = useState(false);
  function handleClick() {
    setPop(true);
    setTimeout(() => setPop(false), 420);
    if (onTap) onTap();
  }
  const s = MOTIF_SVG[motif] || MOTIF_SVG.sparkle;
  return (
    <div
      onClick={handleClick}
      style={{
        cursor: "pointer",
        userSelect: "none",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), filter 0.18s",
        transform: pop ? "scale(1.38)" : "scale(1)",
        filter: pop
          ? `drop-shadow(0 -5px 8px rgba(255,255,255,1)) drop-shadow(0 8px 18px ${color}99)`
          : `drop-shadow(0 -3px 5px rgba(255,255,255,0.85)) drop-shadow(0 5px 12px ${color}66)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        dangerouslySetInnerHTML={{ __html: s }}
      />
    </div>
  );
}

// ── ColorPicker: 2D HSLパレット + 明るさバー ─────────────────────────────────
function ColorPicker({ hue, sat, bright, onHueSat, onBright }) {
  const paletteRef = useRef(null);
  const brightRef = useRef(null);
  const paletteDrag = useRef(false);
  const brightDrag = useRef(false);

  // パレットキャンバス描画 (X=色相, Y=彩度, brightness固定)
  useEffect(() => {
    const canvas = paletteRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const id = ctx.createImageData(W, H);
    const d = id.data;
    for (let y = 0; y < H; y++) {
      const s = 100 - (y / H) * 100;
      for (let x = 0; x < W; x++) {
        const h = (x / W) * 360;
        const [r, g, b] = hslToRgb(h, s, bright);
        const i = (y * W + x) * 4;
        d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
      }
    }
    ctx.putImageData(id, 0, 0);
  }, [bright]);

  // 明るさバー描画 (現在の色相・彩度で明るさだけ変化)
  useEffect(() => {
    const canvas = brightRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const id = ctx.createImageData(W, H);
    const d = id.data;
    for (let y = 0; y < H; y++) {
      const l = 100 - (y / H) * 100;
      const [r, g, b] = hslToRgb(hue, sat, l);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
      }
    }
    ctx.putImageData(id, 0, 0);
  }, [hue, sat]);

  function readPalette(e) {
    const c = paletteRef.current;
    const rect = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = Math.max(0, Math.min(1, (t.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (t.clientY - rect.top) / rect.height));
    onHueSat(x * 360, 100 - y * 100);
  }
  function readBright(e) {
    const c = brightRef.current;
    const rect = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const y = Math.max(0, Math.min(1, (t.clientY - rect.top) / rect.height));
    onBright(100 - y * 100);
  }

  const curX = (hue / 360) * 100;
  const curY = (1 - sat / 100) * 100;
  const curBY = (1 - bright / 100) * 100;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
      {/* 2Dパレット */}
      <div style={{ position: "relative", flex: 1, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", cursor: "crosshair" }}
        onMouseDown={e => { paletteDrag.current = true; readPalette(e); }}
        onMouseMove={e => { if (paletteDrag.current) readPalette(e); }}
        onMouseUp={() => (paletteDrag.current = false)}
        onMouseLeave={() => (paletteDrag.current = false)}
        onTouchStart={e => { paletteDrag.current = true; readPalette(e); }}
        onTouchMove={e => { e.preventDefault(); if (paletteDrag.current) readPalette(e); }}
        onTouchEnd={() => (paletteDrag.current = false)}
      >
        <canvas ref={paletteRef} width={260} height={160} style={{ width: "100%", height: 160, display: "block" }}/>
        {/* カーソル */}
        <div style={{
          position: "absolute",
          left: `${curX}%`, top: `${curY}%`,
          width: 16, height: 16,
          borderRadius: "50%",
          border: "2.5px solid white",
          boxShadow: "0 0 6px rgba(0,0,0,0.4)",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
          background: rgbToHex(...hslToRgb(hue, sat, bright)),
        }}/>
        <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, color: "rgba(255,255,255,0.85)", fontFamily: font, pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>← 色相　 彩度 ↕</div>
      </div>
      {/* 明るさバー */}
      <div style={{ position: "relative", width: 28, borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", cursor: "ns-resize" }}
        onMouseDown={e => { brightDrag.current = true; readBright(e); }}
        onMouseMove={e => { if (brightDrag.current) readBright(e); }}
        onMouseUp={() => (brightDrag.current = false)}
        onMouseLeave={() => (brightDrag.current = false)}
        onTouchStart={e => { brightDrag.current = true; readBright(e); }}
        onTouchMove={e => { e.preventDefault(); if (brightDrag.current) readBright(e); }}
        onTouchEnd={() => (brightDrag.current = false)}
      >
        <canvas ref={brightRef} width={28} height={160} style={{ width: "100%", height: 160, display: "block" }}/>
        {/* カーソル */}
        <div style={{
          position: "absolute",
          left: "50%", top: `${curBY}%`,
          width: 22, height: 6,
          borderRadius: 3,
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}/>
      </div>
    </div>
  );
}

// ── MapScreen ────────────────────────────────────────────────────────────────
function MapScreen({ onPost }) {
  const [tip, setTip] = useState(null);
  const [tapping, setTapping] = useState(null);

  function handlePinTap(pin) {
    setTapping(pin.id);
    setTip({ motif: pin.motif, text: SEASON_TIPS[pin.motif] });
    setTimeout(() => setTapping(null), 420);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#FAF9F6", overflow: "hidden", fontFamily: font }}>

      {/* ── 擬似マップ背景 ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* 緑地エリア */}
        <rect x="30" y="35" width="25" height="20" rx="4" fill="#DFF0D6" opacity="0.7"/>
        <rect x="5" y="55" width="14" height="30" rx="3" fill="#DFF0D6" opacity="0.5"/>
        <rect x="70" y="60" width="20" height="18" rx="3" fill="#DFF0D6" opacity="0.5"/>
        {/* 道路（縦横） */}
        <rect x="0" y="24" width="100" height="2.5" fill="#E6DECC"/>
        <rect x="0" y="48" width="100" height="2.5" fill="#E6DECC"/>
        <rect x="0" y="75" width="100" height="2.5" fill="#E6DECC"/>
        <rect x="28" y="0" width="2.5" height="100" fill="#E6DECC"/>
        <rect x="58" y="0" width="2.5" height="100" fill="#E6DECC"/>
        <rect x="82" y="0" width="2.5" height="100" fill="#E6DECC"/>
        {/* 建物ブロック */}
        <rect x="5"  y="5"  width="10" height="10" rx="1.5" fill="#EDE8DF"/>
        <rect x="18" y="5"  width="8"  height="10" rx="1.5" fill="#EDE8DF"/>
        <rect x="62" y="5"  width="12" height="10" rx="1.5" fill="#EDE8DF"/>
        <rect x="85" y="5"  width="10" height="10" rx="1.5" fill="#EDE8DF"/>
        <rect x="62" y="51" width="10" height="8"  rx="1.5" fill="#EDE8DF"/>
        <rect x="5"  y="28" width="20" height="14" rx="1.5" fill="#EDE8DF"/>
        <rect x="62" y="28" width="10" height="14" rx="1.5" fill="#EDE8DF"/>
        <rect x="85" y="28" width="10" height="14" rx="1.5" fill="#EDE8DF"/>
        <rect x="5"  y="78" width="20" height="18" rx="1.5" fill="#EDE8DF"/>
        <rect x="32" y="60" width="22" height="12" rx="1.5" fill="#EDE8DF"/>
        <rect x="85" y="78" width="10" height="18" rx="1.5" fill="#EDE8DF"/>
      </svg>

      {/* ── 地図ピン（浮き出しアイコン） ── */}
      {MAP_PINS.map(pin => (
        <div
          key={pin.id}
          style={{
            position: "absolute",
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: "translate(-50%,-50%)",
            zIndex: tapping === pin.id ? 10 : 5,
          }}
        >
          <FloatingIcon
            motif={pin.motif}
            color={pin.color}
            size={38}
            onTap={() => handlePinTap(pin)}
          />
        </div>
      ))}

      {/* ── ヘッダー ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "52px 20px 14px", background: "linear-gradient(to bottom, rgba(250,249,246,0.98) 70%, transparent)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#3a3028" }}>🌱 今日の発見</div>
        <div style={{ fontSize: 11, color: "#aaa" }}>4月・春</div>
      </div>

      {/* ── 投稿ボタン ── */}
      <button
        onClick={onPost}
        style={{ position: "absolute", bottom: 36, right: 24, width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#7dcc6a,#5aaa48)", color: "white", fontSize: 28, fontWeight: 700, boxShadow: "0 4px 20px rgba(109,184,92,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >+</button>

      {/* ── AI季節ヒントポップアップ ── */}
      {tip && (
        <div
          onClick={() => setTip(null)}
          style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", background: "#faf7f2", borderRadius: "24px 24px 0 0", padding: "20px 22px 40px", boxShadow: "0 -6px 30px rgba(0,0,0,0.12)", animation: "slideUp 0.3s ease" }}
          >
            <div style={{ width: 36, height: 4, background: "#e0d8d0", borderRadius: 2, margin: "0 auto 16px" }}/>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8, letterSpacing: 1 }}>✦ AI季節ガイド — 4月</div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#3a3028", lineHeight: 1.7 }}>{tip.text}</p>
            <button onClick={() => setTip(null)} style={{ marginTop: 18, width: "100%", padding: "11px 0", borderRadius: 13, border: "none", background: "#6db85c", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PostScreen ───────────────────────────────────────────────────────────────
function PostScreen({ onBack }) {
  const [hue, setHue] = useState(330);
  const [sat, setSat] = useState(70);
  const [bright, setBright] = useState(58);
  const [motif, setMotif] = useState("flower");
  const [note, setNote] = useState("");
  const [aiTip, setAiTip] = useState(null);

  const color = rgbToHex(...hslToRgb(hue, sat, bright));

  function handlePost() {
    setAiTip(SEASON_TIPS[motif]);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#faf7f2", display: "flex", flexDirection: "column", fontFamily: font, overflow: "hidden" }}>
      {/* ヘッダー */}
      <div style={{ flexShrink: 0, padding: "52px 20px 14px", borderBottom: "1px solid #eee8e0", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#6db85c", fontWeight: 700, padding: 0 }}>‹ 地図</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#3a3028" }}>発見を記録する ✨</div>
      </div>

      {/* スクロールエリア */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 40px" }}>

        {/* ── カラーピッカー ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🎨 今の気分で色を選ぶ</div>
          <ColorPicker
            hue={hue} sat={sat} bright={bright}
            onHueSat={(h, s) => { setHue(h); setSat(s); }}
            onBright={setBright}
          />
          {/* 選択中の色プレビュー */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: color, boxShadow: `0 3px 10px ${color}88`, flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: "#888" }}>選択中のカラー</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#bbb", fontFamily: "monospace" }}>{color.toUpperCase()}</span>
          </div>
        </div>

        {/* ── モチーフ選択 ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>モチーフ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {CATEGORIES.map(c => {
              const sel = motif === c.value;
              const s = MOTIF_SVG[c.value] || MOTIF_SVG.sparkle;
              return (
                <button
                  key={c.value}
                  onClick={() => setMotif(c.value)}
                  style={{
                    padding: "14px 4px 10px",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    background: sel ? `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.13)` : "#fff0f4",
                    boxShadow: sel ? `0 0 0 2.5px ${color}` : "0 1px 4px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s",
                  }}
                >
                  <svg
                    width={30}
                    height={30}
                    viewBox="0 0 24 24"
                    fill={sel ? color : "#e8a0b0"}
                    style={{
                      filter: sel
                        ? `drop-shadow(0 -2px 4px rgba(255,255,255,0.9)) drop-shadow(0 3px 8px ${color}66)`
                        : "none",
                      transition: "filter 0.15s",
                    }}
                    dangerouslySetInnerHTML={{ __html: s }}
                  />
                  <span style={{ fontSize: 10, color: sel ? color : "#c0a0a8", fontWeight: sel ? 700 : 400 }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── テキスト入力 ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ひとこと</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="何を見つけた？感じた？（省略可）"
            rows={3}
            style={{ width: "100%", padding: "11px 13px", borderRadius: 12, border: "1.5px solid #e8e0d8", background: "white", fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", fontFamily: font, lineHeight: 1.6, color: "#3a3028" }}
          />
        </div>

        {/* 投稿ボタン */}
        <button
          onClick={handlePost}
          style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${color}, ${rgbToHex(...hslToRgb(hue, sat, Math.max(bright-12,20)))})`, color: "white", fontSize: 15, fontWeight: 800, boxShadow: `0 4px 18px ${color}55` }}
        >
          みんなに届ける 🌱
        </button>
      </div>

      {/* ── AI季節ポップアップ ── */}
      {aiTip && (
        <div
          onClick={() => setAiTip(null)}
          style={{ position: "absolute", inset: 0, background: "rgba(58,48,40,0.45)", zIndex: 30, display: "flex", alignItems: "flex-end" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", background: "#faf7f2", borderRadius: "24px 24px 0 0", padding: "24px 22px 48px", boxShadow: "0 -8px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.35s ease" }}
          >
            <div style={{ width: 36, height: 4, background: "#e0d8d0", borderRadius: 2, margin: "0 auto 16px" }}/>
            <div style={{ fontSize: 22, textAlign: "center", marginBottom: 12 }}>🌱</div>
            <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginBottom: 10, letterSpacing: 1 }}>✦ AI季節ガイド — 4月</div>
            <div style={{ background: `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.1)`, borderRadius: 14, padding: "14px 16px", borderLeft: `4px solid ${color}`, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#3a3028", lineHeight: 1.8 }}>{aiTip}</p>
            </div>
            <button
              onClick={() => { setAiTip(null); }}
              style={{ width: "100%", padding: "12px 0", borderRadius: 13, border: "none", background: color, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              地図で見る 📍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Demo App ─────────────────────────────────────────────────────────────────
export default function Demo() {
  const [screen, setScreen] = useState("map"); // "map" | "post"

  return (
    <div style={{ height: "100dvh", maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden", fontFamily: font }}>
      {/* マップ画面 */}
      <div style={{ position: "absolute", inset: 0, transform: screen === "map" ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <MapScreen onPost={() => setScreen("post")} />
      </div>
      {/* 投稿画面 */}
      <div style={{ position: "absolute", inset: 0, transform: screen === "post" ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <PostScreen onBack={() => setScreen("map")} />
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
