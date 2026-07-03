import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section className="footer-service-summary" aria-label="모오 임상심리연구소 서비스 요약">
          <article className="footer-service-item">
            <strong>전문적인 심리치료</strong>
            <span>Psychotherapy</span>
            <p>성인상담 · 청소년상담 · 아동상담 · 심리치료 및 상담 워크숍</p>
          </article>
          <article className="footer-service-item">
            <strong>전문적인 심리검사</strong>
            <span>Psychological Test</span>
            <p>심층종합 심리검사 · 진로 및 적성검사 · 지능/학습능력검사 · 심리검사 워크숍</p>
          </article>
        </section>

        <div className="site-footer-legal">
          <span>© 2026 모오 임상심리연구소. All rights reserved.</span>
          <Link href="/privacy">개인정보처리방침</Link>
        </div>
      </div>
    </footer>
  );
}
