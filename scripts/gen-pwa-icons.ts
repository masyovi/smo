import sharp from 'sharp'
import { mkdirSync } from 'fs'

const SRC = 'public/smo-icon.png'
const OUT_DIR = 'public/icons'
mkdirSync(OUT_DIR, { recursive: true })

// Emerald brand background — a solid fill so the icon is clearly visible on
// any taskbar/dock (no transparent/white edges that vanish on dark taskbars).
const EMERALD = { r: 16, g: 118, b: 110, alpha: 1 } // #0f766e
const EMERALD_LIGHT = { r: 20, g: 184, b: 166, alpha: 1 } // #14b8a6 (teal-500)

// Build a full-bleed emerald background image of the given size.
function solidBg(size: number, color = EMERALD) {
  return sharp({
    create: { width: size, height: size, channels: 4, background: color },
  }).png()
}

// Compose the logo onto a solid emerald bg + FLATTEN to remove the alpha
// channel. This is critical for Windows taskbar icons: a PNG with an alpha
// channel (even if fully opaque) can render as blank/transparent in the
// taskbar. Flattening to 3-channel RGB guarantees an opaque, solid icon.
async function buildIcon(size: number, logoRatio: number, color = EMERALD) {
  const logo = await sharp(SRC)
    .resize({
      width: Math.round(size * logoRatio),
      height: Math.round(size * logoRatio),
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  return solidBg(size, color)
    .composite([{ input: logo, gravity: 'center' }])
    .flatten({ background: color }) // merge any transparency onto emerald
    .removeAlpha() // strip alpha channel entirely → 3-channel RGB PNG
    .png()
}

async function main() {
  // 1) "any" purpose icons — full-bleed emerald + logo at ~78% (fills square).
  for (const size of [192, 512]) {
    await (await buildIcon(size, 0.78, EMERALD)).toFile(`${OUT_DIR}/icon-${size}.png`)
    console.log('generated', `icon-${size}.png`)
  }

  // 2) "maskable" purpose icons — teal bg + logo at ~62% (safe zone).
  for (const size of [192, 512]) {
    await (await buildIcon(size, 0.62, EMERALD_LIGHT)).toFile(`${OUT_DIR}/maskable-${size}.png`)
    console.log('generated', `maskable-${size}.png`)
  }

  // 3) Apple touch icon (180×180).
  await (await buildIcon(180, 0.78, EMERALD)).toFile(`${OUT_DIR}/apple-touch-icon.png`)
  console.log('generated', 'apple-touch-icon.png')

  // 4) Favicons (16 + 32).
  for (const s of [16, 32]) {
    await (await buildIcon(s, 0.78, EMERALD)).toFile(`${OUT_DIR}/favicon-${s}.png`)
  }

  // 5) Favicon .ico — Windows/Chrome sometimes uses the favicon for the
  //    taskbar/start-menu shortcut as a fallback. We write a 32×32 PNG
  //    renamed to .ico (most browsers accept a PNG inside an .ico name).
  await (await buildIcon(32, 0.7, EMERALD)).toFile(`${OUT_DIR}/favicon.ico`)
  console.log('generated', 'favicon.ico')

  console.log('done')
}

main().catch((e) => { console.error(e); process.exit(1) })
