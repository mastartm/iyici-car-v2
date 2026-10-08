// Cloudinary bağlantısı. Ayar CLOUDINARY_URL ortam değişkeninden okunur
// (cloudinary://API_KEY:API_SECRET@CLOUD_NAME). Paket bunu kendisi okur.
const { v2: cloudinary } = require("cloudinary");

const FOLDER = "iyici-car";

function isConfigured() {
  return Boolean(cloudinary.config().cloud_name);
}

// Bellekteki dosyayı Cloudinary'ye yükler. Büyük fotoğrafları 1600 px'e küçültür.
function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: "image",
        transformation: [{ width: 1600, height: 1600, crop: "limit" }],
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

// Hata olursa yutar: Cloudinary'de artık kalan bir dosya, kullanıcıya hata
// göstermekten daha az zararlı.
async function destroyImages(publicIds) {
  const ids = publicIds.filter(Boolean);
  if (ids.length === 0 || !isConfigured()) return;
  try {
    await cloudinary.api.delete_resources(ids);
  } catch (err) {
    console.error("Cloudinary silme hatası:", err?.message || err);
  }
}

module.exports = { isConfigured, uploadBuffer, destroyImages };
