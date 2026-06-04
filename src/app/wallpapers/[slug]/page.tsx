import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LikeButton } from "@/app/gallery-interactions";
import { CopyPromptButton } from "./prompt-actions";
import { findItemBySlug, galleryItems, relatedItemsFor } from "@/data/gallery";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return galleryItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = findItemBySlug(slug);
  if (!item) {
    return {};
  }
  return {
    title: item.title,
    description: item.description,
    alternates: {
      canonical: `/wallpapers/${item.slug}`
    }
  };
}

export default async function WallpaperPage({ params }: PageProps) {
  const { slug } = await params;
  const item = findItemBySlug(slug);
  if (!item) {
    notFound();
  }

  const related = relatedItemsFor(item, 6);
  const copyText = item.negativePrompt
    ? `Prompt:\n${item.prompt}\n\nNegative prompt:\n${item.negativePrompt}`
    : item.prompt;

  return (
    <main className="detailPage">
      <Link className="backLink" href="/">Back to gallery</Link>
      <section className="detailShell">
        <div className={`detailImage ${item.aspectRatio === "9:16" ? "portrait" : "landscape"}`}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} />
          ) : (
            <div className="imagePlaceholder detailPlaceholder">
              <span>{item.aspectRatio}</span>
            </div>
          )}
        </div>
        <div className="detailPanel">
          <div className="detailTopline">
            <p className="eyebrow">PROMPT DETAIL</p>
            <LikeButton itemId={item.id} />
          </div>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
          {item.imageUrl ? (
            <a className="downloadButton" href={`/download/${item.slug}`}>
              Download 4K wallpaper
            </a>
          ) : null}
          <div className="tagRow">
            {[...item.styles, ...item.scenes, ...item.moods, ...item.colors, ...item.uses].map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="promptBox">
            <div className="promptHeader">
              <h2>Prompt</h2>
              <CopyPromptButton text={copyText} />
            </div>
            <p>{item.prompt}</p>
          </div>
          {item.negativePrompt ? (
            <details className="negativeBox">
              <summary>Negative prompt</summary>
              <p>{item.negativePrompt}</p>
            </details>
          ) : null}
          <dl className="metaGrid">
            <div>
              <dt>Size</dt>
              <dd>{item.width} x {item.height}</dd>
            </div>
            <div>
              <dt>Ratio</dt>
              <dd>{item.aspectRatio}</dd>
            </div>
            <div>
              <dt>Optimized for</dt>
              <dd>Image2</dd>
            </div>
          </dl>
        </div>
      </section>
      {related.length ? (
        <section className="relatedBand">
          <div className="sectionHeader inline">
            <div>
              <p className="eyebrow">KEEP BROWSING</p>
              <h2>Related prompts</h2>
            </div>
          </div>
          <div className="relatedGrid">
            {related.map((relatedItem) => (
              <Link className={`relatedCard ${relatedItem.aspectRatio === "9:16" ? "portrait" : "landscape"}`} href={`/wallpapers/${relatedItem.slug}`} key={relatedItem.id}>
                {relatedItem.thumbUrl ? <img src={relatedItem.thumbUrl} alt={relatedItem.title} loading="lazy" /> : null}
                <span>{relatedItem.aspectRatio}</span>
                <strong>{relatedItem.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
