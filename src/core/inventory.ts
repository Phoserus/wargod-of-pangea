export type Bag = Record<string, number>;

export function isQty(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

export function hasAll(bag: Bag, need: Bag): boolean {
  return Object.entries(need).every(([id, n]) => (bag[id] ?? 0) >= n);
}

export function addItem(bag: Bag, id: string, n: number): Bag {
  return { ...bag, [id]: (bag[id] ?? 0) + n };
}

/** Returns null when the bag does not hold enough. Zero entries are removed. */
export function removeItem(bag: Bag, id: string, n: number): Bag | null {
  const have = bag[id] ?? 0;
  if (have < n) return null;
  const next = { ...bag };
  if (have === n) delete next[id];
  else next[id] = have - n;
  return next;
}

/** Atomically consume `inputs` and add `outputs`; null if the inputs aren't all present. */
export function exchange(bag: Bag, inputs: Bag, outputs: Bag): Bag | null {
  if (!hasAll(bag, inputs)) return null;
  let next = bag;
  for (const [id, n] of Object.entries(inputs)) next = removeItem(next, id, n) as Bag;
  for (const [id, n] of Object.entries(outputs)) next = addItem(next, id, n);
  return next;
}
