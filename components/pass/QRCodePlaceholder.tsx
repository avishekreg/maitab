"use client";

/**
 * Self-contained QR-style matrix derived from the payload hash.
 * Keeps the MVP free of extra QR libs on the customer pass surface.
 */
export function QRCodePlaceholder({ value }: { value: string }) {
  const size = 21;
  const cells: boolean[] = [];
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const finder =
        (x < 7 && y < 7) ||
        (x > size - 8 && y < 7) ||
        (x < 7 && y > size - 8);
      if (finder) {
        const onBorder =
          x === 0 ||
          y === 0 ||
          x === 6 ||
          y === 6 ||
          x === size - 1 ||
          y === size - 1 ||
          x === size - 7 ||
          y === size - 7 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3);
        cells.push(onBorder);
      } else {
        const n = (hash ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
        cells.push(n % 3 !== 0);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-52 w-52"
      role="img"
      aria-label="Member pass QR"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {cells.map((on, index) => {
        if (!on) return null;
        const x = index % size;
        const y = Math.floor(index / size);
        return <rect key={index} x={x} y={y} width="1" height="1" fill="#08090C" />;
      })}
    </svg>
  );
}
