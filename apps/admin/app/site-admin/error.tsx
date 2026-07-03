"use client";

import { useEffect } from "react";

type SiteAdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteAdminError({ error, reset }: SiteAdminErrorProps) {
  useEffect(() => {
    console.error("[site-admin] error boundary", serializeSiteAdminBoundaryError(error));
  }, [error]);

  return (
    <main className="page-shell" id="main-content">
      <section className="surface-card section" aria-labelledby="site-admin-error-title">
        <div className="card-body section-stack">
          <div className="section-heading">
            <div>
              <h1 className="page-title" id="site-admin-error-title">
                관리자 화면 처리 중 문제가 생겼습니다
              </h1>
              <p className="page-subtitle">
                화면을 준비하거나 입력을 처리하는 중 오류가 발생했습니다. 새로고침해도 반복되면 아래 오류 번호를 기준으로
                브라우저 콘솔과 배포 로그를 함께 확인하면 됩니다.
              </p>
            </div>
          </div>

          {error.digest ? (
            <p className="hint hint-strong">
              오류 번호: <strong>{error.digest}</strong>
            </p>
          ) : null}

          <div className="actions-row">
            <button className="button" type="button" onClick={reset}>
              다시 불러오기
            </button>
            <a className="button-secondary" href="/signin">
              로그인 화면으로 이동
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function serializeSiteAdminBoundaryError(error: Error & { digest?: string }) {
  return {
    digest: error.digest,
    message: error.message,
    name: error.name,
    stack: error.stack
  };
}
