export function AdminLoadingState() {
  return (
    <main className="page-shell admin-page-shell" id="main-content">
      <section className="admin-loading-state" aria-label="관리자 화면을 불러오는 중">
        <span className="admin-loading-line admin-loading-line-wide" />
        <span className="admin-loading-line" />
        <span className="admin-loading-grid">
          <span />
          <span />
          <span />
        </span>
      </section>
    </main>
  );
}
