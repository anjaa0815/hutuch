# hutuch.com — Барилгын ухаалаг тооцоолуур

Монголын барилгын төсөв тооцоолох вэб платформ. Хэрэглэгч өрөөгөө зурж, материалаа сонгоод,
БНбД нормоор материал, ажлын хөлс, нийт төсвөө гаргадаг. AI зөвлөх, AI план үүсгэгчтэй.

**Бүх харилцаа, UI текст, commit мессеж монголоор.**

---

## Стек

- React 19 + Vite (rolldown-vite) + Tailwind CSS
- Firebase: Hosting + Auth + Firestore (Standard edition, asia-northeast1) + Analytics
- Firebase project ID: `hutuchcom-39123`
- 3D: three.js
- Icons: lucide-react
- AI API: Vercel serverless (тусдаа репо, доор үз)
- Repo: github.com/anjaa0815/hutuch, branch `main`

## Файлын бүтэц (src/)

| Файл | Үүрэг |
|---|---|
| `main.jsx` | React entry — `App`-ийг mount хийнэ |
| `App.jsx` | Нүүр хуудас, навигаци, Footer, дэлгүүр, форум. View routing + `track()` analytics. ХАМГИЙН ТОМ ФАЙЛ (~138KB) |
| `firebase.js` | Firebase init (нэгдсэн), `app/auth/db` export, `track(name, params)` analytics helper |
| `BuildEstimator.jsx` | Үндсэн тооцоолуур: план зурагч, 3D, материал, төсөв, маягт (~129KB) |
| `QuickPlanner.jsx` | Хурдан төлөвлөгч (хялбаршуулсан горим) |
| `EngineeringTools.jsx` | 14 инженерийн тооцоолуур (дулаан алдагдал, радиатор, кабель, доум сууц г.м.) |
| `AdviceChat.jsx` | AI зөвлөх чат (лимиттэй) |
| `AIPlanGenerator.jsx` | Текстээс план үүсгэгч (AI → өрөөний хөтөлбөр → алгоритмаар зохион байгуулалт) |
| `HouseTemplates.jsx` | 6 бэлэн байшингийн загвар |
| `FurnitureCatalog.jsx` | 22 тавилга, сантехникийн SVG тэмдэгт |
| `BudgetExplain.jsx` | Төсвийн мөрийг AI-аас тайлбарлуулах 💡 товч (Pro) |
| `ProjectStore.jsx` | Cloud төсөл хадгалах (Pro) |
| `ProMembership.jsx` | `usePro()` hook, `ProUpgradeModal`, дансны мэдээлэл |
| `AuthPanel.jsx` | Нэвтрэх, бүртгүүлэх |
| `dxfExport.jsx` | Планыг DXF (AutoCAD R12, мм) болгож экспортлох (Pro) |
| `miBenchmark.jsx` | RASMI материалын эрчимшлийн жишиг (кг/м²) — төсвийн мөрийг масс руу хөрвүүлж харьцуулна ("Төсөв" таб) |
| `priceStore.js` | `useLivePrices()` — Firestore `config/prices`-оос төвлөрсөн үнэ ачаална (BuildEstimator, QuickPlanner) |
| `energyEstimate.js` | Халаалтын дулааны баланс: `wallU()` (давхаргаар), `heatBalance()`, `estimateHeating()`. λ/U лавлах утгууд. EngineeringTools-ийн HeatLoss ч үүнийг ашиглана |
| `AdminPanel.jsx` | Админ хуудас (`view === 'admin'`): зах зээлийн үнэ засах (`config/prices`), Pro хүсэлт/гишүүдийг удирдах (`proRequests`, `proStatus`). `AdminNavButton` толгойд зөвхөн админд харагдана |
| `AdminNavButton.jsx` | Толгойн 🛠 Админ товч. AdminPanel-ээс тусад нь байгаа нь админ хуудсыг эхний ачаалалд оруулахгүйн тулд |
| `__tests__/` | Vitest тестүүд (`npm test`): `energyEstimate`, төсвийн мөр бүр RULES-д танигдах, key давхцахгүй |
| `admin.js` | `ADMIN_EMAILS`, `isAdminUser(u)` — UI-д л ашиглана, жинхэнэ хамгаалалт нь Firestore дүрмийн `isAdmin()` |
| `EnergyPanel.jsx` | "Төсөв" таб: жилийн халаалтын кВт·ц/₮, зуухны чадлын шалгалт, дулаалгын харьцуулалт (өртөг, хэмнэлт, нөхөгдөх хугацаа) |
| `VariantCompare.jsx` | "Төсөв" таб: материалын сонголтыг 3 хүртэл хувилбар болгон хадгалж (localStorage), нийт төсөв, жилийн халаалт, 10 жилийн нийт өртгийг зэрэгцүүлнэ. Тооцоог `BuildEstimator`-ийн `calcBudget`/`calcHeating`-ээр авна |

Import-ын бүтэц: `App.jsx` → AIPlanGenerator (`AIPlanInline`), ProMembership, AuthPanel, AdminNavButton, firebase.js.
BuildEstimator, QuickPlanner, EngineeringTools, AdviceChat, AdminPanel-ийг `lazy()`-аар ачаална (code splitting).
`vite.config.js`-ийн `manualChunks` нь react, firebase, three-г тусдаа chunk болгоно.
⚠️ App.jsx-ээс эдгээрийг шууд (static) import хийвэл code splitting эвдэрнэ.
`BuildEstimator.jsx` → ProjectStore, BudgetExplain, HouseTemplates, AIPlanGenerator, miBenchmark,
ProMembership, dxfExport, FurnitureCatalog.

Бусад: `firestore.rules` (Firestore дүрэм), `functions/` (Firebase Functions, nodejs20),
`firebase.json` (hosting `dist`, SPA rewrite).
`src/src/`, `src/functions/` хуучин хуулбаруудыг устгасан (2026-11-09). `functions/` нь хуучин Firebase Function юм. Одоо AI нь Vercel дээр ажилладаг.

## Админ хуудас

- Админ имэйлээр (Google эсвэл баталгаажсан имэйл) нэвтэрхэд толгойд **🛠 Админ** товч гарна
- Админ нэмэх: `src/admin.js`-ийн `ADMIN_EMAILS` БА Console дүрмийн `isAdmin()` — хоёуланг нь засна
- Firestore дүрэм (Console-д нэмсэн байх ёстой): `isAdmin()` функц + `config/prices` write,
  `proStatus/{uid}` админ read/write, `proRequests/{uid}` — блокийг `firestore.rules`-ээс хуулна

## Pro гишүүнчлэл

- Төлбөр: дансаар шилжүүлнэ → хэрэглэгч Pro цонхонд «✓ Төлбөр шилжүүлсэн» дарна (`proRequests/{uid}`)
  → админ хуудас → Pro таб → дансны хуулгаас шалгаад **Идэвхжүүлэх**
- Гараар (хуучин арга): Firestore Console → `proStatus` коллекц → Document ID = хэрэглэгчийн uid → талбар `isPro` (boolean) = `true`
- Хугацаа автоматаар дуусдаггүй (хожим `expiresAt` нэмж болно)
- Pro боломжууд: хязгааргүй AI, cloud төсөл, төсвийн AI тайлбар, DXF экспорт, AI план үүсгэгч
- Үнэ: 30,000₮/сар, 300,000₮/жил (`ProMembership.jsx`-д `PRO_PRICE`)

## Зах зээлийн үнэ шинэчлэх (код засахгүй)

- Хялбар арга: **Админ хуудас → 💰 Зах зээлийн үнэ** — 109 материал, хайлт, анхдагчаас ялгаа %
- Console-оор: Firestore Console → `config` коллекц → `prices` баримт → талбар нэмэх:
  нэр = материалын key (жишээ `fl_screed1`), төрөл number, утга = ₮
- `updatedAt` талбар (timestamp эсвэл `"2026-11-08"` string) — "Норм & Үнэ" таб дээр огноо харагдана
- Зөвхөн өөрчилсөн үнээ бичнэ — бусад нь `BuildEstimator.jsx`-ийн анхдагч `price:` хэвээр
- Key-г олох: "Норм & Үнэ" таб дээр үнийн нүдэнд хулгана аваачихад `key: ...` гарна
- Хэрэглэгчийн гараар засварласан, эсвэл төслөөс ачаалсан үнийг дарахгүй. Хэрэглэгчид хуудас дахин ачаалахад шинэ үнэ авна
- Firestore дүрэм: `match /config/prices { allow read: if true; allow write: if isAdmin(); }`

## AI backend (тусдаа репо)

- Repo: github.com/anjaa0815/hutuch-ai-api → Vercel
- Endpoint: `https://hutuch-ai-api-kyrj.vercel.app/api/chat`
- `api/chat.js` нь provider-agnostic: OpenAI-нийцтэй ба Anthropic хоёуланг дэмжинэ
- Vercel env: `CHAT_API_KEY`, `CHAT_BASE_URL`, `CHAT_MODEL`, `CHAT_PLAN_MODEL` (сонголт),
  нөөц провайдер `CHAT2_API_KEY`, `CHAT2_BASE_URL`, `CHAT2_MODEL`,
  Firestore лимитэд: `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`
- Өдрийн лимит: зочин 5 / нэвтэрсэн 10 / Pro хязгааргүй. `aiUsage` коллекцид Firestore REST-ээр бичнэ
- Үндсэн нь алдаа/лимит өгвөл автоматаар `CHAT2_*` руу шилжинэ

## Орчны хувьсагч (hutuch/.env — git-д ОРУУЛАХГҮЙ)

```
VITE_CHAT_API_URL=https://hutuch-ai-api-kyrj.vercel.app/api/chat
VITE_FIREBASE_CONFIG={"apiKey":"...","projectId":"hutuchcom-39123",...}
```

## Deploy урсгал

**Автомат (2026-11-09-ээс):** `main`-д merge/push хийхэд `.github/workflows/firebase-deploy.yml`
lint → test → build → Firebase Hosting (hutuch.com) руу deploy хийнэ. GitHub Secrets шаардлагатай:
`FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_CONFIG`, `VITE_CHAT_API_URL`. Явцыг GitHub → Actions табаас харна.
Сайтын footer дээрх «Хувилбар: огноо» нь байршсан build-ийн цаг.
www.hutuch.com нь Vercel-ийн «hutuch» төсөл рүү зааж байсан — Firebase-д шилжүүлж нэгтгэнэ (Vercel Hobby нь арилжааны хэрэглээнд зөвшөөрөгдөхгүй).

Гараар (нөөц арга):

```powershell
npm run build                      # ← алдаа гарвал ЦААШ ЯВАХГҮЙ
firebase deploy --only hosting
git add src
git commit -m "<монголоор тайлбар>"
git push
```

Firestore дүрэм: `firebase deploy --only firestore` нь Windows дээр colon алдаа өгдөг →
Firebase Console → Firestore → Rules → шинэ match блокийг **нэмж** **Publish**.
Репо дахь `firestore.rules` нь Console-той синк (2026-11-08). Console-д засвар хийвэл файлыг ч шинэчилнэ —
зөрвөл бүхэлд нь хуулж тавихаас өмнө харьцуулна.

---

## ЧУХАЛ ДҮРМҮҮД (олон удаа алдаа гаргасан)

1. **Build амжилтгүй бол deploy хийхгүй.** `npm run build` улаан "error" өгвөл эхлээд засна.
   Алдаатай build үед `dist` хуучин хэвээр үлдэж, deploy нь хуучин хувилбарыг дахин байршуулдаг —
   шинэ өөрчлөлт огт орохгүй.

2. **`App.jsx` нь `./firebase.js`-ээс import хийдэг.** Хэрэв `__firebase_config` шууд ашиглагдсан
   хуучин хувилбар орвол сайт цагаан дэлгэц болно. Шалгалт:
   - `from './firebase.js'` — байх ёстой
   - `JSON.parse(__firebase_config)` — байх ЁСГҮЙ

3. **Шинэ state эсвэл функц нэмэхдээ зарлалтын дарааллыг шалгана.** `rooms`, `furniture`,
   `freeWalls` зэргийг ашигладаг код тэдгээрийн ДАРААХ мөрөнд байх ёстой
   (TDZ: "Cannot access 'X' before initialization").

4. **Компонентын хил (scope) шалгана.** `PlanCanvas` доторх хувьсагчийг (`drawMode`, `wallPts`)
   `RoomCard` эсвэл үндсэн компонентод ашиглаж болохгүй ("X is not defined").

5. **Өөрчлөлт бүрийн дараа бодит рендер тест хийнэ** — зөвхөн build хангалтгүй. Build өнгөрсөн ч
   runtime алдаа (scope, TDZ) сайтыг унагадаг.

6. **`.env`, `functions/.env` git-д оруулахгүй** (нууц түлхүүр). `.env` өмнө нь track хийгдэж байсныг 2026-11-09-нд хассан.

7. **Commit хийхээс өмнө `npm run lint` (0 error), `npm test` хоёуланг нь ажиллуулна.** Шинэ материалын мөр нэмбэл тест нь miBenchmark `RULES`-д танигдаж байгаа эсэхийг шалгана.

---

## Одоогийн байдал (2026-11)

Ажиллаж байгаа: тооцоолуур, план зурагч (хана зурах, устгагч, undo, тавилга, бэлэн загвар),
3D, 14 инженерийн хэрэгсэл, AI чат, AI план үүсгэгч, бүртгэл, Pro, DXF экспорт, материалын жишиг (RASMI), og:image, Analytics.

### Хийгдээгүй / дараагийн ажлууд

- [x] `miBenchmark.jsx` холбосон (2026-11-08) — "Төсөв" табын доод хэсэгт RASMI жишиг.
      `RULES` нь төсвийн бүх мөрийг таньдаг (109, `npm test` шалгана). Шинэ материалын мөр нэмбэл `RULES`-д дүрэм нэмнэ
      (RASMI-ийн 5 материалд хамаарахгүй бол `mat: null`). Кирилл үгэнд `\b` ажилладаггүй тул `word()` ашиглана.
      Нээлттэй асуулт: "Дотор шавардлага" цементэн (бетон, 30кг/м²) гэж тооцогдож байгаа — гипсэн бол `mat: null`.
- [x] Таазны дулаалга (2026-11-09) — `ceilInsulation` систем (хөвөн 200/150/100мм, дулаалгагүй), талбай = `sumArea`.
      U нь `energyEstimate.js`-ийн `CEILING_INSULATION_U`-аас авна. Хуучин төсөлд байхгүй бол EnergyPanel-ийн гараар сонголт ажиллана.
      Шинэ `extWall`/`insulation`/`windows` сонголт нэмбэл `energyEstimate.js`-ийн хүснэгтэд λ/U нэмнэ, үгүй бол халаалтын тооцоо гарахгүй.
- [~] Аймгийн хэм хоног (2026-11-09): `HDD_ZONES` нь БНбД «Барилгын дулаан хамгаалалт» (2021) 3-р хүснэгтийн бүсчлэлээр хийгдсэн (I 7000 / II 6500 / III 6000 / IV 5000).
      Увс, Хөвсгөл, Төв эх сурвалжид тодорхой гараагүй тул ороогүй. Гадна загварын темп.-ийг (БНбД 23-01-09) хараахан оруулаагүй.
      Нээлттэй асуулт: УБ-ын анхдагч 7800 нь нормын I бүсийн 7000-аас зөрүүтэй.
- [ ] Gemini free tier рүү шилжих (Vercel env солих), Groq-г нөөцөд үлдээх
- [ ] FB кампанит ажил: постууд бэлэн, дулаан алдагдлын тоо бөглөх, демо видео бичих
- [ ] Гадна/дотор ханыг материалын тооцоонд ялгаж тусгах (одоо зөвхөн харагдац)
- [ ] Pro хугацаа (`expiresAt`) автоматжуулах
- [x] Code splitting (2026-11-09): эхний ачаалал 448KB → ~258KB (gzip). Firestore SDK (~170KB gzip) хамгийн том хэсэг хэвээр байна.
- [ ] `aiUsage`-г хаах: `docs/aiUsage-hamgaalalt.md`-ийг үз (Vercel → service account, дараа нь дүрэм)

## Код бичих хэв маяг

- UI текст, тайлбар бүгд монголоор
- Tailwind, inline classNames; тусдаа CSS файл үүсгэхгүй
- Шинэ боломжийг тусдаа файл болгоно (BuildEstimator аль хэдийн том)
- Мөнгөн дүн `₮`, хэмжээ метр/м²/м³, бодит цагаар тооцоолно
