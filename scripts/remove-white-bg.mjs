/**
 * Removes the background from Logo.png using a flood-fill from the image edges.
 * This preserves white elements (camera brackets) that are inside the logo.
 */
import { Jimp } from 'jimp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '../src/assets/images/Logo.png');

const img = await Jimp.read(FILE);
const { width, height, data } = img.bitmap;

// Helper: get flat index for pixel (x, y)
const idx = (x, y) => (y * width + x) * 4;

// Is pixel near-white (background)?
const isBackground = (x, y) => {
  const i = idx(x, y);
  return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200 && data[i + 3] > 128;
};

// Make pixel transparent
const erase = (x, y) => { data[idx(x, y) + 3] = 0; };

// Flood-fill BFS from all edge pixels
const visited = new Uint8Array(width * height);
const queue = [];

for (let x = 0; x < width; x++) {
  if (isBackground(x, 0))        { visited[0 * width + x] = 1; queue.push([x, 0]); }
  if (isBackground(x, height-1)) { visited[(height-1) * width + x] = 1; queue.push([x, height-1]); }
}
for (let y = 0; y < height; y++) {
  if (isBackground(0, y))       { visited[y * width + 0] = 1; queue.push([0, y]); }
  if (isBackground(width-1, y)) { visited[y * width + (width-1)] = 1; queue.push([width-1, y]); }
}

const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
let head = 0;
while (head < queue.length) {
  const [cx, cy] = queue[head++];
  erase(cx, cy);
  for (const [dx, dy] of dirs) {
    const nx = cx + dx, ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (visited[ny * width + nx]) continue;
    if (!isBackground(nx, ny)) continue;
    visited[ny * width + nx] = 1;
    queue.push([nx, ny]);
  }
}

await img.write(FILE);
console.log('✅  Background removed (flood-fill) →', FILE);
