const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// MÜŞTERİ: Kendi taleplerini listele
router.get("/mine", authenticate, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: { userId: req.user.id, hidden: false },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ADMIN: Tüm talepleri listele
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// MÜŞTERİ: Yeni talep oluştur (birden fazla ürün ile)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productIds, notes } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "En az bir ürün seçmelisin" });
    }

    const request = await prisma.request.create({
      data: {
        userId: req.user.id,
        notes: notes || undefined,
        items: {
          create: productIds.map((productId) => ({
            productId: Number(productId),
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ADMIN: Talep durumunu güncelle
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ error: "Geçersiz durum" });
    }

    const request = await prisma.request.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ADMIN: Talebi müşteriden gizle/göster
router.patch("/:id/hidden", authenticate, requireAdmin, async (req, res) => {
  try {
    const { hidden } = req.body;

    const request = await prisma.request.update({
      where: { id: Number(req.params.id) },
      data: { hidden: Boolean(hidden) },
    });

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ADMIN: Talebi kalıcı sil
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.requestItem.deleteMany({ where: { requestId: id } });
    await prisma.request.delete({ where: { id } });
    res.json({ message: "Talep silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
