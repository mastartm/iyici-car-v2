require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const requestRoutes = require("./routes/requests");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET tanımlı değil, sunucu başlatılmadı.");
  process.exit(1);
}

const app = express();

// nginx arkasında gerçek istemci IP'si için (rate limit buna bakar)
app.set("trust proxy", 1);

app.use(helmet());

// CORS_ORIGIN: virgülle ayrılmış izinli adresler (örn. https://alanadi.com).
// Tanımlı değilse (yerel geliştirme) herkese açık kalır.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: "100kb" }));

// Giriş denemelerini sınırla (şifre tahmin saldırısına karşı)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla deneme. Biraz sonra tekrar dene." },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/requests", requestRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Böyle bir adres yok" });
});

// Bozuk JSON gibi beklenmeyen hatalar
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Geçersiz JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Sunucu hatası" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
