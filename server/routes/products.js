const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Kategori sayıları (admin için)
router.get("/stats", authenticate, async (req, res) => {
  try {
    const [vehicle, engine, part] = await Promise.all([
      prisma.product.count({ where: { category: "vehicle" } }),
      prisma.product.count({ where: { category: "engine" } }),
      prisma.product.count({ where: { category: "part" } }),
    ]);
    res.json({ vehicle, engine, part });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});
// TÜM ÜRÜNLERİ LİSTELE (herkes görebilir, arama/filtre destekli)
router.get("/", async (req, res) => {
  try {
    const { category, search, year, transmission, includeHidden } = req.query;

    const where = {};

    if (category) where.category = category;
    if (year) where.year = Number(year);
    if (transmission) where.transmission = transmission;
    if (!includeHidden) where.visible = true;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { vin: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { photos: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// TEK ÜRÜN DETAYI
router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { photos: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ÜRÜN EKLE (sadece admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { category, name } = req.body;

    if (!category || !["vehicle", "engine", "part"].includes(category)) {
      return res
        .status(400)
        .json({ error: "category 'vehicle', 'engine' veya 'part' olmalı" });
    }
    if (!name) {
      return res.status(400).json({ error: "name zorunlu" });
    }

    const product = await prisma.product.create({
      data: {
        category,
        name,
        vin: req.body.vin || undefined,
        year: req.body.year !== undefined ? Number(req.body.year) : undefined,
        km: req.body.km !== undefined ? Number(req.body.km) : undefined,
        color: req.body.color || undefined,
        segment: req.body.segment || undefined,
        engineCode: req.body.engineCode || undefined,
        engineVolume: req.body.engineVolume || undefined,
        transmission: req.body.transmission || undefined,
        seats:
          req.body.seats !== undefined ? Number(req.body.seats) : undefined,
        steering: req.body.steering || undefined,
        price:
          req.body.price !== undefined ? Number(req.body.price) : undefined,
        currency: req.body.currency || "TRY",
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ÜRÜN GÜNCELLE (sadece admin)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name: req.body.name,
        vin: req.body.vin,
        year: req.body.year !== undefined ? Number(req.body.year) : undefined,
        km: req.body.km !== undefined ? Number(req.body.km) : undefined,
        color: req.body.color,
        segment: req.body.segment,
        engineCode: req.body.engineCode,
        engineVolume: req.body.engineVolume,
        transmission: req.body.transmission,
        seats:
          req.body.seats !== undefined ? Number(req.body.seats) : undefined,
        steering: req.body.steering,
        price:
          req.body.price !== undefined ? Number(req.body.price) : undefined,
        currency: req.body.currency,
        visible: req.body.visible,
      },
    });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ÜRÜN SİL (sadece admin)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.requestItem.deleteMany({ where: { productId: id } });
    await prisma.photo.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    res.json({ message: "Ürün silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
