import { addItem, isQty, removeItem, type Bag } from "../inventory";

export interface EconomyState {
  currency: number;
  inventory: Bag;
  bank: Bag;
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
  if (from === to || !isQty(qty)) return state;
  const src = removeItem(state[from], itemId, qty);
  if (!src) return state;
  return { ...state, [from]: src, [to]: addItem(state[to], itemId, qty) };
}

export interface ShopItem {
  itemId: string;
  price: number;
}

function validPrice(p: number): boolean {
  return Number.isInteger(p) && p >= 0;
}

export function buy(state: EconomyState, shopItem: ShopItem, qty: number): EconomyState {
  if (!isQty(qty) || !validPrice(shopItem.price)) return state;
  const cost = shopItem.price * qty;
  if (state.currency < cost) return state;
  return {
    ...state,
    currency: state.currency - cost,
    inventory: addItem(state.inventory, shopItem.itemId, qty),
  };
}

export function sell(
  state: EconomyState,
  itemId: string,
  price: number,
  qty: number,
): EconomyState {
  if (!isQty(qty) || !validPrice(price)) return state;
  const inventory = removeItem(state.inventory, itemId, qty);
  if (!inventory) return state;
  return { ...state, currency: state.currency + price * qty, inventory };
}
