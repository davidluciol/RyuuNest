import { useId } from "react";

import "./field.css";

/** F25 — campo de texto web con etiqueta y error (los textos llegan por props). */
export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  error?: string | undefined;
  testID?: string | undefined;
  autoFocus?: boolean | undefined;
}

export default function TextField({ label, value, onChange, placeholder, error, testID, autoFocus }: TextFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label className="t-label-md field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`field-input t-body-md${error !== undefined ? " field-input-error" : ""}`}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        data-testid={testID}
        autoFocus={autoFocus}
      />
      {error !== undefined && (
        <p className="t-body-sm field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
