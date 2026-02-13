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
  const layers = koalaLayerPaths(state);

  const img = (src, cls) => src
    ? `<img class="kLayer ${cls}" src="${src}" alt="">`
    : `<span class="kLayer ${cls}"></span>`;

  // Face FX overlay lives ABOVE the PNG layers.
  // Blink + mood are CSS-driven, triggered by applyKoalaIdleMotion timers.
  return `
    <div class="koalaCanvas ${big ? "big" : "small"}" data-mood="smile">
      ${img(layers.back,"back")}
      ${img(layers.base,"base")}
      ${img(layers.suit,"suit")}
      ${img(layers.neck,"neck")}
      ${img(layers.hand,"hand")}
      ${img(layers.hat,"hat")}

      <div class="kFX" aria-hidden="true">
        <div class="kLid left"></div>
        <div class="kLid right"></div>
        <div class="kMouth"></div>
        <div class="kBrow left"></div>
        <div class="kBrow right"></div>
      </div>
    </div>
  `;
}

/**
 * Adds subtle idle motion + random blink (1–8s) + random mood shift (1–30s).
 * Safe to call multiple times; it will arm itself only once per canvas.
 */
export function applyKoalaIdleMotion(canvasEl){
  if(!canvasEl) return;

  // breathing forever
  canvasEl.classList.add("koalaIdle");

  // Prevent double-arming timers if render() re-runs
  if(canvasEl.dataset.fxArmed === "1") return;
  canvasEl.dataset.fxArmed = "1";

  // Start with a calm default
  if(!canvasEl.dataset.mood) canvasEl.dataset.mood = "smile";

  // Random blink loop: 1–8 seconds
  const scheduleBlink = () => {
    const ms = randInt(1000, 8000);
    setTimeout(() => {
      // trigger single blink
      canvasEl.classList.remove("blinkNow");
      // force reflow
      void canvasEl.offsetWidth;
      canvasEl.classList.add("blinkNow");
      scheduleBlink();
    }, ms);
  };

  // Random mood loop: 1–30 seconds
  const moods = ["smile","neutral","curious"];
  const scheduleMood = () => {
    const ms = randInt(1000, 30000);
    setTimeout(() => {
      const current = canvasEl.dataset.mood || "smile";
      // pick a different one than current
      const options = moods.filter(m => m !== current);
      const next = options[Math.floor(Math.random()*options.length)];
      canvasEl.dataset.mood = next;
      scheduleMood();
    }, ms);
  };

  // arm loops
  scheduleBlink();
  scheduleMood();
}

function randInt(min, max){
  // inclusive min/max
  return Math.floor(Math.random()*(max-min+1)) + min;
}
