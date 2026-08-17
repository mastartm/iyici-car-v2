import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Layout from "../components/Layout";

const categories = [
  { key: "vehicle", label: "Araçlar" },
  { key: "engine", label: "Motorlar" },
  { key: "part", label: "Parçalar" },
];

const PER_PAGE = 12;

const emptyForm = {
  name: "",
  vin: "",
  year: "",
  km: "",
  color: "",
  segment: "",
  engineCode: "",
  engineVolume: "",
  transmission: "",
  seats: "",
  steering: "",
  price: "",
  currency: "TRY",
};

export default function Inventory() {
  const { user } = useAuth();
  const { cart, addToCart, removeFromCart, isInCart } = useCart();
  const isAdmin = user?.role === "admin";

  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "vehicle",
  );
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState("vehicle");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [activeCategory, search, yearFilter, transmissionFilter]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, yearFilter, transmissionFilter]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function loadProducts() {
    try {
      const params = new URLSearchParams({ category: activeCategory });
      if (isAdmin) params.set("includeHidden", "1");
      if (search) params.set("search", search);
      if (yearFilter) params.set("year", yearFilter);
      if (transmissionFilter) params.set("transmission", transmissionFilter);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setError("");
    if (!form.name) {
      setError("İsim zorunlu");
      return;
    }
    const payload = {
      category: formCategory,
      name: form.name,
      vin: form.vin || undefined,
      year: form.year ? Number(form.year) : undefined,
      km: form.km ? Number(form.km) : undefined,
      color: form.color || undefined,
      segment: form.segment || undefined,
      engineCode: form.engineCode || undefined,
      engineVolume: form.engineVolume || undefined,
      transmission: form.transmission || undefined,
      seats: form.seats ? Number(form.seats) : undefined,
      steering: form.steering || undefined,
      price: form.price ? Number(form.price) : undefined,
      currency: form.currency || "TRY",
    };

    try {
      if (editId) {
        await api.put(`/products/${editId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setForm(emptyForm);
      setIsFormOpen(false);
      setEditId(null);
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || "Kaydedilemedi");
    }
  }
  function openEditForm(p) {
    setFormCategory(p.category);
    setForm({
      name: p.name || "",
      vin: p.vin || "",
      year: p.year || "",
      km: p.km || "",
      color: p.color || "",
      segment: p.segment || "",
      engineCode: p.engineCode || "",
      engineVolume: p.engineVolume || "",
      transmission: p.transmission || "",
      seats: p.seats || "",
      steering: p.steering || "",
      price: p.price || "",
      currency: p.currency || "TRY",
    });
    setEditId(p.id);
    setError("");
    setIsFormOpen(true);
  }

  async function toggleVisible(p) {
    try {
      await api.put(`/products/${p.id}`, { visible: !p.visible });
      loadProducts();
      if (selectedProduct?.id === p.id) {
        setSelectedProduct({ ...p, visible: !p.visible });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/products/${id}`);
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }

  const years = [...new Set(products.map((p) => p.year).filter(Boolean))].sort(
    (a, b) => b - a,
  );
  const totalPages = Math.ceil(products.length / PER_PAGE);
  const paginated = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Envanter</h1>
          {isAdmin && (
            <button
              onClick={() => {
                setFormCategory(activeCategory);
                setForm(emptyForm);
                setEditId(null);
                setError("");
                setIsFormOpen(true);
              }}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              + Yeni Kayıt Ekle
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory === c.key
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="İsim veya VIN ile ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Tüm Yıllar</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {activeCategory !== "part" && (
            <select
              value={transmissionFilter}
              onChange={(e) => setTransmissionFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tüm Vitesler</option>
              <option value="Manuel">Manuel</option>
              <option value="Otomatik">Otomatik</option>
              <option value="Yarı-Otomatik">Yarı-Otomatik</option>
            </select>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {products.length} kayıt
          </span>
        </div>

        {paginated.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Eşleşen ürün bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paginated.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden relative"
              >
                {isAdmin && !p.visible && (
                  <span className="absolute top-2 left-2 z-10 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-full">
                    Gizli
                  </span>
                )}
                <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                  {p.photos?.[0] ? (
                    <img
                      src={p.photos[0].url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    "Fotoğraf yok"
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-gray-500">
                    {p.year} {p.km != null && `• ${p.km.toLocaleString()} km`}
                  </p>
                  {p.price != null && (
                    <p className="mt-2 font-semibold text-gray-700">
                      {p.price} {p.currency}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-lg bg-white shadow disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-sm text-gray-500">
              Sayfa {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-lg bg-white shadow disabled:opacity-30"
            >
              →
            </button>
          </div>
        )}
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-400">
              {selectedProduct.photos?.[0] ? (
                <img
                  src={selectedProduct.photos[0].url}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                "Fotoğraf yok"
              )}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                {isAdmin && (
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => openEditForm(selectedProduct)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => toggleVisible(selectedProduct)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {selectedProduct.visible ? "Gizle" : "Göster"}
                    </button>
                    <button
                      onClick={() => deleteProduct(selectedProduct.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>
              {selectedProduct.vin && (
                <p className="text-xs text-blue-600 font-mono mb-4">
                  {selectedProduct.vin}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                {selectedProduct.year != null && (
                  <Detail label="Yıl" value={selectedProduct.year} />
                )}
                {selectedProduct.km != null && (
                  <Detail
                    label="Kilometre"
                    value={selectedProduct.km?.toLocaleString()}
                  />
                )}
                {selectedProduct.transmission && (
                  <Detail label="Vites" value={selectedProduct.transmission} />
                )}
                {selectedProduct.color && (
                  <Detail label="Renk" value={selectedProduct.color} />
                )}
                {selectedProduct.seats != null && (
                  <Detail label="Koltuk" value={selectedProduct.seats} />
                )}
                {selectedProduct.steering && (
                  <Detail label="Direksiyon" value={selectedProduct.steering} />
                )}
                {selectedProduct.segment && (
                  <Detail label="Segment" value={selectedProduct.segment} />
                )}
                {selectedProduct.engineCode && (
                  <Detail
                    label="Motor Kodu"
                    value={selectedProduct.engineCode}
                  />
                )}
                {selectedProduct.engineVolume && (
                  <Detail
                    label="Motor Hacmi"
                    value={`${selectedProduct.engineVolume}cc`}
                  />
                )}
                {selectedProduct.price != null && (
                  <Detail
                    label="Fiyat"
                    value={`${selectedProduct.price} ${selectedProduct.currency}`}
                  />
                )}
              </div>

              {isInCart(selectedProduct.id) ? (
                <button
                  onClick={() => removeFromCart(selectedProduct.id)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Stoğumdan Çıkar
                </button>
              ) : (
                <button
                  onClick={() => addToCart(selectedProduct)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
                >
                  Stoğuma Ekle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editId ? "Kaydı Düzenle" : "Yeni Kayıt Ekle"}
                </h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="flex gap-4 border-b">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setFormCategory(c.key)}
                    className={`pb-2 text-sm font-semibold ${formCategory === c.key ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}
                  >
                    {c.label.slice(0, -3)} Formu
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder={
                    formCategory === "vehicle"
                      ? "Marka / Model *"
                      : formCategory === "engine"
                        ? "Motor Adı *"
                        : "Parça Adı *"
                  }
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="border p-2 rounded col-span-2"
                />
                <input
                  placeholder={
                    formCategory === "part"
                      ? "Parça Kodu / VIN"
                      : "Şasi No (VIN)"
                  }
                  value={form.vin}
                  onChange={(e) => set("vin", e.target.value)}
                  className="border p-2 rounded"
                />
                {formCategory !== "part" && (
                  <input
                    type="number"
                    placeholder="Yıl"
                    value={form.year}
                    onChange={(e) => set("year", e.target.value)}
                    className="border p-2 rounded"
                  />
                )}
                {formCategory === "vehicle" && (
                  <>
                    <input
                      type="number"
                      placeholder="Kilometre"
                      value={form.km}
                      onChange={(e) => set("km", e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      placeholder="Segment"
                      value={form.segment}
                      onChange={(e) => set("segment", e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      placeholder="Koltuk sayısı"
                      type="number"
                      value={form.seats}
                      onChange={(e) => set("seats", e.target.value)}
                      className="border p-2 rounded"
                    />
                    <select
                      value={form.steering}
                      onChange={(e) => set("steering", e.target.value)}
                      className="border p-2 rounded"
                    >
                      <option value="">Direksiyon</option>
                      <option value="Sol (LHD)">Sol (LHD)</option>
                      <option value="Sağ (RHD)">Sağ (RHD)</option>
                    </select>
                  </>
                )}
                {(formCategory === "vehicle" || formCategory === "engine") && (
                  <>
                    <input
                      placeholder="Motor Kodu"
                      value={form.engineCode}
                      onChange={(e) => set("engineCode", e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      placeholder="Motor Hacmi (cc)"
                      value={form.engineVolume}
                      onChange={(e) => set("engineVolume", e.target.value)}
                      className="border p-2 rounded"
                    />
                    <select
                      value={form.transmission}
                      onChange={(e) => set("transmission", e.target.value)}
                      className="border p-2 rounded"
                    >
                      <option value="">Vites</option>
                      <option value="Manuel">Manuel</option>
                      <option value="Otomatik">Otomatik</option>
                      <option value="Yarı-Otomatik">Yarı-Otomatik</option>
                    </select>
                  </>
                )}
                {formCategory !== "part" && (
                  <input
                    placeholder="Renk"
                    value={form.color}
                    onChange={(e) => set("color", e.target.value)}
                    className="border p-2 rounded"
                  />
                )}
                <input
                  type="number"
                  placeholder="Fiyat"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="border p-2 rounded"
                />
                <select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="TRY">Türk Lirası (TRY)</option>
                  <option value="USD">Amerikan Doları (USD)</option>
                  <option value="GBP">İngiliz Sterlini (GBP)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-200"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                {editId ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-gray-50 p-2 rounded">
      <p className="text-[10px] text-gray-400 uppercase font-semibold">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
