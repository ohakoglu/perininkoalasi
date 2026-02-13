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

  return `
    <div class="koalaCanvas ${big ? "big" : "small"}" data-mood="smile">
      ${img(layers.back,"back")}
      ${img(layers.base,"base")}
      ${img(layers.suit,"suit")}
      ${img(layers.neck,"neck")}
      ${img(layers.hand,"hand")}
      ${img(layers.hat,"hat")}

      <!-- FX overlay: eyelids + mouth + brows -->
      <div class="kFX" aria-hidden="true">
        <img class="kFxBlink" src="assets/koala/fx/blink_lids.png" alt="">
        <div class="kMouth"></div>
        <div class="kBrow left"></div>
        <div class="kBrow right"></div>
      </div>
    </div>
  `;
}

/**
 * Adds subtle idle motion + random blink (1â8s) + random mood shift (1â30s).
 * Safe to call multiple times; it arms itself only once per canvas.
 */
export function applyKoalaIdleMotion(canvasEl){
  if(!canvasEl) return;

  canvasEl.classList.add("koalaIdle");

  // Prevent double-arming timers if render() re-runs
  if(canvasEl.dataset.fxArmed === "1") return;
  canvasEl.dataset.fxArmed = "1";

  if(!canvasEl.dataset.mood) canvasEl.dataset.mood = "smile";

  // Random blink loop: 1â8 seconds
  const scheduleBlink = () => {
    const ms = randInt(1000, 8000);
    setTimeout(() => {
      // trigger single blink
      canvasEl.classList.remove("blinkNow");
      void canvasEl.offsetWidth; // reflow
      canvasEl.classList.add("blinkNow");
      scheduleBlink();
    }, ms);
  };

  // Random mood loop: 1â30 seconds
  const moods = ["smile","neutral","curious"];
  const scheduleMood = () => {
    const ms = randInt(1000, 30000);
    setTimeout(() => {
      const current = canvasEl.dataset.mood || "smile";
      const options = moods.filter(m => m !== current);
      const next = options[Math.floor(Math.random()*options.length)];
      canvasEl.dataset.mood = next;
      scheduleMood();
    }, ms);
  };

  scheduleBlink();
  scheduleMood();
}

function randInt(min, max){
  return Math.floor(Math.random()*(max-min+1)) + min;
}
