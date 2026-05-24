/**
 * Ani Bucket List — newtab.js  v1.1
 * Bookmark manager + Glassmorphism + Wallpaper engine
 */

// ─────────────────────────────────────────────
const PREPOPULATED_BOARDS = [
  { id: "entertainment", name: "🎬 Entertainment" },
  { id: "social-media",  name: "👥 Social Media" },
  { id: "ai",            name: "🤖 A I" },
  { id: "notes",         name: "📝 Notes" },
  { id: "projects",      name: "💻 Projects" },
  { id: "reviews",       name: "🍿 Reviews" },
  { id: "live",          name: "⚽ Live" },
  { id: "cr9",           name: "🏏 Cr9" }
];

const PREPOPULATED_BOOKMARKS = [];


const DEFAULT_BOARDS   = PREPOPULATED_BOARDS;
const DEFAULT_SETTINGS = { activeBoardId: "entertainment", privacyModeActive: false, theme: "dark",
  wallpaper: { type: "none", livePreset: null, dim: 50, blur: 16 } };

let state = { boards: [], bookmarks: [], settings: { ...DEFAULT_SETTINGS }, searchQuery: "" };
let editingBookmarkId = null;

// ─────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────

async function loadFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["boards", "bookmarks", "settings"], (data) => {
      let loadedBoards = Array.isArray(data.boards) ? data.boards : [];
      let loadedBookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];

      // Check if we need to force-populate the preseeded LumiList bookmarks.
      // If "entertainment" board is missing in current storage, it's either first run
      // or a migration from an old version. We overwrite with the complete preseeded data.
      const hasPreseededData = loadedBoards.some((b) => b.id === "entertainment");

      if (!hasPreseededData) {
        state.boards = [...DEFAULT_BOARDS];
        state.boards.forEach((b, index) => {
          b.laneIndex = index;
          b.left = 20 + index * 320;
          b.top = 20;
        });
        state.bookmarks = [...PREPOPULATED_BOOKMARKS];
        state.settings = { ...DEFAULT_SETTINGS };
        
        // Immediately persist so the preloaded boards and bookmarks are permanently committed
        persist(["boards", "bookmarks", "settings"]);
      } else {
        state.boards = loadedBoards;
        state.boards.forEach((b, index) => {
          if (b.laneIndex === undefined) {
            b.laneIndex = index;
            b.left = 20 + index * 320;
            b.top = 20;
          }
        });
        state.bookmarks = loadedBookmarks;
        state.settings = data.settings
          ? { ...DEFAULT_SETTINGS, ...data.settings,
              wallpaper: { ...DEFAULT_SETTINGS.wallpaper, ...(data.settings.wallpaper || {}) } }
          : { ...DEFAULT_SETTINGS };
      }
      resolve();
    });
  });
}

function persist(keys = ["boards", "bookmarks", "settings"]) {
  const p = {};
  if (keys.includes("boards"))    p.boards    = state.boards;
  if (keys.includes("bookmarks")) p.bookmarks = state.bookmarks;
  if (keys.includes("settings"))  p.settings  = state.settings;
  chrome.storage.local.set(p);
}

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────

function sanitize(str) {
  const el = document.createElement("div");
  el.textContent = String(str || "");
  return el.innerHTML;
}
function safeText(str) { return String(str || "").trim(); }
function extractDomain(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } }
function getFaviconUrl(url) { try { return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=64`; } catch { return ""; } }

let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ─────────────────────────────────────────────
//  WALLPAPER ENGINE
// ─────────────────────────────────────────────

const LIVE_PRESETS = {
  aurora:    { name: "Aurora",      thumbClass: "thumb-aurora",    desc: "Color gradients" },
  space:     { name: "Deep Space",  thumbClass: "thumb-space",     desc: "Starfield" },
  matrix:    { name: "Matrix Rain", thumbClass: "thumb-matrix",    desc: "Digital rain" },
  mesh:      { name: "Neural Mesh", thumbClass: "thumb-mesh",      desc: "Particle web" },
  synthwave: { name: "Synthwave",   thumbClass: "thumb-synthwave", desc: "Retro grid" },
};

let _animId     = null;
let _animState  = {};   // per-preset mutable state (stars, drops, particles)

/* ── Aurora ── */
const AURORA_BLOBS = [
  { bx: 0.25, by: 0.45, speed: 0.00025, phase: 0,    r: 0.55, color: [99,102,241]  },
  { bx: 0.70, by: 0.30, speed: 0.00018, phase: 2.1,  r: 0.50, color: [139,92,246]  },
  { bx: 0.50, by: 0.75, speed: 0.00032, phase: 4.2,  r: 0.48, color: [20,184,166]  },
  { bx: 0.10, by: 0.60, speed: 0.00022, phase: 1.5,  r: 0.40, color: [236,72,153]  },
  { bx: 0.85, by: 0.65, speed: 0.00028, phase: 3.3,  r: 0.42, color: [59,130,246]  },
];
function drawAurora(canvas, ctx, t) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#050514"; ctx.fillRect(0,0,canvas.width,canvas.height);
  const min = Math.min(canvas.width, canvas.height);
  AURORA_BLOBS.forEach((b,i) => {
    const x = (b.bx + Math.sin(t * b.speed + b.phase)       * 0.18) * canvas.width;
    const y = (b.by + Math.cos(t * b.speed + b.phase + 1.1) * 0.12) * canvas.height;
    const r = b.r * min * 0.9;
    const g = ctx.createRadialGradient(x,y,0, x,y,r);
    const [cr,cg,cb] = b.color;
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0.45)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  });
  // soft noise vignette
  const vig = ctx.createRadialGradient(canvas.width/2,canvas.height/2,canvas.height*0.1,canvas.width/2,canvas.height/2,canvas.width*0.8);
  vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.5)");
  ctx.fillStyle = vig; ctx.fillRect(0,0,canvas.width,canvas.height);
}

/* ── Deep Space ── */
function initSpace(canvas) {
  _animState.stars = Array.from({length: 260}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    sz: Math.random() * 1.8 + 0.3,
    op: Math.random() * 0.75 + 0.2,
    twinkle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.025 + 0.005,
  }));
  _animState.shooting = null;
  _animState.shootTimer = 0;
}
function drawSpace(canvas, ctx, t) {
  ctx.fillStyle = "#020209"; ctx.fillRect(0,0,canvas.width,canvas.height);
  (_animState.stars || []).forEach(s => {
    s.twinkle += s.speed;
    const op = s.op * (0.65 + 0.35 * Math.sin(s.twinkle));
    ctx.beginPath(); ctx.arc(s.x, s.y, s.sz, 0, Math.PI*2);
    ctx.fillStyle = `rgba(200,210,255,${op.toFixed(2)})`; ctx.fill();
  });
  // shooting star
  _animState.shootTimer = (_animState.shootTimer || 0) + 1;
  if (_animState.shootTimer > 240 && !_animState.shooting) {
    _animState.shooting = { x: Math.random()*canvas.width, y: Math.random()*canvas.height*0.4, len: 120+Math.random()*80, prog: 0, angle: Math.PI/5 + Math.random()*0.3 };
    _animState.shootTimer = 0;
  }
  if (_animState.shooting) {
    const sh = _animState.shooting;
    sh.prog += 6;
    const ex = sh.x + Math.cos(sh.angle) * sh.prog;
    const ey = sh.y + Math.sin(sh.angle) * sh.prog;
    const sx = sh.x + Math.cos(sh.angle) * Math.max(0, sh.prog - sh.len);
    const sy = sh.y + Math.sin(sh.angle) * Math.max(0, sh.prog - sh.len);
    const grad = ctx.createLinearGradient(sx,sy,ex,ey);
    grad.addColorStop(0,"rgba(255,255,255,0)"); grad.addColorStop(1,"rgba(255,255,255,0.85)");
    ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 1.5;
    ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    if (sh.prog > sh.len + 40) _animState.shooting = null;
  }
}

/* ── Matrix Rain ── */
const MATRIX_CHARS = "アイウエオカキクケコ0123456789ABCDEF🪣◈▲△○";
function initMatrix(canvas) {
  const cols = Math.floor(canvas.width / 16);
  _animState.drops = Array.from({length: cols}, () => -(Math.random() * canvas.height / 16));
  _animState.matrixFrame = 0;
}
function drawMatrix(canvas, ctx, t) {
  _animState.matrixFrame = (_animState.matrixFrame || 0) + 1;
  if (_animState.matrixFrame % 2 !== 0) return; // throttle to ~30fps
  ctx.fillStyle = "rgba(2,5,2,0.06)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font = "13px 'Courier New',monospace";
  const drops = _animState.drops || [];
  drops.forEach((drop, i) => {
    const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    const x = i * 16, y = drop * 16;
    // leading glyph: bright indigo-white
    ctx.fillStyle = "#c7d2fe";
    ctx.fillText(char, x, y);
    // previous glyphs: dim violet
    ctx.fillStyle = `rgba(99,102,241,${0.3 + Math.random()*0.2})`;
    const trailChar = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    ctx.fillText(trailChar, x, y - 16);
    drops[i] += 0.6;
    if (y > canvas.height && Math.random() > 0.974) drops[i] = 0;
  });
}

/* ── Neural Mesh ── */
function initMesh(canvas) {
  _animState.particles = Array.from({length: 70}, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.55,
    vy: (Math.random() - 0.5) * 0.55,
    sz: Math.random() * 2 + 1,
  }));
}
function drawMesh(canvas, ctx, t) {
  ctx.fillStyle = "#06061a"; ctx.fillRect(0,0,canvas.width,canvas.height);
  const pts = _animState.particles || [];
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });
  const LINK_DIST = 160;
  pts.forEach((p, i) => {
    for (let j = i+1; j < pts.length; j++) {
      const q = pts[j];
      const d = Math.hypot(p.x-q.x, p.y-q.y);
      if (d < LINK_DIST) {
        ctx.strokeStyle = `rgba(99,102,241,${((1 - d/LINK_DIST)*0.35).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
    ctx.fillStyle = `rgba(165,180,252,${0.5 + 0.3*Math.sin(t*0.001+i)})`;
    ctx.fill();
  });
}

/* ── Synthwave ── */
let _swFrame = 0;
function drawSynthwave(canvas, ctx, t) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = "#0d0221"; ctx.fillRect(0,0,W,H);
  // sky gradient
  const sky = ctx.createLinearGradient(0,0,0,H*0.55);
  sky.addColorStop(0,"#0d0221"); sky.addColorStop(1,"#1a0533");
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H*0.55);
  // sun
  const sx = W/2, sy = H*0.42, sr = H*0.14;
  const sunGrad = ctx.createRadialGradient(sx,sy,0,sx,sy,sr);
  sunGrad.addColorStop(0,"rgba(255,200,80,0.9)"); sunGrad.addColorStop(0.5,"rgba(255,100,180,0.7)"); sunGrad.addColorStop(1,"rgba(100,0,200,0)");
  ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill();
  // sun scanlines
  for (let sl=1; sl<=6; sl++) {
    const lineY = sy - sr*0.6 + (sl * sr*0.22);
    if (lineY > sy - sr && lineY < sy + sr) {
      ctx.fillStyle = "rgba(0,0,20,0.55)";
      ctx.fillRect(sx - sr, lineY, sr*2, sr*0.08);
    }
  }
  // horizon glow
  const hg = ctx.createLinearGradient(0,H*0.52,0,H*0.6);
  hg.addColorStop(0,"rgba(255,0,200,0.4)"); hg.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = hg; ctx.fillRect(0,H*0.52,W,H*0.1);
  // grid floor
  const horizon = H * 0.55;
  const offset = (t * 0.04) % (H / 10);
  ctx.strokeStyle = "rgba(255,0,200,0.25)"; ctx.lineWidth = 1;
  for (let gy=0; gy<20; gy++) {
    const rawY = horizon + gy*(H*0.1) - offset;
    if (rawY < horizon || rawY > H) continue;
    const progress = (rawY - horizon) / (H - horizon);
    const lx = W/2 - (W * 0.7 * progress);
    const rx = W/2 + (W * 0.7 * progress);
    ctx.beginPath(); ctx.moveTo(lx, rawY); ctx.lineTo(rx, rawY); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,200,255,0.2)";
  for (let vl=-12; vl<=12; vl++) {
    const xStart = W/2 + vl * (W * 0.065);
    ctx.beginPath(); ctx.moveTo(xStart, horizon); ctx.lineTo(W/2 + vl*(W*0.65), H+40); ctx.stroke();
  }
  // vignette
  const vig = ctx.createRadialGradient(W/2,H,H*0.05,W/2,H,W*0.8);
  vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,20,0.7)");
  ctx.fillStyle = vig; ctx.fillRect(0,0,W,H);
}

/* ── Dispatch ── */
function initPreset(preset, canvas) {
  _animState = {};
  if (preset === "space")  initSpace(canvas);
  if (preset === "matrix") initMatrix(canvas);
  if (preset === "mesh")   initMesh(canvas);
}
function drawPreset(preset, canvas, ctx, t) {
  if (preset === "aurora")    drawAurora(canvas, ctx, t);
  if (preset === "space")     drawSpace(canvas, ctx, t);
  if (preset === "matrix")    drawMatrix(canvas, ctx, t);
  if (preset === "mesh")      drawMesh(canvas, ctx, t);
  if (preset === "synthwave") drawSynthwave(canvas, ctx, t);
}

function startLiveWallpaper(preset) {
  stopLiveWallpaper();
  const canvas = document.getElementById("wp-canvas");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";
  document.getElementById("wp-img").style.display    = "none";
  document.getElementById("wp-solid").style.display  = "none";
  const ctx = canvas.getContext("2d");
  initPreset(preset, canvas);
  const tick = (t) => { drawPreset(preset, canvas, ctx, t); _animId = requestAnimationFrame(tick); };
  _animId = requestAnimationFrame(tick);
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initPreset(preset, canvas);
  });
}

function stopLiveWallpaper() {
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
  document.getElementById("wp-canvas").style.display = "none";
  const video = document.getElementById("wp-video");
  video.style.display = "none";
  video.src = "";
}

function setStaticWallpaper(base64) {
  stopLiveWallpaper();
  const img = document.getElementById("wp-img");
  img.src = base64;
  img.style.display = "block";
  document.getElementById("wp-solid").style.display = "none";
}

function setCustomLiveWallpaper(dataUrlOrUrl) {
  stopLiveWallpaper();
  const video = document.getElementById("wp-video");
  const img = document.getElementById("wp-img");
  
  const isVideo = dataUrlOrUrl.startsWith("data:video/") || 
                  /\.(mp4|webm|ogv|mov)$/i.test(dataUrlOrUrl);
                  
  if (isVideo) {
    img.style.display = "none";
    video.src = dataUrlOrUrl;
    video.style.display = "block";
    video.play().catch(err => console.log("Video autoplay blocked or error:", err));
  } else {
    video.style.display = "none";
    video.src = "";
    img.src = dataUrlOrUrl;
    img.style.display = "block";
  }
  document.getElementById("wp-solid").style.display = "none";
}

function clearWallpaper() {
  stopLiveWallpaper();
  document.getElementById("wp-img").style.display   = "none";
  const video = document.getElementById("wp-video");
  video.style.display = "none";
  video.src = "";
  document.getElementById("wp-solid").style.display = "block";
}

function applyDimAndBlur(dim, blur) {
  document.getElementById("wp-dim-overlay").style.background = `rgba(0,0,0,${dim/100})`;
  document.documentElement.style.setProperty("--blur-ui", `${blur}px`);
}

function applyWallpaperSettings() {
  const wp = state.settings.wallpaper;
  applyDimAndBlur(wp.dim ?? 50, wp.blur ?? 16);
  if (wp.type === "live" && wp.livePreset) {
    if (wp.livePreset === "custom") {
      chrome.storage.local.get("custom_live_wallpaper", (res) => {
        if (res.custom_live_wallpaper) {
          setCustomLiveWallpaper(res.custom_live_wallpaper);
        } else {
          clearWallpaper();
        }
      });
    } else {
      startLiveWallpaper(wp.livePreset);
    }
  } else if (wp.type === "static") {
    const saved = localStorage.getItem("ani-bucket-list_wallpaper");
    if (saved) setStaticWallpaper(saved);
    else clearWallpaper();
  } else {
    clearWallpaper();
  }
}

// ─────────────────────────────────────────────
//  WALLPAPER PANEL UI
// ─────────────────────────────────────────────

function buildPresetGrid() {
  const grid = document.getElementById("wp-presets-grid");
  grid.innerHTML = "";
  Object.entries(LIVE_PRESETS).forEach(([id, preset]) => {
    const card = document.createElement("div");
    card.className = "wp-preset-card" + (state.settings.wallpaper.type === "live" && state.settings.wallpaper.livePreset === id ? " selected" : "");
    card.dataset.preset = id;
    card.innerHTML = `
      <div class="wp-preset-thumb ${preset.thumbClass}">
        <span class="wp-preset-name">${sanitize(preset.name)}</span>
      </div>`;
    card.addEventListener("click", () => {
      state.settings.wallpaper.type       = "live";
      state.settings.wallpaper.livePreset = id;
      persist(["settings"]);
      buildPresetGrid();
      setActiveWpTab("live");
      startLiveWallpaper(id);
      showToast(`🎬 Live: ${preset.name}`);
    });
    grid.appendChild(card);
  });
}

function setActiveWpTab(tab) {
  document.querySelectorAll(".wp-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".wp-tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById(`wp-tab-${tab}`)?.classList.add("active");
}

function syncWpPanelState() {
  const wp = state.settings.wallpaper;
  setActiveWpTab(wp.type);
  buildPresetGrid();
  document.getElementById("wp-dim").value  = wp.dim  ?? 50;
  document.getElementById("wp-blur").value = wp.blur ?? 16;
  document.getElementById("dim-val").textContent  = `${wp.dim ?? 50}%`;
  document.getElementById("blur-val").textContent = `${wp.blur ?? 16}px`;
  // static preview
  const saved = localStorage.getItem("ani-bucket-list_wallpaper");
  const previewWrap = document.getElementById("wp-static-preview");
  if (saved) {
    document.getElementById("wp-preview-img").src = saved;
    previewWrap.style.display = "block";
  } else {
    previewWrap.style.display = "none";
  }
  
  // custom live preview
  chrome.storage.local.get("custom_live_wallpaper", (res) => {
    const livePreviewWrap = document.getElementById("wp-live-custom-preview");
    const previewVideo = document.getElementById("wp-live-preview-video");
    const previewGif = document.getElementById("wp-live-preview-gif");
    const urlInput = document.getElementById("wp-live-url-input");
    
    const savedLive = res.custom_live_wallpaper;
    if (savedLive) {
      const isVideo = savedLive.startsWith("data:video/") || /\.(mp4|webm|ogv|mov)$/i.test(savedLive);
      if (isVideo) {
        previewGif.style.display = "none";
        previewVideo.src = savedLive;
        previewVideo.style.display = "block";
      } else {
        previewVideo.style.display = "none";
        previewVideo.src = "";
        previewGif.src = savedLive;
        previewGif.style.display = "block";
      }
      livePreviewWrap.style.display = "block";
      if (!savedLive.startsWith("data:")) {
        urlInput.value = savedLive;
      } else {
        urlInput.value = "";
      }
    } else {
      livePreviewWrap.style.display = "none";
      previewVideo.src = "";
      previewGif.src = "";
      urlInput.value = "";
    }
  });
}

function setupWallpaperPanel() {
  const panel = document.getElementById("wp-panel");

  // Open/close
  document.getElementById("wallpaper-btn").addEventListener("click", () => {
    panel.classList.toggle("open");
    document.getElementById("bottom-left-stack").classList.toggle("panel-open", panel.classList.contains("open"));
    if (panel.classList.contains("open")) syncWpPanelState();
  });
  document.getElementById("wp-close").addEventListener("click", () => {
    panel.classList.remove("open");
    document.getElementById("bottom-left-stack").classList.remove("panel-open");
  });

  // Tab switching
  document.querySelectorAll(".wp-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      setActiveWpTab(tab);
      if (tab === "none") {
        state.settings.wallpaper.type = "none";
        state.settings.wallpaper.livePreset = null;
        persist(["settings"]);
        clearWallpaper();
      }
      if (tab === "static" && state.settings.wallpaper.type !== "static") {
        // Just show the tab; user still needs to upload
      }
      if (tab === "live") buildPresetGrid();
    });
  });

  // File upload
  document.getElementById("wp-file-input").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX = 4 * 1024 * 1024;
    if (file.size > MAX) { showToast("⚠ Image too large. Use under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      try {
        localStorage.setItem("ani-bucket-list_wallpaper", base64);
      } catch {
        showToast("⚠ Storage full — try a smaller image."); return;
      }
      state.settings.wallpaper.type = "static";
      state.settings.wallpaper.livePreset = null;
      persist(["settings"]);
      setStaticWallpaper(base64);
      document.getElementById("wp-preview-img").src = base64;
      document.getElementById("wp-static-preview").style.display = "block";
      showToast("🖼 Wallpaper applied");
    };
    reader.readAsDataURL(file);
  });

  // Remove static
  document.getElementById("wp-remove-static").addEventListener("click", () => {
    localStorage.removeItem("ani-bucket-list_wallpaper");
    state.settings.wallpaper.type = "none";
    state.settings.wallpaper.livePreset = null;
    persist(["settings"]);
    clearWallpaper();
    document.getElementById("wp-static-preview").style.display = "none";
    setActiveWpTab("none");
    showToast("Wallpaper removed");
  });

  // Live File upload
  document.getElementById("wp-live-file-input").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX = 15 * 1024 * 1024; // 15MB limit since chrome.storage.local allows large base64
    if (file.size > MAX) { showToast("⚠ File too large. Use under 15MB."); return; }
    
    showToast("Processing live wallpaper...");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      
      try {
        await chrome.storage.local.set({ "custom_live_wallpaper": base64 });
      } catch (err) {
        showToast("⚠ Failed to save live wallpaper to storage.");
        return;
      }
      
      state.settings.wallpaper.type = "live";
      state.settings.wallpaper.livePreset = "custom";
      persist(["settings"]);
      setCustomLiveWallpaper(base64);
      syncWpPanelState();
      showToast("🎬 Live wallpaper applied");
    };
    reader.readAsDataURL(file);
  });

  // Live URL input
  const liveUrlInput = document.getElementById("wp-live-url-input");
  const handleLiveUrlSave = async () => {
    const url = liveUrlInput.value.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      showToast("⚠ Enter a valid URL.");
      return;
    }
    
    await chrome.storage.local.set({ "custom_live_wallpaper": url });
    state.settings.wallpaper.type = "live";
    state.settings.wallpaper.livePreset = "custom";
    persist(["settings"]);
    setCustomLiveWallpaper(url);
    syncWpPanelState();
    showToast("🎬 Custom streaming live wallpaper applied");
  };
  
  liveUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLiveUrlSave();
    }
  });
  liveUrlInput.addEventListener("blur", handleLiveUrlSave);

  // Remove Custom Live
  document.getElementById("wp-remove-live-custom").addEventListener("click", async () => {
    await chrome.storage.local.remove("custom_live_wallpaper");
    state.settings.wallpaper.type = "none";
    state.settings.wallpaper.livePreset = null;
    persist(["settings"]);
    clearWallpaper();
    syncWpPanelState();
    showToast("Custom live wallpaper removed");
  });

  // Dim slider
  document.getElementById("wp-dim").addEventListener("input", (e) => {
    const v = parseInt(e.target.value);
    document.getElementById("dim-val").textContent = `${v}%`;
    state.settings.wallpaper.dim = v;
    applyDimAndBlur(v, state.settings.wallpaper.blur ?? 16);
    persist(["settings"]);
  });

  // Blur slider
  document.getElementById("wp-blur").addEventListener("input", (e) => {
    const v = parseInt(e.target.value);
    document.getElementById("blur-val").textContent = `${v}px`;
    state.settings.wallpaper.blur = v;
    applyDimAndBlur(state.settings.wallpaper.dim ?? 50, v);
    persist(["settings"]);
  });
}

// ─────────────────────────────────────────────
//  SIDEBAR RENDERING
// ─────────────────────────────────────────────

function renderSidebar() {
  const container = document.getElementById("sidebar-boards");
  container.innerHTML = "";
  state.boards.forEach((board) => {
    const item = document.createElement("div");
    item.className = "board-item" + (board.id === state.settings.activeBoardId ? " active" : "");
    item.dataset.boardId = board.id;
    const nameSpan = document.createElement("span");
    nameSpan.className = "board-name";
    nameSpan.textContent = safeText(board.name);
    item.appendChild(nameSpan);
    const del = document.createElement("span");
    del.className = "del-board"; del.title = "Delete board";
    del.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`;
    del.addEventListener("click", (e) => { e.stopPropagation(); handleDeleteBoard(board.id, board.name); });
    item.appendChild(del);
    item.addEventListener("click", () => {
      state.settings.activeBoardId = board.id;
      persist(["settings"]);
      renderSidebar();
      
      const colEl = document.querySelector(`.kanban-column[data-board-id="${board.id}"]`);
      if (colEl) {
        colEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('highlighted'));
        colEl.classList.add('highlighted');
        setTimeout(() => colEl.classList.remove('highlighted'), 1600);
      }
    });
    container.appendChild(item);
  });
}

// ─────────────────────────────────────────────
//  KANBAN DRAG AND DROP UTILS
// ─────────────────────────────────────────────

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.bookmark-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function getDragAfterColumn(container, x, y) {
  const draggableColumns = [...container.querySelectorAll('.kanban-column:not(.dragging-column)')];
  
  return draggableColumns.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const dx = x - (box.left + box.width / 2);
    const dy = y - (box.top + box.height / 2);
    const d = Math.hypot(dx, dy);
    if (d < closest.distance) {
      return { distance: d, element: child };
    } else {
      return closest;
    }
  }, { distance: Number.POSITIVE_INFINITY }).element;
}

// ─────────────────────────────────────────────
//  CARDS RENDERING (KANBAN MULTI-COLUMN VIEW)
// ─────────────────────────────────────────────

function makeColumnDraggable(colEl, boardId) {
  const header = colEl.querySelector(".column-header");
  
  header.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || e.target.closest("svg")) return;
    
    e.preventDefault();
    header.setPointerCapture(e.pointerId);
    
    colEl.classList.add("dragging-column");
    colEl.style.zIndex = "1000";
    
    const rect = colEl.getBoundingClientRect();
    const gridEl = document.getElementById("cards-grid");
    const gridRect = gridEl.getBoundingClientRect();
    
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const onPointerMove = (moveEv) => {
      let left = moveEv.clientX - gridRect.left + gridEl.scrollLeft - offsetX;
      let top = moveEv.clientY - gridRect.top + gridEl.scrollTop - offsetY;
      
      left = Math.max(10, left);
      top = Math.max(10, top);
      
      colEl.style.left = `${left}px`;
      colEl.style.top = `${top}px`;
    };
    
    const onPointerUp = (upEv) => {
      header.releasePointerCapture(upEv.pointerId);
      colEl.classList.remove("dragging-column");
      colEl.style.zIndex = "";
      
      header.removeEventListener("pointermove", onPointerMove);
      header.removeEventListener("pointerup", onPointerUp);
      
      let left = parseInt(colEl.style.left, 10);
      let top = parseInt(colEl.style.top, 10);
      
      let slotX = Math.round((left - 20) / 320);
      slotX = Math.max(0, slotX);
      
      const board = state.boards.find(b => b.id === boardId);
      if (board) {
        board.laneIndex = slotX;
        board.left = left;
        board.top = top;
      }
      persist(["boards"]);
      
      renderSidebar();
      renderCards();
      
      showToast("Workspace order saved ✓");
    };
    
    header.addEventListener("pointermove", onPointerMove);
    header.addEventListener("pointerup", onPointerUp);
  });
}

function renderCards() {
  const grid       = document.getElementById("cards-grid");
  const empty      = document.getElementById("empty-state");
  const titleEl    = document.getElementById("board-title");
  const countEl    = document.getElementById("board-count");
  
  titleEl.textContent = "🪣 Ani's Workspace Canvas";
  countEl.textContent = `${state.bookmarks.length} bookmark${state.bookmarks.length !== 1 ? "s" : ""} in total`;
  
  grid.innerHTML = "";
  
  if (state.bookmarks.length === 0) {
    empty.classList.add("visible");
    return;
  }
  empty.classList.remove("visible");

  // Render each board as a clean absolute positioned snapping grid column widget
  state.boards.forEach((board, index) => {
    const column = document.createElement("div");
    column.className = "kanban-column" + (board.id === state.settings.activeBoardId ? " highlighted" : "");
    column.dataset.boardId = board.id;
    
    // Auto-tiling positions if left/top/laneIndex are undefined
    if (board.laneIndex === undefined) {
      board.laneIndex = index;
      board.left = 20 + index * 320;
      board.top = 20;
    }
    
    column.style.left = `${board.left}px`;
    column.style.top = `${board.top}px`;
    
    // Emojis mapping from board name
    const titleText = safeText(board.name);
    
    // Filter bookmarks for this column
    let columnBookmarks = state.bookmarks.filter((bm) => bm.boardId === board.id);
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      columnBookmarks = columnBookmarks.filter((bm) =>
        safeText(bm.title).toLowerCase().includes(q) || safeText(bm.url).toLowerCase().includes(q)
      );
    }
    
    columnBookmarks.sort((a, b) => b.createdAt - a.createdAt);
    
    column.innerHTML = `
      <div class="column-header">
        <span class="column-title">${sanitize(titleText)}</span>
        <div style="display:flex; align-items:center; gap:4px;">
          <button class="column-add-btn" data-board-id="${sanitize(board.id)}" title="Quick Add Link" style="background:transparent;border:none;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;transition:color 0.15s;padding:4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button class="column-del-btn" data-board-id="${sanitize(board.id)}" title="Delete Board">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
      <div class="column-divider"></div>
      <div class="column-cards-list" data-board-id="${sanitize(board.id)}"></div>
    `;
    
    // Bind column Add button to open manual modal with this board preselected
    column.querySelector(".column-add-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openModalWithBoard(board.id);
    });
    
    // Bind column Delete button to trigger deletion workflow
    column.querySelector(".column-del-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      handleDeleteBoard(board.id, board.name);
    });
    
    const cardsList = column.querySelector(".column-cards-list");
    
    columnBookmarks.forEach((bm) => {
      const card = document.createElement("div");
      card.className = "bookmark-card";
      card.dataset.id = bm.id;
      card.setAttribute("draggable", "true");
      
      const favicon  = getFaviconUrl(bm.url);
      const domain   = extractDomain(bm.url);
      const title    = safeText(bm.title) || domain;
      
      card.innerHTML = `
        <div class="card-head">
          <img class="card-favicon" src="${sanitize(favicon)}" alt="" loading="lazy" onerror="this.style.display='none'"/>
          <div class="card-title">${sanitize(title)}</div>
        </div>
        <div class="card-domain">${sanitize(domain)}</div>
        <button class="card-edit" data-id="${sanitize(bm.id)}" title="Edit">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
        <button class="card-del" data-id="${sanitize(bm.id)}" title="Remove">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      `;
      
      // Card Click Handler
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-del") || e.target.closest(".card-edit")) return;
        window.location.href = bm.url;
      });
      
      // Card Edit Button Click Handler
      card.querySelector(".card-edit").addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(bm.id);
      });
      
      // Card Delete Button Click Handler
      card.querySelector(".card-del").addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteBookmark(bm.id);
      });
      
      // Native Drag events on the Card
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", bm.id);
        card.classList.add("dragging");
      });
      
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
      });
      
      cardsList.appendChild(card);
    });
    
    // Column drop zone drag events (reorders bookmark list vertically)
    cardsList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector(".dragging");
      if (!draggingCard) return;
      
      const afterElement = getDragAfterElement(cardsList, e.clientY);
      if (afterElement == null) {
        cardsList.appendChild(draggingCard);
      } else {
        cardsList.insertBefore(draggingCard, afterElement);
      }
      cardsList.classList.add("drag-over");
    });
    
    cardsList.addEventListener("dragleave", () => {
      cardsList.classList.remove("drag-over");
    });
    
    cardsList.addEventListener("drop", (e) => {
      cardsList.classList.remove("drag-over");
      const bmId = e.dataTransfer.getData("text/plain");
      const targetBoardId = cardsList.dataset.boardId;
      
      const cardElements = [...cardsList.querySelectorAll(".bookmark-card")];
      const orderedIds = cardElements.map(el => el.dataset.id);
      
      const bm = state.bookmarks.find((b) => b.id === bmId);
      if (bm) {
        bm.boardId = targetBoardId;
      }
      
      // Assign descending timestamps so card layout preserves drop order
      const now = Date.now();
      orderedIds.forEach((id, index) => {
        const item = state.bookmarks.find((b) => b.id === id);
        if (item) {
          item.createdAt = now - index * 1000;
        }
      });
      
      persist(["bookmarks"]);
      renderCards();
      
      const boardName = state.boards.find(b => b.id === targetBoardId)?.name || "Column";
      showToast(`Saved layout to ${boardName} ✓`);
    });
    
    // Bind Drag Draggable logic
    makeColumnDraggable(column, board.id);
    
    grid.appendChild(column);
  });
  
  // Append inline "Add Board" card at the end of the canvas
  const placeholder = document.createElement("div");
  placeholder.className = "add-board-placeholder";
  placeholder.id = "add-board-placeholder-inline";
  
  let maxBoardRight = 20;
  state.boards.forEach(b => {
    if (b.left !== undefined && b.left + 320 > maxBoardRight) {
      maxBoardRight = b.left + 320;
    }
  });
  placeholder.style.left = `${maxBoardRight}px`;
  placeholder.style.top = `20px`;
  
  placeholder.innerHTML = `
    <div class="placeholder-trigger" id="pl-trigger">
      <span>＋ Create Board</span>
    </div>
    <div class="placeholder-form" id="pl-form" style="display: none;">
      <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px;">
        <input type="text" id="pl-name-input" class="modal-input" placeholder="New board name..." style="flex: 1; font-size: 0.85rem;" autocomplete="off" />
        <button id="pl-add-btn" class="active-pill" style="padding: 6px 12px !important; border-radius: 6px !important; flex-shrink:0;">Add</button>
        <button id="pl-cancel-btn" class="card-del" style="position: static; opacity: 1; transform: none; width: 28px; height: 28px; flex-shrink: 0; display:flex; align-items:center; justify-content:center;">✕</button>
      </div>
    </div>
  `;
  
  const trigger = placeholder.querySelector("#pl-trigger");
  const form = placeholder.querySelector("#pl-form");
  const input = placeholder.querySelector("#pl-name-input");
  const addBtn = placeholder.querySelector("#pl-add-btn");
  const cancelBtn = placeholder.querySelector("#pl-cancel-btn");
  
  placeholder.addEventListener("click", (e) => {
    if (form.style.display === "none") {
      trigger.style.display = "none";
      form.style.display = "block";
      input.focus();
    }
  });
  
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent re-triggering click on placeholder!
    trigger.style.display = "flex";
    form.style.display = "none";
    input.value = "";
  });
  
  const handleSave = () => {
    const name = safeText(input.value);
    if (name) {
      // Create new board with auto-tiled coordinate position
      let maxLane = -1;
      state.boards.forEach(b => {
        if (b.laneIndex !== undefined && b.laneIndex > maxLane) {
          maxLane = b.laneIndex;
        }
      });
      const nextLane = maxLane + 1;
      state.boards.push({ 
        id: crypto.randomUUID(), 
        name, 
        isDefault: false,
        laneIndex: nextLane,
        left: 20 + nextLane * 320,
        top: 20
      });
      persist(["boards"]);
      renderSidebar();
      renderCards();
      showToast(`Board "${name}" created ✓`);
    } else {
      trigger.style.display = "flex";
      form.style.display = "none";
    }
  };
  
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleSave();
  });
  
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleSave();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      cancelBtn.click();
    }
  });
  
  grid.appendChild(placeholder);
  
  // Statically calculate offset height layout positions to ensure perfect equal spacing
  positionBoards();
  persist(["boards"]);
  
  // Clear highlighted active state after rendering
  setTimeout(() => {
    document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('highlighted'));
  }, 1600);
}

function positionBoards() {
  const lanes = {};
  const columns = [...document.querySelectorAll(".kanban-column")];
  
  columns.forEach(col => {
    const boardId = col.dataset.boardId;
    const board = state.boards.find(b => b.id === boardId);
    if (board) {
      const lane = board.laneIndex !== undefined ? board.laneIndex : 0;
      if (!lanes[lane]) lanes[lane] = [];
      lanes[lane].push({ board, col });
    }
  });
  
  Object.keys(lanes).forEach(lane => {
    lanes[lane].sort((a, b) => (a.board.top !== undefined ? a.board.top : 0) - (b.board.top !== undefined ? b.board.top : 0));
    
    let currentTop = 20;
    lanes[lane].forEach(item => {
      item.col.style.left = `${20 + lane * 320}px`;
      item.col.style.top = `${currentTop}px`;
      item.board.left = 20 + lane * 320;
      item.board.top = currentTop;
      
      currentTop += item.col.offsetHeight + 20;
    });
  });
  
  const placeholder = document.getElementById("add-board-placeholder-inline");
  if (placeholder) {
    let maxLane = -1;
    Object.keys(lanes).forEach(lane => {
      if (lanes[lane].length > 0 && parseInt(lane) > maxLane) {
        maxLane = parseInt(lane);
      }
    });
    const placeholderLane = maxLane + 1;
    placeholder.style.left = `${20 + placeholderLane * 320}px`;
    placeholder.style.top = `20px`;
  }
}
  


function renderModalBoardOptions() {
  const select = document.getElementById("modal-board");
  select.innerHTML = "";
  state.boards.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id; opt.textContent = safeText(b.name);
    if (b.id === state.settings.activeBoardId) opt.selected = true;
    select.appendChild(opt);
  });
}

// ─────────────────────────────────────────────
//  BOARD & BOOKMARK MANAGEMENT
// ─────────────────────────────────────────────

function handleDeleteBoard(boardId, boardName) {
  if (state.boards.length <= 1) {
    showToast("⚠ You must keep at least one board.");
    return;
  }
  if (!confirm(`Delete board "${safeText(boardName)}" and all its bookmarks?`)) return;
  state.bookmarks = state.bookmarks.filter((bm) => bm.boardId !== boardId);
  state.boards = state.boards.filter((b) => b.id !== boardId);
  if (state.settings.activeBoardId === boardId) {
    state.settings.activeBoardId = state.boards[0].id;
  }
  persist(["boards","bookmarks","settings"]); renderSidebar(); renderCards();
  showToast(`Board "${boardName}" deleted`);
}

function handleDeleteBookmark(id) {
  state.bookmarks = state.bookmarks.filter((bm) => bm.id !== id);
  persist(["bookmarks"]); renderCards(); showToast("Bookmark removed");
}

function handleSaveBookmark(rawUrl, rawTitle, boardId, editId = null) {
  const url = safeText(rawUrl); const title = safeText(rawTitle);
  if (!url) return { ok:false, error:"URL is required." };
  try { new URL(url); } catch { return { ok:false, error:"Enter a valid URL (include https://)." }; }
  
  if (editId) {
    const idx = state.bookmarks.findIndex((bm) => bm.id === editId);
    if (idx !== -1) {
      state.bookmarks[idx].url = url;
      state.bookmarks[idx].title = title || extractDomain(url);
      state.bookmarks[idx].boardId = boardId;
      persist(["bookmarks"]);
      renderCards();
      return { ok:true, updated:true };
    }
    return { ok:false, error:"Bookmark not found." };
  }

  const existingIdx = state.bookmarks.findIndex((bm) => bm.url === url && bm.boardId === boardId);
  if (existingIdx !== -1) {
    state.bookmarks[existingIdx].createdAt = Date.now();
    if (title) state.bookmarks[existingIdx].title = title;
    persist(["bookmarks"]); renderCards(); return { ok:true, updated:true };
  }
  state.bookmarks.push({ id: crypto.randomUUID(), boardId, title: title || extractDomain(url), url, createdAt: Date.now() });
  persist(["bookmarks"]);
  if (boardId === state.settings.activeBoardId) renderCards();
  return { ok:true, updated:false };
}

function setupAddBoardInput() {
  const topBtn = document.getElementById("add-board-btn-top");
  if (topBtn) {
    topBtn.addEventListener("click", () => {
      const name = prompt("Enter new board name:");
      if (name && name.trim()) {
        let maxLane = -1;
        state.boards.forEach(b => {
          if (b.laneIndex !== undefined && b.laneIndex > maxLane) {
            maxLane = b.laneIndex;
          }
        });
        state.boards.push({ 
          id: crypto.randomUUID(), 
          name: name.trim(), 
          isDefault: false,
          laneIndex: maxLane + 1,
          left: 20 + (maxLane + 1) * 320,
          top: 20
        });
        persist(["boards"]);
        renderSidebar();
        renderCards();
        showToast(`Board "${name}" created ✓`);
      }
    });
  }
}

// ─────────────────────────────────────────────
//  MODAL
// ─────────────────────────────────────────────

function openModal(bookmarkId = null) {
  renderModalBoardOptions();
  const modalTitleEl = document.getElementById("modal-header-title");
  const modalSubtitleEl = document.getElementById("modal-header-subtitle");
  const modalSaveBtn = document.getElementById("modal-save");

  if (bookmarkId) {
    editingBookmarkId = bookmarkId;
    const bm = state.bookmarks.find((b) => b.id === bookmarkId);
    if (bm) {
      modalTitleEl.textContent = "Edit Bookmark";
      modalSubtitleEl.textContent = "Modify link details";
      modalSaveBtn.textContent = "Update Bookmark";
      document.getElementById("modal-url").value = bm.url;
      document.getElementById("modal-title").value = bm.title;
      document.getElementById("modal-board").value = bm.boardId;
    }
  } else {
    editingBookmarkId = null;
    modalTitleEl.textContent = "Add Bookmark";
    modalSubtitleEl.textContent = "Save a link to your vault";
    modalSaveBtn.textContent = "Save Bookmark";
    document.getElementById("modal-url").value = "";
    document.getElementById("modal-title").value = "";
    if (state.settings.activeBoardId) {
      document.getElementById("modal-board").value = state.settings.activeBoardId;
    }
  }

  document.getElementById("modal-error").style.display = "none";
  document.getElementById("modal-overlay").classList.add("visible");
  document.getElementById("modal-url").focus();
}

function openModalWithBoard(boardId) {
  openModal(null);
  document.getElementById("modal-board").value = boardId;
}

function closeModal() { document.getElementById("modal-overlay").classList.remove("visible"); editingBookmarkId = null; }

function setupModal() {
  document.getElementById("add-bookmark-btn").addEventListener("click", () => openModal(null));
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => { if (e.target === document.getElementById("modal-overlay")) closeModal(); });
  document.getElementById("modal-save").addEventListener("click", () => {
    const url = document.getElementById("modal-url").value;
    const title = document.getElementById("modal-title").value;
    const boardId = document.getElementById("modal-board").value;
    const errEl = document.getElementById("modal-error");
    const result = handleSaveBookmark(url, title, boardId, editingBookmarkId);
    if (!result.ok) { errEl.textContent = result.error; errEl.style.display = "block"; return; }
    closeModal(); renderSidebar(); showToast(result.updated ? "Bookmark updated ✓" : "Bookmark saved ✓");
  });
  document.getElementById("modal-url").addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("modal-save").click(); });
}

// ─────────────────────────────────────────────
//  SEARCH & PRIVACY & KEYBOARD
// ─────────────────────────────────────────────

function setupSearch() {
  const wrap = document.getElementById("search-stack-wrap");
  const trigger = document.getElementById("search-btn-trigger");
  const input = document.getElementById("search-input");

  trigger.addEventListener("click", () => {
    wrap.classList.toggle("expanded");
    if (wrap.classList.contains("expanded")) {
      input.focus();
    }
  });

  input.addEventListener("blur", () => {
    if (!input.value.trim()) {
      wrap.classList.remove("expanded");
    }
  });

  input.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderCards();
  });
}

function applyPrivacyMode() {
  const on = state.settings.privacyModeActive;
  document.body.classList.toggle("privacy-mode", on);
  document.getElementById("privacy-btn").classList.toggle("active", on);
  const labelEl = document.getElementById("privacy-label");
  if (labelEl) labelEl.textContent = on ? "Hidden" : "Privacy";
  const icon = document.getElementById("privacy-icon");
  icon.innerHTML = on
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
}

function setupPrivacyMode() {
  document.getElementById("privacy-btn").addEventListener("click", () => {
    state.settings.privacyModeActive = !state.settings.privacyModeActive;
    persist(["settings"]); applyPrivacyMode();
  });
}

function setupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { 
      closeModal(); 
      document.getElementById("wp-panel").classList.remove("open"); 
      document.getElementById("bottom-left-stack").classList.remove("panel-open"); 
    }
    if ((e.ctrlKey||e.metaKey) && e.key === "k") {
      e.preventDefault();
      const wrap = document.getElementById("search-stack-wrap");
      wrap.classList.add("expanded");
      document.getElementById("search-input").focus();
    }
    if ((e.ctrlKey||e.metaKey) && e.key === "n" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) { e.preventDefault(); openModal(); }
  });
}

function setupExtraButtons() {
  // 1. Export backup JSON
  document.getElementById("backup-btn-stack").addEventListener("click", () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ boards: state.boards, bookmarks: state.bookmarks }, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `ani_bucket_list_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      showToast("Backup exported successfully! 📥");
    } catch (err) {
      showToast("Error exporting backup.");
    }
  });

  // 2. Toggle Pinned Controls (always show edit/delete triggers)
  let alwaysShow = false;
  const pinBtn = document.getElementById("pin-controls-btn-stack");
  pinBtn.addEventListener("click", () => {
    alwaysShow = !alwaysShow;
    document.body.classList.toggle("always-show-controls", alwaysShow);
    pinBtn.classList.toggle("active", alwaysShow);
    showToast(alwaysShow ? "Controls pinned visible 📌" : "Controls hidden on hover 🕶");
  });

  // 3. Reset Default Boards
  document.getElementById("reset-btn-stack").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all boards and bookmarks to the default pre-seeded state? This will clear any manual additions and cannot be undone!")) {
      chrome.storage.local.clear(() => {
        localStorage.clear();
        window.location.reload();
      });
    }
  });
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.bookmarks) { state.bookmarks = changes.bookmarks.newValue || []; renderCards(); }
    if (changes.boards)    { state.boards    = changes.boards.newValue    || []; renderSidebar(); renderModalBoardOptions(); }
  });
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────

async function init() {
  await loadFromStorage();
  renderSidebar();
  renderCards();
  applyPrivacyMode();
  applyWallpaperSettings();
  setupAddBoardInput();
  setupModal();
  setupSearch();
  setupPrivacyMode();
  setupWallpaperPanel();
  setupExtraButtons();
  setupKeyboard();
  setupStorageListener();
}

init();
