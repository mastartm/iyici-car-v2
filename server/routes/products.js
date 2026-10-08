const express = require("express");
const multer = require("multer");
const prisma = require("../lib/prisma");
const {
  isConfigured,
  uploadBuffer,
  destroyImages,
} = require("../lib/cloudinary");
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

// Fotoğraflar yükleme sırasına göre döner; ilki kapak fotoğrafıdır.
const withPhotos = { photos: { orderBy: { id: "asc" } } };

const MAX_PHOTOS_PER_PRODUCT = 15;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new ValidationError("Sadece JPG, PNG veya WebP yüklenebilir"));
  },
});

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
      include: withPhotos,
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
      include: withPhotos,
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
    const photos = await prisma.photo.findMany({
      where: { productId: id },
      select: { publicId: true },
    });

    await prisma.$transaction([
      prisma.requestItem.deleteMany({ where: { productId: id } }),
      prisma.photo.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    // Kayıt silindikten sonra Cloudinary'deki dosyaları da temizle
    await destroyImages(photos.map((p) => p.publicId));

    res.json({ message: "Ürün silindi" });
  } catch (err) {
    handleError(res, err);
  }
});

// FOTOĞRAF YÜKLE (sadece admin): form alanı adı "photos", en fazla 10 dosya
router.post(
  "/:id/photos",
  authenticate,
  requireAdmin,
  upload.array("photos", 10),
  async (req, res) => {
    try {
      const productId = parseId(req.params.id);

      if (!isConfigured()) {
        return res
          .status(503)
          .json({ error: "Fotoğraf servisi ayarlanmamış (CLOUDINARY_URL)" });
      }
      if (!req.files || req.files.length === 0) {
        throw new ValidationError("En az bir fotoğraf seçmelisin");
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        return res.status(404).json({ error: "Ürün bulunamadı" });
      }

      const existing = await prisma.photo.count({ where: { productId } });
      if (existing + req.files.length > MAX_PHOTOS_PER_PRODUCT) {
        throw new ValidationError(
          `Bir üründe en fazla ${MAX_PHOTOS_PER_PRODUCT} fotoğraf olabilir (şu an ${existing})`,
        );
      }

      const uploaded = [];
      try {
        for (const file of req.files) {
          const result = await uploadBuffer(file.buffer);
          uploaded.push({ url: result.secure_url, publicId: result.public_id });
        }
      } catch (err) {
        // Yarım kalan yüklemeyi geri al
        await destroyImages(uploaded.map((u) => u.publicId));
        console.error("Cloudinary yükleme hatası:", err?.message || err);
        return res
          .status(502)
          .json({ error: "Fotoğraf yüklenemedi, tekrar dene" });
      }

      await prisma.photo.createMany({
        data: uploaded.map((u) => ({ ...u, productId })),
      });

      const photos = await prisma.photo.findMany({
        where: { productId },
        orderBy: { id: "asc" },
      });
      res.status(201).json(photos);
    } catch (err) {
      handleError(res, err);
    }
  },
);

// FOTOĞRAF SİL (sadece admin)
router.delete(
  "/:id/photos/:photoId",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const productId = parseId(req.params.id);
      const photoId = parseId(req.params.photoId);

      const photo = await prisma.photo.findFirst({
        where: { id: photoId, productId },
      });
      if (!photo) {
        return res.status(404).json({ error: "Fotoğraf bulunamadı" });
      }

      await prisma.photo.delete({ where: { id: photoId } });
      await destroyImages([photo.publicId]);

      res.json({ message: "Fotoğraf silindi" });
    } catch (err) {
      handleError(res, err);
    }
  },
);

module.exports = router;
