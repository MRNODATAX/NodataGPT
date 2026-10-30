interface ToolsIconProps {
  className?: string;
  dualTone?: boolean;
}

/**
 * Custom crossed Wrench ("Kunci Pas") & Screwdriver ("Obeng") vector icon
 * crafted on a 24x24 grid with center-crossing occlusion gap for crisp
 * legibility at 14px–20px across mobile & desktop.
 */
export function ToolsIcon({ className = 'h-4 w-4', dualTone = true }: ToolsIconProps) {
  const wrenchStroke = dualTone ? '#22D3EE' : 'currentColor';
  const screwdriverStroke = dualTone ? '#FB923C' : 'currentColor';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Screwdriver ("Obeng"): top-left flathead tip -> shaft -> bottom-right handle */}
      <path
        d="M2.7 4.9L4.9 2.7L6.9 5.3L6.2 6.2L5.3 6.9Z"
        stroke={screwdriverStroke}
      />
      <path d="M6.2 6.2L8.5 8.5" stroke={screwdriverStroke} />
      <path d="M12.8 12.8L15.1 15.1" stroke={screwdriverStroke} />
      <path
        d="M13.65 16.55L16.55 13.65L20.55 17.65A2.05 2.05 0 0 1 17.65 20.55Z"
        stroke={screwdriverStroke}
      />

      {/* Open-End Wrench ("Kunci Pas"): bottom-left handle -> top-right open jaw */}
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke={wrenchStroke}
      />
    </svg>
  );
}
