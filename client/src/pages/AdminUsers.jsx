import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/users", { email, password, role });
      setEmail("");
      setPassword("");
      setRole("user");
      setSuccess("Kullanıcı oluşturuldu");
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Kullanıcı oluşturulamadı");
    }
  }

  async function toggleRole(u) {
    try {
      const newRole = u.role === "admin" ? "user" : "admin";
      await api.patch(`/users/${u.id}/role`, { role: newRole });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`${u.email} kullanıcısını silmek istediğine emin misin?`))
      return;
    try {
      await api.delete(`/users/${u.id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Silinemedi");
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Müşteri Yönetimi</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="font-semibold mb-4">Yeni Kullanıcı Oluştur</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded flex-1 min-w-[180px]"
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded flex-1 min-w-[140px]"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Oluştur
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Kullanıcılar ({users.length})</h2>

          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center border p-3 rounded"
              >
                <div>
                  <p className="text-sm font-medium">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.role === "admin" ? "Admin" : "Kullanıcı"}
                  </span>
                  <button
                    onClick={() => toggleRole(u)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {u.role === "admin" ? "Admin Yetkisini Al" : "Admin Yap"}
                  </button>
                  <button
                    onClick={() => deleteUser(u)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
