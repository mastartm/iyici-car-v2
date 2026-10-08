import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const statusLabels = {
  pending: { label: "Beklemede", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Onaylandı", color: "bg-green-100 text-green-700" },
  rejected: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
  completed: { label: "Tamamlandı", color: "bg-blue-100 text-blue-700" },
};

const statusInfo = {
  approved: "Talebin onaylandı! En kısa sürede seninle iletişime geçilecek.",
  rejected:
    "Talebin reddedildi. Daha fazla bilgi için yöneticiyle iletişime geç.",
  completed: "Talebin tamamlandı. İyi günler dileriz!",
};

const tabs = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Beklemede" },
  { key: "approved", label: "Onaylandı" },
  { key: "rejected", label: "Reddedildi" },
  { key: "completed", label: "Tamamlandı" },
];

const REFRESH_MS = 20000;

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadRequests();
    // v1'deki Realtime yerine: admin durumu değiştirince birkaç saniyede yansır
    const timer = setInterval(loadRequests, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  async function loadRequests() {
    try {
      const res = await api.get("/requests/mine");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  const counts = Object.fromEntries(
    tabs.map((t) => [
      t.key,
      t.key === "all"
        ? requests.length
        : requests.filter((r) => r.status === t.key).length,
    ]),
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Taleplerim</h1>
          <button
            onClick={loadRequests}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Yenile
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                activeTab === t.key
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {requests.length === 0
              ? "Henüz talebin yok."
              : "Bu durumda talep yok."}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => {
              const status = statusLabels[r.status] || statusLabels.pending;
              return (
                <div key={r.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        Talep #{r.id}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {statusInfo[r.status] && (
                    <p className={`text-xs rounded p-2 mb-3 ${status.color}`}>
                      {statusInfo[r.status]}
                    </p>
                  )}

                  <div className="space-y-2 mb-3">
                    {r.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded bg-gray-200 overflow-hidden shrink-0">
                          {item.product.photos?.[0] && (
                            <img
                              src={item.product.photos[0].url}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          )}
                        </div>
                        <p className="text-sm">
                          {item.product.name}{" "}
                          {item.product.year && `(${item.product.year})`}
                        </p>
                      </div>
                    ))}
                  </div>

                  {r.notes && (
                    <p className="text-xs text-gray-500 italic border-t pt-2 mt-2">
                      {r.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
