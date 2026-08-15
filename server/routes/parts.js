const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// TÜM PARÇALARI LİSTELE
router.get("/", async (req, res) => {
  try {
    const parts = await prisma.part.findMany({
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(parts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// PARÇA EKLE (sadece admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, price, currency, vehicleId } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: "name, category ve price zorunlu" });
    }

    const part = await prisma.part.create({
      data: {
        name,
        category,
        price: Number(price),
        currency: currency || "TRY",
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
      },
    });

    res.status(201).json(part);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// PARÇA GÜNCELLE (sadece admin)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, price, currency } = req.body;

    const part = await prisma.part.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        category,
        price: price !== undefined ? Number(price) : undefined,
        currency,
      },
    });

    res.json(part);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// PARÇA SİL (sadece admin)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.part.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Parça silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
