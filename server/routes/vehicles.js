const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// TÜM ARAÇLARI LİSTELE (herkes görebilir)
router.get("/", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { photos: true, engines: true, parts: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// TEK ARAÇ DETAYI (herkes görebilir)
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(req.params.id) },
      include: { photos: true, engines: true, parts: true },
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Araç bulunamadı" });
    }

    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ARAÇ EKLE (sadece admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { brand, model, year } = req.body;

    if (!brand || !model || !year) {
      return res.status(400).json({ error: "brand, model ve year zorunlu" });
    }

    const vehicle = await prisma.vehicle.create({
      data: { brand, model, year: Number(year) },
    });

    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ARAÇ GÜNCELLE (sadece admin)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { brand, model, year } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: { brand, model, year: year ? Number(year) : undefined },
    });

    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ARAÇ SİL (sadece admin)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.vehicle.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Araç silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
