import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const statusLabels = {
  pending: { label: "Beklemede", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Onaylandı", color: "bg-green-100 text-green-700" },
  rejected: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
  completed: { label: "Tamamlandı", color: "bg-blue-100 text-blue-700" },
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const res = await api.get("/requests/mine");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Vitrine dön
        </Link>

        <h1 className="text-2xl font-bold mt-2 mb-6">Taleplerim</h1>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Henüz talebin yok.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const status = statusLabels[r.status] || statusLabels.pending;
              return (
                <div key={r.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {r.items.map((item) => (
                      <p key={item.id} className="text-sm">
                        {item.vehicle.brand} {item.vehicle.model} (
                        {item.vehicle.year})
                      </p>
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
    </div>
  );
}
