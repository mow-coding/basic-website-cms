"use client";

import { useFormStatus } from "react-dom";
import { useEditorFormDirty } from "@/app/site-admin/unsaved-editor-guard";

type FormSubmitButtonProps = {
  label: string;
  className?: string;
  formId?: string;
  pendingLabel?: string;
  requireDirty?: boolean;
};

export function FormSubmitButton({
  label,
  className = "button board-submit-button",
  formId,
  pendingLabel = "저장 중...",
  requireDirty = false
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const dirty = useEditorFormDirty(formId, requireDirty);
  const disabled = pending || (requireDirty && !dirty);

  return (
    <button
      className={className}
      type="submit"
      disabled={disabled}
      aria-busy={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
