"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UnsavedEditorGuardProps = {
  formId?: string;
};

const internalNavigationMessage =
  "저장하지 않은 내용이 있습니다. 임시저장을 원하면 공개 상태를 비공개로 선택한 뒤 저장하고 이동해 주세요. 지금 이동하면 작성 중인 내용은 저장되지 않습니다.";

const editorSavedEventName = "cms-editor-form-saved";
const editorDirtyChangeEventName = "cms-editor-dirty-change";

type EditorDirtyChangeDetail = {
  dirty: boolean;
  formId?: string;
};

export function UnsavedEditorGuard({ formId }: UnsavedEditorGuardProps) {
  const router = useRouter();
  const dirtyRef = useRef(false);
  const armedRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState("");

  useEffect(() => {
    const form = formId ? document.getElementById(formId) : null;
    if (!form) {
      return;
    }

    const armTimer = window.setTimeout(() => {
      armedRef.current = true;
    }, 400);

    const setDirtyState = (nextDirty: boolean) => {
      if (dirtyRef.current === nextDirty) {
        return;
      }

      dirtyRef.current = nextDirty;
      setDirty(nextDirty);
      notifyEditorDirtyChange(formId, nextDirty);
    };

    const markDirty = () => {
      if (!armedRef.current) {
        return;
      }

      setDirtyState(true);
    };

    const markClean = () => {
      setDirtyState(false);
      setPendingHref("");
    };

    const handleSubmit = () => {
      markClean();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented) {
        return;
      }

      const anchor = findNavigationAnchor(event.target);
      if (!anchor || shouldIgnoreAnchorClick(event, anchor)) {
        return;
      }

      const nextHref = anchor.href;
      if (!nextHref || nextHref === window.location.href) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(nextHref);
    };

    const handleFormClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest<HTMLButtonElement>("button");
      if (!button || button.type === "submit" || button.disabled) {
        return;
      }

      markDirty();
    };

    form.addEventListener("input", markDirty, true);
    form.addEventListener("change", markDirty, true);
    form.addEventListener("click", handleFormClick, true);
    form.addEventListener("submit", handleSubmit, true);
    window.addEventListener("cms-rich-editor-change", markDirty);
    window.addEventListener(editorSavedEventName, markClean);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.clearTimeout(armTimer);
      form.removeEventListener("input", markDirty, true);
      form.removeEventListener("change", markDirty, true);
      form.removeEventListener("click", handleFormClick, true);
      form.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("cms-rich-editor-change", markDirty);
      window.removeEventListener(editorSavedEventName, markClean);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [formId]);

  if (!dirty || !pendingHref) {
    return null;
  }

  return (
    <div
      className="unsaved-editor-guard-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setPendingHref("");
        }
      }}
    >
      <div aria-modal="true" className="unsaved-editor-guard-dialog" role="dialog" aria-labelledby="unsaved-editor-guard-title">
        <h2 id="unsaved-editor-guard-title">저장하지 않은 내용이 있습니다</h2>
        <p>{internalNavigationMessage}</p>
        <div className="unsaved-editor-guard-actions">
          <button type="button" className="button-secondary" onClick={() => setPendingHref("")}>
            계속 작성
          </button>
          <button type="button" className="button" onClick={() => continueNavigation(pendingHref, router.push)}>
            이동
          </button>
        </div>
      </div>
    </div>
  );
}

export function notifyEditorFormSaved(formId?: string) {
  window.dispatchEvent(new Event(editorSavedEventName));
  notifyEditorDirtyChange(formId, false);
}

export function useEditorFormDirty(formId?: string, enabled = true) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!enabled || !formId) {
      return;
    }

    const handleDirtyChange = (event: Event) => {
      const detail = (event as CustomEvent<EditorDirtyChangeDetail>).detail;
      if (!detail || detail.formId !== formId) {
        return;
      }

      setDirty(detail.dirty);
    };

    window.addEventListener(editorDirtyChangeEventName, handleDirtyChange);
    return () => window.removeEventListener(editorDirtyChangeEventName, handleDirtyChange);
  }, [enabled, formId]);

  return dirty;
}

function notifyEditorDirtyChange(formId: string | undefined, dirty: boolean) {
  const detail: EditorDirtyChangeDetail = { dirty, formId };
  window.dispatchEvent(new CustomEvent<EditorDirtyChangeDetail>(editorDirtyChangeEventName, { detail }));

  if (window.parent !== window) {
    window.parent.postMessage({ type: editorDirtyChangeEventName, ...detail }, window.location.origin);
  }
}

function findNavigationAnchor(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
}

function shouldIgnoreAnchorClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download")
  );
}

function continueNavigation(href: string, push: (href: string) => void) {
  const nextUrl = new URL(href, window.location.href);
  const currentUrl = new URL(window.location.href);
  const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

  if (nextUrl.origin === currentUrl.origin) {
    push(nextPath);
    return;
  }

  window.location.assign(href);
}
