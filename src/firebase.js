/* Firebase-ийн нэгдсэн init — App, AuthPanel, AdviceChat бүгд эндээс авна.
   Тохиргоо: .env файлд VITE_FIREBASE_CONFIG={"apiKey":...} (Firebase Console →
   Project settings → Your apps → Config-оос авна). Тохиргоогүй бол сайт
   auth-гүй горимд хэвийн ажиллана. */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';

let app = null;
let auth = null;
let db = null;
let analytics = null;
try {
    // eslint-disable-next-line no-undef
    const cfgStr = typeof __firebase_config !== 'undefined' ? __firebase_config : (import.meta.env.VITE_FIREBASE_CONFIG || null);
    if (cfgStr) {
        const cfg = typeof cfgStr === 'string' ? JSON.parse(cfgStr) : cfgStr;
        app = initializeApp(cfg);
        auth = getAuth(app);
        db = getFirestore(app);
        try { analytics = getAnalytics(app); } catch { /* analytics боломжгүй орчин */ }
    } else {
        console.warn('Firebase тохиргоо олдсонгүй — auth/firestore идэвхгүй горимд ажиллана.');
    }
} catch (e) {
    console.warn('Firebase эхлүүлж чадсангүй:', e);
}
/* Analytics event илгээх туслах — analytics байхгүй бол чимээгүй алгасна */
export function track(name, params) {
  try { if (analytics) logEvent(analytics, name, params || {}); } catch { /* alga */ }
}
export { app, auth, db, analytics };