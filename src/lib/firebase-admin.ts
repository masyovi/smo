import admin from 'firebase-admin'

/**
 * Server-side Firebase Admin SDK — used to send push notifications to
 * registered FCM tokens. Initialized lazily + only if the service-account
 * env vars are present.
 */
let app: admin.app.App | null = null

function configured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )
}

function getApp(): admin.app.App | null {
  if (!configured()) return null
  if (app) return app
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(
          /\\n/g,
          '\n'
        ),
      }),
    })
    return app
  } catch {
    // already initialized or bad config
    try {
      app = admin.app()
      return app
    } catch {
      return null
    }
  }
}

/**
 * Send a push notification to a list of FCM tokens. Returns the count of
 * successful sends. Silently no-ops if Firebase isn't configured.
 */
export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<number> {
  if (!tokens.length) return 0
  const a = getApp()
  if (!a) return 0
  try {
    const res = await admin.messaging(a).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { title, body, ...(data || {}), url: '/' },
    })
    return res.successCount
  } catch {
    return 0
  }
}
