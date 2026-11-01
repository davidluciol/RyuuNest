import "./chip.css";

/** F25 — chip de filtro/selección web (área táctil mínima 48 px, RNF-7). */
export interface ChipProps {
  label: string;
  active: boolean;
  onClick?: (() => void) | undefined;
  testID?: string | undefined;
}

export default function Chip({ label, active, onClick, testID }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip t-label-md${active ? " chip-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
      data-testid={testID}
    >
      {label}
    </button>
  );
}
