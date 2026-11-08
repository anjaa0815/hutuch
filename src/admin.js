/* ============================================================
   ХӨТӨЧ — Админ эрх
   Админыг баталгаажсан имэйлээр нь таньна. ЖИНХЭНЭ хамгаалалт нь Firestore дүрэм
   (firestore.rules → isAdmin()) — энд зөвхөн UI-д "Админ" товч харуулах эсэхийг шийднэ.
   Шинэ админ нэмбэл энэ жагсаалт БА Console дээрх дүрмийн isAdmin()-ийг хоёуланг нь засна.
   ============================================================ */

export const ADMIN_EMAILS = ["anjaaariunjargal@gmail.com"];

export function isAdminUser(u) {
  return !!(u && u.emailVerified && u.email && ADMIN_EMAILS.includes(u.email.toLowerCase()));
}
