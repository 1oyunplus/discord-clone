# Discord Clone

Electron.js + React + WebRTC + Socket.io + PostgreSQL + Prisma ile yapılmış Discord klonu.

## Gereksinimler

- Node.js 18+
- PostgreSQL (lokal veya Supabase)
- Git

---

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
# Ana dizinde
cd server && npm install
cd ../client && npm install
```

### 2. Veritabanı Ayarla

`server/.env` dosyası oluştur (`.env.example`'dan kopyala):

```env
DATABASE_URL="postgresql://postgres:SIFREN@localhost:5432/discord_clone"
JWT_SECRET="gizli-bir-anahtar-yaz"
PORT=3001
CLIENT_URL="http://localhost:3000"
```

### 3. Prisma Migration

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

---

## Geliştirme

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend (React):**
```bash
cd client
npm run dev
```

**Terminal 3 - Electron (opsiyonel, masaüstü penceresi):**
```bash
cd client
npm run electron
```

---

## Windows .exe Oluşturma

```bash
cd client
npm run dist
```

`client/release/` klasöründe `.exe` dosyası oluşur.

---

## Proje Yapısı

```
discord-clone/
├── client/                 # Electron + React frontend
│   ├── electron/           # Electron ana process
│   │   ├── main.js
│   │   └── preload.js
│   └── src/
│       ├── components/
│       │   ├── Sidebar/
│       │   ├── Chat/
│       │   └── Voice/
│       ├── pages/
│       ├── styles/         # CSS Modules
│       └── utils/
├── server/                 # Node.js + Express backend
│   └── src/
│       ├── routes/
│       ├── middleware/
│       └── socket/
└── prisma/
    └── schema.prisma       # Veritabanı şeması
```

---

## Özellikler

- ✅ Kullanıcı kaydı ve girişi (JWT)
- ✅ Metin odaları (gerçek zamanlı Socket.io)
- ✅ Ses odaları (WebRTC + STUN)
- ✅ Oda oluşturma
- ✅ Şifreli mesaj depolama (PostgreSQL)
- ✅ Windows .exe derleme
