export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#153E75" />
      <path
        d="M16 5.5l8.5 3.2v6.1c0 5.3-3.6 9.8-8.5 11.6-4.9-1.8-8.5-6.3-8.5-11.6V8.7z"
        fill="none"
        stroke="#F5C542"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 16.2l3 3 5.2-6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
