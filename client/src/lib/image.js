// Cloudinary adreslerine boyut/biçim dönüşümü ekler (küçük resim, otomatik
// format ve kalite). Cloudinary'den gelmeyen adreslere dokunmaz.
export function imageUrl(url, transform = "") {
  if (!url || !url.includes("/image/upload/")) return url;
  const t = [transform, "f_auto", "q_auto"].filter(Boolean).join(",");
  return url.replace("/image/upload/", `/image/upload/${t}/`);
}

// Liste kartı ve küçük resimler için hazır boyutlar
export const CARD = "w_600,h_400,c_fill";
export const THUMB = "w_160,h_120,c_fill";
export const LARGE = "w_1200,c_limit";
export const FULL = "w_2000,c_limit";
