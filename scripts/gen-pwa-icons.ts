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

async function main() {
  // 1) "any" purpose icons — full-bleed emerald with the logo centered at ~78%
  //    so it fills the square nicely and is unmistakable on the taskbar.
  for (const size of [192, 512]) {
    const logo = await sharp(SRC)
      .resize({
        width: Math.round(size * 0.78),
        height: Math.round(size * 0.78),
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
    await solidBg(size)
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(`${OUT_DIR}/icon-${size}.png`)
    console.log('generated', `icon-${size}.png`)
  }

  // 2) "maskable" purpose icons — emerald background + logo at ~62% so the
  //    safe zone (~80%) keeps the logo inside any masked circle/squircle.
  for (const size of [192, 512]) {
    const logo = await sharp(SRC)
      .resize({
        width: Math.round(size * 0.62),
        height: Math.round(size * 0.62),
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
    await solidBg(size, EMERALD_LIGHT)
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(`${OUT_DIR}/maskable-${size}.png`)
    console.log('generated', `maskable-${size}.png`)
  }

  // 3) Apple touch icon (180×180) — full-bleed emerald + logo.
  {
    const logo = await sharp(SRC)
      .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    await solidBg(180)
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(`${OUT_DIR}/apple-touch-icon.png`)
    console.log('generated', 'apple-touch-icon.png')
  }

  // 4) Favicons (16 + 32) — full-bleed emerald + logo (sized down).
  for (const s of [16, 32]) {
    const logo = await sharp(SRC)
      .resize(Math.round(s * 0.78), Math.round(s * 0.78), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    await solidBg(s)
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(`${OUT_DIR}/favicon-${s}.png`)
  }
  console.log('done')
}

main().catch((e) => { console.error(e); process.exit(1) })
