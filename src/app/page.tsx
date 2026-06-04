import type { Metadata } from "next";
import Link from "next/link";
import { InteractiveGallery, InteractiveHeroWall } from "./gallery-interactions";
import { allTags, galleryItems, slugifyTag } from "@/data/gallery";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

function uniqueItems(items: typeof galleryItems) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function PreviewStrip({
  eyebrow,
  title,
  href,
  items
}: {
  eyebrow: string;
  title: string;
  href: string;
  items: typeof galleryItems;
}) {
  return (
    <section className="previewSection">
      <div className="sectionHeader inline">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <Link href={href}>View all</Link>
      </div>
      <div className="previewStrip">
        {items.slice(0, 8).map((item) => (
          <Link className={`previewCard ${item.aspectRatio === "9:16" ? "portrait" : "landscape"}`} href={`/wallpapers/${item.slug}`} key={item.id}>
            {item.thumbUrl ? <img src={item.thumbUrl} alt={item.title} loading="lazy" /> : <span>{item.aspectRatio}</span>}
            <small>{item.aspectRatio}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const desktopItems = galleryItems.filter((item) => item.aspectRatio === "16:9");
  const mobileItems = galleryItems.filter((item) => item.aspectRatio === "9:16");
  const desktopHref = `/categories/${slugifyTag("Desktop Wallpaper")}`;
  const mobileHref = `/categories/${slugifyTag("Mobile Wallpaper")}`;
  const featured = uniqueItems([...desktopItems, ...mobileItems, ...galleryItems]);
  const latestItems = [...galleryItems].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const popularStartingPoints = uniqueItems([
    ...galleryItems.filter((item) => item.scenes.includes("Starlight") || item.scenes.includes("Night Sky")),
    ...galleryItems.filter((item) => item.styles.includes("Impressionist Anime")),
    ...galleryItems.filter((item) => item.styles.includes("Gothic Anime")),
    ...galleryItems
  ]);
  const styleTags = allTags.slice(0, 16);
  const heroItems = [...featured, ...galleryItems].slice(0, 8);

  return (
    <>
      <header className="siteHeader">
        <nav className="nav">
          <Link className="brand" href="/">
            <span className="brandMark" />
            <span>AI Wallpaper Prompt Gallery</span>
          </Link>
          <div className="navLinks">
            <Link href={desktopHref}>16:9</Link>
            <Link href={mobileHref}>9:16</Link>
            <a href="#gallery">Gallery</a>
            <Link href="/contact">Contact</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="visualHero">
          <div className="heroCopy">
            <p className="eyebrow">IMAGE2-OPTIMIZED WALLPAPER PROMPTS</p>
            <h1>AI wallpaper prompts with a visual-first gallery.</h1>
            <p>
              Browse original unknown-character wallpaper ideas for 16:9 desktop
              and 9:16 mobile generation. This batch currently features
              {desktopItems.length ? ` ${desktopItems.length} desktop prompts` : " desktop prompts"}
              {mobileItems.length ? ` and ${mobileItems.length} mobile prompts` : ""}. Prompts are tuned for Image2 output;
              other models may need adjustments.
            </p>
            <div className="searchDock" aria-label="Gallery search placeholder">
              <span>Search mood, scene, color, ratio...</span>
              <a href="#gallery">Explore gallery</a>
            </div>
            <div className="quickTags" aria-label="Featured categories">
              {styleTags.slice(0, 6).map((tag) => (
                <Link href={`/categories/${slugifyTag(tag)}`} key={tag}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <InteractiveHeroWall items={heroItems} />
        </section>

        <section className="ratioBand" aria-label="Main wallpaper ratios">
          <Link href={desktopHref}>
            <strong>16:9</strong>
            <span>Desktop wallpaper prompts</span>
          </Link>
          <Link href={mobileHref}>
            <strong>9:16</strong>
            <span>{mobileItems.length ? "Mobile lock screen prompts" : "Mobile prompts coming next"}</span>
          </Link>
        </section>

        <PreviewStrip eyebrow="LATEST" title="Newest 4K prompt drops" href="#gallery" items={latestItems} />
        <PreviewStrip eyebrow="MOBILE" title="9:16 phone wallpapers" href={mobileHref} items={mobileItems} />
        <PreviewStrip eyebrow="START HERE" title="Popular visual directions" href="#categories" items={popularStartingPoints} />

        <section className="galleryBand" id="gallery">
          <div className="galleryToolbar">
            <div>
              <p className="eyebrow">FEATURED</p>
              <h2>Wallpaper prompt gallery</h2>
            </div>
            <div className="toolbarMeta">
              <span>{galleryItems.length} prompts</span>
              <span>{allTags.length} tags</span>
            </div>
          </div>

          <div className="galleryLayout">
            <aside className="filterRail" id="categories">
              <span>Browse by tag</span>
              {styleTags.map((tag) => (
                <Link href={`/categories/${slugifyTag(tag)}`} key={tag}>
                  {tag}
                </Link>
              ))}
            </aside>

            <InteractiveGallery items={featured} />
          </div>
        </section>

        <section className="editorNote">
          <p>
            Public entries are organized by visual intent, ratio, mood, color,
            and scene. Private generation metadata and source-IP fields are not
            published.
          </p>
        </section>
      </main>

      <footer className="footer">
        <span>AI Wallpaper Prompt Gallery</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </>
  );
}
