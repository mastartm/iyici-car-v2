// v1'deki WhatsApp iletişim butonunun numarası. Değiştirmek için client/.env
// içine VITE_WHATSAPP_NUMBER=90XXXXXXXXXX yaz (başında + olmadan).
const number = import.meta.env.VITE_WHATSAPP_NUMBER || "905338471818";

export const WHATSAPP_URL = `https://wa.me/${number}`;
