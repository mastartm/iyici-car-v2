import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ vehicle: 0, engine: 0, part: 0 });
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    api
      .get("/products/stats")
      .then((res) => setStats(res.data))
      .catch(console.error);
  }, []);

  const cards = [
    {
      key: "vehicle",
      label: "Araçlar",
      value: stats.vehicle,
      color: "bg-blue-50 text-blue-700",
    },
    {
      key: "engine",
      label: "Motorlar",
      value: stats.engine,
      color: "bg-amber-50 text-amber-700",
    },
    {
      key: "part",
      label: "Parçalar",
      value: stats.part,
      color: "bg-green-50 text-green-700",
    },
  ];

  function goToCategory(key) {
    navigate(`/inventory?category=${key}`);
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Genel Bakış</h1>

        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {isAdmin ? "Yönetim Paneli" : "Kullanıcı Paneli"}
          </p>
          <h2 className="text-3xl font-bold">Hoş geldin, {user?.email}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.key}
              onClick={() => goToCategory(c.key)}
              className={`rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-transform ${c.color}`}
            >
              <p className="text-4xl font-bold">{c.value}</p>
              <p className="text-sm font-semibold uppercase tracking-wide mt-1">
                {c.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
