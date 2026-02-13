import { load, save, reset, exportToFile, importFromFile } from "./storage.js";
import { renderKoalaLayers, applyKoalaIdleMotion } from "./koala.js";

let state = load();

const $ = (id) => document.getElementById(id);

function show(screenId){
  ["screenName","screenHome","screenKoala"].forEach(id => $(id).classList.add("hidden"));
  $(screenId).classList.remove("hidden");
}

function toast(msg, which=1){
  const el = which===1 ? $("toast") : $("toast2");
  el.textContent = msg || "";
}

function stageLabel(stage){
  if(stage===1) return "Bebek (Minik minik 🙂)";
  if(stage===2) return "Minik (Büyüyor!)";
  if(stage===3) return "Genç (Güçlü)";
  if(stage===4) return "Yetişkin (Harika)";
  return "Bilge (Efsane)";
}

function render(){
  $("ver").textContent = "v0.2";

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
  $("sHunger").textContent = k.hunger;

  $("koalaStage").innerHTML = renderKoalaLayers(state, {big:false});
  applyKoalaIdleMotion($("koalaStage").querySelector(".koalaCanvas"));

  // KOALA SCREEN
  $("kTitle").textContent = `${k.name}`;
  $("kSub").textContent = stageLabel(k.stage);
  $("kTiny").textContent = `Tokluk ${k.hunger}% • XP ${k.xp} • Yaprak ${k.leaves}`;

  $("koalaBig").innerHTML = renderKoalaLayers(state, {big:true});
  applyKoalaIdleMotion($("koalaBig").querySelector(".koalaCanvas"));

  $("barHunger").style.width = `${k.hunger}%`;
  $("barXp").style.width = `${Math.min(100, (k.xp % 100))}%`; // placeholder bar

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
  // default color is mint
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
  // ensure idle motion applied on visible screen
  setTimeout(()=>{
    applyKoalaIdleMotion($("koalaBig").querySelector(".koalaCanvas"));
  }, 0);
});

$("btnBack").addEventListener("click", () => {
  show("screenHome");
});

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
  toast("Sıfırlandı.",1);
  render();
});

// placeholder math button -> gives some rewards for testing
$("btnMath").addEventListener("click", () => {
  const k = state.koala;
  k.correctTotal += 5;
  k.leaves += 5;
  k.xp += 10;
  if(k.correctTotal >= 50) state.shop.unlocked = true;
  save(state);
  toast("Test: +5 doğru, +5 yaprak, +10 XP ✅",1);
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
