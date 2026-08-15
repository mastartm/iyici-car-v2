const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// TÜM MOTORLARI LİSTELE
router.get("/", async (req, res) => {
  try {
    const engines = await prisma.engine.findMany({
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(engines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// MOTOR EKLE (sadece admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, vehicleId, price, currency } = req.body;

    if (!name || !vehicleId || price === undefined) {
      return res
        .status(400)
        .json({ error: "name, vehicleId ve price zorunlu" });
    }

    const engine = await prisma.engine.create({
      data: {
        name,
        vehicleId: Number(vehicleId),
        price: Number(price),
        currency: currency || "TRY",
      },
    });

    res.status(201).json(engine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// MOTOR GÜNCELLE (sadece admin)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, price, currency } = req.body;

    const engine = await prisma.engine.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        price: price !== undefined ? Number(price) : undefined,
        currency,
      },
    });

    res.json(engine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// MOTOR SİL (sadece admin)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.engine.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Motor silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
