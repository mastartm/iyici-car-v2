const express = require("express");
const prisma = require("../lib/prisma");
const {
  authenticate,
  optionalAuth,
  requireAdmin,
} = require("../middleware/auth");
const {
  ValidationError,
  optionalText,
  requiredText,
  optionalNumber,
  handleError,
} = require("../lib/validate");

const router = express.Router();

const CATEGORIES = ["vehicle", "engine", "part"];
const CURRENCIES = ["TRY", "USD", "GBP"];

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError("Geçersiz id");
  }
  return id;
}

// Ekleme ve güncelleme için ortak alan doğrulaması.
// undefined = alan gönderilmedi (dokunma), null = alanı temizle.
function buildProductData(body) {
  const data = {
    vin: optionalText(body.vin, "VIN"),
    year: optionalNumber(body.year, "Yıl", { integer: true, min: 1900, max: 2100 }),
    km: optionalNumber(body.km, "Kilometre", { integer: true }),
    color: optionalText(body.color, "Renk"),
    segment: optionalText(body.segment, "Segment"),
    engineCode: optionalText(body.engineCode, "Motor kodu"),
    engineVolume: optionalText(body.engineVolume, "Motor hacmi"),
    transmission: optionalText(body.transmission, "Vites"),
    seats: optionalNumber(body.seats, "Koltuk sayısı", { integer: true, max: 100 }),
    steering: optionalText(body.steering, "Direksiyon"),
    price: optionalNumber(body.price, "Fiyat"),
  };

  if (body.currency !== undefined) {
    if (!CURRENCIES.includes(body.currency)) {
      throw new ValidationError(`Para birimi ${CURRENCIES.join(", ")} olmalı`);
    }
    data.currency = body.currency;
  }

  return data;
}

// Kategori sayıları. Admin hepsini, diğerleri sadece yayındakileri sayar.
router.get("/stats", authenticate, async (req, res) => {
  try {
    const visibleOnly = req.user.role === "admin" ? {} : { visible: true };
    const [vehicle, engine, part] = await Promise.all(
      CATEGORIES.map((category) =>
        prisma.product.count({ where: { category, ...visibleOnly } }),
      ),
    );
    res.json({ vehicle, engine, part });
  } catch (err) {
    handleError(res, err);
  }
});

// TÜM ÜRÜNLERİ LİSTELE (herkes görebilir, arama/filtre destekli)
// Gizli ürünler sadece giriş yapmış admin'e görünür.
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, search, year, transmission, includeHidden } = req.query;
    const isAdmin = req.user?.role === "admin";

    const where = {};

    if (category) {
      if (!CATEGORIES.includes(category)) {
        throw new ValidationError("Geçersiz kategori");
      }
      where.category = category;
    }
    if (year) {
      where.year = optionalNumber(year, "Yıl", { integer: true, min: 1900, max: 2100 });
    }
    if (transmission) where.transmission = String(transmission);
    if (!(isAdmin && includeHidden)) where.visible = true;

    if (search) {
      const term = String(search).slice(0, 100);
      where.OR = [
        { name: { contains: term } },
        { vin: { contains: term } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { photos: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (err) {
    handleError(res, err);
  }
});

// TEK ÜRÜN DETAYI (gizli ürün admin dışında 404 döner)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseId(req.params.id) },
      include: { photos: true },
    });

    if (!product || (!product.visible && req.user?.role !== "admin")) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    res.json(product);
  } catch (err) {
    handleError(res, err);
  }
});

// ÜRÜN EKLE (sadece admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { category } = req.body;
    if (!CATEGORIES.includes(category)) {
      throw new ValidationError("category 'vehicle', 'engine' veya 'part' olmalı");
    }
    const name = requiredText(req.body.name, "İsim");

    const product = await prisma.product.create({
      data: { category, name, ...buildProductData(req.body) },
    });

    res.status(201).json(product);
  } catch (err) {
    handleError(res, err);
  }
});

// ÜRÜN GÜNCELLE (sadece admin)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const data = buildProductData(req.body);

    if (req.body.name !== undefined) {
      data.name = requiredText(req.body.name, "İsim");
    }
    if (req.body.category !== undefined) {
      if (!CATEGORIES.includes(req.body.category)) {
        throw new ValidationError("category 'vehicle', 'engine' veya 'part' olmalı");
      }
      data.category = req.body.category;
    }
    if (req.body.visible !== undefined) {
      if (typeof req.body.visible !== "boolean") {
        throw new ValidationError("visible true veya false olmalı");
      }
      data.visible = req.body.visible;
    }

    const product = await prisma.product.update({
      where: { id: parseId(req.params.id) },
      data,
    });

    res.json(product);
  } catch (err) {
    handleError(res, err);
  }
});

// ÜRÜN SİL (sadece admin) — hepsi tek transaction'da, yarım kalmaz
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    await prisma.$transaction([
      prisma.requestItem.deleteMany({ where: { productId: id } }),
      prisma.photo.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.json({ message: "Ürün silindi" });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
