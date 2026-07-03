"use client";

import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpTooltip } from "@/app/site-admin/help-tooltip";
import { normalizeHttpUrl, parseLinkLines } from "@/lib/site-admin/links";

type LinkItem = {
  title: string;
  url: string;
};

const emptyDraftItem: LinkItem = { title: "", url: "" };

type LinkListInputProps = {
  defaultValue?: string;
  hint?: string;
  maxItems: number;
  name: string;
  title: string;
};

export function LinkListInput({ defaultValue = "", hint, maxItems, name, title }: LinkListInputProps) {
  const initialItems = useMemo(() => parseLinkLines(defaultValue, maxItems), [defaultValue, maxItems]);
  const rootRef = useRef<HTMLDivElement>(null);
  const draftTitleRef = useRef<HTMLInputElement>(null);
  const draftUrlRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const serializedRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<LinkItem[]>(initialItems);
  const draftItemRef = useRef<LinkItem>({ title: "", url: "" });
  const [items, setItems] = useState<LinkItem[]>(initialItems);
  const [draftItem, setDraftItem] = useState<LinkItem>({ title: "", url: "" });
  const [draftError, setDraftError] = useState("");

  const serializedItems = useMemo(
    () => getSerializableLinks(items, emptyDraftItem, maxItems),
    [items, maxItems]
  );
  const serializedValue = serializeLinks(serializedItems);
  const serializedJsonValue = JSON.stringify(serializedItems);

  const syncSerializedLinks = useCallback(
    (nextItems = itemsRef.current) => {
      const committedItems = getSerializableLinks(nextItems, emptyDraftItem, maxItems);

      if (jsonRef.current) {
        jsonRef.current.value = JSON.stringify(committedItems);
      }

      if (serializedRef.current) {
        serializedRef.current.value = serializeLinks(committedItems);
      }
    },
    [maxItems]
  );

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) {
      return;
    }

    const handleSubmit = (event: SubmitEvent) => {
      const currentDraft = {
        title: readDraftInputValue(draftTitleRef.current, draftItemRef.current.title).trim(),
        url: readDraftInputValue(draftUrlRef.current, draftItemRef.current.url).trim()
      };

      if (currentDraft.title || currentDraft.url) {
        event.preventDefault();
        event.stopPropagation();
        setDraftError("링크를 저장하려면 먼저 추가 버튼을 눌러 목록에 올려 주세요.");

        const scrollTarget = rootRef.current;
        if (scrollTarget) {
          scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        const fieldToFocus = !currentDraft.url ? draftUrlRef.current : draftTitleRef.current;
        if (fieldToFocus) {
          window.setTimeout(() => {
            fieldToFocus.focus({ preventScroll: true });
          }, 350);
        }

        return;
      }

      syncSerializedLinks();
    };

    const handleFormData = (event: FormDataEvent) => {
      const committedItems = getSerializableLinks(itemsRef.current, emptyDraftItem, maxItems);

      event.formData.set(`${name}Json`, JSON.stringify(committedItems));
      event.formData.set(`${name}Serialized`, serializeLinks(committedItems));
      event.formData.delete(name);
      event.formData.delete(`${name}DraftTitle`);
      event.formData.delete(`${name}DraftUrl`);

      committedItems.forEach((item) => {
        event.formData.append(name, `${item.title} | ${item.url}`);
      });
    };

    form.addEventListener("submit", handleSubmit, { capture: true });
    form.addEventListener("formdata", handleFormData);
    return () => {
      form.removeEventListener("submit", handleSubmit, { capture: true });
      form.removeEventListener("formdata", handleFormData);
    };
  }, [maxItems, name, syncSerializedLinks]);

  return (
    <div className="attachment-panel link-list-field" aria-label={title} ref={rootRef}>
      <div className="attachment-panel-head">
        <span className="upload-label">{title}</span>
        {hint ? <HelpTooltip>{hint}</HelpTooltip> : null}
      </div>
      <div className="attachment-panel-body">
        <input
          ref={jsonRef}
          name={`${name}Json`}
          defaultValue={serializedJsonValue}
          type="hidden"
          readOnly
        />
        <input
          ref={serializedRef}
          name={`${name}Serialized`}
          defaultValue={serializedValue}
          type="hidden"
          readOnly
        />
        {serializedItems.map((item) => (
          <input
            key={`${item.url}-${item.title}`}
            name={name}
            type="hidden"
            value={`${item.title} | ${item.url}`}
            readOnly
          />
        ))}
        <div className="attachment-entry-zone link-entry-zone">
          <div className="link-list-row">
            <input
              aria-label="링크 이름"
              autoComplete="off"
              className="text-input"
              name={`${name}DraftTitle`}
              ref={draftTitleRef}
              type="text"
              placeholder="링크 이름"
              value={draftItem.title}
              onKeyDown={handleDraftKeyDown}
              onPaste={handleDraftPaste("title")}
              onChange={handleDraftChange("title")}
            />
            <input
              aria-label="URL"
              autoComplete="off"
              className="text-input"
              inputMode="url"
              name={`${name}DraftUrl`}
              ref={draftUrlRef}
              type="text"
              placeholder="여기에 URL 붙여넣기"
              value={draftItem.url}
              onKeyDown={handleDraftKeyDown}
              onPaste={handleDraftPaste("url")}
              onChange={handleDraftChange("url")}
            />
            <button
              className="button-secondary button-compact attachment-add-button"
              type="button"
              onClick={addDraftItem}
              disabled={(!draftItem.title.trim() && !draftItem.url.trim()) || items.length >= maxItems}
            >
              추가
            </button>
          </div>
          {draftError ? <p className="error-text attachment-inline-message">{draftError}</p> : null}
        </div>
        {items.length > 0 ? (
          <ul className="attachment-item-list">
            {items.map((item, index) => (
              <li className="attachment-item-row" key={`${item.url}-${index}`}>
                <a href={item.url || "#"} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined}>
                  {item.title || item.url}
                </a>
                <button className="button-secondary button-compact" type="button" onClick={() => removeItem(index)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );

  function addDraftItem() {
    const draftTitle = readDraftInputValue(draftTitleRef.current, draftItemRef.current.title).trim();
    const draftUrl = readDraftInputValue(draftUrlRef.current, draftItemRef.current.url).trim();

    if ((!draftTitle && !draftUrl) || itemsRef.current.length >= maxItems) {
      return;
    }

    const normalizedUrl = normalizeDraftUrl(draftUrl);
    if (!normalizedUrl) {
      setDraftError("http:// 또는 https://로 시작하는 주소를 입력해 주세요.");
      return;
    }

    const nextItem = {
      title: draftTitle || normalizedUrl,
      url: normalizedUrl
    };

    const nextItems = getSerializableLinks(itemsRef.current, nextItem, maxItems);
    itemsRef.current = nextItems;
    syncSerializedLinks(nextItems);
    setItems(nextItems);
    draftItemRef.current = { title: "", url: "" };
    setDraftItem({ title: "", url: "" });
    setDraftError("");
  }

  function removeItem(index: number) {
    const nextItems = itemsRef.current.filter((_, itemIndex) => itemIndex !== index);
    itemsRef.current = nextItems;
    syncSerializedLinks(nextItems);
    setItems(nextItems);
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    addDraftItem();
  }

  function handleDraftChange(field: keyof LinkItem) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      const nextDraft = { ...draftItemRef.current, [field]: nextValue };

      draftItemRef.current = nextDraft;
      setDraftItem(nextDraft);
      setDraftError("");
    };
  }

  function handleDraftPaste(field: keyof LinkItem) {
    return (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const pastedText = event.clipboardData.getData("text/plain").trim();
      const nextValue = field === "url" ? pastedText.split(/\s+/)[0] ?? "" : pastedText;
      const nextDraft = { ...draftItemRef.current, [field]: nextValue };

      draftItemRef.current = nextDraft;
      setDraftItem(nextDraft);
      setDraftError("");
    };
  }

}

function normalizeDraftUrl(value: string) {
  try {
    return normalizeHttpUrl(value.trim(), "link");
  } catch {
    return null;
  }
}

function readDraftInputValue(input: HTMLInputElement | null, fallback: string) {
  const value = input?.value;
  return value && value.trim() ? value : fallback;
}

function getSerializableLinks(items: LinkItem[], draftItem: LinkItem, limit: number) {
  const normalizedItems = items
    .map(normalizeLinkItem)
    .filter((item): item is LinkItem => Boolean(item));
  const draftLink = normalizeLinkItem(draftItem);
  const nextItems = [...normalizedItems];

  if (draftLink && !nextItems.some((item) => item.url === draftLink.url)) {
    nextItems.push(draftLink);
  }

  return nextItems.slice(0, limit);
}

function normalizeLinkItem(item: LinkItem) {
  const title = item.title.trim();
  const normalizedUrl = normalizeDraftUrl(item.url.trim());

  if (!normalizedUrl) {
    return null;
  }

  return {
    title: title || normalizedUrl,
    url: normalizedUrl
  };
}

function serializeLinks(items: LinkItem[]) {
  return items.map((item) => `${item.title} | ${item.url}`).join("\n");
}
