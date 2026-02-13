export const VERSION = "0.2";

export function defaultState() {
  return {
    meta: { version: VERSION, createdAt: Date.now(), updatedAt: Date.now() },
    koala: {
      name: "",
      color: "mint",        // default
      stage: 1,             // 1..5
      xp: 0,
      leaves: 0,
      hunger: 60,           // 0..100
      correctTotal: 0
    },
    wardrobe: {
      unlocked: false,
      owned: [],
      equipped: { hat:null, neck:null, hand:null, back:null, suit:null }
    },
    shop: {
      unlocked: false,
      lastOfferAt: 0
    }
  };
}

export function sanitizeState(s) {
  const d = defaultState();
  if (!s || typeof s !== "object") return d;

  const out = d;
  out.meta = out.meta || {};
  out.meta.version = (s.meta && s.meta.version) || d.meta.version;
  out.meta.createdAt = (s.meta && s.meta.createdAt) || d.meta.createdAt;
  out.meta.updatedAt = Date.now();

  const k = (s.koala && typeof s.koala === "object") ? s.koala : {};
  out.koala.name = String(k.name || "").slice(0, 18);
  out.koala.color = safeColor(k.color) || "mint";
  out.koala.stage = clampInt(k.stage, 1, 5, 1);
  out.koala.xp = clampInt(k.xp, 0, 999999, 0);
  out.koala.leaves = clampInt(k.leaves, 0, 999999, 0);
  out.koala.hunger = clampInt(k.hunger, 0, 100, 60);
  out.koala.correctTotal = clampInt(k.correctTotal, 0, 999999, 0);

  const w = (s.wardrobe && typeof s.wardrobe === "object") ? s.wardrobe : {};
  out.wardrobe.unlocked = !!w.unlocked;
  out.wardrobe.owned = Array.isArray(w.owned) ? w.owned.slice(0, 500) : [];
  out.wardrobe.equipped = (w.equipped && typeof w.equipped === "object")
    ? { hat: w.equipped.hat||null, neck: w.equipped.neck||null, hand: w.equipped.hand||null, back: w.equipped.back||null, suit: w.equipped.suit||null }
    : d.wardrobe.equipped;

  const sh = (s.shop && typeof s.shop === "object") ? s.shop : {};
  out.shop.unlocked = !!sh.unlocked;
  out.shop.lastOfferAt = clampInt(sh.lastOfferAt, 0, 9999999999999, 0);

  return out;
}

function safeColor(c){
  const v = String(c||"").toLowerCase();
  if(v==="mint"||v==="lavender"||v==="sky") return v;
  return "";
}
function clampInt(v, min, max, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}
