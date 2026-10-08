import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Layout from "../components/Layout";
import Gallery from "../components/Gallery";
import { imageUrl, CARD, THUMB } from "../lib/image";
import { formatPrice } from "../lib/format";
import { WHATSAPP_URL } from "../lib/contact";

const categories = [
  { key: "vehicle", label: "Araçlar" },
  { key: "engine", label: "Motorlar" },
  { key: "part", label: "Parçalar" },
];

const PER_PAGE_OPTIONS = [12, 24, 48, 96];

// Sunucudaki sınırlarla aynı olmalı (server/routes/products.js)
const MAX_FILE_MB = 10;
const MAX_PER_UPLOAD = 10;
const MAX_PHOTOS = 15;

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
  const { addToCart, removeFromCart, isInCart } = useCart();
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
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [years, setYears] = useState([]);
  const [stats, setStats] = useState({ vehicle: 0, engine: 0, part: 0 });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState("vehicle");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [editPhotos, setEditPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  // Seçilen dosyaların önizlemesi; liste değişince eskiler serbest bırakılır
  const previews = useMemo(
    () => newFiles.map((f) => URL.createObjectURL(f)),
    [newFiles],
  );
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

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

      // Yıl listesi, yıl filtresi seçilince daralmasın diye sadece filtresizken güncellenir
      if (!yearFilter) {
        setYears(
          [...new Set(res.data.map((p) => p.year).filter(Boolean))].sort(
            (a, b) => b - a,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStats() {
    try {
      const res = await api.get("/products/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setError("");
    if (!form.name) {
      setError("İsim zorunlu");
      return;
    }
    // Düzenlemede boş bırakılan alan null gider (değer silinir); yeni kayıtta hiç gönderilmez
    const empty = editId ? null : undefined;
    const payload = {
      category: formCategory,
      name: form.name,
      vin: form.vin || empty,
      year: form.year ? Number(form.year) : empty,
      km: form.km ? Number(form.km) : empty,
      color: form.color || empty,
      segment: form.segment || empty,
      engineCode: form.engineCode || empty,
      engineVolume: form.engineVolume || empty,
      transmission: form.transmission || empty,
      seats: form.seats ? Number(form.seats) : empty,
      steering: form.steering || empty,
      price: form.price ? Number(form.price) : empty,
      currency: form.currency || "TRY",
    };

    setSaving(true);
    let productId = editId;
    try {
      if (editId) {
        await api.put(`/products/${editId}`, payload);
      } else {
        const res = await api.post("/products", payload);
        productId = res.data.id;
      }
    } catch (err) {
      setError(err.response?.data?.error || "Kaydedilemedi");
      setSaving(false);
      return;
    }

    if (newFiles.length > 0) {
      try {
        const data = new FormData();
        newFiles.forEach((f) => data.append("photos", f));
        await api.post(`/products/${productId}/photos`, data);
      } catch (err) {
        // Kayıt tamam, fotoğraf yüklenemedi: formu düzenleme moduna alıp tekrar denetir
        setEditId(productId);
        setEditPhotos([]);
        setError(
          `Kayıt kaydedildi ama fotoğraflar yüklenemedi: ${
            err.response?.data?.error || "bağlantı hatası"
          }. Fotoğrafları kontrol edip tekrar Güncelle'ye bas.`,
        );
        setSaving(false);
        loadProducts();
        loadStats();
        return;
      }
    }

    setForm(emptyForm);
    setNewFiles([]);
    setEditPhotos([]);
    setIsFormOpen(false);
    setEditId(null);
    setSelectedProduct(null);
    setSaving(false);
    loadProducts();
    loadStats();
  }

  function addFiles(fileList) {
    const picked = Array.from(fileList);
    const bad = picked.find(
      (f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    if (bad) {
      setError(`"${bad.name}" desteklenmiyor. Sadece JPG, PNG veya WebP.`);
      return;
    }
    const tooBig = picked.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" ${MAX_FILE_MB} MB'tan büyük.`);
      return;
    }
    const total = newFiles.length + picked.length;
    if (total > MAX_PER_UPLOAD) {
      setError(`Tek seferde en fazla ${MAX_PER_UPLOAD} fotoğraf seçebilirsin.`);
      return;
    }
    if (editPhotos.length + total > MAX_PHOTOS) {
      setError(`Bir üründe en fazla ${MAX_PHOTOS} fotoğraf olabilir.`);
      return;
    }
    setError("");
    setNewFiles((prev) => [...prev, ...picked]);
  }

  async function removeExistingPhoto(photo) {
    if (!confirm("Bu fotoğrafı silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/products/${editId}/photos/${photo.id}`);
      setEditPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSelectedProduct((sp) =>
        sp && sp.id === editId
          ? { ...sp, photos: sp.photos.filter((p) => p.id !== photo.id) }
          : sp,
      );
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || "Fotoğraf silinemedi");
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
    setNewFiles([]);
    setEditPhotos(p.photos || []);
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
      alert(err.response?.data?.error || "Güncellenemedi");
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
    try {
      await api.delete(`/products/${id}`);
      setSelectedProduct(null);
      loadProducts();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.error || "Silinemedi");
    }
  }

  const totalPages = Math.ceil(products.length / perPage);
  const paginated = products.slice((page - 1) * perPage, page * perPage);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Envanter</h1>
          <div className="flex gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600"
            >
              İletişim
            </a>
            {isAdmin && (
              <button
                onClick={() => {
                  setFormCategory(activeCategory);
                  setForm(emptyForm);
                  setNewFiles([]);
                  setEditPhotos([]);
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
        </div>

        <div className="flex gap-2 mb-4">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setActiveCategory(c.key);
                setYearFilter("");
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory === c.key
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.label} ({stats[c.key]})
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
                <div className="absolute top-2 left-2 z-10 flex gap-1">
                  {isAdmin && !p.visible && (
                    <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-full">
                      Gizli
                    </span>
                  )}
                  {isInCart(p.id) && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Stoğumda
                    </span>
                  )}
                </div>
                <div className="relative h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                  {p.photos?.[0] ? (
                    <img
                      src={imageUrl(p.photos[0].url, CARD)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    "Fotoğraf yok"
                  )}
                  {p.photos?.length > 1 && (
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                      {p.photos.length} foto
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-gray-500">
                    {p.year} {p.km != null && `• ${p.km.toLocaleString()} km`}
                  </p>
                  {p.price != null && (
                    <p className="mt-2 font-semibold text-gray-700">
                      {formatPrice(p.price, p.currency)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {products.length > PER_PAGE_OPTIONS[0] && (
          <div className="flex justify-center items-center gap-2 mt-8 text-sm text-gray-500">
            <span>Sayfada</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-lg px-2 py-1 bg-white"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>kayıt</span>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
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
            <Gallery key={selectedProduct.id} photos={selectedProduct.photos} />

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
                    value={formatPrice(
                      selectedProduct.price,
                      selectedProduct.currency,
                    )}
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
                    min="1900"
                    max="2100"
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
                      min="0"
                      max="999999999"
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
                  min="0"
                  max="999999999"
                  step="0.01"
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

                <div className="col-span-2 border-t pt-4">
                  <p className="text-sm font-semibold mb-2">
                    Fotoğraflar ({editPhotos.length + newFiles.length}/
                    {MAX_PHOTOS})
                  </p>

                  {(editPhotos.length > 0 || newFiles.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editPhotos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={imageUrl(photo.url, THUMB)}
                            className="h-16 w-24 object-cover rounded"
                            alt=""
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingPhoto(photo)}
                            aria-label="Fotoğrafı sil"
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {newFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="relative">
                          <img
                            src={previews[i]}
                            className="h-16 w-24 object-cover rounded ring-2 ring-blue-400"
                            alt=""
                          />
                          <span className="absolute bottom-0 left-0 text-[9px] bg-blue-600 text-white px-1 rounded-tr">
                            yeni
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            aria-label="Seçimi kaldır"
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="inline-block cursor-pointer text-sm text-blue-600 hover:underline">
                    + Fotoğraf seç (JPG, PNG, WebP, en fazla {MAX_FILE_MB} MB)
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    İlk fotoğraf kapak olur. Kaydet'e basınca yüklenir.
                  </p>
                </div>
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
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? newFiles.length > 0
                    ? "Fotoğraflar yükleniyor..."
                    : "Kaydediliyor..."
                  : editId
                    ? "Güncelle"
                    : "Kaydet"}
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
