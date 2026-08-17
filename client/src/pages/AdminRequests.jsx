import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const statusConfig = {
  pending: { label: "Beklemede", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Onaylandı", color: "bg-green-100 text-green-700" },
  rejected: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
  completed: { label: "Tamamlandı", color: "bg-blue-100 text-blue-700" },
};

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const res = await api.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleHidden(r) {
    try {
      await api.patch(`/requests/${r.id}/hidden`, { hidden: !r.hidden });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleProductVisible(product) {
    try {
      await api.put(`/products/${product.id}`, { visible: !product.visible });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteRequest(id) {
    if (!confirm("Bu talebi kalıcı olarak silmek istediğine emin misin?"))
      return;
    try {
      await api.delete(`/requests/${id}`);
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Talepler</h1>

        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: "all", label: "Tümü" },
            { key: "pending", label: "Beklemede" },
            { key: "approved", label: "Onaylandı" },
            { key: "rejected", label: "Reddedildi" },
            { key: "completed", label: "Tamamlandı" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Talep bulunamadı.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => {
              const status = statusConfig[r.status] || statusConfig.pending;
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-lg shadow p-5 ${r.hidden ? "opacity-60" : ""}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                      {r.hidden && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          Müşteriden Gizli
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">{r.user?.email}</p>

                  <div className="space-y-1 mb-3">
                    {r.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>
                          {item.product.name}{" "}
                          {item.product.year && `(${item.product.year})`}
                          {!item.product.visible && (
                            <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              İlandan Gizli
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => toggleProductVisible(item.product)}
                          className="text-xs text-gray-500 hover:text-gray-800 underline"
                        >
                          {item.product.visible
                            ? "İlandan Gizle"
                            : "İlanda Göster"}
                        </button>
                      </div>
                    ))}
                  </div>

                  {r.notes && (
                    <p className="text-xs text-gray-500 italic border-t pt-2 mb-3">
                      {r.notes}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(r.id, "approved")}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200"
                    >
                      Reddet
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "completed")}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200"
                    >
                      Tamamlandı
                    </button>
                    <button
                      onClick={() => toggleHidden(r)}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      {r.hidden ? "Göster" : "Gizle"}
                    </button>
                    <button
                      onClick={() => deleteRequest(r.id)}
                      className="text-xs bg-gray-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
