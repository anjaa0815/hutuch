/* Firebase-ийн нэгдсэн init — App, AuthPanel, AdviceChat бүгд эндээс авна.
   Тохиргоо: .env файлд VITE_FIREBASE_CONFIG={"apiKey":...} (Firebase Console →
   Project settings → Your apps → Config-оос авна). Тохиргоогүй бол сайт
   auth-гүй горимд хэвийн ажиллана. */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;
try {
    // eslint-disable-next-line no-undef
    const cfgStr = typeof __firebase_config !== 'undefined' ? __firebase_config : (import.meta.env.VITE_FIREBASE_CONFIG || null);
    if (cfgStr) {
        const cfg = typeof cfgStr === 'string' ? JSON.parse(cfgStr) : cfgStr;
        app = initializeApp(cfg);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn('Firebase тохиргоо олдсонгүй — auth/firestore идэвхгүй горимд ажиллана.');
    }
} catch (e) {
    console.warn('Firebase эхлүүлж чадсангүй:', e);
}
export { app, auth, db };
