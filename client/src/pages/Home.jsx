import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { user, logout } = useAuth();
  const { cart, addToCart, removeFromCart, isInCart } = useCart();

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data.filter((v) => v.visible));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">İyici Car</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/my-requests" className="text-blue-600 text-sm">
                Taleplerim
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" className="text-blue-600 text-sm">
                  Admin Panel
                </Link>
              )}
              <button onClick={logout} className="text-red-600 text-sm">
                Çıkış Yap
              </button>
            </>
          ) : (
            <Link to="/login" className="text-blue-600 text-sm">
              Giriş Yap
            </Link>
          )}
        </div>
      </div>

      {/* ARAÇ KARTLARI */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div
            key={v.id}
            onClick={() => setSelectedVehicle(v)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
          >
            <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400">
              {v.photos?.[0] ? (
                <img
                  src={v.photos[0].url}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                "Fotoğraf yok"
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold">
                {v.brand} {v.model}
              </h3>
              <p className="text-sm text-gray-500">
                {v.year} {v.km != null && `• ${v.km.toLocaleString()} km`}
              </p>
              {v.price != null && (
                <p className="mt-2 font-semibold text-gray-700">
                  {v.price} {v.currency}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ARAÇ DETAY MODALI */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedVehicle(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-400">
              {selectedVehicle.photos?.[0] ? (
                <img
                  src={selectedVehicle.photos[0].url}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                "Fotoğraf yok"
              )}
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-1">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h2>
              {selectedVehicle.vin && (
                <p className="text-xs text-blue-600 font-mono mb-4">
                  {selectedVehicle.vin}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Detail label="Yıl" value={selectedVehicle.year} />
                <Detail
                  label="Kilometre"
                  value={selectedVehicle.km?.toLocaleString()}
                />
                <Detail label="Vites" value={selectedVehicle.transmission} />
                <Detail label="Renk" value={selectedVehicle.color} />
                <Detail label="Koltuk" value={selectedVehicle.seats} />
                <Detail label="Direksiyon" value={selectedVehicle.steering} />
                <Detail label="Segment" value={selectedVehicle.segment} />
                <Detail
                  label="Fiyat"
                  value={
                    selectedVehicle.price != null
                      ? `${selectedVehicle.price} ${selectedVehicle.currency}`
                      : null
                  }
                />
              </div>

              {selectedVehicle.engines?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-600 mb-2">
                    Motorlar
                  </h3>
                  {selectedVehicle.engines.map((e) => (
                    <p key={e.id} className="text-sm text-gray-500">
                      {e.name}
                      {e.code ? ` (${e.code})` : ""}
                      {e.volume ? ` — ${e.volume}cc` : ""} — {e.price}{" "}
                      {e.currency}
                    </p>
                  ))}
                </div>
              )}

              {selectedVehicle.parts?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-gray-600 mb-2">
                    Parçalar
                  </h3>
                  {selectedVehicle.parts.map((p) => (
                    <p key={p.id} className="text-sm text-gray-500">
                      {p.name} ({p.category}) — {p.price} {p.currency}
                    </p>
                  ))}
                </div>
              )}

              {user ? (
                isInCart(selectedVehicle.id) ? (
                  <button
                    onClick={() => removeFromCart(selectedVehicle.id)}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                  >
                    Stoğumdan Çıkar
                  </button>
                ) : (
                  <button
                    onClick={() => addToCart(selectedVehicle)}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Stoğuma Ekle
                  </button>
                )
              ) : (
                <Link
                  to="/login"
                  className="block text-center w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
                >
                  Talep oluşturmak için giriş yap
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEPET ÇUBUĞU */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
          <span className="text-sm font-semibold">
            {cart.length} araç seçildi
          </span>
          <Link
            to="/stock"
            className="bg-green-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-700"
          >
            Sepete Git
          </Link>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-gray-50 p-2 rounded">
      <p className="text-[10px] text-gray-400 uppercase font-semibold">
        {label}
      </p>
      <p className="text-sm font-medium">{value || "---"}</p>
    </div>
  );
}
