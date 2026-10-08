const SYMBOLS = { TRY: "₺", USD: "$", GBP: "£" };

export function formatPrice(price, currency = "TRY") {
  if (price == null) return "";
  const amount = Number(price).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });
  return `${amount} ${SYMBOLS[currency] || currency}`;
}
