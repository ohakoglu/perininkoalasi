// js/app.js
import { load, save, reset, exportToFile, importFromFile } from "./storage.js";
import { renderKoalaLayers, applyKoalaIdleMotion } from "./koala.js";

let state = load();
state.math = state.math || { streak: 0 };

const $ = (id) => document.getElementById(id);

const GOAL = 3000;
let currentQ = null;
let answeringLocked = false;
let mode = "speed";

/* =========================
   ZORLUK SİSTEMİ (GÜNCEL)
========================= */

function phaseFor(correctTotal){
  if(correctTotal < 150) return { name:"Isınma", pool:[2,5,10] };
  if(correctTotal < 600) return { name:"Temel", pool:[2,3,4,5,6,10] };
  if(correctTotal < 1500) return { name:"Orta", pool:[2,3,4,5,6,7,8,10] };
  return { name:"Tam Tablo", pool:[2,3,4,5,6,7,8,9,10] };
}

function weightedPool(correctTotal){
  const phase = phaseFor(correctTotal);
  const easyPool = phase.pool;
  const fullPool = [2,3,4,5,6,7,8,9,10];

  // %70 faz havuzu, %30 tam tablo
  if(Math.random() < 0.7){
    return easyPool;
  } else {
    return fullPool;
  }
}

function pickQuestion(){
  const k = state.koala;

  const pool = weightedPool(k.correctTotal);

  const a = pool[Math.floor(Math.random()*pool.length)];
  const b = pool[Math.floor(Math.random()*pool.length)];
  const ans = a * b;

  const opts = new Set([ans]);
  while(opts.size < 4){
    let cand = ans + randInt(-5,6);
    if(cand <= 0) continue;
    if(cand !== ans) opts.add(cand);
  }

  const list = Array.from(opts);
  shuffle(list);

  return { a,b,ans,opts:list };
}

/* =========================
   PUAN SİSTEMİ
========================= */

function marathonMultiplier(streak){
  if(streak >= 20) return 2.2;
  if(streak >= 15) return 1.8;
  if(streak >= 10) return 1.5;
  if(streak >= 5)  return 1.2;
  return 1.0;
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
    leaves = Math.round(leaves * mult);
    xp = Math.round(xp * mult);
  }

  return { leaves, xp };
}

/* =========================
   MATH AKIŞI
========================= */

function renderMath(){
  const k = state.koala;

  $("mGoal").textContent = GOAL;
  $("mCorrect").textContent = k.correctTotal;
  $("mStreak").textContent = state.math.streak;

  const pct = Math.min(100, (k.correctTotal / GOAL) * 100);
  $("mProg").style.width = `${pct}%`;

  if(!currentQ) currentQ = pickQuestion();

  $("qText").textContent = `${currentQ.a} × ${currentQ.b} = ?`;

  const grid = $("optGrid");
  grid.innerHTML = "";

  currentQ.opts.forEach(val=>{
    const btn = document.createElement("button");
    btn.className = "optBtn";
    btn.textContent = val;
    btn.onclick = ()=> onAnswer(val, btn);
    grid.appendChild(btn);
  });
}

function onAnswer(val, btn){
  if(answeringLocked) return;
  answeringLocked = true;

  const correct = (val === currentQ.ans);

  if(correct){
    state.math.streak++;
    state.koala.correctTotal++;

    const pts = pointsForCorrect();
    state.koala.leaves += pts.leaves;
    state.koala.xp += pts.xp;

  } else {
    state.math.streak = 0;
  }

  save(state);

  setTimeout(()=>{
    currentQ = pickQuestion();
    answeringLocked = false;
    render();
    renderMath();
  }, 500);
}

/* =========================
   RENDER
========================= */

function render(){
  $("ver").textContent = "v0.7";

  const k = state.koala;

  if(!k.name){
    show("screenName");
    return;
  }

  $("helloTitle").textContent = `Merhaba, ${k.name}!`;
  $("sCorrect").textContent = k.correctTotal;
  $("sLeaves").textContent = k.leaves;
  $("sXp").textContent = k.xp;
  $("sStreak").textContent = state.math.streak;

  $("koalaStage").innerHTML = renderKoalaLayers(state, {big:false});
  applyKoalaIdleMotion($("koalaStage").querySelector(".koalaCanvas"));

  $("koalaBig").innerHTML = renderKoalaLayers(state, {big:true});
  applyKoalaIdleMotion($("koalaBig").querySelector(".koalaCanvas"));

  show("screenHome");
}

/* ========================= */

function show(id){
  ["screenName","screenHome","screenKoala","screenMath"].forEach(s=>{
    const el=$(s);
    if(el) el.classList.add("hidden");
  });
  const t=$(id);
  if(t) t.classList.remove("hidden");
}

$("btnMath").onclick = ()=>{
  show("screenMath");
  currentQ = pickQuestion();
  renderMath();
};

$("btnMathBack").onclick = ()=> show("screenHome");

$("btnStart").onclick = ()=>{
  const v = $("nameInput").value.trim();
  if(!v) return;
  state.koala.name = v;
  save(state);
  render();
};

$("btnRandom").onclick = ()=>{
  const pool=["Pofuduk","Bulut","Minnoş","Fıstık","Pamuk","Lokum"];
  $("nameInput").value = pool[Math.floor(Math.random()*pool.length)];
};

render();

/* ========================= */

function randInt(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
}
