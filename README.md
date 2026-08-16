# Minecraft Shape Tool

A browser-based helper for planning Minecraft builds. It generates block-by-block grids for common curved shapes so you can follow them layer-by-layer in game.

Open [index.html](index.html) in a browser — no build step or server required.

## Builders

- **Circle Builder** — ring outline from a diameter and ring width.
- **Ellipse Builder** — ring outline from a width, height, and ring width.
- **Arch Builder** — an arch/doorway opening controlled by total width/height, wall thickness, deck thickness, and a shape factor (superellipse exponent).
- **Dome Builder** — a full dome profile plus a per-level breakdown, each level showing its own circle outline and diameter.

Each grid cell is either a block (dark, numbered with its run length along the row) or air (light), which makes it easy to count consecutive blocks while placing them.

## Files

- [index.html](index.html) — page shell and tab container
- [script.js](script.js) — grid generation math and rendering logic for all four builders
- [styles.css](styles.css) — layout and grid/cell styling
- [minecraft_shape_tool.xlsx](minecraft_shape_tool.xlsx) — original spreadsheet version of the tool
