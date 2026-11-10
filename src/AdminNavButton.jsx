import { useAuthUser } from "./AuthPanel.jsx";
import { isAdminUser } from "./admin.js";

/* Толгойн 🛠 Админ товч — зөвхөн админд харагдана.
   AdminPanel.jsx-ээс тусад нь байлгасан нь админ хуудсыг (ба BuildEstimator-ийг)
   эхний ачаалалд оруулахгүйн тулд. */
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
