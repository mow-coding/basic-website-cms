"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Fragment } from "react";
import { useEffect, useRef, useState } from "react";

export type WorkshopCardCarouselItem = {
  href: string;
  slug: string;
  shortName: string;
  title: string;
  cardImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  introParagraphs: string[][];
  latestSessionLabel: string;
  todaySummary: string;
};

type WorkshopCardCarouselProps = {
  items: WorkshopCardCarouselItem[];
};

export function WorkshopCardCarousel({ items }: WorkshopCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const activeItem = items[activeIndex];

  useEffect(() => {
    const updateHeight = () => {
      const slideHeights = slideRefs.current.map((slide) => slide?.offsetHeight ?? 0);
      setViewportHeight(Math.max(...slideHeights));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    slideRefs.current.forEach((slide) => {
      if (slide) {
        observer.observe(slide);
      }
    });
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? items.length - 1 : currentIndex - 1));
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % items.length);
  };

  return (
    <section className="section workshop-carousel" aria-label="프로그램">
      <button className="workshop-carousel-button workshop-carousel-button-prev" type="button" onClick={goToPrevious} aria-label="이전 프로그램">
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </span>
      </button>

      <div className="workshop-carousel-viewport" style={viewportHeight ? { height: viewportHeight } : undefined}>
        <div className="workshop-carousel-stage" aria-live="polite">
          {items.map((item, index) => (
            <article
              className={`workshop-card workshop-carousel-card workshop-carousel-card-${item.slug} ${getCarouselPosition(index, activeIndex, items.length)}`}
              key={item.href}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              aria-hidden={index !== activeIndex}
              style={
                {
                  "--workshop-card-media-height": `${((item.cardImage.height / item.cardImage.width) * 27).toFixed(3)}rem`,
                } as CSSProperties
              }
            >
              <div className="workshop-card-media">
                <Image
                  src={item.cardImage.src}
                  alt={item.cardImage.alt}
                  width={item.cardImage.width}
                  height={item.cardImage.height}
                  sizes="(max-width: 720px) 100vw, 32rem"
                  priority={index === 0}
                />
                <div className="workshop-card-media-copy">
                  {item.introParagraphs.map((paragraphLines) => (
                    <p key={paragraphLines.join(" ")}>
                      {paragraphLines.map((line, lineIndex) => (
                        <Fragment key={`${line}-${lineIndex}`}>
                          {lineIndex > 0 ? <br /> : null}
                          {line}
                        </Fragment>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
              <div className="workshop-card-body">
                <div className="workshop-card-heading-row">
                  <h3>{item.title}</h3>
                  <Link className="workshop-card-more" href={item.href} tabIndex={index === activeIndex ? undefined : -1}>
                    더 알아보기
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M5 12h13" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                <dl className="workshop-card-schedule" aria-label={`${item.shortName} 일정 요약`}>
                  <div>
                    <dt>마지막 일정</dt>
                    <dd>{item.latestSessionLabel}</dd>
                  </div>
                  <div>
                    <dt>오늘 기준 일정</dt>
                    <dd>{item.todaySummary}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>

      <button className="workshop-carousel-button workshop-carousel-button-next" type="button" onClick={goToNext} aria-label="다음 프로그램">
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </span>
      </button>

      <p className="sr-only" aria-live="polite">
        {activeItem ? `${activeIndex + 1}번째 프로그램, ${activeItem.title}` : null}
      </p>
    </section>
  );
}

function getCarouselPosition(index: number, activeIndex: number, total: number) {
  const forwardDistance = (index - activeIndex + total) % total;
  if (forwardDistance === 0) {
    return "is-active";
  }
  if (forwardDistance === 1) {
    return "is-next";
  }
  if (forwardDistance === total - 1) {
    return "is-prev";
  }
  return "is-back";
}
