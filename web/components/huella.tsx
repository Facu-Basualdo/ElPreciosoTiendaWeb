// Huella de perro: la "O" del logo (El Precioso lleva el nombre del perro de la dueña).
export function Huella({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <ellipse cx="12" cy="16.2" rx="5.2" ry="4.4" />
      <ellipse cx="4.6" cy="10.4" rx="2.2" ry="2.7" transform="rotate(-22 4.6 10.4)" />
      <ellipse cx="9.2" cy="5.4" rx="2.3" ry="2.9" transform="rotate(-8 9.2 5.4)" />
      <ellipse cx="14.8" cy="5.4" rx="2.3" ry="2.9" transform="rotate(8 14.8 5.4)" />
      <ellipse cx="19.4" cy="10.4" rx="2.2" ry="2.7" transform="rotate(22 19.4 10.4)" />
    </svg>
  );
}
