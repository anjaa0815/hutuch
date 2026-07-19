import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/* ============================================================
   ХӨТӨЧ — Pro гишүүнчлэл
   users/{uid} баримтын isPro талбараар эрхийг тодорхойлно.
   Админ (эзэн) Firebase Console-оос гараар isPro=true болгоно.

   usePro() → { user, isPro, loading }  — хаанаас ч Pro эрх шалгана
   <ProUpgradeModal onClose /> — гишүүнчлэлийн санал + дансны мэдээлэл
   <ProBadge /> — Pro хэрэглэгчийн тэмдэг
   ============================================================ */

/* --- Тохиргоо: өөрийн дансны мэдээллээ энд бичнэ --- */
export const PRO_PRICE = "30,000₮";
export const PRO_PRICE_YEAR = "300,000₮";
export const BANK_INFO = {
  bank: "Хаан банк",
  account: "5xxx xxx xxx",       // ← өөрийн дансаа бичнэ
  name: "Ариунжаргал",           // ← дансны нэр
};

export function usePro() {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && db) {
        try {
          const snap = await getDoc(doc(db, "proStatus", u.uid));
          setIsPro(snap.exists() && snap.data().isPro === true);
        } catch { setIsPro(false); }
      } else {
        setIsPro(false);
      }
      setLoading(false);
    });
  }, []);

  return { user, isPro, loading };
}

export function ProBadge() {
  return (
    <span className="ml-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-[10px] font-black text-white">
      PRO
    </span>
  );
}

export function ProUpgradeModal({ onClose, reason }) {
  const [copied, setCopied] = useState(false);
  const copy = (t) => {
    navigator.clipboard?.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return createPortal(
    <div className="flex items-center justify-center bg-black/50 p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, overflowY: "auto" }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-black text-stone-900">
            Хөтөч <span className="ml-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-xs font-black text-white">PRO</span>
          </h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100">✕</button>
        </div>

        {reason && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{reason}</p>}

        {/* Давуу талууд */}
        <div className="mb-4 space-y-2">
          {[
            ["🤖", "Хязгааргүй AI зөвлөгөө", "Өдрийн лимитгүй, хүссэн үедээ асуу"],
            ["☁️", "Төслөө татаж хадгалах", "Хязгааргүй cloud төсөл, лого-той PDF маягт"],
            ["💡", "Төсвөө AI-аас тайлбарлуул", "«Энэ мөр юу вэ, яагаад ийм үнэтэй вэ» гэж асуу"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3 rounded-xl border border-stone-100 p-3">
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-sm font-bold text-stone-800">{title}</div>
                <div className="text-xs text-stone-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Үнэ */}
        <div className="mb-4 flex items-center justify-center gap-4 rounded-2xl bg-stone-900 px-4 py-3 text-white">
          <div className="text-center">
            <div className="font-mono text-2xl font-black text-orange-400">{PRO_PRICE}</div>
            <div className="text-[10px] uppercase text-stone-400">сар</div>
          </div>
          <div className="text-stone-600">•</div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-white">{PRO_PRICE_YEAR}</div>
            <div className="text-[10px] uppercase text-stone-400">жил (2 сар үнэгүй)</div>
          </div>
        </div>

        {/* Дансны мэдээлэл */}
        <div className="rounded-2xl border border-stone-200 p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Дансаар шилжүүлэх</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Банк</span><span className="font-medium">{BANK_INFO.bank}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Данс</span>
              <button onClick={() => copy(BANK_INFO.account)} className="font-mono font-bold text-orange-600 hover:underline">
                {BANK_INFO.account} {copied ? "✓" : "📋"}
              </button>
            </div>
            <div className="flex justify-between"><span className="text-stone-500">Хүлээн авагч</span><span className="font-medium">{BANK_INFO.name}</span></div>
          </div>
          <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-[11px] leading-snug text-stone-600">
            Гүйлгээний утга дээр <b>бүртгэлтэй имэйлээ</b> бичээрэй. Төлбөр хийсний дараа таны Pro эрх <b>24 цагийн дотор</b> идэвхжинэ. Асуувал: hutuch.com Холбоо барих хэсгээр.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
