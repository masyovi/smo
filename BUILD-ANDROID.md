# SMO — Build untuk Android (APK) via Capacitor

App SMO sudah dibungkus Capacitor agar bisa di-build jadi aplikasi Android
(APK/AAB). Karena SMO adalah app full-stack (Next.js API routes + database
Turso), APK Android-nya adalah **WebView wrapper** yang me-load URL app
yang sudah di-deploy.

## Prasyarat (di mesin Anda)
1. **Android Studio** (terbaru) — untuk build APK. Termasuk Android SDK + Gradle.
2. **JDK 17+** (biasanya bawaan Android Studio).
3. **Node.js / Bun** + dependensi ter-install (`bun install`).
4. **App SMO sudah di-deploy** ke URL HTTPS publik (Vercel / VPS / dst).
   - Contoh: `https://smo-app.anda.com`
   - Pastikan URL ini bisa diakses publik (Android WebView me-load URL ini).

## Langkah Build

### 1. Deploy app SMO ke URL publik
```bash
bun run build          # hasilnya di .next/standalone
# Deploy .next/standalone + public ke hosting HTTPS Anda
# Catat URL-nya, mis: https://smo-app.anda.com
```

Atau push ke Vercel (paling gampang) — URL-nya otomatis HTTPS.

### 2. Set URL deployed ke konfigurasi Capacitor
Edit `capacitor.config.ts`, ubah baris:
```ts
const APP_URL = process.env.SMO_APP_URL || 'https://smo-app.example.com';
```
Jadi (salah satu):
- Ganti placeholder `'https://smo-app.example.com'` → URL Anda, ATAU
- Set env var sebelum sync:
  ```bash
  export SMO_APP_URL="https://smo-app.anda.com"
  ```

### 3. Sync project native Android
```bash
bun run cap:sync        # = cap sync android
```
Ini meng-copy web assets + config ke folder `android/`.

### 4. Buka di Android Studio + build APK
```bash
bun run cap:open        # = cap open android (buka Android Studio)
```
Di Android Studio:
- Tunggu Gradle sync selesai.
- Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
- APK ada di `android/app/build/outputs/apk/...`.
- Install ke device/emulator: **Run ▶**.

## Setelah ada perubahan web app
Setiap kali Anda mengubah app SMO (kode web):
1. Deploy ulang ke URL Anda (step 1).
2. Tidak perlu re-build APK selama URL tetap sama — WebView akan load
   versi terbaru otomatis (cukup restart app di Android).

Kalau Anda mengubah config Capacitor (icon, appId, dll):
1. `bun run cap:sync`
2. Re-build APK di Android Studio.

## Ganti App Icon
Icon default pakai `assets/icon.png` (logo SMO). Ganti file itu (1024×1024
PNG recommended) lalu:
```bash
bun run cap:icons        # regenerate android launcher icons + splash
bun run cap:sync
```

## App ID
- **appId**: `com.smo.saveoffice`
- **appName**: `SMO`
- Ubah di `capacitor.config.ts` kalau perlu (hati-hati, mengubah appId
  butuh uninstall app lama di device).

## Catatan Teknis
- **Auth**: Bearer token disimpan di localStorage WebView — login + session
  persist antar launch.
- **Push notifications**: Service Worker jalan saat URL HTTPS. Untuk push
  yang benar-benar background (app tertutup), bisa tambah plugin
  `@capacitor/push-notifications` + FCM (lihat komentar di
  `capacitor.config.ts`).
- **No offline mode**: app butuh internet (load URL deployed) karena DB +
  API ada di server.
- **backgroundColor** WebView emerald (#0f766e) supaya tidak white flash.

## Struktur File Capacitor
```
capacitor.config.ts          ← config utama (URL, appId, dll)
assets/icon.png              ← source icon (logo SMO)
android/                     ← native Android project (Gradle + Kotlin)
  app/src/main/res/...       ← launcher icons + splash (auto-generated)
```
