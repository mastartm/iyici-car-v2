import { useState, useEffect } from "react";
import { imageUrl, THUMB, LARGE, FULL } from "../lib/image";

// Ürün fotoğraf galerisi: büyük görsel, oklar, küçük resimler, tam ekran.
export default function Gallery({ photos = [], height = "h-64" }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = photos.length;
  const current = Math.min(index, Math.max(count - 1, 0));

  const prev = () => setIndex((current - 1 + count) % count);
  const next = () => setIndex((current + 1) % count);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === "Escape") setLightbox(false);
      if (count > 1 && e.key === "ArrowLeft") {
        setIndex((i) => (Math.min(i, count - 1) - 1 + count) % count);
      }
      if (count > 1 && e.key === "ArrowRight") {
        setIndex((i) => (Math.min(i, count - 1) + 1) % count);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, count]);

  if (count === 0) {
    return (
      <div
        className={`${height} bg-gray-200 flex items-center justify-center text-gray-400`}
      >
        Fotoğraf yok
      </div>
    );
  }

  return (
    <div>
      <div className={`relative ${height} bg-gray-100`}>
        <img
          src={imageUrl(photos[current].url, LARGE)}
          alt=""
          onClick={() => setLightbox(true)}
          className="w-full h-full object-contain cursor-zoom-in"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Önceki fotoğraf"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Sonraki fotoğraf"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-3 text-xs bg-black/60 text-white px-2 py-1 rounded">
              {current + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 p-2 overflow-x-auto bg-white">
          {photos.map((p, i) => (
            <img
              key={p.id}
              src={imageUrl(p.url, THUMB)}
              alt=""
              onClick={() => setIndex(i)}
              className={`h-14 w-20 shrink-0 object-cover rounded cursor-pointer border-2 ${
                i === current
                  ? "border-red-600"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Kapat"
            className="absolute top-4 right-5 text-white text-3xl"
          >
            ×
          </button>
          {count > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Önceki fotoğraf"
              className="absolute left-4 text-white text-5xl"
            >
              ‹
            </button>
          )}
          <img
            src={imageUrl(photos[current].url, FULL)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          {count > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Sonraki fotoğraf"
              className="absolute right-4 text-white text-5xl"
            >
              ›
            </button>
          )}
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
            {current + 1} / {count}
          </span>
        </div>
      )}
    </div>
  );
}
