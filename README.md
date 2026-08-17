# Iyici Car V2

Otomotiv yedek parça ve araç envanteri için geliştirilmiş, tam kapsamlı (full-stack) bir stok yönetim sistemi.

## Özellikler

- Kullanıcı kayıt/giriş sistemi (JWT tabanlı kimlik doğrulama)
- Rol bazlı yetkilendirme (admin / müşteri)
- Araç ve yedek parça envanteri yönetimi (ekleme, listeleme, silme)
- İlişkisel veri modeli (Foreign key kısıtlamalarıyla veri bütünlüğü)
- Admin paneli üzerinden envanter kontrolü

## Kullanılan Teknolojiler

**Backend:**

- Node.js + Express.js
- Prisma ORM
- MySQL / MariaDB
- JWT (jsonwebtoken) & bcrypt

**Frontend:**

- React
- (kullandığın diğer kütüphaneleri buraya ekleyebilirsin, örn. react-router, axios vs.)

## Kurulum

```bash
# Backend
cd server
npm install
npx prisma generate
npm run dev

# Frontend
cd client
npm install
npm start
```

## Geliştirme Durumu

Bu proje aktif olarak geliştirilmektedir. Planlanan özellikler:

- Cloudinary entegrasyonu ile çoklu fotoğraf yükleme
- Gelişmiş fotoğraf galerisi arayüzü
- Araç detay sayfasına ek alanlar (SKU, durum, menşei ülke)

## Geliştirici

[mastartm](https://github.com/mastartm)
