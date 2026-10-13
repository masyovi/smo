# SMO — Setup Firebase Cloud Messaging (FCM) untuk Push Notification

Panduan lengkap setup Firebase Console agar notifikasi maintenance muncul di
perangkat user **meski app tertutup** (background push).

## Arsitektur

```
[Jadwal jatuh tempo] → [Cron job] → POST /api/push/check
  → cek jadwal due → sendPush() via Firebase Admin SDK
  → FCM server → browser/device user → Service Worker
  → showNotification (OS notification, app tertutup)
```

## Step 1: Buat Firebase Project

1. Buka **https://console.firebase.google.com** → login (akun Google).
2. **Add project** → kasih nama (mis. "smo-saveoffice") → continue (nonaktif Google Analytics, optional) → Create project.
3. Tunggu project dibuat → lanjut ke step 2.

## Step 2: Daftarkan Web App

1. Di Firebase Console → **Project Overview** (gear icon ⚙️) → **Project Settings**.
2. Scroll ke **"Your apps"** → klik icon Web `</>`.
3. App nickname: "SMO" → **Register app**.
4. Copy `firebaseConfig` yang muncul (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Simpan sementara.

## Step 3: Generate Web Push Certificate (VAPID)

1. Masih di **Project Settings** → tab **Cloud Messaging**.
2. Scroll ke **"Web Push Certificates"** → klik **"Generate key pair"**.
3. Copy **Public key** yang muncul (string panjang mulai `B...`). Simpan.

## Step 4: Download Service Account (Server Key)

1. Masih di **Project Settings** → tab **Service Accounts**.
2. Klik **"Generate new private key"** → confirm → download file JSON.
3. Buka file JSON itu — ambil `client_email` + `private_key`.

## Step 5: Isi Config di Aplikasi SMO

### A. File `public/firebase-config.js` (untuk Service Worker)

Edit `public/firebase-config.js`, ganti placeholder:
```js
self.firebaseConfig = {
  apiKey: "AIzaSyXXXX...",        // dari step 2
  authDomain: "smo-saveoffice.firebaseapp.com",
  projectId: "smo-saveoffice",
  storageBucket: "smo-saveoffice.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef...",
}
self.vapidKey = "BXXXXXXXXXXXX..."  // dari step 3
```

### B. File `.env` (untuk server-side Admin SDK)

Edit `.env`, isi env vars Firebase:
```env
# Public (client-side) — dari step 2 + 3
NEXT_PUBLIC_FB_API_KEY=AIzaSyXXXX...
NEXT_PUBLIC_FB_AUTH_DOMAIN=smo-saveoffice.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=smo-saveoffice
NEXT_PUBLIC_FB_STORAGE_BUCKET=smo-saveoffice.appspot.com
NEXT_PUBLIC_FB_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FB_APP_ID=1:1234567890:web:abcdef...
NEXT_PUBLIC_FB_VAPID_KEY=BXXXXXXXXXXXX...

# Private (server-side) — dari step 4 (service account JSON)
FIREBASE_PROJECT_ID=smo-saveoffice
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@smo-saveoffice.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Secret untuk protect cron endpoint (string random):
CRON_SECRET=ganti-ini-dengan-string-acak
```

> **Catatan**: `FIREBASE_PRIVATE_KEY` harus pakai tanda kutip + `\n` sebagai literal newline (bukan enter asli). Copy dari file JSON service account.

### C. Restart server + rebuild SW

```bash
# Restart dev server (atau re-deploy kalau production)
pkill -f "next dev"; sleep 2; bun run dev

# Hard reload browser (Ctrl+Shift+R) biar SW update + firebase-config load
```

## Step 6: Setup Cron Job (untuk cek + kirim push)

Cron job adalah yang **memantau jadwal maintenance** + **mengirim push** saat jatuh tempo. Tanpa cron, push cuma jalan saat app dibuka (foreground). Dengan cron, push muncul **meski app tertutup**.

### Opsi A: Vercel Cron (kalau deploy di Vercel)

Tambah di `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/push/check?notify=due", "schedule": "0 8 * * *" }
  ]
}
```
 Ini panggil `/api/push/check` setiap hari jam 8 pagi. Tambahkan header
 `x-cron-secret: <CRON_SECRET>` di Vercel Cron config. (Vercel Cron auto-
 inject `Authorization: Basic <CRON_SECRET>` — adapt `x-cron-secret` di route
 atau ganti dengan `Authorization`.)

### Opsi B: Cron Eksternal (uptime-robot / cron-job.org / VPS cron)

Set up a scheduled HTTP POST ke:
```
POST https://your-deployed-url.com/api/push/check?notify=due
Header: x-cron-secret: <CRON_SECRET_ANDA>
```
Schedule: mis. tiap 6 jam (`0 */6 * * *`) atau tiap hari jam 8 pagi.

### Opsi C: Manual test (tanpa cron)

Test push manual:
```bash
curl -X POST "http://localhost:3000/api/push/check?notify=due" \
  -H "x-cron-secret: <CRON_SECRET_ANDA>" \
  -H "Authorization: Bearer <TOKEN_TEKNISI>"
```
Atau login sebagai teknisi + trigger via UI (kalau ada tombol "Test Push").

## Step 7: Test End-to-End

1. **Login** sebagai teknisi di browser (HTTPS — push butuh secure context).
2. Browser akan minta **permission** → **Allow**.
3. Firebase SDK ambil **FCM token** → register ke server (POST /api/push/register).
4. Saat ada jadwal jatuh tempo + cron jalan → server kirim push via FCM → browser tampilkan **OS notification** (di Windows notification center / Android lock screen / macOS notification).
5. Klik notification → buka app SMO.

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Push nggak muncul | Cek `permission` = "granted" di `Notification.permission`. Cek browser console untuk error FCM. |
| `firebaseConfig.apiKey` placeholder | Belum isi `public/firebase-config.js`. |
| `/api/push/check` return `sent: 0` | Firebase belum configured (cek `FIREBASE_*` env vars) ATAU belum ada token terdaftar (login dulu di browser untuk register token). |
| SW nggak load Firebase | Cek browser console. Firebase SDK di-load via `importScripts` dari gstatic CDN — butuh internet di SW. |
| Private key error | Pastikan `FIREBASE_PRIVATE_KEY` pakai `\n` literal (bukan enter asli). Copy exact dari service account JSON. |
| Token nggak terdaftar | Login di browser (HTTPS) + allow notification permission → `useFcmPush` hook register token otomatis. |

## File yang Berubah

```
prisma/schema.prisma          ← +PushSubscription model
public/firebase-config.js     ← public Firebase config (isi dari Console)
public/sw.js                  ← +Firebase background messaging (importScripts)
src/lib/firebase.ts           ← client Firebase init + getFcmToken + useFcmPush
src/lib/firebase-admin.ts     ← server Admin SDK + sendPush
src/app/api/push/register/    ← POST/DELETE token
src/app/api/push/check/       ← POST cek due + kirim push (cron)
src/components/app/topbar.tsx ← panggil useFcmPush setelah permission granted
.env                          ← +FIREBASE_* env vars
```

## Tanpa Firebase (app tetap jalan)

Kalau Firebase env vars kosong, app tetap berfungsi normal:
- Notifikasi foreground tetap jalan (via Web Notifications API + SW).
- Yang hilang: push background (app tertutup) + FCM relay.
- Isi env vars kapan saja untuk aktifkan FCM.
