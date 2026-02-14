import { load, save, reset, exportToFile, importFromFile } from "./storage.js";
import { renderKoalaLayers, applyKoalaIdleMotion } from "./koala.js";

let state = load();
state.math = state.math || { streak: 0 };

const $ = (id) => document.getElementById(id);

function show(screenId){
  ["screenName","screenHome","screenKoala","screenMath"].forEach(id => $(id).classList.add("hidden"));
  $(screenId).classList.remove("hidden");
}

function toast(msg, which=1){
  const el = which===1 ? $("toast") : $("toast2");
  el.textContent = msg || "";
}

function mtoast(msg){
  $("mToast").textContent = msg || "";
}

function stageLabel(stage){
  if(stage===1) return "Bebek (Minik minik 🙂)";
  if(stage===2) return "Minik (Büyüyor!)";
  if(stage===3) return "Genç (Güçlü)";
  if(stage===4) return "Yetişkin (Harika)";
  return "Bilge (Efsane)";
}

/* ---------- MATH ENGINE ---------- */
const GOAL = 3000;

let currentQ = null;
let answeringLocked = false;
let mode = "speed";

function phaseFor(correctTotal){
  if(correctTotal < 150) return { name:"Isınma", pool:[2,5,10] };
  if(correctTotal < 600) return { name:"Temel", pool:[2,3,4,5,6,10] };
  if(correctTotal < 1500) return { name:"Orta", pool:[2,3,4,5,6,7,8,10] };
  return { name:"Tam Tablo", pool:[2,3,4,5,6,7,8,9,10] };
}

function pickQuestion(){
  const k = state.koala;
  const ph = phaseFor(k.correctTotal);

  const basePool = (mode === "marathon")
    ? [2,3,4,5,6,7,8,9,10]
    : ph.pool;

  const a = basePool[Math.floor(Math.random()*basePool.length)];
  const bPool = (k.correctTotal < 150)
    ? [1,2,3,4,5,6,7,8,9,10]
    : [2,3,4,5,6,7,8,9,10];

  const b = bPool[Math.floor(Math.random()*bPool.length)];
  const ans = a * b;

  const opts = new Set([ans]);
  while(opts.size < 4){
    const delta = randInt(-5, 6);
    let cand = ans + delta;
    if(cand < 0) cand = ans + Math.abs(delta);
    if(cand === ans) continue;
    opts.add(cand);
  }

  const list = Array.from(opts);
  shuffle(list);

  return { a,b,ans,opts:list };
}

function marathonMultiplier(streak){
  if(streak >= 20) return 2.2;
  if(streak >= 15) return 1.8;
  if(streak >= 10) return 1.5;
  if(streak >= 5)  return 1.2;
  return 1.0;
}

function marathonStreakPenalty(streak){
  return Math.max(0, streak - 5);
}

function pointsForCorrect(){
  let leaves = 1;
  let xp = 2;

  if(mode === "master"){
    leaves *= 2;
    xp *= 2;
  }

  if(mode === "marathon"){
    const mult = marathonMultiplier(state.math.streak);
    leaves = Math.max(1, Math.round(leaves * mult));
    xp = Math.max(1, Math.round(xp * mult));
  }

  return { leaves, xp };
}

function setMode(next){
  mode = next;

  document.querySelectorAll(".tabBtn").forEach(b=>{
    b.classList.toggle("selected", b.dataset.mode === mode);
  });

  const isMaster = mode === "master";
  $("answerRow").classList.toggle("hidden", !isMaster);
  $("optGrid").classList.toggle("hidden", isMaster);

  $("mMultPill").style.display =
    (mode === "marathon") ? "inline-flex" : "none";

  if(mode === "speed"){
    $("mSub").textContent = "Hız kazanalım: 4 şık, hızlı cevap.";
    $("mHint").textContent = "Yanlışta ceza yok 🙂";
  } else if(mode === "master"){
    $("mSub").textContent = "Usta Modu: cevabı sen yazarsın. (2×)";
    $("mHint").textContent = "Yanlışta üzülmek yok 🙂";
  } else {
    $("mSub").textContent = "Maraton: seri uzadıkça puan artar.";
    $("mHint").textContent = "Yanlışta seri düşer ama sıfırlanmaz 🙂";
  }

  currentQ = pickQuestion();
  renderMath();
}

function renderMath(){
  const k = state.koala;

  $("mGoal").textContent = GOAL;
  $("mCorrect").textContent = k.correctTotal;
  $("mStreak").textContent = state.math.streak;

  const pct = Math.min(100, (k.correctTotal / GOAL) * 100);
  $("mProg").style.width = `${pct}%`;

  if(!currentQ) currentQ = pickQuestion();

  $("qText").textContent = `${currentQ.a} × ${currentQ.b} = ?`;

  if(mode === "marathon"){
    $("mMult").textContent =
      marathonMultiplier(state.math.streak).toFixed(1);
  } else {
    $("mMult").textContent = "1.0";
  }

  mtoast("🙂");

  const grid = $("optGrid");
  grid.innerHTML = "";

  if(mode !== "master"){
    currentQ.opts.forEach(val=>{
      const btn = document.createElement("button");
      btn.className = "optBtn";
      btn.textContent = val;
      btn.addEventListener("click", ()=> onAnswer(val, btn));
      grid.appendChild(btn);
    });
  } else {
    $("ansInput").value = "";
    setTimeout(()=> $("ansInput").focus(), 0);
  }
}

function lockButtons(lock){
  if(mode === "master") return;
  document.querySelectorAll(".optBtn")
    .forEach(b=> b.disabled = !!lock);
}

function highlightCorrectAnswer(){
  document.querySelectorAll(".optBtn").forEach(b=>{
    if(Number(b.textContent) === currentQ.ans){
      b.classList.add("good");
    }
  });
}

function onAnswer(val, btnEl){
  if(answeringLocked) return;
  answeringLocked = true;

  const k = state.koala;
  const correct = (val === currentQ.ans);

  lockButtons(true);

  if(correct){
    btnEl && btnEl.classList.add("good");

    state.math.streak += 1;
    k.correctTotal += 1;

    const pts = pointsForCorrect();
    k.leaves += pts.leaves;
    k.xp += pts.xp;

    mtoast("Doğru! 🐾");

  } else {

    if(mode === "marathon"){
      highlightCorrectAnswer();      // 0.5 sn doğruyu göster
      const before = state.math.streak;
      state.math.streak =
        marathonStreakPenalty(state.math.streak);
      const after = state.math.streak;
      mtoast(`Olmadı 🙂 Seri ${before} → ${after}`);
    } else {
      state.math.streak = 0;
      highlightCorrectAnswer();
      mtoast("Tekrar dene 🙂");
    }
  }

  save(state);

  setTimeout(()=>{
    currentQ = pickQuestion();
    answeringLocked = false;
    render();
    show("screenMath");
    renderMath();
  }, correct ? 500 : 500);   // ❗ artık yanlışta da 0.5 sn
}

/* ---------- UI RENDER ---------- */
function render(){
  $("ver").textContent = "v0.6";

  const k = state.koala;
  if(!k.name){
    show("screenName");
    return;
  }

  $("helloTitle").textContent = `Merhaba, ${k.name}!`;
  $("helloSub").textContent = "Koalan büyümeye hazır.";

  $("sCorrect").textContent = k.correctTotal;
  $("sLeaves").textContent = k.leaves;
  $("sXp").textContent = k.xp;
  $("sStreak").textContent = state.math.streak;

  $("koalaStage").innerHTML =
    renderKoalaLayers(state,{big:false});
  applyKoalaIdleMotion(
    $("koalaStage").querySelector(".koalaCanvas")
  );

  $("kTitle").textContent = k.name;
  $("kSub").textContent = stageLabel(k.stage);
  $("kTiny").textContent =
    `Tokluk ${k.hunger}% • XP ${k.xp} • Yaprak ${k.leaves}`;

  $("koalaBig").innerHTML =
    renderKoalaLayers(state,{big:true});
  applyKoalaIdleMotion(
    $("koalaBig").querySelector(".koalaCanvas")
  );

  $("barHunger").style.width = `${k.hunger}%`;
  $("barXp").style.width =
    `${Math.min(100,(k.xp % 100))}%`;

  show("screenHome");
}

/* ---------- EVENTS ---------- */
$("btnMath").addEventListener("click", ()=>{
  show("screenMath");
  setMode(mode || "speed");
});

$("btnMathBack").addEventListener("click", ()=> show("screenHome"));

document.querySelectorAll(".tabBtn")
  .forEach(btn=>{
    btn.addEventListener("click",
      ()=> setMode(btn.dataset.mode));
  });

$("btnAnsOk")?.addEventListener("click", ()=>{
  const raw = $("ansInput").value.trim();
  if(!raw) return;
  const val = Number(raw);
  if(!Number.isFinite(val)) return;
  onAnswer(val, null);
});

$("ansInput")?.addEventListener("keydown", e=>{
  if(e.key==="Enter"){
    const val = Number($("ansInput").value.trim());
    if(Number.isFinite(val)) onAnswer(val,null);
  }
});

$("btnExport").addEventListener("click", ()=>{
  exportToFile(state);
  toast("Yedek indirildi ✅");
});

$("importFile").addEventListener("change", async e=>{
  const f = e.target.files?.[0];
  if(!f) return;
  try{
    state = await importFromFile(f);
    state.math = state.math || { streak: 0 };
    currentQ = null;
    toast("Yedek yüklendi ✅");
    render();
  }catch{
    toast("Bu dosya okunamadı 😅");
  }
});

$("btnResetConfirm").addEventListener("click", ()=>{
  state = reset();
  state.math = { streak: 0 };
  currentQ = null;
  render();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

render();

/* ---------- helpers ---------- */
function randInt(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
}
