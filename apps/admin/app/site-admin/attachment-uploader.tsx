"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { HelpTooltip } from "@/app/site-admin/help-tooltip";

type AttachmentItem = {
  title: string;
  url: string;
};

type AttachmentUploaderProps = {
  defaultValue?: string;
  maxFiles?: number;
  name?: string;
};

const defaultMaxFiles = 5;
const maxSizeBytes = 30 * 1024 * 1024;
const allowedExtensions = new Set(["pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
const fileHelpText = "PDF, HWP, HWPX, Word, Excel, PowerPoint 파일을 최대 5개까지 올릴 수 있습니다. 파일당 30MB 이하입니다.";

export function AttachmentUploader({ defaultValue = "", maxFiles = defaultMaxFiles, name = "attachments" }: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() => parseAttachmentLines(defaultValue, maxFiles));
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="attachment-panel upload-box">
      <div className="attachment-panel-head">
        <span className="upload-label">파일 첨부</span>
        <HelpTooltip>{fileHelpText}</HelpTooltip>
      </div>
      <div className="attachment-panel-body">
        <div
          className={`attachment-entry-zone file-drop-zone ${isDragging ? "dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(Array.from(event.dataTransfer.files ?? []));
          }}
        >
          <div className="file-input-row">
            <span className="attachment-empty-text">
              {isPending ? "첨부 파일을 업로드하고 있습니다." : "파일을 여기에 끌어다 놓거나 직접 선택하세요."}
            </span>
            <button className="file-picker-button" type="button" onClick={() => fileInputRef.current?.click()}>
              파일 선택
            </button>
          </div>
        </div>
        <input
          className="native-file-input"
          id="post-file-upload"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";

            handleFiles(files);
          }}
        />

        {attachments.map((attachment) => (
          <input
            key={`${attachment.url}-${attachment.title}`}
            name={name}
            type="hidden"
            value={`${attachment.title} | ${attachment.url}`}
            readOnly
          />
        ))}

        {message ? <p className="error-text">{message}</p> : null}

        {attachments.length > 0 ? (
          <ul className="attachment-item-list">
            {attachments.map((attachment) => (
              <li className="attachment-item-row" key={attachment.url}>
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  {attachment.title}
                </a>
                <button
                  className="button-secondary button-compact"
                  type="button"
                  onClick={() => setAttachments((current) => current.filter((item) => item.url !== attachment.url))}
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );

  function handleFiles(files: File[]) {
    startTransition(async () => {
      await uploadFiles(files);
    });
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    if (attachments.length + files.length > maxFiles) {
      setMessage("첨부 파일은 게시글에 최대 5개까지만 등록할 수 있습니다.");
      return;
    }

    const invalidFile = files.find((file) => !isAllowedFile(file));
    if (invalidFile) {
      setMessage(`${invalidFile.name} 파일 형식은 첨부할 수 없습니다.`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > maxSizeBytes);
    if (oversizedFile) {
      setMessage(`${oversizedFile.name} 파일은 30MB를 넘습니다.`);
      return;
    }

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const blob = await upload(`site-attachments/${sanitizeFileName(file.name)}`, file, {
            access: "public",
            handleUploadUrl: "/api/site-admin/blob-upload"
          });

          return {
            title: file.name,
            url: blob.url
          };
        })
      );

      setAttachments((current) => [...current, ...uploaded]);
      setMessage("");
    } catch (error) {
      setMessage(getUploadErrorMessage(error));
    }
  }
}

function parseAttachmentLines(value: string, limit: number) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((line) => {
      const [title, url] = line.includes("|") ? line.split("|", 2) : [line, line];
      return {
        title: title.trim(),
        url: url.trim()
      };
    })
    .filter((item) => item.title && item.url);
}

function isAllowedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && allowedExtensions.has(extension));
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "file";
  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").slice(0, 60);
  return `${baseName || "attachment"}.${extension}`;
}

function getUploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("retrieve the client token")) {
    return "파일 업로드 권한 토큰을 발급받지 못했습니다. 다시 로그인한 뒤 시도해 주세요. 계속 실패하면 Vercel Blob 저장소 설정(BLOB_READ_WRITE_TOKEN)을 확인해야 합니다.";
  }

  return message || "첨부 파일 업로드에 실패했습니다.";
}
