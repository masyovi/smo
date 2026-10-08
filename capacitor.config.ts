import type { CapacitorConfig } from '@capacitor/cli';

/**
 * SMO — Save My Office · Capacitor config (Android build).
 *
 * SMO is a full-stack Next.js app (API routes + Turso DB), so the Android
 * build is a thin WebView wrapper that loads the DEPLOYED web app URL.
 *
 * === HOW TO BUILD THE APK ===
 * 1. Deploy the Next.js app to a public HTTPS URL (Vercel / a VPS / etc.).
 *    `bun run build` then serve the standalone output, OR push to Vercel.
 * 2. Set the deployed URL:
 *      export SMO_APP_URL="https://your-deployed-domain.com"
 * 3. Sync the native project:
 *      npx cap sync android
 * 4. Open in Android Studio (or build with Gradle):
 *      npx cap open android
 *      → Run / Build APK in Android Studio.
 *
 * The auth (Bearer token in localStorage) works inside the WebView, so login
 * + session persist. The service worker (push notifications) works when the
 * deployed URL is HTTPS.
 */

const APP_URL = process.env.SMO_APP_URL || 'https://smo-app.example.com';

const config: CapacitorConfig = {
  appId: 'com.smo.saveoffice',
  appName: 'SMO',
  webDir: 'public',
  // Load the deployed full-stack app inside the WebView (the API routes +
  // Turso connection live on the server, not in the APK).
  server: {
    url: APP_URL,
    // Use an https-like scheme so the WebView is a secure context (needed
    // for Service Worker registration + push notifications).
    androidScheme: 'https',
  },
  android: {
    // Tint the WebView background emerald so there's no white flash on load.
    backgroundColor: '#0f766e',
    // Let mixed content through (in case any asset is http) + allow the
    // WebView to be debuggable during development.
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    // Future hook: native push via @capacitor/push-notifications could be
    // added here for true background push (without relying on the SW).
  },
};

export default config;
