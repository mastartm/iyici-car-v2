// Girdi doğrulama yardımcıları. Hatalı girdide ValidationError fırlatır,
// route'lardaki catch bloğu handleError ile 400 döner.

const MAX_NUMBER = 999999999; // v1'deki "büyük sayı" hatasının tekrarını önler
const MAX_TEXT = 191; // şemadaki VARCHAR(191) sınırı
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ValidationError extends Error {}

// undefined -> undefined (alan gönderilmedi), ""/null -> null (alanı temizle)
function optionalText(value, label, max = MAX_TEXT) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new ValidationError(`${label} metin olmalı`);
  const text = value.trim();
  if (text === "") return null;
  if (text.length > max) {
    throw new ValidationError(`${label} en fazla ${max} karakter olabilir`);
  }
  return text;
}

function requiredText(value, label, max = MAX_TEXT) {
  const text = optionalText(value, label, max);
  if (!text) throw new ValidationError(`${label} zorunlu`);
  return text;
}

function optionalNumber(value, label, { integer = false, min = 0, max = MAX_NUMBER } = {}) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) throw new ValidationError(`${label} sayı olmalı`);
  if (integer && !Number.isInteger(num)) {
    throw new ValidationError(`${label} tam sayı olmalı`);
  }
  if (num < min || num > max) {
    throw new ValidationError(`${label} ${min} ile ${max} arasında olmalı`);
  }
  return num;
}

function validateEmail(value) {
  if (typeof value !== "string") throw new ValidationError("Email zorunlu");
  const email = value.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > MAX_TEXT) {
    throw new ValidationError("Geçerli bir email gir");
  }
  return email;
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 6) {
    throw new ValidationError("Şifre en az 6 karakter olmalı");
  }
  // bcrypt 72 bayttan sonrasını yok sayar
  if (Buffer.byteLength(value) > 72) {
    throw new ValidationError("Şifre en fazla 72 bayt olabilir");
  }
  return value;
}

function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  // multer: dosya çok büyük, çok fazla dosya vb.
  if (err && err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Her fotoğraf en fazla 10 MB olabilir",
      LIMIT_FILE_COUNT: "Tek seferde en fazla 10 fotoğraf yüklenebilir",
      LIMIT_UNEXPECTED_FILE: "Beklenmeyen dosya alanı",
    };
    return res
      .status(400)
      .json({ error: messages[err.code] || "Dosya yüklenemedi" });
  }
  // Prisma: kayıt bulunamadı
  if (err && err.code === "P2025") {
    return res.status(404).json({ error: "Kayıt bulunamadı" });
  }
  console.error(err);
  return res.status(500).json({ error: "Sunucu hatası" });
}

module.exports = {
  ValidationError,
  MAX_NUMBER,
  optionalText,
  requiredText,
  optionalNumber,
  validateEmail,
  validatePassword,
  handleError,
};
