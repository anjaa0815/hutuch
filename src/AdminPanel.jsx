import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { useAuthUser } from "./AuthPanel.jsx";
import { isAdminUser } from "./admin.js";
import { SYSTEMS, COMMON_ITEMS } from "./BuildEstimator.jsx";

/* ============================================================
   ХӨТӨЧ — Админ хуудас
   1) Үнэ: config/prices баримтыг засна (анхдагч үнээс өөр утгуудыг л хадгална)
   2) Pro: proRequests (хэрэглэгчийн "төлбөр шилжүүлсэн" хүсэлт) → proStatus/{uid}.isPro
   Бичих эрхийг Firestore дүрмийн isAdmin() шалгана (CLAUDE.md → "Админ хуудас").
   ============================================================ */

const RULES_HINT = "Firestore дүрэмд админы блок нэмэгдээгүй байна (CLAUDE.md → «Админ хуудас» хэсгийг үз).";
const errText = (e) => (e?.code === "permission-denied" ? RULES_HINT : `Алдаа: ${e?.message || e}`);
const tg = (v) => Math.round(v).toLocaleString("en-US") + "₮";
const fmtDate = (t) => { const d = t?.toDate ? t.toDate() : t ? new Date(t) : null; return d && !isNaN(d) ? d.toISOString().slice(0, 10) : "—"; };

/* Бүх материал — key давхардвал бүлгийн нэрийг нийлүүлнэ */
const PRICE_ROWS = (() => {
  const m = new Map();
  const add = (it, group) => {
    const r = m.get(it.key);
    if (r) { if (!r.groups.includes(group)) r.groups.push(group); return; }
    m.set(it.key, { key: it.key, name: it.name, unit: it.unit, def: it.price, groups: [group] });
  };
  for (const sys of SYSTEMS) for (const o of sys.options) for (const it of o.items) add(it, `${sys.label} › ${o.name}`);
  for (const it of COMMON_ITEMS) add(it, it.group || "Нийтлэг");
  return [...m.values()];
})();

function Msg({ msg }) {
  if (!msg) return null;
  const ok = msg.startsWith("✓");
  return <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg}</p>;
}

/* ---------------- Үнэ ---------------- */
function PricesTab() {
  const [live, setLive] = useState(null);          // Firestore-д одоо байгаа утгууд
  const [updatedAt, setUpdatedAt] = useState(null);
  const [draft, setDraft] = useState({});          // key → оруулсан текст
  const [q, setQ] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const s = await getDoc(doc(db, "config", "prices"));
      const data = s.exists() ? s.data() : {};
      const vals = {};
      for (const r of PRICE_ROWS) if (typeof data[r.key] === "number" && data[r.key] > 0) vals[r.key] = data[r.key];
      setLive(vals);
      setUpdatedAt(data.updatedAt ?? null);
      setDraft(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, String(v)])));
    } catch (e) { setLive({}); setMsg(errText(e)); }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() дахь setState бүгд await-ийн дараа
  useEffect(() => { load(); }, []);

  /* Хадгалах утга: эерэг тоо, анхдагчаас өөр */
  const next = useMemo(() => {
    const o = {};
    for (const r of PRICE_ROWS) {
      const n = Number(String(draft[r.key] ?? "").replace(/[,\s₮]/g, ""));
      if (isFinite(n) && n > 0 && n !== r.def) o[r.key] = n;
    }
    return o;
  }, [draft]);

  const dirty = live && (Object.keys(next).length !== Object.keys(live).length || Object.entries(next).some(([k, v]) => live[k] !== v));

  const rows = PRICE_ROWS.filter((r) => {
    if (onlyChanged && !(r.key in next)) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return r.key.toLowerCase().includes(s) || r.name.toLowerCase().includes(s) || r.groups.join(" ").toLowerCase().includes(s);
  });

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      await setDoc(doc(db, "config", "prices"), { ...next, updatedAt: serverTimestamp() });   // бүтнээр солино — устгасан үнэ анхдагч руугаа буцна
      await load();
      setMsg(`✓ Хадгаллаа — ${Object.keys(next).length} материалын үнэ шинэчлэгдсэн. Хэрэглэгчид хуудсаа дахин ачаалахад шинэ үнэ авна.`);
    } catch (e) { setMsg(errText(e)); }
    setBusy(false);
  };

  if (!live) return <p className="text-xs text-stone-500">Ачаалж байна…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх: нэр, key, бүлэг…"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none" />
        <label className="flex items-center gap-1.5 text-xs text-stone-600">
          <input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} /> Зөвхөн өөрчилсөн
        </label>
        <button onClick={save} disabled={busy || !dirty}
          className="rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40">
          {busy ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-stone-500">
        {PRICE_ROWS.length} материал · шинэчилсэн {Object.keys(next).length} · сүүлд хадгалсан {fmtDate(updatedAt)}.
        Нүдийг хоосон үлдээвэл анхдагч үнэ хэрэглэгдэнэ.
      </p>
      <Msg msg={msg} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[10px] uppercase tracking-wide text-stone-400">
              <th className="py-1.5 pr-2">Материал</th><th className="py-1.5 pr-2">Нэгж</th>
              <th className="py-1.5 pr-2 text-right">Анхдагч</th><th className="py-1.5 pr-2 text-right">Шинэ үнэ (₮)</th><th className="py-1.5 text-right">Өөрчлөлт</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const v = next[r.key];
              const saved = live[r.key] === v || (!(r.key in live) && v === undefined);
              const pct = v ? ((v - r.def) / r.def) * 100 : null;
              return (
                <tr key={r.key} className={`border-b border-stone-100 ${v ? "bg-orange-50/60" : ""}`}>
                  <td className="py-1.5 pr-2">
                    <div className="font-medium text-stone-800">{r.name}</div>
                    <div className="text-[10px] text-stone-400">{r.key} · {r.groups.join(", ")}</div>
                  </td>
                  <td className="py-1.5 pr-2 text-stone-500">{r.unit}</td>
                  <td className="py-1.5 pr-2 text-right font-mono text-stone-500">{tg(r.def)}</td>
                  <td className="py-1.5 pr-2 text-right">
                    <input inputMode="numeric" value={draft[r.key] ?? ""} placeholder={String(r.def)}
                      onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
                      className={`w-28 rounded-md border px-2 py-1 text-right font-mono text-xs focus:border-orange-500 focus:outline-none ${saved ? "border-stone-300" : "border-orange-400"}`} />
                  </td>
                  <td className={`py-1.5 text-right font-mono ${pct > 0 ? "text-red-600" : pct < 0 ? "text-emerald-700" : "text-stone-300"}`}>
                    {pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Pro ---------------- */
function ProTab({ admin }) {
  const [reqs, setReqs] = useState(null);
  const [members, setMembers] = useState([]);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [r, m] = await Promise.all([getDocs(collection(db, "proRequests")), getDocs(collection(db, "proStatus"))]);
      setReqs(r.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)));
      setMembers(m.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (e) { setReqs([]); setMsg(errText(e)); }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() дахь setState бүгд await-ийн дараа
  useEffect(() => { load(); }, []);

  const setPro = async (id, on, extra = {}) => {
    setBusy(id); setMsg("");
    try {
      await setDoc(doc(db, "proStatus", id), {
        isPro: on, ...extra, updatedAt: serverTimestamp(), updatedBy: admin.email,
        ...(on ? { activatedAt: serverTimestamp() } : {}),
      }, { merge: true });
      if (on) await deleteDoc(doc(db, "proRequests", id)).catch(() => {});
      setMsg(`✓ ${extra.email || id}: Pro ${on ? "идэвхжлээ" : "цуцлагдлаа"}. Хэрэглэгч хуудсаа дахин ачаалахад хүчинтэй болно.`);
      await load();
    } catch (e) { setMsg(errText(e)); }
    setBusy("");
  };

  const dropReq = async (id) => {
    setBusy(id);
    try { await deleteDoc(doc(db, "proRequests", id)); await load(); } catch (e) { setMsg(errText(e)); }
    setBusy("");
  };

  if (!reqs) return <p className="text-xs text-stone-500">Ачаалж байна…</p>;
  const btn = "rounded border px-2 py-0.5 text-[11px] font-medium disabled:opacity-40";

  return (
    <div className="space-y-5">
      <Msg msg={msg} />
      <section>
        <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">Төлбөрийн хүсэлт ({reqs.length})</h4>
        <p className="text-[11px] text-stone-400">Хэрэглэгч Pro цонхны «Төлбөр шилжүүлсэн» товчийг дарахад энд гарна. Дансны хуулгаас шалгаад идэвхжүүлнэ.</p>
        {reqs.length === 0 ? <p className="mt-2 text-xs text-stone-400">Шинэ хүсэлт алга.</p> : (
          <div className="mt-2 divide-y divide-stone-100 rounded-lg border border-stone-200">
            {reqs.map((r) => (
              <div key={r.uid} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-stone-800">{r.email || "(имэйлгүй)"} {r.name && <span className="text-stone-400">· {r.name}</span>}</div>
                  <div className="text-[10px] text-stone-400">{r.plan === "year" ? "Жил" : "Сар"} · {fmtDate(r.createdAt)} · {r.uid}</div>
                </div>
                <button disabled={!!busy} onClick={() => setPro(r.uid, true, { email: r.email || "", plan: r.plan || "month" })}
                  className={`${btn} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}>Идэвхжүүлэх</button>
                <button disabled={!!busy} onClick={() => dropReq(r.uid)} className={`${btn} border-stone-300 text-stone-500 hover:bg-stone-50`}>Устгах</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">Гараар идэвхжүүлэх</h4>
        <p className="text-[11px] text-stone-400">Хэрэглэгчийн uid: Firebase Console → Authentication → Users хүснэгтийн «User UID».</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input value={uid} onChange={(e) => setUid(e.target.value.trim())} placeholder="User UID"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-1.5 font-mono text-xs focus:border-orange-500 focus:outline-none" />
          <input value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="Имэйл (тэмдэглэл)"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
          <button disabled={!!busy || uid.length < 10} onClick={() => setPro(uid, true, email ? { email } : {}).then(() => { setUid(""); setEmail(""); })}
            className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-40">Идэвхжүүлэх</button>
        </div>
      </section>

      <section>
        <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">Pro гишүүд ({members.filter((m) => m.isPro).length})</h4>
        {members.length === 0 ? <p className="mt-2 text-xs text-stone-400">Бүртгэл алга.</p> : (
          <div className="mt-2 divide-y divide-stone-100 rounded-lg border border-stone-200">
            {members.map((m) => (
              <div key={m.uid} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.isPro ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-400"}`}>{m.isPro ? "PRO" : "цуцалсан"}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-stone-800">{m.email || "(имэйлгүй)"}</div>
                  <div className="text-[10px] text-stone-400">{m.plan === "year" ? "Жил · " : m.plan === "month" ? "Сар · " : ""}идэвхжсэн {fmtDate(m.activatedAt)} · {m.uid}</div>
                </div>
                <button disabled={!!busy} onClick={() => setPro(m.uid, !m.isPro, m.email ? { email: m.email } : {})}
                  className={`${btn} ${m.isPro ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}>
                  {m.isPro ? "Цуцлах" : "Сэргээх"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------- Хуудас ---------------- */
export default function AdminPanel({ onBack }) {
  const user = useAuthUser();
  const [tab, setTab] = useState("prices");
  const admin = isAdminUser(user);

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">🛠 Админ</h2>
        <button onClick={onBack} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">← Буцах</button>
      </div>
      {!db ? <p className="text-sm text-stone-500">Firebase тохиргоо алга.</p>
        : !admin ? <p className="rounded-xl bg-white p-6 text-sm text-stone-500 shadow-sm">Энэ хуудас зөвхөн админд нээлттэй. Админ имэйлээр (баталгаажсан) нэвтэрнэ үү.</p>
        : (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-stone-800 shadow-sm sm:p-6">
            <div className="mb-4 flex gap-1 border-b border-stone-200">
              {[["prices", "💰 Зах зээлийн үнэ"], ["pro", "⭐ Pro гишүүнчлэл"]].map(([id, l]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${tab === id ? "border-orange-600 text-orange-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>{l}</button>
              ))}
            </div>
            {tab === "prices" ? <PricesTab /> : <ProTab admin={user} />}
          </div>
        )}
    </div>
  );
}

/* Толгойн товч — зөвхөн админд харагдана */
export function AdminNavButton({ onNavigate }) {
  const user = useAuthUser();
  if (!isAdminUser(user)) return null;
  return (
    <button onClick={() => onNavigate("admin")} title="Админ"
      className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-slate-700">
      🛠<span className="hidden sm:inline"> Админ</span>
    </button>
  );
}
