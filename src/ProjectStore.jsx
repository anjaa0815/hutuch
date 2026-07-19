import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { usePro, ProUpgradeModal } from "./ProMembership.jsx";
import {
  collection, doc, setDoc, getDocs, deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

/* ============================================================
   ХӨТӨЧ — Миний төслүүд (cloud хадгалалт)
   Тооцоолуурын төслийг Firestore-д хэрэглэгч тус бүрээр:
   users/{uid}/projects/{id} = { name, updatedAt, data:{...} }
   Ашиглалт: <CloudProjects getData={} onLoad={} />
   getData() → одоогийн төслийн бүрэн объект
   onLoad(data) → сонгосон төслийг тооцоолуурт буулгана
   Аюулгүй байдал: firestore.rules-ээр зөвхөн эзэн нь хандана.
   ============================================================ */

const fmtDate = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("mn-MN") + " " + d.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

export default function CloudProjects({ getData, onLoad }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const { isPro } = usePro();
  const [showPro, setShowPro] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  const colRef = () => collection(db, "users", user.uid, "projects");

  const refresh = async () => {
    if (!user || !db) return;
    setBusy(true);
    try {
      const snap = await getDocs(colRef());
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setItems(list);
    } catch (e) {
      console.error(e);
      setMsg({ t: "err", x: "Уншиж чадсангүй — Firestore үүсгэгдсэн, дүрэм deploy хийгдсэн эсэхийг шалгана уу." });
    } finally { setBusy(false); }
  };

  const openModal = () => {
    setMsg(null);
    setOpen(true);
    if (user && db) refresh();
  };

  const save = async () => {
    const nm = name.trim() || "Нэргүй төсөл";
    setBusy(true); setMsg(null);
    try {
      const id = "p" + Date.now();
      await setDoc(doc(db, "users", user.uid, "projects", id), {
        name: nm,
        updatedAt: serverTimestamp(),
        data: JSON.parse(JSON.stringify(getData())), // undefined утгуудыг цэвэрлэнэ
      });
      setName("");
      setMsg({ t: "ok", x: `«${nm}» хадгалагдлаа` });
      refresh();
    } catch (e) {
      console.error(e);
      setMsg({ t: "err", x: "Хадгалж чадсангүй: " + (e.code || e.message) });
    } finally { setBusy(false); }
  };

  const load = (it) => {
    onLoad(it.data);
    setOpen(false);
  };

  const remove = async (it) => {
    if (!confirm(`«${it.name}» төслийг устгах уу?`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "users", user.uid, "projects", it.id));
      refresh();
    } catch (e) { setMsg({ t: "err", x: "Устгаж чадсангүй" }); }
    finally { setBusy(false); }
  };

  if (!db || !auth) return null; // Firebase тохиргоогүй орчинд товч нуугдана

  return (
    <>
      <button onClick={openModal}
        className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700">
        ☁️ Миний төслүүд
      </button>
      {open && createPortal(
        <div className="flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, overflowY: "auto" }}
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900">☁️ Миний төслүүд</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100">✕</button>
            </div>

            {!user ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Төслөө cloud-д хадгалахын тулд эхлээд <b>Нэвтэрч</b> орно уу (баруун дээд булангийн товч).
              </p>
            ) : !isPro ? (
              <div className="text-center">
                <div className="mb-3 text-4xl">☁️✨</div>
                <p className="mb-1 text-sm font-bold text-stone-800">Cloud төсөл хадгалах нь Pro боломж</p>
                <p className="mb-4 text-xs text-stone-500">Төслөө үүлэнд хадгалаад өөр төхөөрөмжөөс нээх, лого-той PDF маягт татахын тулд Pro болоорой.</p>
                <button onClick={() => { setOpen(false); setShowPro(true); }}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-90">
                  Pro болох →
                </button>
              </div>
            ) : (
              <>
                {/* Одоогийн төслийг хадгалах */}
                <div className="mb-4 flex gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !busy && save()}
                    placeholder="Төслийн нэр (ж: Зуслангийн байшин)"
                    className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none" />
                  <button onClick={save} disabled={busy}
                    className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40">
                    Хадгалах
                  </button>
                </div>

                {msg && (
                  <p className={`mb-3 rounded-xl px-3 py-2 text-xs ${msg.t === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {msg.x}
                  </p>
                )}

                {/* Жагсаалт */}
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {busy && items.length === 0 && <p className="py-4 text-center text-sm text-stone-400">Уншиж байна...</p>}
                  {!busy && items.length === 0 && (
                    <p className="py-4 text-center text-sm text-stone-400">Хадгалсан төсөл алга — дээрээс нэр өгөөд эхнийхээ хадгалаарай</p>
                  )}
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 hover:border-orange-300">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-stone-800">{it.name}</div>
                        <div className="text-[11px] text-stone-400">{fmtDate(it.updatedAt)}</div>
                      </div>
                      <button onClick={() => load(it)}
                        className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-700">Нээх</button>
                      <button onClick={() => remove(it)}
                        className="rounded-lg px-2 py-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600" title="Устгах">🗑</button>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-stone-400">Төслүүд таны бүртгэлд хадгалагдаж, өөр төхөөрөмжөөс нэвтрэхэд мөн харагдана.</p>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
      {showPro && <ProUpgradeModal onClose={() => setShowPro(false)} reason="Cloud төсөл хадгалах, лого-той PDF татах нь Pro гишүүдэд нээлттэй." />}
    </>
  );
}
