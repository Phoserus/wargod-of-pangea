import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface MergeCombineState extends PrimitiveState {
  board: number[];
  target: number;
  moves: number;
  moveLimit: number;
}

export const mergeCombinePrimitive: Primitive<MergeCombineState> = {
  id: "MergeCombine",
  configSchema: {
    boardSize: "number",
    reagentCount: "number",
    targetTier: "number",
    moveLimit: "number",
  },
  create(seed, config) {
    const rng = createRng(seed);
    const boardSize = (config.boardSize as number) ?? 5;
    const reagentCount = (config.reagentCount as number) ?? 4;
    const targetTier = (config.targetTier as number) ?? 3;
    const moveLimit = (config.moveLimit as number) ?? 10;
    const board: number[] = [];
    for (let i = 0; i < boardSize; i++) {
      board.push(Math.floor(rng() * reagentCount) + 1);
    }
    const target = Math.min(reagentCount + targetTier - 1, reagentCount * 2);
    return {
      status: "playing",
      board,
      target,
      moves: 0,
      moveLimit,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (state.moves >= state.moveLimit) {
      return { ...state, status: "lost" };
    }
    if (typeof action === "number" && Number.isInteger(action)) {
      const index = action;
      if (index < 0 || index >= state.board.length - 1) return state;
      const left = state.board[index];
      const right = state.board[index + 1];
      if (left === right && left > 0) {
        const nextBoard = [...state.board];
        nextBoard[index] = left + 1;
        nextBoard[index + 1] = 0;
        // Shift zeros to the end and refill
        const tiles = nextBoard.filter((t) => t > 0);
        while (tiles.length < state.board.length) {
          tiles.push(Math.floor(Math.random() * 4) + 1);
        }
        const nextMoves = state.moves + 1;
        const won = tiles.some((t) => t >= state.target);
        return {
          ...state,
          board: tiles,
          moves: nextMoves,
          status: won ? "won" : nextMoves >= state.moveLimit ? "lost" : "playing",
        };
      }
      const nextMoves = state.moves + 1;
      return {
        ...state,
        moves: nextMoves,
        status: nextMoves >= state.moveLimit ? "lost" : "playing",
      };
    }
    return state;
  },
};
