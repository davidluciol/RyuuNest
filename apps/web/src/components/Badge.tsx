import "./badge.css";

/** F25 — insignia de estado (máx. 2 por fila, V8/V9): pastilla con borde suave. */
export interface BadgeProps {
  label: string;
  tone?: "neutral" | "warning" | "error" | undefined;
  testID?: string | undefined;
}

export default function Badge({ label, tone = "neutral", testID }: BadgeProps) {
  return (
    <span className={`badge t-label-sm badge-${tone}`} data-testid={testID}>
      {label}
    </span>
  );
}
