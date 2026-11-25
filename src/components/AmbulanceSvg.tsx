/** Ambulance dessinée (vectorielle), avec gyrophares qui clignotent. */
export function AmbulanceSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="amb-carros" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe5ee" />
        </linearGradient>
        <linearGradient id="amb-vitre" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe0ff" />
          <stop offset="1" stopColor="#5d93c9" />
        </linearGradient>
        <radialGradient id="amb-halo-r">
          <stop offset="0" stopColor="#ff5a6a" stopOpacity=".95" />
          <stop offset="1" stopColor="#ff5a6a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="amb-halo-b">
          <stop offset="0" stopColor="#5ab0ff" stopOpacity=".95" />
          <stop offset="1" stopColor="#5ab0ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Halos des gyrophares */}
      <circle className="amb-flash-r" cx="70" cy="14" r="26" fill="url(#amb-halo-r)" />
      <circle className="amb-flash-b" cx="104" cy="14" r="26" fill="url(#amb-halo-b)" />
      {/* Ombre au sol */}
      <ellipse cx="110" cy="110" rx="96" ry="7" fill="#000" opacity=".25" />
      {/* Caisse arrière */}
      <rect
        x="14"
        y="22"
        width="132"
        height="72"
        rx="10"
        fill="url(#amb-carros)"
        stroke="#1b2433"
        strokeWidth="3"
      />
      {/* Cabine */}
      <path
        d="M146 40 H178 Q186 40 191 48 L204 68 Q208 74 208 80 V88 Q208 94 202 94 H146 Z"
        fill="url(#amb-carros)"
        stroke="#1b2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M154 47 H176 Q181 47 184 52 L194 68 H154 Z"
        fill="url(#amb-vitre)"
        stroke="#1b2433"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Bande rouge et damier */}
      <rect x="14" y="68" width="194" height="9" fill="#C8283A" />
      <g fill="#F5C542">
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={18 + i * 12} y="80" width="6" height="6" />
        ))}
      </g>
      {/* Croix */}
      <g transform="translate(58 44)">
        <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#C8283A" />
        <path d="M-4 -11 h8 v7 h7 v8 h-7 v7 h-8 v-7 h-7 v-8 h7z" fill="#fff" />
      </g>
      {/* Porte */}
      <rect
        x="104"
        y="30"
        width="34"
        height="36"
        rx="4"
        fill="none"
        stroke="#1b2433"
        strokeWidth="2"
        opacity=".5"
      />
      {/* Gyrophares */}
      <rect
        className="amb-feu-r"
        x="62"
        y="12"
        width="16"
        height="10"
        rx="3"
        fill="#ff3b4f"
        stroke="#1b2433"
        strokeWidth="2"
      />
      <rect
        className="amb-feu-b"
        x="96"
        y="12"
        width="16"
        height="10"
        rx="3"
        fill="#2f8cff"
        stroke="#1b2433"
        strokeWidth="2"
      />
      {/* Phare */}
      <rect x="200" y="74" width="8" height="7" rx="2" fill="#FFE08A" />
      {/* Roues */}
      {[50, 172].map((x) => (
        <g key={x}>
          <circle cx={x} cy="96" r="15" fill="#1b2433" />
          <circle cx={x} cy="96" r="7" fill="#c9ced6" />
        </g>
      ))}
    </svg>
  );
}
