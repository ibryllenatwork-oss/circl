"use client";

import { useEffect, useRef } from "react";

/** After a failed save (formKey changes), move focus to the first invalid field. */
export function useFocusFirstError(formKey: string) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (formKey === "initial") return;
    const first = ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (first) {
      first.focus();
      first.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [formKey]);
  return ref;
}
