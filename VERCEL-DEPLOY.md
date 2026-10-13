# SMO — Deploy ke Vercel

Panduan lengkap deploy SMO ke Vercel (gratis, HTTPS otomatis, PWA + FCM push siap).

## Step 1: Push ke GitHub

```bash
git init
git add .
git commit -m "SMO — Save My Office"
# Buat repo di GitHub → copy URL
git remote add origin https://github.com/USERNAME/smo.git
git push -u origin main
```

> **Catatan**: file `.env` sudah di `.vercelignore` + `.gitignore` — tidak ikut
> ter-upload. Env vars di-set di Vercel dashboard (Step 3).

## Step 2: Import ke Vercel

1. Buka **https://vercel.com** → login (akun GitHub).
2. **Add New** → **Project** → pilih repo `smo`.
3. Framework Preset: **Next.js** (auto-detected).
4. **Build & Output Settings**:
   - Build Command: **default** (`next build`, sudah di package.json).
   - Output Directory: **default** (Vercel auto-detects).
   - Install Command: **default** (`bun install` atau `npm install`).
5. JANGAN deploy dulu — klik **Environment Variables** dulu (Step 3).

## Step 3: Set Environment Variables

Di Vercel project → **Settings** → **Environment Variables**, tambah satu-satu:

### Database + Auth
| Key | Value | Environments |
|-----|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://smoid-gedung.aws-ap-northeast-1.turso.io?authToken=eyJhbGci...` (copy full dari .env lokal) | Production + Preview |
| `SESSION_SECRET` | `smo-super-secret-key-change-in-production-2024` | All |
| `DATABASE_URL` | `file:/home/z/my-project/db/smoid.db` | All (fallback, tidak terpakai) |

### Firebase (Push Notification)
| Key | Value | Environments |
|-----|-------|-------------|
| `NEXT_PUBLIC_FB_API_KEY` | `AIzaSyCkBTjpdg5P_Adklgbt9bMaa7YgYXJxZEs` | All |
| `NEXT_PUBLIC_FB_AUTH_DOMAIN` | `nextjs77.firebaseapp.com` | All |
| `NEXT_PUBLIC_FB_PROJECT_ID` | `nextjs77` | All |
| `NEXT_PUBLIC_FB_STORAGE_BUCKET` | `nextjs77.firebasestorage.app` | All |
| `NEXT_PUBLIC_FB_MESSAGING_SENDER_ID` | `495364721162` | All |
| `NEXT_PUBLIC_FB_APP_ID` | `1:495364721162:web:b16429cfa40abff5102df3` | All |
| `NEXT_PUBLIC_FB_VAPID_KEY` | `BBorY0HG13qO5k8uq7sJeCDhkZMLQMWjHBPyj0ziHOuYGBTT_edmSvnurI0oSSYFqt4kwQ05gecLZ3zM-T4o8bs` | All |
| `FIREBASE_PROJECT_ID` | `nextjs77` | Production + Preview |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@nextjs77.iam.gserviceaccount.com` | Production + Preview |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n` (copy dari service account JSON) | Production + Preview |
| `CRON_SECRET` | `smo-cron-secret-change-me` | Production |

> **Tips**: Vercel mendukung import dari `.env` file. Kalau males ketik
> satu-satu, klik "Import .env File" di Vercel + upload `.env` lokal Anda.
> Tapi **PASTIKAN** `FIREBASE_PRIVATE_KEY` pakai `\n` literal (bukan enter asli).

## Step 4: Deploy!

Klik **Deploy** → tunggu build selesai (2-5 menit).

### Kalau build error:
| Error | Solusi |
|-------|--------|
| `prisma generate` fails | Tambah `"postinstall": "prisma generate"` di package.json (sudah ada). |
| `Cannot find module @prisma/adapter-libsql` | Run `bun add @prisma/adapter-libsql@6.19.3` lokal, commit, push ulang. |
| Turso connection error | Cek `TURSO_DATABASE_URL` di Vercel env vars — harus full URL dengan `?authToken=`. |
| Firebase Admin init error | Cek `FIREBASE_PRIVATE_KEY` — harus pakai `\n` literal. |

## Step 5: Setup Vercel Cron (Push Notification Otomatis)

File `vercel.json` sudah ada di project:
```json
{
  "crons": [
    { "path": "/api/push/check?notify=due", "schedule": "0 1,7,13,19 * * *" }
  ]
}
```
Ini akan **call `/api/push/check` 4x sehari** (jam 1, 7, 13, 19 UTC). Vercel
auto-kirim `Authorization: Bearer <CRON_SECRET>` ke route itu.

> **Vercel Cron GRATIS**: maksimal 2 cron jobs di plan Hobby (free). Schedule
> di atas pakai 1 slot. Kalau mau ubah jadwal, edit `vercel.json`.
> **Note**: Vercel Cron di plan free jalan di **UTC timezone**. Untuk WIB (UTC+7),
> jam 1 UTC = 8 WIB, 7 UTC = 14 WIB, dst.

### Aktifkan Cron:
1. Vercel dashboard → project → **Settings** → **Cron Jobs**.
2. Cron job `push-check` sudah terdeteksi dari `vercel.json`.
3. Set `CRON_SECRET` env var (kalau belum, Step 3).
4. Cron auto-aktif setelah deploy.

## Step 6: Test Setelah Deploy

1. Buka URL Vercel (mis. `https://smo.vercel.app`) di Chrome.
2. Login teknisi (`teknisi@smo.com` / `teknisi123`).
3. Browser minta permission → **Allow**.
4. FCM token terdaftar (via `useFcmPush` hook → `POST /api/push/register`).
5. Cek cron:
   ```
   curl -H "Authorization: Bearer smo-cron-secret-change-me" \
     "https://YOUR-VERCEL-URL.vercel.app/api/push/check?notify=due"
   ```
   Harus return `{"due":1,"tokens":1,"firebaseConfigured":true}`.
6. Tunggu cron jalan (atau trigger manual di atas) → **push notification muncul** di perangkat!

## Step 7: Re-install PWA di URL Vercel

URL Vercel adalah HTTPS → PWA + Service Worker + FCM semuanya jalan full.
1. Buka `https://YOUR-VERCEL-URL.vercel.app` di Chrome.
2. Klik **Install** di address bar → PWA ter-install dengan icon SMO.
3. Taskbar icon SMO muncul (kotak emerald + logo).

## Step 8: Update Capacitor Android Config (kalau mau build APK)

Edit `capacitor.config.ts` → set `SMO_APP_URL`:
```env
SMO_APP_URL="https://YOUR-VERCEL-URL.vercel.app"
```
Lalu:
```bash
bun run cap:sync
bun run cap:open  # buka Android Studio → build APK
```

## Checklist

- [ ] Push ke GitHub.
- [ ] Import ke Vercel.
- [ ] Set semua env vars (12 vars).
- [ ] Deploy berhasil (build OK).
- [ ] Cron job terdeteksi (Settings → Cron Jobs).
- [ ] Login di URL Vercel + Allow notification.
- [ ] `/api/push/check` return `tokens:1, firebaseConfigured:true`.
- [ ] Push notification muncul di perangkat.
- [ ] PWA ter-install di URL Vercel.
