import Image, { type ImageProps } from "next/image";

type LightboxImageProps = Omit<ImageProps, "alt" | "src"> & {
  alt: string;
  fullSrc?: string;
  src: string;
};

function getLightboxId(src: string) {
  const slug = src.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

  return `lightbox-${slug || "image"}`;
}

export function LightboxImage({ alt, fullSrc, src, ...imageProps }: LightboxImageProps) {
  const lightboxId = getLightboxId(src);
  const originalSrc = fullSrc ?? src;
  const originalWidth = typeof imageProps.width === "number" ? imageProps.width : 1600;
  const originalHeight = typeof imageProps.height === "number" ? imageProps.height : 1200;

  return (
    <>
      <a className="lightbox-trigger" href={`#${lightboxId}`} aria-label={`${alt} 원본 보기`}>
        <Image src={src} alt={alt} {...imageProps} />
      </a>
      <div className="image-lightbox" id={lightboxId} role="dialog" aria-modal="true" aria-label={`${alt} 원본 보기`}>
        <a className="image-lightbox-backdrop" href="#close" aria-label="닫기" />
        <Image
          className="image-lightbox-image"
          src={originalSrc}
          alt={alt}
          width={originalWidth}
          height={originalHeight}
          sizes="100vw"
          unoptimized
        />
        <a className="image-lightbox-close" href="#close" aria-label="닫기">
          ×
        </a>
      </div>
    </>
  );
}
