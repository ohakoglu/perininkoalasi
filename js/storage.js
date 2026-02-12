import { defaultState, sanitizeState } from "./state.js";

const KEY = "perinin_koalasi_state_v01";

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function save(state) {
  try {
    state.meta = state.meta || {};
    state.meta.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function reset() {
  const s = defaultState();
  save(s);
  return s;
}

export function exportToFile(state) {
  const safe = sanitizeState(state);
  const json = JSON.stringify(safe, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  const fname = `perinin-koalasi-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  const safe = sanitizeState(obj);
  save(safe);
  return safe;
}
