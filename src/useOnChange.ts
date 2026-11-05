import { useEffect, useRef } from "react";

/** Calls `onChange(previous, current)` whenever `value` changes after mount (never on first render). */
export function useOnChange<T>(value: T, onChange: (prev: T, next: T) => void): void {
  const prev = useRef(value);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    if (prev.current !== value) {
      cb.current(prev.current, value);
      prev.current = value;
    }
  }, [value]);
}
