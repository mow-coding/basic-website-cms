import Link from "next/link";
import { siteConfig } from "@/lib/site-data";

export const metadata = {
  title: "단일",
};

// 오시는 길: siteConfig.address 한 값으로 지도 임베드와 길찾기 링크가 모두 구성됩니다.
const mapQuery = encodeURIComponent(siteConfig.address);
const googleMapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

// 문의 버튼이 여는 외부 신청/문의 양식(예: Google Forms). 실제 양식 주소로 교체해 쓰세요.
const counselingInquiryFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSd1oW8l6m-dtPDWonRhr4i6dFSJ3EvouGPepYD1_oSncpZXhA/viewform?usp=publish-editor";
const programInquiryFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLScxd-i2n07F-uv_EWplBorwSLUn4oGl7Rozeh23PuoUqFk0rQ/viewform?usp=publish-editor";

const mapLinks = [
  {
    name: "카카오맵",
    mark: "K",
    href: `https://map.kakao.com/?q=${mapQuery}`,
  },
  {
    name: "네이버 지도",
    mark: "N",
    href: `https://map.naver.com/p/search/${mapQuery}`,
  },
];

export default function SingleDemoPage() {
  return (
    <>
      <section className="page-hero">
        <h1>예시로 보여드리는 화면입니다</h1>
        <p>여기 담긴 소개·연락처·오시는 길은 실제 정보가 아니라, 하나의 페이지가 어떻게 구성되는지 보여드리기 위해 꾸민 가상의 예시입니다.</p>
      </section>

      <section className="section service-section" id="site-overview">
        <article className="service-panel">
          <div>
            <h3>지금 겪고 있는 어려움을 편안하게 이야기하세요</h3>
            <p>우울, 불안, 관계의 어려움 등 어떤 주제든 괜찮습니다. 전문 상담자가 함께 실마리를 찾아갑니다.</p>
          </div>
          <div className="service-panel-actions">
            <Link href="/#site-notices">소식 보기</Link>
            <a href={counselingInquiryFormUrl} target="_blank" rel="noreferrer">
              상담 문의
            </a>
          </div>
        </article>
        <article className="service-panel service-workshop">
          <div>
            <h3>임상 실무 역량을 단계적으로 키워갑니다</h3>
            <p>입문부터 심화까지, 수준에 맞는 전문가 교육 프로그램을 운영합니다.</p>
          </div>
          <div className="service-panel-actions">
            <Link href="/nested">프로그램 살펴보기</Link>
            <a href={programInquiryFormUrl} target="_blank" rel="noreferrer">
              프로그램 문의
            </a>
          </div>
        </article>
      </section>

      <section className="section counselor-section" aria-labelledby="counselor-heading">
        <div className="counselor-layout">
          <div className="counselor-copy">
            <h2 className="schedule-title" id="counselor-heading">
              상담진 안내
            </h2>
            <p>
              모오 임상심리연구소의 상담은 임상심리 전문 자격을 갖춘 상담자가 진행합니다.
              <br />
              각자의 전문 영역을 바탕으로 내담자의 상황에 맞는 방식을 함께 찾아갑니다.
            </p>
            <p>상담자 배정과 자세한 약력은 예약 상담 시 안내해 드립니다.</p>
            <dl className="counselor-contact-list">
              <div>
                <dt>예약 문의</dt>
                <dd>02-0000-0000</dd>
              </div>
              <div>
                <dt>문의 가능 시간</dt>
                <dd>평일 10:00 ~ 19:00 · 토요일 10:00 ~ 14:00</dd>
              </div>
            </dl>
          </div>
          <figure className="counselor-photo-card" aria-label="상담실 전경">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/counseling-room.jpg" alt="차분한 분위기의 상담실 코너" loading="lazy" />
            <figcaption>상담실 전경</figcaption>
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
                <p className="location-address-text">{siteConfig.address}</p>
              </div>
              <p className="location-guide-note">가까운 지하철역에서 도보로 이동하실 수 있습니다. 방문 전에 예약을 부탁드립니다.</p>
            </div>
            <div className="location-photo-grid">
              <div className="location-photo-card location-map-embed-card">
                <iframe
                  className="location-google-map"
                  title={`${siteConfig.name} 구글 지도`}
                  src={googleMapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <figure className="location-photo-card" aria-label="연구소 입구">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/institute-entrance.jpg" alt="연구소 건물 외관" loading="lazy" />
                <figcaption>연구소 입구</figcaption>
              </figure>
            </div>
            <div className="location-parking-note">
              <p>건물 지하 주차장을 이용하실 수 있으며, 상담 시간 동안 무료로 주차하실 수 있습니다.</p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
