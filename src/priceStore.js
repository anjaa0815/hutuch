/* ============================================================
   ХӨТӨЧ — Төвлөрсөн зах зээлийн үнэ (Firestore)
   Админ Firestore Console → config/prices баримтад үнэ шинэчилнэ:
     талбарын нэр = материалын key (BuildEstimator.jsx-ийн `key:`), утга = үнэ (number, ₮)
     updatedAt   = огноо (timestamp эсвэл "2026-11-08" string) — сонголттой
   Зөвхөн өөрчилсөн үнээ бичихэд хангалттай — бусад нь кодын анхдагч үнээрээ үлдэнэ.
   Firestore уншиж чадахгүй бол (дүрэмгүй, offline) анхдагч үнээр чимээгүй ажиллана.
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const CACHE_KEY = "hutuch_prices_v1";

/* Firestore-ын түүхий баримтаас зөвхөн мэдэгдэж буй key, эерэг тоог авна */
export function cleanPrices(raw, defaults) {
  const prices = {};
  if (!raw || typeof raw !== "object") return { prices, updatedAt: null };
  for (const [k, v] of Object.entries(raw)) {
    if (!(k in defaults)) continue;
    const n = Number(v);
    if (isFinite(n) && n > 0) prices[k] = n;
  }
  const u = raw.updatedAt;
  const d = u?.toDate ? u.toDate() : u ? new Date(u) : null;
  const updatedAt = d && !isNaN(d) ? d.toISOString().slice(0, 10) : null;
  return { prices, updatedAt };
}

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
};
const writeCache = (v) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch { /* хадгалах боломжгүй */ }
};

/* Хуудас ачаалах бүрт Firestore-оос нэг л удаа уншина (компонентууд хуваалцана) */
let pending = null;
function fetchOnce() {
  if (!db) return Promise.resolve(null);
  if (!pending) {
    pending = getDoc(doc(db, "config", "prices"))
      .then((s) => (s.exists() ? s.data() : {}))
      .catch(() => null);                     // permission-denied, offline г.м. — анхдагч үнэ
  }
  return pending;
}

/* Анхдагч үнийг Firestore-ийн шинэчлэлээр давхарлана.
   Буцаана: base — бүх key-ийн хэрэглэх үнэ; live — Firestore-оос ирсэн үнүүд;
   updatedAt — шинэчилсэн огноо; source — "default" | "cache" | "live" */
export function useLivePrices(defaults) {
  const [state, setState] = useState(() => {
    const c = readCache();
    const { prices, updatedAt } = cleanPrices(c, defaults);
    return Object.keys(prices).length
      ? { live: prices, updatedAt, source: "cache" }
      : { live: {}, updatedAt: null, source: "default" };
  });

  useEffect(() => {
    let alive = true;
    fetchOnce().then((raw) => {
      if (!alive || raw === null) return;       // уншиж чадаагүй — кэш/анхдагч хэвээр
      const { prices, updatedAt } = cleanPrices(raw, defaults);
      writeCache({ ...prices, updatedAt });
      setState({ live: prices, updatedAt, source: Object.keys(prices).length ? "live" : "default" });
    });
    return () => { alive = false; };
  }, [defaults]);

  const base = useMemo(() => ({ ...defaults, ...state.live }), [defaults, state.live]);
  return { ...state, base };
}
