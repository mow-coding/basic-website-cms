import Link from "next/link";

export const metadata = {
  title: "단일",
};

const mapLinks = [
  {
    name: "카카오맵",
    mark: "K",
    href: "https://example.com",
  },
  {
    name: "네이버 지도",
    mark: "N",
    href: "https://example.com",
  },
];

export default function SingleDemoPage() {
  return (
    <>
      <section className="page-hero">
        <h1>단일</h1>
        <p className="hero-copy-nowrap">전문적 심리치료 및 심리검사 서비스</p>
      </section>

      <section className="section service-section" id="site-overview">
        <article className="service-panel">
          <div>
            <h3>전문적인 심리평가와 상담을 바탕으로 지금 필요한 도움을 차분히 찾아갑니다.</h3>
            <p>모오 임상심리연구소의 심리치료와 심리검사 서비스를 안내합니다</p>
          </div>
          <Link href="/#site-notices">심리상담 안내</Link>
        </article>
        <article className="service-panel service-workshop">
          <div>
            <h3>전문가 교육의 시간을 꾸준하고 깊이 있게 만들어갑니다</h3>
            <p>오랜 시간 동안 쌓아온 전문성을 바탕으로 임상 현장에 필요한 노하우를 제공합니다.</p>
          </div>
          <Link href="/nested">프로그램 살펴보기</Link>
        </article>
      </section>

      <section className="section counselor-section" aria-labelledby="counselor-heading">
        <div className="counselor-layout">
          <div className="counselor-copy">
            <h2 className="schedule-title" id="counselor-heading">
              상담진 안내
            </h2>
            <p>
              여기에 상담진 소개 문구가 들어갑니다.
              <br />
              실제 소개 문구는 운영 환경에서 작성합니다.
            </p>
            <p>상담진 약력에 대한 사항은 전화 예약 시에 자세히 안내해드리겠습니다.</p>
            <dl className="counselor-contact-list">
              <div>
                <dt>예약 문의</dt>
                <dd>00-0000-0000</dd>
              </div>
              <div>
                <dt>문의 가능 시간</dt>
                <dd>월 ~ 토 · 10:00 ~ 18:00</dd>
              </div>
            </dl>
          </div>
          <figure className="counselor-photo-card" aria-label="상담진 사진 자리">
            <figcaption>여기에 사진이 들어갑니다</figcaption>
          </figure>
        </div>
      </section>

      <section className="section location-section" aria-label="오시는 길 안내">
        <div className="section-heading">
          <h2 className="schedule-title">오시는 길</h2>
        </div>
        <div className="location-layout">
          <article className="location-guide-panel">
            <div className="location-address-row">
              <div className="location-address-line">
                <div className="location-map-row">
                  <nav className="location-map-mentions" aria-label="지도 앱 링크">
                    {mapLinks.map((item) => (
                      <a
                        className={`location-map-mention location-map-mention-${item.mark.toLowerCase()}`}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${item.name}에서 모오 임상심리연구소 위치 열기`}
                        key={item.name}
                      >
                        <span className="location-map-icon" aria-hidden="true" />
                        {item.name}
                      </a>
                    ))}
                  </nav>
                </div>
                <p className="location-address-text">여기에 주소가 들어갑니다</p>
              </div>
              <p className="location-guide-note">여기에 오시는 길 안내 문구가 들어갑니다. 실제 안내 문구는 운영 환경에서 작성합니다.</p>
            </div>
            <div className="location-photo-grid">
              <div className="location-photo-card location-map-embed-card">
                <p>여기에 지도 임베드가 들어갑니다</p>
              </div>
              <figure className="location-photo-card" aria-label="오시는 길 사진 자리">
                <figcaption>여기에 사진이 들어갑니다</figcaption>
              </figure>
            </div>
            <div className="location-parking-note">
              <p>여기에 주차 안내 문구가 들어갑니다.</p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
