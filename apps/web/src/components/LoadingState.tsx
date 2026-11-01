import "./loadingState.css";

/** F25 — estado de carga (SPEC §11.12): texto centrado, sin animación. */
export default function LoadingState({ label, testID }: { label: string; testID?: string | undefined }) {
  return (
    <div className="loading-state" data-testid={testID} role="status">
      <p className="t-body-lg">{label}</p>
    </div>
  );
}
