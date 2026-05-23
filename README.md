# pea-ate

A browser-only Pico-8 cart editor. Load a `.p8` or `.p8.png` file, view and edit the spritesheet and map, swap palette colours, and export a modified `.p8` with your changes baked in.

**[Try it online](https://pea-ate.netlify.app)**

## Features

- **Spritesheet view** — renders the 128×128 sprite sheet using the current palette
- **Map editor** — paint tiles, flood fill, eraser, multi-tile brush, variable map width, undo
- **Palette editor** — remap any of the 16 draw palette slots to any standard or secret colour; save named palette snapshots
- **Label view** — view and remap colours in the cart's cover image
- **Sprite inspector** — select a region of the spritesheet and compare it against saved palettes
- **Export `.p8`** — writes a `__meta:pea-ate__` block to preserve your palette settings across sessions, and generates `pal()` Lua snippets ready to paste into your cart
- **Drag & drop** — supports both `.p8` text carts and `.p8.png` steganographic carts

## Running locally

Requires Node.js 18+.

```bash
git clone https://github.com/Athas1980/pea-ate.git
cd pea-ate
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Building

```bash
npm run build   # output goes to dist/
```

The build uses `base: './'` so `dist/index.html` can be opened directly from the filesystem without a server.

## Sample carts

The bundled sample carts are public domain works by their respective authors. If you'd like your cart included as a sample, [raise an issue](https://github.com/Athas1980/pea-ate/issues/new?labels=sample-cart&title=Sample+cart+request%3A+%5Bcart+name%5D&body=**Cart+name%3A**+%0A**Author%3A**+%0A**Source+URL%3A**+%0A**License%2Fpermission%3A**+).

## Contributing

Bug reports and feature requests welcome via [GitHub Issues](https://github.com/Athas1980/pea-ate/issues).

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4
