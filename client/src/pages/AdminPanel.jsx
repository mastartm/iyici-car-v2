import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");

  const emptyVehicleForm = {
    brand: "",
    model: "",
    year: "",
    vin: "",
    km: "",
    transmission: "",
    color: "",
    seats: "",
    steering: "",
    segment: "",
    price: "",
  };
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);

  const [engineForm, setEngineForm] = useState({});
  const [partForm, setPartForm] = useState({});

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  function updateVehicleForm(field, value) {
    setVehicleForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/vehicles", {
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        year: Number(vehicleForm.year),
        vin: vehicleForm.vin || undefined,
        km: vehicleForm.km ? Number(vehicleForm.km) : undefined,
        transmission: vehicleForm.transmission || undefined,
        color: vehicleForm.color || undefined,
        seats: vehicleForm.seats ? Number(vehicleForm.seats) : undefined,
        steering: vehicleForm.steering || undefined,
        segment: vehicleForm.segment || undefined,
        price: vehicleForm.price ? Number(vehicleForm.price) : undefined,
      });
      setVehicleForm(emptyVehicleForm);
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.error || "Araç eklenemedi");
    }
  }

  async function handleDeleteVehicle(id) {
    if (!confirm("Bu aracı silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleVisible(v) {
    try {
      await api.put(`/vehicles/${v.id}`, { visible: !v.visible });
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  function updateEngineForm(vehicleId, field, value) {
    setEngineForm((prev) => ({
      ...prev,
      [vehicleId]: { ...prev[vehicleId], [field]: value },
    }));
  }

  function updatePartForm(vehicleId, field, value) {
    setPartForm((prev) => ({
      ...prev,
      [vehicleId]: { ...prev[vehicleId], [field]: value },
    }));
  }

  async function handleAddEngine(vehicleId) {
    const form = engineForm[vehicleId];
    if (!form?.name || !form?.price) return;

    try {
      await api.post("/engines", {
        name: form.name,
        code: form.code || undefined,
        volume: form.volume ? Number(form.volume) : undefined,
        vehicleId,
        price: Number(form.price),
        currency: form.currency || "TRY",
      });
      setEngineForm((prev) => ({ ...prev, [vehicleId]: {} }));
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteEngine(id) {
    if (!confirm("Bu motoru silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/engines/${id}`);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddPart(vehicleId) {
    const form = partForm[vehicleId];
    if (!form?.name || !form?.category || !form?.price) return;

    try {
      await api.post("/parts", {
        name: form.name,
        category: form.category,
        vehicleId,
        price: Number(form.price),
        currency: form.currency || "TRY",
      });
      setPartForm((prev) => ({ ...prev, [vehicleId]: {} }));
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeletePart(id) {
    if (!confirm("Bu parçayı silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/parts/${id}`);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <Link
              to="/admin/requests"
              className="text-sm text-blue-600 hover:underline"
            >
              Talepler →
            </Link>
            <Link
              to="/admin/users"
              className="text-sm text-blue-600 hover:underline"
            >
              Müşteri Yönetimi →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* ARAÇ EKLEME FORMU */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Yeni Araç Ekle</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleAddVehicle} className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Marka *"
              value={vehicleForm.brand}
              onChange={(e) => updateVehicleForm("brand", e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Model *"
              value={vehicleForm.model}
              onChange={(e) => updateVehicleForm("model", e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Yıl *"
              value={vehicleForm.year}
              onChange={(e) => updateVehicleForm("year", e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Şasi No (VIN)"
              value={vehicleForm.vin}
              onChange={(e) => updateVehicleForm("vin", e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Kilometre"
              value={vehicleForm.km}
              onChange={(e) => updateVehicleForm("km", e.target.value)}
              className="border p-2 rounded"
            />
            <select
              value={vehicleForm.transmission}
              onChange={(e) =>
                updateVehicleForm("transmission", e.target.value)
              }
              className="border p-2 rounded"
            >
              <option value="">Vites seç</option>
              <option value="Otomatik">Otomatik</option>
              <option value="Manuel">Manuel</option>
            </select>
            <input
              type="text"
              placeholder="Renk"
              value={vehicleForm.color}
              onChange={(e) => updateVehicleForm("color", e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Koltuk sayısı"
              value={vehicleForm.seats}
              onChange={(e) => updateVehicleForm("seats", e.target.value)}
              className="border p-2 rounded"
            />
            <select
              value={vehicleForm.steering}
              onChange={(e) => updateVehicleForm("steering", e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Direksiyon</option>
              <option value="Sol (LHD)">Sol (LHD)</option>
              <option value="Sağ (RHD)">Sağ (RHD)</option>
            </select>
            <input
              type="text"
              placeholder="Segment"
              value={vehicleForm.segment}
              onChange={(e) => updateVehicleForm("segment", e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Fiyat"
              value={vehicleForm.price}
              onChange={(e) => updateVehicleForm("price", e.target.value)}
              className="border p-2 rounded"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 col-span-3"
            >
              Araç Ekle
            </button>
          </form>
        </div>

        {/* ARAÇ LİSTESİ */}
        <div className="space-y-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-medium text-lg">
                    {v.brand} {v.model}
                  </span>
                  <span className="text-gray-500 ml-2">({v.year})</span>
                  {!v.visible && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      Gizli
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleVisible(v)}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    {v.visible ? "Gizle" : "Göster"}
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Aracı Sil
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4 flex flex-wrap gap-x-4 gap-y-1">
                {v.vin && <span>VIN: {v.vin}</span>}
                {v.km != null && <span>{v.km.toLocaleString()} km</span>}
                {v.transmission && <span>{v.transmission}</span>}
                {v.color && <span>{v.color}</span>}
                {v.seats && <span>{v.seats} koltuk</span>}
                {v.steering && <span>{v.steering}</span>}
                {v.segment && <span>{v.segment}</span>}
                {v.price != null && (
                  <span className="font-semibold text-gray-700">
                    {v.price} {v.currency}
                  </span>
                )}
              </div>

              {/* MOTORLAR */}
              <div className="mb-4 pl-4 border-l-2 border-blue-200">
                <h3 className="font-semibold text-sm text-gray-600 mb-2">
                  Motorlar
                </h3>

                {v.engines.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center text-sm py-1"
                  >
                    <span>
                      {e.name}
                      {e.code ? ` (${e.code})` : ""}
                      {e.volume ? ` — ${e.volume}cc` : ""} — {e.price}{" "}
                      {e.currency}
                    </span>
                    <button
                      onClick={() => handleDeleteEngine(e.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Sil
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Motor adı"
                    value={engineForm[v.id]?.name || ""}
                    onChange={(ev) =>
                      updateEngineForm(v.id, "name", ev.target.value)
                    }
                    className="border p-1 rounded text-sm flex-1 min-w-[100px]"
                  />
                  <input
                    type="text"
                    placeholder="Motor kodu"
                    value={engineForm[v.id]?.code || ""}
                    onChange={(ev) =>
                      updateEngineForm(v.id, "code", ev.target.value)
                    }
                    className="border p-1 rounded text-sm w-28"
                  />
                  <input
                    type="number"
                    placeholder="Hacim (cc)"
                    value={engineForm[v.id]?.volume || ""}
                    onChange={(ev) =>
                      updateEngineForm(v.id, "volume", ev.target.value)
                    }
                    className="border p-1 rounded text-sm w-24"
                  />
                  <input
                    type="number"
                    placeholder="Fiyat"
                    value={engineForm[v.id]?.price || ""}
                    onChange={(ev) =>
                      updateEngineForm(v.id, "price", ev.target.value)
                    }
                    className="border p-1 rounded text-sm w-24"
                  />
                  <button
                    onClick={() => handleAddEngine(v.id)}
                    className="bg-blue-100 text-blue-700 px-3 rounded text-sm hover:bg-blue-200"
                  >
                    + Motor
                  </button>
                </div>
              </div>

              {/* PARÇALAR */}
              <div className="pl-4 border-l-2 border-green-200">
                <h3 className="font-semibold text-sm text-gray-600 mb-2">
                  Parçalar
                </h3>

                {v.parts.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center text-sm py-1"
                  >
                    <span>
                      {p.name} ({p.category}) — {p.price} {p.currency}
                    </span>
                    <button
                      onClick={() => handleDeletePart(p.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Sil
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Parça adı"
                    value={partForm[v.id]?.name || ""}
                    onChange={(ev) =>
                      updatePartForm(v.id, "name", ev.target.value)
                    }
                    className="border p-1 rounded text-sm flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Kategori"
                    value={partForm[v.id]?.category || ""}
                    onChange={(ev) =>
                      updatePartForm(v.id, "category", ev.target.value)
                    }
                    className="border p-1 rounded text-sm flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Fiyat"
                    value={partForm[v.id]?.price || ""}
                    onChange={(ev) =>
                      updatePartForm(v.id, "price", ev.target.value)
                    }
                    className="border p-1 rounded text-sm w-24"
                  />
                  <button
                    onClick={() => handleAddPart(v.id)}
                    className="bg-green-100 text-green-700 px-3 rounded text-sm hover:bg-green-200"
                  >
                    + Parça
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
