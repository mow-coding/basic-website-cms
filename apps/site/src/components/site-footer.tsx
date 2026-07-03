import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section className="footer-service-summary" aria-label="모오 임상심리연구소 서비스 요약">
          <article className="footer-service-item">
            <strong>심리상담</strong>
            <span>Counseling</span>
            <p>개인의 상황에 맞추어 진행하는 전문 심리상담입니다.</p>
          </article>
          <article className="footer-service-item">
            <strong>심리평가</strong>
            <span>Psychological Assessment</span>
            <p>종합 심리검사로 자신을 이해하는 폭을 넓힙니다.</p>
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
