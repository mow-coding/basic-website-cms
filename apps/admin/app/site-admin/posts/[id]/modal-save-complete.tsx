"use client";

import { useEffect } from "react";

const updatedListUrl = "/site-admin?section=manage-posts&message=updated";

export function ModalSaveComplete() {
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "site-admin-post-updated" }, window.location.origin);
      return;
    }

    window.location.href = updatedListUrl;
  }, []);

  return (
    <main className="admin-edit-modal-document" id="main-content">
      <div className="rich-editor-loading">게시물 수정을 반영하고 있습니다, 창을 닫지 말고 잠시 기다려주세요.</div>
    </main>
  );
}
