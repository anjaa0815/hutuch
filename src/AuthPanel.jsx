import { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import {
  onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updateProfile,
} from "firebase/auth";

/* ============================================================
   ХӨТӨЧ — Бүртгэл, нэвтрэлт
   <AuthButton /> — толгойн товч (нэвтрээгүй: "Нэвтрэх",
   нэвтэрсэн: нэр + гарах цэс). Modal нь имэйл/нууц үг + Google.
   useAuthUser() — хаанаас ч хэрэглэгчийг авах hook.
   ============================================================ */

export function useAuthUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);
  return user;
}

const ERR_MN = {
  "auth/invalid-email": "Имэйл хаяг буруу байна",
  "auth/user-not-found": "Ийм хэрэглэгч бүртгэлгүй байна",
  "auth/wrong-password": "Нууц үг буруу байна",
  "auth/invalid-credential": "Имэйл эсвэл нууц үг буруу байна",
  "auth/email-already-in-use": "Энэ имэйл аль хэдийн бүртгэлтэй",
  "auth/weak-password": "Нууц үг сул байна (6-аас дээш тэмдэгт)",
  "auth/popup-closed-by-user": "Нэвтрэлт цуцлагдлаа",
  "auth/too-many-requests": "Хэт олон оролдлого — түр хүлээгээд дахин оролдоно уу",
};
const errMsg = (e) => ERR_MN[e?.code] || "Алдаа гарлаа — дахин оролдоно уу";

function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const run = async (fn) => {
    setBusy(true); setError(null); setInfo(null);
    try { await fn(); onClose(); }
    catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  const submit = () => run(async () => {
    if (mode === "register") {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  });
  const google = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()));
  const reset = async () => {
    if (!email) { setError("Имэйлээ эхлээд бичнэ үү"); return; }
    setError(null);
    try { await sendPasswordResetEmail(auth, email); setInfo("Нууц үг сэргээх холбоос имэйл рүү тань явлаа"); }
    catch (e) { setError(errMsg(e)); }
  };

  const input = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {[["login", "Нэвтрэх"], ["register", "Бүртгүүлэх"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === m ? "bg-white dark:bg-slate-900 text-orange-600 shadow" : "text-slate-500"}`}>{l}</button>
          ))}
        </div>
        <div className="space-y-3">
          {mode === "register" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Нэр" className={input} />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Имэйл" type="email" className={input} />
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Нууц үг" type="password" className={input}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
          {error && <p className="rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-600">{error}</p>}
          {info && <p className="rounded-xl bg-green-50 dark:bg-green-950/40 px-3 py-2 text-xs text-green-700">{info}</p>}
          <button onClick={submit} disabled={busy || !email || !pass}
            className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-40">
            {busy ? "..." : mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
          <button onClick={google} disabled={busy}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800">
            Google-ээр нэвтрэх
          </button>
          {mode === "login" && (
            <button onClick={reset} className="w-full text-center text-xs text-slate-400 hover:text-orange-600">Нууц үгээ мартсан уу?</button>
          )}
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-400">Бүртгүүлснээр төслөө хадгалах, AI зөвлөхөөс илүү олон асуулт асуух боломжтой</p>
      </div>
    </div>
  );
}

export function AuthButton() {
  const user = useAuthUser();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!auth) {
    return (
      <button onClick={() => alert("Firebase тохиргоо (.env → VITE_FIREBASE_CONFIG) хийгдээгүй тул бүртгэл түр идэвхгүй.")}
        className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-400">
        Нэвтрэх
      </button>
    );
  }

  if (!user) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className="rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-700">
          Нэвтрэх
        </button>
        {open && <AuthModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  const label = user.displayName || user.email?.split("@")[0] || "Хэрэглэгч";
  return (
    <div className="relative">
      <button onClick={() => setMenu((m) => !m)}
        className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[11px] text-white">
          {label[0]?.toUpperCase()}
        </span>
        <span className="hidden max-w-[100px] truncate sm:inline">{label}</span>
      </button>
      {menu && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl">
          <div className="truncate px-3 py-1.5 text-[11px] text-slate-400">{user.email}</div>
          <button onClick={() => { signOut(auth); setMenu(false); }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            Гарах
          </button>
        </div>
      )}
    </div>
  );
}
