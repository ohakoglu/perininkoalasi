import { load, save, reset, exportToFile, importFromFile } from "./storage.js";
import { renderKoalaSVG } from "./koala.js";

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

function render(){
  $("ver").textContent = "v0.1";

  const k = state.koala;
  const hasName = !!k.name;

  if(!hasName){
    show("screenName");
    return;
  }

  // home
  $("helloTitle").textContent = `Merhaba, ${k.name}!`;
  $("helloSub").textContent = `Koalan sakin… ve büyümeye hazır.`;

  $("sCorrect").textContent = k.correctTotal;
  $("sLeaves").textContent = k.leaves;
  $("sXp").textContent = k.xp;
  $("sHunger").textContent = k.hunger;

  $("koalaStage").innerHTML = renderKoalaSVG(k, { big:false });

  // koala screen
  $("kTitle").textContent = `${k.name}`;
  $("kSub").textContent = stageLabel(k.stage);
  $("kTiny").textContent = `Tokluk ${k.hunger}% • XP ${k.xp} • Yaprak ${k.leaves}`;

  $("koalaBig").innerHTML = renderKoalaSVG(k, { big:true });

  $("barHunger").style.width = `${k.hunger}%`;
  $("barXp").style.width = `${Math.min(100, (k.xp % 100))}%`; // placeholder bar

  show("screenHome");
}

function stageLabel(stage){
  if(stage===1) return "Bebek (Minik minik 🙂)";
  if(stage===2) return "Minik (Büyüyor!)";
  if(stage===3) return "Genç (Güçlü)";
  if(stage===4) return "Yetişkin (Harika)";
  return "Bilge (Efsane)";
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
  save(state);
  toast("");
  render();
});

$("btnKoala").addEventListener("click", () => {
  show("screenKoala");
  toast("",1);
  toast("",2);
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

// Besleme (demo): 10 yaprak -> +25 tokluk, mağaza kilidi sonra gelecek
$("btnFeed").addEventListener("click", () => {
  const k = state.koala;
  if(k.leaves < 10){
    toast("10 yaprak lazım 🍃",2);
    return;
  }
  k.leaves -= 10;
  k.hunger = Math.min(100, k.hunger + 25);
  save(state);
  toast("Mmm… teşekkürler 😌 (+Tokluk)",2);
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
  // temporary: simulate correct answers to test progression
  const k = state.koala;
  k.correctTotal += 5;
  k.leaves += 5;
  k.xp += 10;
  // unlock shop at 50 correct (we’ll implement later)
  if(k.correctTotal >= 50) state.shop.unlocked = true;
  save(state);
  toast("Test: +5 doğru, +5 yaprak, +10 XP ✅",1);
  render();
});

// PWA service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

render();
