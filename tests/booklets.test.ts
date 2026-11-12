import test from "node:test";
import assert from "node:assert/strict";
import { SLOT_PRESETS, bookletCapacity, detectSlots, normalizeSlot, parseSlots } from "../lib/booklets";

function sketch(width: number, height: number, boxes: [number, number, number, number][], frame = false) {
  const data = new Uint8ClampedArray(width * height * 4).fill(245);
  const ink = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = 30;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let t = 0; t < 2; t += 1) {
      for (let x = x0; x <= x1; x += 1) {
        ink(x, y0 + t);
        ink(x, y1 - t);
      }
      for (let y = y0; y <= y1; y += 1) {
        ink(x0 + t, y);
        ink(x1 - t, y);
      }
    }
  };
  if (frame) rect(4, 4, width - 5, height - 5);
  boxes.forEach(([x0, y0, x1, y1]) => rect(x0, y0, x1, y1));
  return data;
}

test("detects hand-drawn photo boxes in reading order", () => {
  const data = sketch(200, 150, [
    [20, 15, 180, 80],
    [20, 95, 95, 135],
    [105, 95, 180, 135],
  ]);
  const slots = detectSlots(data, 200, 150);
  assert.equal(slots.length, 3);
  assert.ok(slots[0].w > 0.75 && slots[0].y < 0.15);
  assert.ok(slots[1].x < slots[2].x);
});

test("ignores a drawn page frame around the boxes", () => {
  const data = sketch(200, 200, [[30, 30, 90, 170], [110, 30, 170, 170]], true);
  assert.equal(detectSlots(data, 200, 200).length, 2);
});

test("boxes with an X drawn through them still count as one slot", () => {
  const width = 200;
  const height = 150;
  const data = sketch(width, height, [[20, 20, 180, 130]]);
  for (let t = 0; t <= 100; t += 1) {
    for (const [x, y] of [
      [Math.round(22 + t * 1.56), Math.round(22 + t * 1.06)],
      [Math.round(178 - t * 1.56), Math.round(22 + t * 1.06)],
    ]) {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 30;
    }
  }
  const slots = detectSlots(data, width, height);
  assert.equal(slots.length, 1);
  assert.ok(slots[0].w > 0.75 && slots[0].h > 0.7);
});

test("an empty page finds nothing", () => {
  assert.deepEqual(detectSlots(sketch(120, 120, []), 120, 120), []);
});

test("slots are clamped inside the page and untrusted input is cleaned", () => {
  assert.deepEqual(normalizeSlot({ x: 0.9, y: -1, w: 0.5, h: 0.5 }), { x: 0.5, y: 0, w: 0.5, h: 0.5 });
  assert.equal(parseSlots([{ x: 0, y: 0, w: 1, h: 1 }, { x: "a" }, null]).length, 1);
  assert.deepEqual(parseSlots("nope"), []);
});

test("capacity counts slots, falling back to the legacy page count", () => {
  const grid = SLOT_PRESETS.find((preset) => preset.id === "grid")!;
  assert.equal(bookletCapacity([{ slots: grid.slots }, { slots: grid.slots }], 40), 8);
  assert.equal(bookletCapacity([], 40), 40);
});
