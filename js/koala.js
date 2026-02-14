// js/koala.js
// Foto-temelli koala: her 100 doğru -> bir sonraki sahne (family_00..family_29)

const AVAILABLE_FAMILY_IMAGES = 6; // şimdilik 6, sonra 30 yapacağız

export function familyIndexFromCorrect(correctTotal){
  const idx = Math.floor((Number(correctTotal) || 0) / 100);
  return Math.max(0, Math.min(AVAILABLE_FAMILY_IMAGES - 1, idx));
}

export function familyImagePath(idx){
  const safe = String(idx).padStart(2, "0");
  return `assets/koala/family/family_${safe}.webp`;
}

export function renderKoalaLayers(state, { big=false } = {}){
  // mevcut app.js bozulmasın diye fonksiyon adını aynı bıraktım
  const correct = (state && state.koala && state.koala.correctTotal) || 0;
  const idx = familyIndexFromCorrect(correct);
  const src = familyImagePath(idx);

  return `
    <div class="koalaCanvas ${big ? "big" : "small"}">
      <img class="kLayer base" src="${src}" alt="Koala">
    </div>
  `;
}

/* Sadece çok hafif nefes animasyonu */
export function applyKoalaIdleMotion(canvasEl){
  if(!canvasEl) return;
  canvasEl.classList.add("koalaIdle");
}
