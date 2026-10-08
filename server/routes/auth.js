const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const {
  validateEmail,
  validatePassword,
  handleError,
} = require("../lib/validate");

const router = express.Router();

// v1'de kendi kendine kayıt kasıtlı olarak kapalıydı: kullanıcıları admin açar
// (POST /api/users). Kayıt sadece ALLOW_REGISTRATION=true ile açılabilir.
router.post("/register", async (req, res) => {
  if (process.env.ALLOW_REGISTRATION !== "true") {
    return res
      .status(403)
      .json({ error: "Kayıt kapalı. Hesabı yönetici oluşturur." });
  }

  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Bu email zaten kayıtlı" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    handleError(res, err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email ve şifre zorunlu" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return res.status(401).json({ error: "Email veya şifre hatalı" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Email veya şifre hatalı" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
