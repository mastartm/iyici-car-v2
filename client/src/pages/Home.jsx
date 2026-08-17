import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const categories = [
  { key: "vehicle", label: "Araçlar" },
  { key: "engine", label: "Motorlar" },
  { key: "part", label: "Parçalar" },
];

const PER_PAGE = 12;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "vehicle",
  );
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [page, setPage] = useState(1);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, isInCart } = useCart();

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
      if (search) params.set("search", search);
      if (yearFilter) params.set("year", yearFilter);
      if (transmissionFilter) params.set("transmission", transmissionFilter);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data);
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
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center mb-6">
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
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-red-600 text-sm"
              >
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

      <div className="max-w-6xl mx-auto px-4">
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
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
              >
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
              <h2 className="text-2xl font-bold mb-1">
                {selectedProduct.name}
              </h2>
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

              {user ? (
                isInCart(selectedProduct.id) ? (
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

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
          <span className="text-sm font-semibold">
            {cart.length} ürün seçildi
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
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
