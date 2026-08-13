/** Client-safe 4-digit floor token helpers (#1000–#9999) */

export function generateOrderTokenCode(existing: Iterable<number>): number {
  const taken = new Set(
    Array.from(existing).filter((n) => n >= 1000 && n <= 9999)
  );

  const roll = (): number => {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return 1000 + ((buf[0] ?? 0) % 9000);
    }
    return 1000 + Math.floor(Math.random() * 9000);
  };

  for (let i = 0; i < 40; i += 1) {
    const code = roll();
    if (!taken.has(code)) return code;
  }
  for (let code = 1000; code <= 9999; code += 1) {
    if (!taken.has(code)) return code;
  }
  return roll();
}

export function formatTokenDisplay(token: number): string {
  return `#${String(Math.abs(token) % 10000).padStart(4, "0")}`;
}
