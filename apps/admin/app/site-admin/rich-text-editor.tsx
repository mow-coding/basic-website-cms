"use client";

import { upload } from "@vercel/blob/client";
import { Editor as TinyMceReactEditor } from "@tinymce/tinymce-react";
import { useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import type { Editor as TinyMceEditorInstance } from "tinymce";

type RichTextEditorProps = {
  compact?: boolean;
  helpText?: string | null;
  height?: number;
  name: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

type BlobInfo = {
  blob: () => Blob;
  filename: () => string;
};
type TinyMceInitOptions = NonNullable<ComponentProps<typeof TinyMceReactEditor>["init"]>;

const imageMaxSizeBytes = 10 * 1024 * 1024;
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const emptyListWrapperClass = "cms-empty-list-wrapper";
const tinyMceKoreanLanguageCode = "ko_KR";
const googleDocsPasteStyleProperties = [
  "background-color",
  "border",
  "border-bottom",
  "border-color",
  "border-left",
  "border-right",
  "border-style",
  "border-top",
  "border-width",
  "color",
  "font-family",
  "font-style",
  "font-weight",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "overflow-wrap",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "white-space",
  "width"
];

type TinyMceI18nRuntime = {
  addI18n?: (code: string, items: Record<string, string>) => void;
};
type EditorScrollPosition = {
  left: number;
  top: number;
};

const defaultRichTextEditorHelpText =
  "본문 안에 이미지를 넣을 수 있습니다. 이미지는 10MB 이하의 JPG, PNG, WebP, GIF를 사용할 수 있습니다.";

const tinyMceKoreanLabels: Record<string, string> = {
  Align: "정렬",
  "Align center": "가운데 정렬",
  "Align left": "왼쪽 정렬",
  "Align right": "오른쪽 정렬",
  "Background color": "배경색",
  "Background color {0}": "배경색 {0}",
  Body: "본문",
  "Border color": "테두리색",
  "Border style": "테두리 스타일",
  "Border width": "테두리 두께",
  Bottom: "아래쪽",
  Blockquote: "인용문",
  "Block {0}": "문단 {0}",
  Blocks: "문단",
  Bold: "굵게",
  "Bullet list": "글머리 기호",
  Cancel: "취소",
  "Cell background color": "셀 배경색",
  "Cell border color": "셀 테두리색",
  "Cell properties": "셀 속성",
  "Cell type": "셀 유형",
  "Clear formatting": "서식 지우기",
  Code: "코드",
  "Column header": "열 머리글",
  Copy: "복사",
  "Copy column": "열 복사",
  "Copy row": "행 복사",
  Cut: "잘라내기",
  "Cut column": "열 잘라내기",
  "Cut row": "행 잘라내기",
  "Decrease indent": "내어쓰기",
  "Decrease font size": "글자 크기 줄이기",
  "Delete column": "열 삭제",
  "Delete row": "행 삭제",
  "Delete table": "표 삭제",
  "Dotted": "점선",
  "Dashed": "파선",
  "Double": "이중선",
  "Find and replace": "찾기 및 바꾸기",
  "Find and Replace": "찾기 및 바꾸기",
  "Find and replace...": "찾기 및 바꾸기...",
  "Font {0}": "글꼴 {0}",
  Fonts: "글꼴",
  "Font size {0}": "글자 크기 {0}",
  "Font sizes": "글자 크기",
  "Format {0}": "서식 {0}",
  Formats: "서식",
  Fullscreen: "전체 화면",
  "Groove": "홈",
  Hidden: "숨김",
  "Heading 1": "제목 1",
  "Heading 2": "제목 2",
  "Heading 3": "제목 3",
  "Heading 4": "제목 4",
  "Heading 5": "제목 5",
  "Heading 6": "제목 6",
  "Horizontal line": "가로 구분선",
  "Increase indent": "들여쓰기",
  "Increase font size": "글자 크기 키우기",
  Inset: "안쪽선",
  "Insert column after": "오른쪽에 열 삽입",
  "Insert column before": "왼쪽에 열 삽입",
  "Insert row after": "아래에 행 삽입",
  "Insert row before": "위에 행 삽입",
  "Insert table": "표 삽입",
  "Insert/edit image": "이미지 삽입/수정",
  "Insert/edit link": "링크 삽입/수정",
  Italic: "기울임",
  Justify: "양쪽 정렬",
  Link: "링크",
  "Line height": "줄간격",
  "Line height {0}": "줄간격 {0}",
  "Merge cells": "셀 병합",
  Middle: "가운데",
  "No alignment": "정렬 없음",
  "Numbered list": "번호 매기기",
  "Open link": "링크 열기",
  Outset: "바깥쪽선",
  Paragraph: "본문",
  Paste: "붙여넣기",
  "Paste as text": "텍스트로 붙여넣기",
  "Paste column after": "오른쪽에 열 붙여넣기",
  "Paste column before": "왼쪽에 열 붙여넣기",
  "Paste row after": "아래에 행 붙여넣기",
  "Paste row before": "위에 행 붙여넣기",
  Redo: "다시 실행",
  "Remove link": "링크 제거",
  Ridge: "돌출선",
  "Row header": "행 머리글",
  "Row properties": "행 속성",
  "Row type": "행 유형",
  Save: "저장",
  Solid: "실선",
  "Split cell": "셀 나누기",
  Strikethrough: "취소선",
  "System Font": "기본 글꼴",
  Table: "표",
  "Table properties": "표 속성",
  "Table styles": "표 스타일",
  "Text color": "글자색",
  "Text color {0}": "글자색 {0}",
  Top: "위쪽",
  "Vertical align": "수직 정렬",
  Underline: "밑줄",
  Undo: "실행 취소",
  "Visual aids": "시각 보조선"
};

export function RichTextEditor({
  compact = false,
  helpText = defaultRichTextEditorHelpText,
  height,
  name,
  initialValue = "",
  onChange,
  placeholder
}: RichTextEditorProps) {
  const [editorReady, setEditorReady] = useState(false);
  const [message, setMessage] = useState("");
  const editorHeight = height ?? (compact ? 320 : 720);
  const editorBodyFontSize = compact ? "15px" : "16px";
  const editorBodyPadding = compact ? "18px 22px" : "36px 44px";

  const editorOptions = useMemo<TinyMceInitOptions>(
    () => ({
      automatic_uploads: true,
      branding: false,
      content_css: false,
      content_style: `
        body {
          color: #142033;
          font-family: "Nanum Gothic", "Noto Sans KR", "Segoe UI", sans-serif;
          font-size: ${editorBodyFontSize};
          line-height: 1.75;
          margin: 0;
          padding: ${editorBodyPadding};
        }
        p {
          font-size: 1rem;
          margin: 0 0 1rem;
        }
        h2, h3, h4 {
          color: #142033;
          font-weight: 800;
          line-height: 1.35;
          margin: 1.9rem 0 0.75rem;
        }
        h2 { font-size: 1.75rem; }
        h3 { font-size: 1.42rem; }
        h4 { font-size: 1.18rem; }
        h2 span, h3 span, h4 span {
          font-weight: inherit !important;
          line-height: inherit !important;
        }
        li.${emptyListWrapperClass} {
          list-style-type: none;
        }
        li.${emptyListWrapperClass}::marker {
          content: "";
        }
        li.${emptyListWrapperClass} > ul,
        li.${emptyListWrapperClass} > ol {
          margin-top: 0;
        }
        li:has(> ul:only-child),
        li:has(> ol:only-child) {
          list-style-type: none;
        }
        li:has(> ul:only-child)::marker,
        li:has(> ol:only-child)::marker {
          content: "";
        }
        li:has(> ul:only-child) > ul,
        li:has(> ol:only-child) > ol {
          margin-top: 0;
        }
        ul, ol {
          list-style-position: outside;
          margin: 0 0 1rem;
          padding-left: 2.5rem;
        }
        ul { list-style-type: disc; }
        ol { list-style-type: decimal; }
        ul ul { list-style-type: circle; }
        ul ul ul { list-style-type: square; }
        li { display: list-item; }
        li::marker {
          color: currentColor;
          font-size: 0.86em;
        }
        a { color: #4e73aa; font-weight: 800; text-decoration: underline; text-underline-offset: 0.18em; }
        blockquote {
          border-left: 4px solid #dce5ef;
          color: #697386;
          margin: 1rem 0;
          padding: 0.25rem 0 0.25rem 1rem;
        }
        hr {
          border: 0;
          border-top: 1px solid #dce5ef;
          margin: 1.5rem 0;
        }
        table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }
        th, td {
          border: 1px solid #c8d5e4;
          padding: 0.7rem;
          vertical-align: top;
        }
        th {
          background: #edf3fb;
          color: #2a5f7f;
          font-weight: 800;
        }
        td > p:first-child,
        th > p:first-child {
          margin-top: 0;
        }
        td > p:last-child,
        th > p:last-child {
          margin-bottom: 0;
        }
        td[data-mce-selected],
        th[data-mce-selected] {
          position: relative;
        }
        td[data-mce-selected]::after,
        th[data-mce-selected]::after {
          background-color: rgb(42 95 127 / 18%);
          border: 1px solid rgb(42 95 127 / 45%);
          content: "";
          inset: -1px;
          pointer-events: none;
          position: absolute;
        }
        img {
          border-radius: 8px;
          height: auto;
          max-width: 100%;
        }
        .ephox-snooker-resizer-bar {
          background: #2a5f7f;
          opacity: 0;
          user-select: none;
        }
        .ephox-snooker-resizer-bar.ephox-snooker-resizer-bar-dragging {
          opacity: 0.9;
        }
        .ephox-snooker-resizer-cols {
          cursor: col-resize !important;
        }
        .ephox-snooker-resizer-rows {
          cursor: row-resize !important;
        }
      `,
      contextmenu: "link image table",
      file_picker_types: "image",
      font_family_formats:
        "나눔고딕=Nanum Gothic,Noto Sans KR,sans-serif; 돋움=Dotum,Noto Sans KR,sans-serif; 바탕=Batang,Noto Serif KR,serif; Arial=arial,helvetica,sans-serif; Times New Roman=times new roman,times,serif",
      font_size_formats: "7pt 8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt",
      font_size_input_default_unit: "pt",
      height: editorHeight,
      image_advtab: true,
      image_caption: true,
      image_title: true,
      images_file_types: "jpg,jpeg,png,webp,gif",
      images_upload_handler: uploadEditorImage,
      language: tinyMceKoreanLanguageCode,
      line_height_formats: "1.1 1.5 2 2.5 3",
      menubar: false,
      paste_data_images: true,
      paste_webkit_styles: googleDocsPasteStyleProperties.join(" "),
      plugins:
        "advlist autolink fullscreen image link lists nonbreaking searchreplace table visualblocks wordcount",
      placeholder,
      promotion: false,
      setup: setupRichTextEditor,
      skin: false,
      statusbar: false,
      table_advtab: true,
      table_appearance_options: false,
      table_cell_advtab: true,
      table_toolbar:
        "tableprops tablerowprops tablecellprops | tablerowheader tablecolheader | tablecellbackgroundcolor tablecellbordercolor tablecellborderstyle tablecellborderwidth tablecellvalign | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells | tabledelete",
      table_row_advtab: true,
      table_use_colgroups: false,
      toolbar:
        "undo redo | fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify lineheight | bullist numlist outdent indent | blockquote hr link image table | removeformat | searchreplace fullscreen",
      toolbar_mode: "wrap"
    }),
    [editorBodyFontSize, editorBodyPadding, editorHeight, placeholder]
  );

  useEffect(() => {
    let cancelled = false;

    void loadTinyMceRuntime().then(() => {
      if (!cancelled) {
        setEditorReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`rich-editor rich-editor-tinymce ${compact ? "rich-editor-compact" : ""}`}>
      <div className="rich-editor-pane">
        {editorReady ? (
          <TinyMceReactEditor
            initialValue={initialValue}
            init={editorOptions}
            onEditorChange={(value) => {
              onChange?.(value);
              window.dispatchEvent(new Event("cms-rich-editor-change"));
            }}
            textareaName={name}
          />
        ) : (
          <>
            <textarea defaultValue={initialValue} hidden name={name} readOnly />
            <div className="rich-editor-loading" style={{ height: editorHeight }}>본문 편집기를 불러오는 중입니다.</div>
          </>
        )}
        {helpText || message ? (
          <div className="rich-editor-help">
            {helpText ? <p>{helpText}</p> : null}
            {message ? <p className={message.startsWith("완료") ? "success-text" : "error-text"}>{message}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  async function uploadEditorImage(blobInfo: BlobInfo, progress: (percent: number) => void) {
    const blob = blobInfo.blob();
    const fileName = blobInfo.filename();
    const extension = getFileExtension(fileName);

    if (!extension || !imageExtensions.has(extension)) {
      const message = "본문 이미지는 JPG, PNG, WebP, GIF만 사용할 수 있습니다.";
      setMessage(message);
      throw message;
    }

    if (blob.size > imageMaxSizeBytes) {
      const message = "본문 이미지는 10MB 이하만 사용할 수 있습니다.";
      setMessage(message);
      throw message;
    }

    try {
      progress(15);
      const file = new File([blob], sanitizeFileName(fileName), { type: blob.type || `image/${extension}` });
      const uploadedBlob = await upload(`site-body-images/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/site-admin/blob-upload"
      });

      progress(100);
      setMessage("완료: 본문 이미지를 삽입했습니다.");
      return uploadedBlob.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "본문 이미지 업로드에 실패했습니다.";
      setMessage(message);
      throw message;
    }
  }
}

function setupRichTextEditor(editor: TinyMceEditorInstance) {
  let undoRedoScrollPosition: EditorScrollPosition | null = null;

  editor.on("init SetContent NodeChange Change KeyUp ExecCommand", (event) => {
    if ("command" in event && isUndoRedoCommand(event.command)) {
      scheduleMarkEmptyListWrappers(editor);
      return;
    }

    markEmptyListWrappers(editor);
  });

  editor.on("BeforeGetContent", () => {
    markEmptyListWrappers(editor);
  });

  editor.on("BeforeExecCommand", (event) => {
    if (isUndoRedoCommand(event.command)) {
      undoRedoScrollPosition = getEditorScrollPosition(editor);
    }

    if (event.command.toLowerCase() !== "fontsize" || typeof event.value !== "string") {
      return;
    }

    const fontSize = normalizeTinyMceFontSize(event.value);
    if (!fontSize) {
      return;
    }

    event.preventDefault();

    editor.undoManager.transact(() => {
      editor.formatter.remove("fontsize", { value: null }, undefined, true);
      editor.formatter.apply("fontsize", { value: fontSize });
      editor.nodeChanged();
    });
  });

  editor.on("Undo Redo", () => {
    restoreEditorScrollPosition(editor, undoRedoScrollPosition);
    undoRedoScrollPosition = null;
    scheduleMarkEmptyListWrappers(editor);
  });
}

function isUndoRedoCommand(command: string) {
  const normalizedCommand = command.toLowerCase();
  return normalizedCommand === "undo" || normalizedCommand === "redo";
}

function getEditorScrollPosition(editor: TinyMceEditorInstance): EditorScrollPosition {
  const editorWindow = editor.getWin();
  const documentElement = editorWindow.document.documentElement;

  return {
    left: editorWindow.scrollX || documentElement.scrollLeft || 0,
    top: editorWindow.scrollY || documentElement.scrollTop || 0
  };
}

function restoreEditorScrollPosition(editor: TinyMceEditorInstance, position: EditorScrollPosition | null) {
  if (!position) {
    return;
  }

  const editorWindow = editor.getWin();

  editorWindow.requestAnimationFrame(() => {
    editorWindow.scrollTo(position.left, position.top);
  });
}

function scheduleMarkEmptyListWrappers(editor: TinyMceEditorInstance) {
  editor.getWin().requestAnimationFrame(() => {
    markEmptyListWrappers(editor);
  });
}

function markEmptyListWrappers(editor: TinyMceEditorInstance) {
  const body = editor.getBody();
  if (!body) {
    return;
  }

  body.querySelectorAll<HTMLLIElement>("li").forEach((item) => {
    if (isEmptyNestedListWrapper(item)) {
      item.classList.add(emptyListWrapperClass);
    } else {
      item.classList.remove(emptyListWrapperClass);
    }
  });
}

function isEmptyNestedListWrapper(item: HTMLLIElement) {
  const significantNodes = Array.from(item.childNodes).filter((node) => isSignificantListItemNode(node));

  if (significantNodes.length !== 1) {
    return false;
  }

  const [onlyNode] = significantNodes;
  return onlyNode.nodeType === Node.ELEMENT_NODE && isListElement(onlyNode as Element);
}

function isSignificantListItemNode(node: ChildNode) {
  if (node.nodeType === Node.TEXT_NODE) {
    return Boolean(node.textContent?.replace(/\uFEFF/g, "").trim());
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  return (node as Element).getAttribute("data-mce-type") !== "bookmark";
}

function isListElement(element: Element) {
  return element.tagName === "UL" || element.tagName === "OL";
}

function normalizeTinyMceFontSize(value: string) {
  const trimmed = value.trim();
  return /^\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed}pt` : value;
}

async function loadTinyMceRuntime() {
  // The tinymce core must finish loading before the language pack, icons,
  // theme and plugins (they register themselves on the tinymce global), but
  // those remaining chunks are independent of each other and load in parallel.
  await import("tinymce/tinymce");
  await Promise.all([
    import("tinymce-i18n/langs6/ko_KR.js"),
    import("tinymce/icons/default"),
    import("tinymce/models/dom"),
    import("tinymce/themes/silver"),
    import("tinymce/plugins/advlist"),
    import("tinymce/plugins/autolink"),
    import("tinymce/plugins/fullscreen"),
    import("tinymce/plugins/image"),
    import("tinymce/plugins/link"),
    import("tinymce/plugins/lists"),
    import("tinymce/plugins/nonbreaking"),
    import("tinymce/plugins/searchreplace"),
    import("tinymce/plugins/table"),
    import("tinymce/plugins/visualblocks"),
    import("tinymce/plugins/wordcount")
  ]);
  registerTinyMceKoreanLabels();
}

function registerTinyMceKoreanLabels() {
  const tinymce = (window as Window & { tinymce?: TinyMceI18nRuntime }).tinymce;

  tinymce?.addI18n?.(tinyMceKoreanLanguageCode, tinyMceKoreanLabels);
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase();
}

function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName) ?? "image";
  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").slice(0, 60);
  return `${baseName || "image"}.${extension}`;
}
