import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryGallery } from "@/app/gallery-interactions";
import { allTags, categoryDescription, categoryTitle, displayTag, findTagBySlug, itemsForTag, slugifyTag } from "@/data/gallery";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return allTags.map((tag) => ({ slug: slugifyTag(tag) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = findTagBySlug(slug);
  if (!tag) {
    return {};
  }
  return {
    title: categoryTitle(tag),
    description: categoryDescription(tag),
    alternates: {
      canonical: `/categories/${slug}`
    },
    openGraph: {
      title: categoryTitle(tag),
      description: categoryDescription(tag),
      url: `/categories/${slug}`
    }
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = findTagBySlug(slug);
  if (!tag) {
    notFound();
  }
  const items = itemsForTag(tag);

  return (
    <main className="categoryPage">
      <Link className="backLink" href="/">Back to gallery</Link>
      <section className="sectionHeader">
        <p className="eyebrow">CATEGORY</p>
        <h1>{categoryTitle(tag)}</h1>
        <p>{categoryDescription(tag)}</p>
        <div className="toolbarMeta">
          <span>{items.length} prompts</span>
          <span>{displayTag(tag)}</span>
        </div>
      </section>
      <CategoryGallery items={items} />
    </main>
  );
}
