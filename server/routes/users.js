const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Tüm kullanıcıları listele (sadece admin)
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Kullanıcının rolünü değiştir (sadece admin)
router.patch("/:id/role", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "role 'admin' veya 'user' olmalı" });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Kullanıcıyı doğrula (sadece admin)
router.patch("/:id/verify", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { verified: true },
      select: { id: true, email: true, verified: true },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
