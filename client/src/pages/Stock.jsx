import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import Layout from "../components/Layout";

export default function Stock() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/requests", {
        productIds: cart.map((p) => p.id),
        notes,
      });
      clearCart();
      navigate("/my-requests");
    } catch (err) {
      setError(err.response?.data?.error || "Talep gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Stoğum</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Stoğunda henüz ürün yok. Vitrinden ürün ekleyebilirsin.
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cart.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.vin || "VIN yok"} {p.year && `• ${p.year}`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(p.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Çıkar
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Ek Notlar
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="İsteğinizle ilgili detayları buraya yazabilirsiniz..."
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {submitting
                ? "Gönderiliyor..."
                : `Talebi Onayla ve Gönder (${cart.length} ürün)`}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
