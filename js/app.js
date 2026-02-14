import { load, save, reset, exportToFile, importFromFile } from "./storage.js";
import { renderKoalaLayers, applyKoalaIdleMotion } from "./koala.js";

let state = load();

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

function phaseFor(correctTotal){
  if(correctTotal < 150) return { name:"Isınma", pool:[2,5,10] };
  if(correctTotal < 600) return { name:"Temel", pool:[2,3,4,5,6,10] };
  if(correctTotal < 1500) return { name:"Orta", pool:[2,3,4,5,6,7,8,10] };
  return { name:"Tam Tablo", pool:[2,3,4,5,6,7,8,9,10] };
}

// hedef: 2–9 çarpım tablosu; 10 dahil edildi ama kolay/rahatlatıcı.
function pickQuestion(){
  const k = state.koala;
  const ph = phaseFor(k.correctTotal);
  const a = ph.pool[Math.floor(Math.random()*ph.pool.length)];
  const bPool = (k.correctTotal < 150) ? [1,2,3,4,5,6,7,8,9,10] : [2,3,4,5,6,7,8,9,10];
  const b = bPool[Math.floor(Math.random()*bPool.length)];
  const ans = a * b;

  // 4 seçenek: doğru + 3 yakın yanlış
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

  return {
    a,b,ans,
    opts:list,
    phaseName: ph.name
  };
}

function renderMath(){
  const k = state.koala;
  $("mGoal").textContent = GOAL;
  $("mCorrect").textContent = k.correctTotal;
  $("mStreak").textContent = state.math.streak;

  const pct = Math.min(100, (k.correctTotal / GOAL) * 100);
  $("mProg").style.width = `${pct}%`;

  const ph = phaseFor(k.correctTotal);
  $("mPhase").textContent = `Faz: ${ph.name}`;

  if(!currentQ) currentQ = pickQuestion();

  $("qText").textContent = `${currentQ.a} × ${currentQ.b} = ?`;

  const grid = $("optGrid");
  grid.innerHTML = "";

  currentQ.opts.forEach((val) => {
    const btn = document.createElement("button");
    btn.className = "optBtn";
    btn.textContent = String(val);
    btn.addEventListener("click", () => onAnswer(val, btn));
    grid.appendChild(btn);
  });

  mtoast("🙂");
}

function onAnswer(val, btnEl){
  if(answeringLocked) return;
  answeringLocked = true;

  const k = state.koala;
  const correct = (val === currentQ.ans);

  // tüm butonları disable et
  document.querySelectorAll(".optBtn").forEach(b => b.disabled = true);

  if(correct){
    btnEl.classList.add("good");
    state.math.streak += 1;

    // Ödüller
    k.correctTotal += 1;
    k.leaves += 1;
    k.xp += 2;

    // 5 seri bonusu
    if(state.math.streak % 5 === 0){
      k.leaves += 3;
      mtoast("Süper seri! +3 bonus yaprak 🍃🍃🍃");
    } else {
      mtoast("Doğru! 🐾");
    }

    // 3000 bitiş (şimdilik mesaj)
    if(k.correctTotal >= GOAL){
      mtoast("🎉 3000! Koalan efsane oldu. (Final ekranını sonra ekleriz)");
    }

  } else {
    btnEl.classList.add("bad");
    state.math.streak = 0;
    mtoast("Tekrar dene 🙂");

    // doğru şıkkı kısa göster (ceza yok, öğretici)
    setTimeout(() => {
      document.querySelectorAll(".optBtn").forEach(b => {
        if(Number(b.textContent) === currentQ.ans) b.classList.add("good");
      });
    }, 250);
  }

  save(state);

  // sonraki soru
  setTimeout(() => {
    currentQ = pickQuestion();
    answeringLocked = false;
    render();          // home/koala sayılarını güncelle
    show("screenMath");
    renderMath();
  }, correct ? 520 : 900);
}

/* ---------- UI RENDER ---------- */
function render(){
  $("ver").textContent = "v0.4";

  const k = state.koala;
  const hasName = !!k.name;

  if(!hasName){
    show("screenName");
    return;
  }

  // HOME
  $("helloTitle").textContent = `Merhaba, ${k.name}!`;
  $("helloSub").textContent = `Koalan sakin… ve büyümeye hazır.`;

  $("sCorrect").textContent = k.correctTotal;
  $("sLeaves").textContent = k.leaves;
  $("sXp").textContent = k.xp;
  $("sStreak").textContent = state.math.streak;

  $("koalaStage").innerHTML = renderKoalaLayers(state, {big:false});
  applyKoalaIdleMotion($("koalaStage").querySelector(".koalaCanvas"));

  // KOALA SCREEN
  $("kTitle").textContent = `${k.name}`;
  $("kSub").textContent = stageLabel(k.stage);
  $("kTiny").textContent = `Tokluk ${k.hunger}% • XP ${k.xp} • Yaprak ${k.leaves}`;

  $("koalaBig").innerHTML = renderKoalaLayers(state, {big:true});
  applyKoalaIdleMotion($("koalaBig").querySelector(".koalaCanvas"));

  $("barHunger").style.width = `${k.hunger}%`;
  $("barXp").style.width = `${Math.min(100, (k.xp % 100))}%`;

  show("screenHome");
}

function setColor(color){
  state.koala.color = color;
  save(state);
  document.querySelectorAll("[data-color]").forEach(b=>{
    b.classList.toggle("selected", b.dataset.color===color);
  });
  render();
}

/* ---------- EVENTS ---------- */
$("btnRandom").addEventListener("click", () => {
  const pool = ["Pofuduk","Bulut","Minnoş","Fıstık","Pamuk","Lokum","Boncuk","Tarçın","Karamel","Maviş"];
  $("nameInput").value = pool[Math.floor(Math.random()*pool.length)];
});

$("btnStart").addEventListener("click", () => {
  const v = $("nameInput").value.trim();
  if(!v){
    toast("İsim yazalım 🙂");
    return;
  }
  state.koala.name = v.slice(0,18);
  if(!state.koala.color) state.koala.color = "mint";
  save(state);
  toast("");
  render();
});

document.querySelectorAll("[data-color]").forEach(btn=>{
  btn.addEventListener("click", ()=> setColor(btn.dataset.color));
});

$("btnKoala").addEventListener("click", () => {
  show("screenKoala");
  toast("",1);
  toast("",2);
  setTimeout(()=>{
    const c = $("koalaBig").querySelector(".koalaCanvas");
    applyKoalaIdleMotion(c);
  }, 0);
});

$("btnBack").addEventListener("click", () => show("screenHome"));

$("btnMath").addEventListener("click", () => {
  currentQ = pickQuestion();
  show("screenMath");
  renderMath();
});

$("btnMathBack").addEventListener("click", () => show("screenHome"));

$("btnExport").addEventListener("click", () => {
  exportToFile(state);
  toast("Yedek indirildi ✅");
});

$("importFile").addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  try{
    state = await importFromFile(f);
    toast("Yedek yüklendi ✅");
    currentQ = null;
    render();
  }catch{
    toast("Bu dosya okunamadı 😅");
  } finally {
    e.target.value = "";
  }
});

// Besleme: 10 yaprak -> +25 tokluk
$("btnFeed").addEventListener("click", () => {
  const k = state.koala;
  if(k.leaves < 10){
    toast("10 yaprak lazım 🍃",2);
    return;
  }
  k.leaves -= 10;
  k.hunger = Math.min(100, k.hunger + 25);
  save(state);
  toast("Mmm… teşekkürler 😌",2);
  render();
  show("screenKoala");
});

// Reset (double confirm)
let resetArmed = false;
$("btnResetConfirm").addEventListener("click", () => {
  if(!resetArmed){
    resetArmed = true;
    toast("Sıfırlamak için tekrar bas (geri dönüş yok).",1);
    setTimeout(()=>{ resetArmed=false; }, 4000);
    return;
  }
  state = reset();
  resetArmed = false;
  currentQ = null;
  toast("Sıfırlandı.",1);
  render();
});

// PWA service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

// Init selected color buttons
setTimeout(()=>{
  const color = (state.koala && state.koala.color) || "mint";
  document.querySelectorAll("[data-color]").forEach(b=>{
    b.classList.toggle("selected", b.dataset.color===color);
  });
}, 0);

render();

/* ---------- helpers ---------- */
function randInt(min, max){
  return Math.floor(Math.random()*(max-min+1)) + min;
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
