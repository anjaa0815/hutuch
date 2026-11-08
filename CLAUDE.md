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
| `EnergyPanel.jsx` | "Төсөв" таб: жилийн халаалтын кВт·ц/₮, зуухны чадлын шалгалт, дулаалгын харьцуулалт (өртөг, хэмнэлт, нөхөгдөх хугацаа) |

Import-ын бүтэц: `App.jsx` → BuildEstimator, QuickPlanner, EngineeringTools, AdviceChat,
AIPlanGenerator (`AIPlanInline`), ProMembership, AuthPanel, firebase.js.
`BuildEstimator.jsx` → ProjectStore, BudgetExplain, HouseTemplates, AIPlanGenerator, miBenchmark,
ProMembership, dxfExport, FurnitureCatalog.

Бусад: `firestore.rules` (Firestore дүрэм), `functions/` (Firebase Functions, nodejs20),
`firebase.json` (hosting `dist`, SPA rewrite).
⚠️ `src/src/` (хуучин App.jsx, AdviceChat.jsx) ба `src/functions/` нь хуучин хуулбар — import
хийгддэггүй. Эдгээрийг засварлахгүй, андуурч хуулж тавихгүй (дүрэм 2-ыг үз).

## Pro гишүүнчлэл

- Төлбөр: дансаар шилжүүлнэ → админ **гараар** идэвхжүүлнэ
- Идэвхжүүлэх: Firestore Console → `proStatus` коллекц → Document ID = хэрэглэгчийн uid → талбар `isPro` (boolean) = `true`
- Хугацаа автоматаар дуусдаггүй (хожим `expiresAt` нэмж болно)
- Pro боломжууд: хязгааргүй AI, cloud төсөл, төсвийн AI тайлбар, DXF экспорт, AI план үүсгэгч
- Үнэ: 30,000₮/сар, 300,000₮/жил (`ProMembership.jsx`-д `PRO_PRICE`)

## Зах зээлийн үнэ шинэчлэх (код засахгүй)

- Firestore Console → `config` коллекц → `prices` баримт → талбар нэмэх:
  нэр = материалын key (жишээ `fl_screed1`), төрөл number, утга = ₮
- `updatedAt` талбар (timestamp эсвэл `"2026-11-08"` string) — "Норм & Үнэ" таб дээр огноо харагдана
- Зөвхөн өөрчилсөн үнээ бичнэ — бусад нь `BuildEstimator.jsx`-ийн анхдагч `price:` хэвээр
- Key-г олох: "Норм & Үнэ" таб дээр үнийн нүдэнд хулгана аваачихад `key: ...` гарна
- Хэрэглэгчийн гараар засварласан, эсвэл төслөөс ачаалсан үнийг дарахгүй. Хэрэглэгчид хуудас дахин ачаалахад шинэ үнэ авна
- Firestore дүрэм: `match /config/prices { allow read: if true; allow write: if false; }`

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

```powershell
npm run build                      # ← алдаа гарвал ЦААШ ЯВАХГҮЙ
firebase deploy --only hosting
git add src
git commit -m "<монголоор тайлбар>"
git push
```

Firestore дүрэм: `firebase deploy --only firestore` нь Windows дээр colon алдаа өгдөг →
Firebase Console → Firestore → Rules → шинэ match блокийг **нэмж** **Publish**.
⚠️ Репо дахь `firestore.rules` нь Console-оос хоцорсон (proStatus, aiUsage зөрнө) — бүхэлд нь хуулж
тавибал Pro болон AI лимит эвдэрнэ. Console-ын дүрмийг репо руу синк хийх хүртэл зөвхөн блок нэмнэ.

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

6. **`.env`, `functions/.env` git-д оруулахгүй** (нууц түлхүүр).

---

## Одоогийн байдал (2026-11)

Ажиллаж байгаа: тооцоолуур, план зурагч (хана зурах, устгагч, undo, тавилга, бэлэн загвар),
3D, 14 инженерийн хэрэгсэл, AI чат, AI план үүсгэгч, бүртгэл, Pro, DXF экспорт, материалын жишиг (RASMI), og:image, Analytics.

### Хийгдээгүй / дараагийн ажлууд

- [x] `miBenchmark.jsx` холбосон (2026-11-08) — "Төсөв" табын доод хэсэгт RASMI жишиг.
      `RULES` нь төсвийн бүх 84 мөрийг таньдаг. Шинэ материалын мөр нэмбэл `RULES`-д дүрэм нэмнэ
      (RASMI-ийн 5 материалд хамаарахгүй бол `mat: null`). Кирилл үгэнд `\b` ажилладаггүй тул `word()` ашиглана.
      Нээлттэй асуулт: "Дотор шавардлага" цементэн (бетон, 30кг/м²) гэж тооцогдож байгаа — гипсэн бол `mat: null`.
- [ ] Таазны дулаалга тооцоолуурын материалд байхгүй (EnergyPanel-д л сонгоно) — `ceiling`/`roof` системд нэмэх.
      Шинэ `extWall`/`insulation`/`windows` сонголт нэмбэл `energyEstimate.js`-ийн хүснэгтэд λ/U нэмнэ, үгүй бол халаалтын тооцоо гарахгүй.
- [ ] Аймгийн төвүүдийн загварын темп., градус·хоног (БНбД 23-01-09) — одоо зөвхөн УБ
- [ ] Gemini free tier рүү шилжих (Vercel env солих), Groq-г нөөцөд үлдээх
- [ ] FB кампанит ажил: постууд бэлэн, дулаан алдагдлын тоо бөглөх, демо видео бичих
- [ ] Гадна/дотор ханыг материалын тооцоонд ялгаж тусгах (одоо зөвхөн харагдац)
- [ ] Pro хугацаа (`expiresAt`) автоматжуулах
- [ ] Bundle хэмжээ 1.5MB — code splitting хийх

## Код бичих хэв маяг

- UI текст, тайлбар бүгд монголоор
- Tailwind, inline classNames; тусдаа CSS файл үүсгэхгүй
- Шинэ боломжийг тусдаа файл болгоно (BuildEstimator аль хэдийн том)
- Мөнгөн дүн `₮`, хэмжээ метр/м²/м³, бодит цагаар тооцоолно
