import { useEffect, useRef, useState } from "react";

import Button from "./Button";

/**
 * F25 — botón de confirmación reforzada web (SPEC §7.1 paso 3): hay que
 * mantenerlo pulsado un segundo y medio; soltarlo antes cancela. Para módulos
 * `script` (ejecutan código).
 */
export interface HoldToConfirmProps {
  label: string;
  holdingLabel: string;
  onConfirm: () => void;
  disabled?: boolean | undefined;
  testID?: string | undefined;
}

const HOLD_MS = 1500;

export default function HoldToConfirm({ label, holdingLabel, onConfirm, disabled, testID }: HoldToConfirmProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timer.current !== undefined) clearTimeout(timer.current);
    },
    [],
  );

  const cancel = () => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  };

  const start = () => {
    if (disabled === true) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      setHolding(false);
      onConfirm();
    }, HOLD_MS);
  };

  return (
    <div
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      data-testid={testID === undefined ? undefined : `${testID}-hold`}
    >
      <Button
        variant="primary"
        label={holding ? holdingLabel : label}
        disabled={disabled}
        testID={testID}
      />
    </div>
  );
}
