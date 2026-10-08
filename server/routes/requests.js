const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
  ValidationError,
  optionalText,
  handleError,
} = require("../lib/validate");

const router = express.Router();

const STATUSES = ["pending", "approved", "rejected", "completed"];
const MAX_ITEMS_PER_REQUEST = 100;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError("Geçersiz id");
  }
  return id;
}

// MÜŞTERİ: Kendi taleplerini listele
router.get("/mine", authenticate, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: { userId: req.user.id, hidden: false },
      include: { items: { include: { product: { include: { photos: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN: Tüm talepleri listele
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      include: {
        items: { include: { product: { include: { photos: true } } } },
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    handleError(res, err);
  }
});

// MÜŞTERİ: Yeni talep oluştur (birden fazla ürün ile)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ValidationError("En az bir ürün seçmelisin");
    }
    if (productIds.length > MAX_ITEMS_PER_REQUEST) {
      throw new ValidationError(
        `Tek talepte en fazla ${MAX_ITEMS_PER_REQUEST} ürün olabilir`,
      );
    }

    const ids = [...new Set(productIds.map(Number))];
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new ValidationError("Geçersiz ürün seçimi");
    }

    // Sadece var olan ve yayında olan ürünler talep edilebilir
    const found = await prisma.product.count({
      where: { id: { in: ids }, visible: true },
    });
    if (found !== ids.length) {
      throw new ValidationError(
        "Seçtiğin ürünlerden bazıları artık mevcut değil. Stoğunu güncelle.",
      );
    }

    const notes = optionalText(req.body.notes, "Not", 2000);

    const request = await prisma.request.create({
      data: {
        userId: req.user.id,
        notes: notes ?? undefined,
        items: { create: ids.map((productId) => ({ productId })) },
      },
      include: { items: { include: { product: true } } },
    });

    res.status(201).json(request);
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN: Talep durumunu güncelle
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      throw new ValidationError("Geçersiz durum");
    }

    const request = await prisma.request.update({
      where: { id: parseId(req.params.id) },
      data: { status },
    });

    res.json(request);
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN: Talebi müşteriden gizle/göster
router.patch("/:id/hidden", authenticate, requireAdmin, async (req, res) => {
  try {
    const { hidden } = req.body;
    if (typeof hidden !== "boolean") {
      throw new ValidationError("hidden true veya false olmalı");
    }

    const request = await prisma.request.update({
      where: { id: parseId(req.params.id) },
      data: { hidden },
    });

    res.json(request);
  } catch (err) {
    handleError(res, err);
  }
});

// ADMIN: Talebi kalıcı sil
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    await prisma.$transaction([
      prisma.requestItem.deleteMany({ where: { requestId: id } }),
      prisma.request.delete({ where: { id } }),
    ]);
    res.json({ message: "Talep silindi" });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
