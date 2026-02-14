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
  $("ver").textContent = "v0.4";

  const k = state.koala;
  const hasName = !!k.name;

  if(!hasName){
    show("screenName");
    return;
  }

  $("helloTitle").textContent = `Merhaba, ${k.name}!`;
  $("helloSub").textContent = `Koalan sakin… ve büyümeye hazır.`;

  $("sCorrect").textContent = k.correctTotal;
  $("sLeaves").textContent = k.leaves;
  $("sXp").textContent = k.xp;
  $("sHunger").textContent = k.hunger;

  $("koalaStage").innerHTML = renderKoalaLayers(state, {big:false});
  applyKoalaIdleMotion($("koalaStage").querySelector(".koalaCanvas"));

  $("kTitle").textContent = `${k.name}`;
  $("kSub").textContent = stageLabel(k.stage);
  $("kTiny").textContent = `Tokluk ${k.hunger}% • XP ${k.xp} • Yaprak ${k.leaves}`;

  $("koalaBig").innerHTML = renderKoalaLayers(state, {big:true});
  applyKoalaIdleMotion($("koalaBig").querySelector(".koalaCanvas"));

  $("barHunger").style.width = `${k.hunger}%`;
  $("barXp").style.width = `${Math.min(100, (k.xp % 100))}%`;

  show("screenHome");
}
