const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
  ValidationError,
  validateEmail,
  validatePassword,
  handleError,
} = require("../lib/validate");

const router = express.Router();

// PRD: en fazla 50 müşteri (user rolü). Admin sayısı sınırsız.
const MAX_USERS = Number(process.env.MAX_USERS) || 50;

const publicUser = {
  id: true,
  email: true,
  role: true,
  verified: true,
  createdAt: true,
};

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError("Geçersiz id");
  }
  return id;
}

// Sistemde en az bir admin kalmalı; yoksa kimse kullanıcı yönetemez.
async function assertNotLastAdmin(targetId) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true },
  });
  if (target?.role !== "admin") return;

  const admins = await prisma.user.count({ where: { role: "admin" } });
  if (admins <= 1) {
    throw new ValidationError("Sistemde en az bir admin kalmalı");
  }
}

// Yeni kullanıcı oluştur (sadece admin)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);
    const role = req.body.role === "admin" ? "admin" : "user";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Bu email zaten kayıtlı" });
    }

    if (role === "user") {
      const count = await prisma.user.count({ where: { role: "user" } });
      if (count >= MAX_USERS) {
        throw new ValidationError(
          `Kullanıcı sınırına ulaşıldı (en fazla ${MAX_USERS})`,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role, verified: true },
      select: publicUser,
    });

    res.status(201).json(user);
  } catch (err) {
    handleError(res, err);
  }
});

// Tüm kullanıcıları listele (sadece admin)
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: publicUser,
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    handleError(res, err);
  }
});

// Kullanıcının rolünü değiştir (sadece admin)
router.patch("/:id/role", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      throw new ValidationError("role 'admin' veya 'user' olmalı");
    }
    if (role === "user") await assertNotLastAdmin(id);

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
});

// Kullanıcıyı doğrula (sadece admin)
router.patch("/:id/verify", authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseId(req.params.id) },
      data: { verified: true },
      select: { id: true, email: true, verified: true },
    });

    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
});

// Kullanıcı sil (sadece admin). Talepleri de birlikte silinir.
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (id === req.user.id) {
      throw new ValidationError("Kendi hesabını silemezsin");
    }
    await assertNotLastAdmin(id);

    await prisma.$transaction([
      prisma.requestItem.deleteMany({ where: { request: { userId: id } } }),
      prisma.request.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    res.json({ message: "Kullanıcı silindi" });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
