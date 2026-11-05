export interface EconomyState {
  currency: number;
  inventory: Record<string, number>;
  bank: Record<string, number>;
}

export function createEconomy(): EconomyState {
  return { currency: 0, inventory: {}, bank: {} };
}

export function moveItem(
  state: EconomyState,
  itemId: string,
  qty: number,
  from: "inventory" | "bank",
  to: "inventory" | "bank",
): EconomyState {
  if (from === to) return state;
  const src = from === "inventory" ? state.inventory : state.bank;
  if ((src[itemId] ?? 0) < qty) return state;
  const next = {
    ...state,
    inventory: { ...state.inventory },
    bank: { ...state.bank },
  };
  const nSrc = from === "inventory" ? next.inventory : next.bank;
  const nDst = to === "inventory" ? next.inventory : next.bank;
  nSrc[itemId] -= qty;
  nDst[itemId] = (nDst[itemId] ?? 0) + qty;
  return next;
}

export interface ShopItem {
  itemId: string;
  price: number;
}

export function buy(state: EconomyState, shopItem: ShopItem, qty: number): EconomyState {
  const cost = shopItem.price * qty;
  if (state.currency < cost) return state;
  const next = {
    ...state,
    currency: state.currency - cost,
    inventory: { ...state.inventory },
  };
  next.inventory[shopItem.itemId] = (next.inventory[shopItem.itemId] ?? 0) + qty;
  return next;
}

export function sell(
  state: EconomyState,
  itemId: string,
  price: number,
  qty: number,
): EconomyState {
  if ((state.inventory[itemId] ?? 0) < qty) return state;
  const next = {
    ...state,
    currency: state.currency + price * qty,
    inventory: { ...state.inventory },
  };
  next.inventory[itemId] -= qty;
  return next;
}
