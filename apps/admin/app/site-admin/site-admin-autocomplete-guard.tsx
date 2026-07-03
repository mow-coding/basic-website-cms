"use client";

import { useEffect } from "react";

const ignoredInputTypes = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);
const managedSelector = "form,input,textarea,select";

export function SiteAdminAutocompleteGuard() {
  useEffect(() => {
    const root = document.body;

    function disableAutocomplete(target: ParentNode) {
      const elements: Element[] = [];
      if (target instanceof Element) {
        elements.push(target);
      }
      elements.push(...Array.from(target.querySelectorAll(managedSelector)));

      for (const element of elements) {
        if (element instanceof HTMLFormElement) {
          element.setAttribute("autocomplete", "off");
          continue;
        }

        if (element instanceof HTMLInputElement) {
          const type = element.type.toLowerCase();
          if (ignoredInputTypes.has(type)) {
            continue;
          }
        }

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.setAttribute("autocomplete", "off");
          element.setAttribute("data-autocomplete-disabled", "true");
        }
      }
    }

    disableAutocomplete(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            disableAutocomplete(node);
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
