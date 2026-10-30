/** Deterministic gradient avatar for an address; no network, no external identicon service. */
export function AddressAvatar({ address, size = 32 }: { address: string; size?: number }) {
  const seed = address.toLowerCase().replace(/^0x/, "").padEnd(40, "0");
  const hue = (index: number) => Math.round((parseInt(seed.slice(index, index + 4), 16) / 0xffff) * 360);
  const a = hue(0);
  const b = (a + 60 + (hue(8) % 120)) % 360;
  const angle = hue(16) % 360;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from ${angle}deg, hsl(${a} 80% 62%), hsl(${b} 85% 55%), hsl(${a} 80% 62%))`,
      }}
    />
  );
}
