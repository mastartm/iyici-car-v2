import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const adminItems = [
    { to: "/dashboard", label: "Genel Bakış" },
    { to: "/inventory", label: "Envanter" },
    { to: "/stock", label: "Stoğum" },
    { to: "/admin/requests", label: "Talepler" },
    { to: "/my-requests", label: "Taleplerim" },
    { to: "/admin/users", label: "Kullanıcılar" },
  ];

  const userItems = [
    { to: "/dashboard", label: "Genel Bakış" },
    { to: "/inventory", label: "Envanter" },
    { to: "/stock", label: "Stoğum" },
    { to: "/my-requests", label: "Taleplerim" },
  ];

  const items = isAdmin ? adminItems : userItems;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b p-4 flex justify-between items-center z-40">
        <span className="font-bold">İyici Car</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-2xl">
          ☰
        </button>
      </div>
      <aside
        className={`w-64 bg-white border-r shrink-0 p-6 lg:flex lg:relative ${mobileOpen ? "fixed inset-y-0 left-0 z-50 flex flex-col" : "hidden lg:flex-col"}`}
      >
        <p className="text-xl font-bold mb-1">İyici Car</p>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-8">
          {isAdmin ? "Yönetim Paneli" : "Kullanıcı Paneli"}
        </p>

        <nav className="flex flex-col gap-1 flex-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold ${
                location.pathname === item.to
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-500 truncate mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
