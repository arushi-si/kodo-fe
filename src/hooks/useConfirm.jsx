import { useCallback, useRef, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

// const [confirm, confirmModal] = useConfirm();
// if (await confirm({ title, message, confirmLabel, danger })) { ... }
// Render {confirmModal} once in the component.
export default function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOptions(opts);
      }),
    [],
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  const modal = (
    <ConfirmModal
      open={Boolean(options)}
      {...options}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return [confirm, modal];
}
