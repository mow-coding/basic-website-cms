import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section className="footer-service-summary" aria-label="모오 임상심리연구소 서비스 요약">
          <article className="footer-service-item">
            <strong>여기에 첫 번째 서비스 이름이 들어갑니다</strong>
            <span>Service One</span>
            <p>여기에 첫 번째 서비스의 소개 문구가 들어갑니다.</p>
          </article>
          <article className="footer-service-item">
            <strong>여기에 두 번째 서비스 이름이 들어갑니다</strong>
            <span>Service Two</span>
            <p>여기에 두 번째 서비스의 소개 문구가 들어갑니다.</p>
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
