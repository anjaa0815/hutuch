# `aiUsage` коллекцийг хаах заавар

## Асуудал

`firestore.rules`-д `aiUsage/{docId}` нь хэн ч бичиж болохоор нээлттэй байна:

```
allow write: if request.resource.data.count is int && ... < 100000;
```

Vercel дээрх `hutuch-ai-api` нь Firestore REST-д **вэб apiKey**-ээр, нэвтрэлтгүй бичдэг.
Тиймээс дүрэм нээлттэй байх шаардлагатай болсон. Гэтэл энэ нь хэн ч браузерын console-оос
өөрийн тоолуурыг `count: 0` болгож өдрийн лимитийг (зочин 5 / нэвтэрсэн 10) тойрч чадна гэсэн үг.

## Шийдэл: Vercel-ийг service account-аар бичүүлэх

Admin SDK (service account) нь Firestore дүрмийг алгасдаг. Тиймээс дүрмийг бүрэн хааж болно.

1. **Service account түлхүүр үүсгэх**
   Firebase Console → Project settings → Service accounts → *Generate new private key* → JSON татна.
2. **Vercel env нэмэх** (hutuch-ai-api төсөл → Settings → Environment Variables)
   `FIREBASE_SERVICE_ACCOUNT` = JSON файлын агуулга (нэг мөрөөр). Git-д **оруулахгүй**.
3. **`hutuch-ai-api/api/chat.js`-ийг засах.** REST + apiKey-ийн оронд `firebase-admin` ашиглана:
   ```js
   import { initializeApp, cert, getApps } from "firebase-admin/app";
   import { getFirestore, FieldValue } from "firebase-admin/firestore";
   if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
   const fdb = getFirestore();
   // тоолох: транзакцаар уншаад +1
   const ref = fdb.doc(`aiUsage/${key}`);
   const count = await fdb.runTransaction(async (t) => {
     const s = await t.get(ref);
     const c = (s.exists ? s.data().count : 0) + 1;
     t.set(ref, { count: c, day, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
     return c;
   });
   ```
   Pro шалгалт (`proStatus/{uid}`)-ыг мөн `fdb.doc(...).get()`-ээр уншина.
   Хэрэглэгчийн uid-ийг клиентээс ирсэн ID token-оос `getAuth().verifyIdToken(token)`-оор баталгаажуулна.
4. **Deploy хийгээд шалгах.** AI чат ажиллаж, лимит тоологдож байгаа эсэхийг шалгана.
5. **Дараа нь л дүрмийг хаана.** Firebase Console → Firestore → Rules → `aiUsage` блокийг дараах байдлаар солиод **Publish** дарна:
   ```
   match /aiUsage/{docId} {
     allow read, write: if false;   // зөвхөн Vercel (Admin SDK) бичнэ
   }
   ```
   Үүний дараа репо дахь `firestore.rules`-ийг ч мөн адил шинэчилнэ.

⚠️ 5-р алхмыг 3–4-өөс **өмнө** хийвэл AI-ийн лимит тоологдохгүй болж, чат алдаа өгнө.
