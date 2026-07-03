export function PageLoadingState() {
  return (
    <section className="page-loading-state" aria-label="페이지를 불러오는 중">
      <div className="page-loading-hero" aria-hidden="true">
        <span className="page-loading-kicker" />
        <span className="page-loading-title" />
        <span className="page-loading-copy page-loading-copy-primary" />
        <span className="page-loading-copy" />
      </div>
      <div className="page-loading-body" aria-hidden="true">
        <span className="page-loading-section-title" />
        <span className="page-loading-row" />
        <span className="page-loading-row" />
        <span className="page-loading-row page-loading-row-short" />
      </div>
    </section>
  );
}
