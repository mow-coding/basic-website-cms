"use client";

import { useEffect, useMemo, useState } from "react";

type BulkAction = {
  label: string;
  tone?: "danger" | "secondary";
  value: string;
};

type BulkSelectionControlsProps = {
  actions: BulkAction[];
  formId: string;
  itemName: string;
};

export function BulkSelectionControls({ actions, formId, itemName }: BulkSelectionControlsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const allSelected = useMemo(() => totalCount > 0 && selectedCount === totalCount, [selectedCount, totalCount]);
  const isPending = pendingAction !== null;

  useEffect(() => {
    const updateCounts = () => {
      const checkboxes = getBulkCheckboxes(formId);
      setTotalCount(checkboxes.length);
      setSelectedCount(checkboxes.filter((checkbox) => checkbox.checked).length);
      syncSelectedBulkInputs(formId);
    };

    updateCounts();
    document.addEventListener("change", updateCounts);

    return () => {
      document.removeEventListener("change", updateCounts);
    };
  }, [formId]);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const handleSubmit = (event: Event) => {
      syncSelectedBulkInputs(formId);
      const submitter = (event as SubmitEvent).submitter;
      if (submitter instanceof HTMLButtonElement && submitter.name === "bulkAction") {
        syncBulkActionInput(formId, submitter.value);
        setPendingAction(submitter.value || "pending");
        return;
      }

      setPendingAction("pending");
    };

    form.addEventListener("submit", handleSubmit);

    return () => {
      form.removeEventListener("submit", handleSubmit);
    };
  }, [formId]);

  const toggleAll = () => {
    const checkboxes = getBulkCheckboxes(formId);
    const nextChecked = !allSelected;
    checkboxes.forEach((checkbox) => {
      checkbox.checked = nextChecked;
    });
    syncSelectedBulkInputs(formId);
    setTotalCount(checkboxes.length);
    setSelectedCount(nextChecked ? checkboxes.length : 0);
  };

  const prepareSubmit = (actionValue: string) => {
    syncBulkActionInput(formId, actionValue);
    syncSelectedBulkInputs(formId);
  };

  return (
    <div className="bulk-toolbar" aria-label={`${itemName} 일괄 작업`} aria-busy={isPending}>
      <button className="button-secondary button-compact" type="button" onClick={toggleAll} disabled={totalCount === 0 || isPending}>
        <CheckedBoxIcon />
        {allSelected ? "전체 해제" : "전체 선택"}
      </button>
      <div className="bulk-actions">
        {actions.map((action) => (
          <button
            className={action.tone === "danger" ? "button-danger button-compact" : "button-secondary button-compact"}
            disabled={selectedCount === 0 || isPending}
            form={formId}
            key={action.value}
            name="bulkAction"
            aria-busy={pendingAction === action.value}
            type="submit"
            value={action.value}
            onClick={() => prepareSubmit(action.value)}
          >
            {getBulkActionIcon(action.value)}
            {pendingAction === action.value ? "처리 중..." : getBulkActionLabel(action, selectedCount)}
          </button>
        ))}
      </div>
    </div>
  );
}

function getBulkActionLabel(action: BulkAction, selectedCount: number) {
  if (action.value === "trash") {
    return `현재 선택된 ${selectedCount}개를 휴지통으로 이동`;
  }

  if (action.value === "restore") {
    return `현재 선택된 ${selectedCount}개를 복구`;
  }

  if (action.value === "permanent-delete") {
    return `현재 선택된 ${selectedCount}개를 완전 삭제`;
  }

  return action.label;
}

function getBulkActionIcon(value: string) {
  if (value === "trash" || value === "permanent-delete") {
    return <TrashIcon />;
  }

  if (value === "restore") {
    return <RestoreIcon />;
  }

  return null;
}

function CheckedBoxIcon() {
  return (
    <svg aria-hidden="true" className="bulk-button-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M5 5h14v14h-14z" />
      <path d="M9 12l2 2l4-5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="bulk-button-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7v-3h6v3" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg aria-hidden="true" className="bulk-button-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M9 14l-4-4l4-4" />
      <path d="M5 10h10a4 4 0 1 1 0 8h-1" />
    </svg>
  );
}

function syncSelectedBulkInputs(formId: string) {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.querySelectorAll<HTMLInputElement>('input[type="hidden"][data-bulk-clone="true"]').forEach((input) => input.remove());

  getBulkCheckboxes(formId)
    .filter((checkbox) => checkbox.checked)
    .forEach((checkbox) => {
      const clone = document.createElement("input");
      clone.type = "hidden";
      clone.name = checkbox.name;
      clone.value = checkbox.value;
      clone.dataset.bulkClone = "true";
      form.appendChild(clone);
    });
}

function syncBulkActionInput(formId: string, actionValue: string) {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const existingInput = form.querySelector<HTMLInputElement>('input[type="hidden"][data-bulk-action="true"]');
  const actionInput = existingInput ?? document.createElement("input");
  actionInput.type = "hidden";
  actionInput.name = "bulkAction";
  actionInput.value = actionValue;
  actionInput.dataset.bulkAction = "true";

  if (!existingInput) {
    form.appendChild(actionInput);
  }
}

function getBulkCheckboxes(formId: string) {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-bulk-item]:not(:disabled)')).filter(
    (checkbox) => checkbox.getAttribute("form") === formId
  );
}
