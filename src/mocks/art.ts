/**
 * Token artwork and quote-token logos, drawn as inline SVG data URIs so the
 * demo never loads an image from anywhere.
 */

import { rng } from "./rng";

const svg = (body: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">${body}</svg>`,
  )}`;

const PALETTES: [string, string][] = [
  ["#94EDFF", "#3B82F6"],
  ["#FBD191", "#F97316"],
  ["#C4B5FD", "#7C3AED"],
  ["#86EFAC", "#059669"],
  ["#FDA4AF", "#E11D48"],
  ["#FDE68A", "#CA8A04"],
  ["#A5F3FC", "#0E7490"],
  ["#F0ABFC", "#A21CAF"],
  ["#FED7AA", "#9A3412"],
  ["#BAE6FD", "#1E3A8A"],
];

/**
 * Generated artwork for a token: a gradient tile with a shape and its glyph.
 * Deterministic per symbol, so a token always looks the same.
 */
export function tokenArt(symbol: string, glyph?: string) {
  const rand = rng(`art:${symbol}`);
  const [a, b] = PALETTES[Math.floor(rand() * PALETTES.length)];
  const angle = Math.floor(rand() * 360);
  const shape = Math.floor(rand() * 3);
  const cx = 30 + rand() * 68;
  const cy = 30 + rand() * 68;
  const text = glyph ?? symbol.slice(0, 2);
  const size = [...text].length > 1 ? 44 : 60;

  const deco =
    shape === 0
      ? `<circle cx="${cx}" cy="${cy}" r="44" fill="#fff" opacity="0.14"/>`
      : shape === 1
        ? `<path d="M0 ${cy + 20} Q32 ${cy - 10} 64 ${cy + 20} T128 ${cy + 20} V128 H0Z" fill="#fff" opacity="0.16"/>`
        : `<rect x="${cx - 40}" y="${cy - 40}" width="80" height="80" rx="18" transform="rotate(${angle} ${cx} ${cy})" fill="#fff" opacity="0.13"/>`;

  return svg(
    `<defs><linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
      `<rect width="128" height="128" fill="url(#g)"/>${deco}` +
      `<text x="64" y="66" text-anchor="middle" dominant-baseline="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="${size}" fill="#0a0a0a" opacity="0.82">${escape(text)}</text>`,
  );
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Round logo for a quote/counter asset. */
function coin(from: string, to: string, label: string) {
  return svg(
    `<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
      `<circle cx="64" cy="64" r="64" fill="url(#c)"/>` +
      `<text x="64" y="68" text-anchor="middle" dominant-baseline="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="${label.length > 1 ? 40 : 56}" fill="#fff">${label}</text>`,
  );
}

export const SOL_LOGO = svg(
  `<defs><linearGradient id="s" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs>` +
    `<circle cx="64" cy="64" r="64" fill="#0a0a0a"/>` +
    `<g fill="url(#s)"><path d="M38 80h50l-10 10H28z"/><path d="M38 59h50l-10 10H28z" transform="translate(0 0) scale(1 1)"/><path d="M28 38h50l10 10H38z"/></g>`,
);
export const USDC_LOGO = coin("#2775CA", "#1A4F8B", "$");
export const USDT_LOGO = coin("#26A17B", "#167A5B", "₮");

/** Icon for the built-in demo wallet. */
export const DEMO_WALLET_ICON = svg(
  `<defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#94EDFF"/><stop offset=".55" stop-color="#E9F4EE"/><stop offset="1" stop-color="#FBD191"/></linearGradient></defs>` +
    `<rect width="128" height="128" rx="28" fill="url(#w)"/>` +
    `<rect x="26" y="40" width="76" height="52" rx="12" fill="none" stroke="#0a0a0a" stroke-width="8"/>` +
    `<circle cx="84" cy="66" r="6" fill="#0a0a0a"/>`,
);
