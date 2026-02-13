export function koalaLayerPaths(state){
  const color = (state.koala && state.koala.color) || "mint";
  const base = `assets/koala/base/base_${color}.png`;

  const eq = (state.wardrobe && state.wardrobe.equipped) || {};
  return {
    back: eq.back ? `assets/koala/back/${eq.back}` : "",
    base,
    suit: eq.suit ? `assets/koala/suit/${eq.suit}` : "",
    neck: eq.neck ? `assets/koala/neck/${eq.neck}` : "",
    hand: eq.hand ? `assets/koala/hand/${eq.hand}` : "",
    hat:  eq.hat  ? `assets/koala/hats/${eq.hat}` : ""
  };
}

export function renderKoalaLayers(state, {big=false} = {}){
  const size = big ? 320 : 180;
  const layers = koalaLayerPaths(state);

  const img = (src, cls) => src
    ? `<img class="kLayer ${cls}" src="${src}" alt="">`
    : `<span class="kLayer ${cls}"></span>`;

  return `
    <div class="koalaCanvas ${big ? "big" : "small"}">
      ${img(layers.back,"back")}
      ${img(layers.base,"base")}
      ${img(layers.suit,"suit")}
      ${img(layers.neck,"neck")}
      ${img(layers.hand,"hand")}
      ${img(layers.hat,"hat")}
    </div>
  `;
}

// Simple “alive” behavior: we don't animate image pixels, we animate the whole canvas.
// Eye blink + face change will come later as an optional overlay layer.
export function applyKoalaIdleMotion(containerEl){
  if(!containerEl) return;
  // Keep it subtle: breathing forever
  containerEl.classList.add("koalaIdle");
}
