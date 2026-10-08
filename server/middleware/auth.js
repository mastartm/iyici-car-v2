const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

function readToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

// Token'ı doğrular, kullanıcıyı DB'den okur. Rol ve silinme anında etkili olur
// (token içindeki eski rol'e güvenilmez).
async function loadUser(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, role: true },
  });
}

async function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: "Token gerekli" });
  }

  try {
    const user = await loadUser(token);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Geçersiz veya süresi dolmuş token" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
}

// Giriş zorunlu değil; token geçerliyse req.user dolar (herkese açık uçlarda
// admin'e ekstra veri göstermek için).
async function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();

  try {
    const user = await loadUser(token);
    if (user) req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Bu işlem için admin yetkisi gerekli" });
  }
  next();
}

module.exports = { authenticate, optionalAuth, requireAdmin };
