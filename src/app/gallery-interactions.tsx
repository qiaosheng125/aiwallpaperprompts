"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GalleryItem } from "@/data/gallery";

const storageKey = "aiwallpaperprompts.likes.v1";
const likesChangedEvent = "aiwallpaperprompts-likes-changed";
const itemsPerPage = 24;
const allRatioFilter = "all";
const allTagFilter = "all";

function cleanPublicUrl(value: string | undefined) {
  const cleaned = value?.replace(/^\uFEFF/, "").trim().replace(/\/+$/, "");
  if (!cleaned) return "";
  try {
    const url = new URL(cleaned);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

const likesApiUrl = cleanPublicUrl(process.env.NEXT_PUBLIC_LIKES_API_URL);

type SortMode = "popular" | "newest";

type LikesState = {
  localLikes: Record<string, boolean>;
  remoteLikes: Record<string, boolean>;
  totals: Record<string, number>;
  ready: boolean;
};

function imageStyle(index: number) {
  const styles = [
    "radial-gradient(circle at 30% 20%, rgba(255,225,162,.92), transparent 28%), linear-gradient(135deg, #192033, #6c4a7f 48%, #d78b64)",
    "radial-gradient(circle at 70% 18%, rgba(137,235,204,.82), transparent 30%), linear-gradient(135deg, #153132, #3e6f71 48%, #e5b66d)",
    "radial-gradient(circle at 55% 25%, rgba(255,163,184,.86), transparent 26%), linear-gradient(135deg, #1b1724, #4d3a7a 52%, #b85e71)",
    "radial-gradient(circle at 40% 18%, rgba(180,222,255,.84), transparent 30%), linear-gradient(135deg, #0e1d2c, #31596e 50%, #d6a65d)"
  ];
  return { background: styles[index % styles.length] };
}

function ratioClass(ratio: string) {
  return ratio === "9:16" ? "portrait" : "landscape";
}

function readLikes() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeLikes(likes: Record<string, boolean>) {
  window.localStorage.setItem(storageKey, JSON.stringify(likes));
  window.dispatchEvent(new CustomEvent(likesChangedEvent));
}

function useLikes() {
  const [state, setState] = useState<LikesState>({
    localLikes: {},
    remoteLikes: {},
    totals: {},
    ready: false
  });

  useEffect(() => {
    const sync = () =>
      setState((current) => ({
        ...current,
        localLikes: readLikes(),
        ready: true
      }));
    sync();
    window.addEventListener(likesChangedEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(likesChangedEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!likesApiUrl) return;
    let cancelled = false;

    async function loadRemoteLikes() {
      try {
        const response = await fetch(`${likesApiUrl}/likes`, {
          credentials: "include"
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          totals?: Record<string, number>;
          userLikes?: string[];
        };
        if (cancelled) return;
        setState((current) => ({
          ...current,
          totals: data.totals || {},
          remoteLikes: Object.fromEntries((data.userLikes || []).map((itemId) => [itemId, true]))
        }));
      } catch {
        // Keep the local-only experience if the API is not deployed yet.
      }
    }

    loadRemoteLikes();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(itemId: string) {
    const next = { ...readLikes() };
    next[itemId] = !next[itemId];
    if (!next[itemId]) delete next[itemId];
    setState((current) => ({
      ...current,
      localLikes: next,
      remoteLikes: likesApiUrl
        ? {
            ...current.remoteLikes,
            [itemId]: next[itemId]
          }
        : current.remoteLikes,
      totals: likesApiUrl
        ? {
            ...current.totals,
            [itemId]: Math.max(0, (current.totals[itemId] || 0) + (next[itemId] ? 1 : -1))
          }
        : current.totals
    }));
    writeLikes(next);

    if (!likesApiUrl) return;

    try {
      const response = await fetch(`${likesApiUrl}/likes/toggle`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ itemId })
      });
      if (!response.ok) return;
      const data = (await response.json()) as { itemId: string; liked: boolean; likes: number };
      setState((current) => {
        const remoteLikes = { ...current.remoteLikes };
        if (data.liked) remoteLikes[data.itemId] = true;
        else delete remoteLikes[data.itemId];
        return {
          ...current,
          remoteLikes,
          totals: {
            ...current.totals,
            [data.itemId]: data.likes
          }
        };
      });
    } catch {
      // Keep optimistic local state if the network request fails.
    }
  }

  return {
    likes: likesApiUrl ? { ...state.localLikes, ...state.remoteLikes } : state.localLikes,
    totals: state.totals,
    toggle,
    ready: state.ready
  };
}

function sortByLikes(items: GalleryItem[], likes: Record<string, boolean>, totals: Record<string, number>) {
  return [...items].sort((a, b) => {
    const totalDiff = (totals[b.id] || 0) - (totals[a.id] || 0);
    if (totalDiff !== 0) return totalDiff;
    return Number(Boolean(likes[b.id])) - Number(Boolean(likes[a.id]));
  });
}

function itemTags(item: GalleryItem) {
  return [...item.styles, ...item.scenes, ...item.moods, ...item.colors, ...item.uses];
}

function searchableText(item: GalleryItem) {
  return [
    item.title,
    item.description,
    item.prompt,
    item.negativePrompt,
    item.aspectRatio,
    ...itemTags(item)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function uniqueFilterTags(items: GalleryItem[]) {
  return Array.from(new Set(items.flatMap(itemTags))).sort((a, b) => a.localeCompare(b));
}

function filterItems(items: GalleryItem[], query: string, ratio: string, tag: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    if (ratio !== allRatioFilter && item.aspectRatio !== ratio) return false;
    if (tag !== allTagFilter && !itemTags(item).includes(tag)) return false;
    if (normalizedQuery && !searchableText(item).includes(normalizedQuery)) return false;
    return true;
  });
}

function sortItems(
  items: GalleryItem[],
  sort: SortMode,
  likes: Record<string, boolean>,
  totals: Record<string, number>
) {
  if (sort === "newest") {
    return [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  return sortByLikes(items, likes, totals);
}

export function LikeButton({ itemId, compact = false }: { itemId: string; compact?: boolean }) {
  const { likes, toggle } = useLikes();
  const liked = Boolean(likes[itemId]);

  return (
    <button
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={liked}
      className={`likeButton${liked ? " active" : ""}${compact ? " compact" : ""}`}
      type="button"
      onClick={() => toggle(itemId)}
    >
      <span aria-hidden="true">{liked ? "\u2665" : "\u2661"}</span>
      {!compact ? <small>{liked ? "Liked" : "Like"}</small> : null}
    </button>
  );
}

export function InteractiveHeroWall({ items }: { items: GalleryItem[] }) {
  const { likes, totals } = useLikes();
  const sortedItems = useMemo(() => sortByLikes(items, likes, totals).slice(0, 8), [items, likes, totals]);

  return (
    <div className="heroWall" aria-label="Wallpaper preview wall">
      {sortedItems.map((item, index) => (
        <div className={`heroTile ${ratioClass(item.aspectRatio)}`} key={`${item.id}-${index}`}>
          <Link className="tileLink" href={`/wallpapers/${item.slug}`}>
            {item.thumbUrl ? (
              <img src={item.thumbUrl} alt={item.title} loading="lazy" />
            ) : (
              <div className="imagePlaceholder" style={imageStyle(index)}>
                <span>{item.aspectRatio}</span>
              </div>
            )}
          </Link>
          <LikeButton itemId={item.id} compact />
        </div>
      ))}
    </div>
  );
}

export function InteractiveGallery({ items }: { items: GalleryItem[] }) {
  return <GalleryBrowser gridClassName="masonryGrid" items={items} withAnchors />;
}

export function CategoryGallery({ items }: { items: GalleryItem[] }) {
  return <GalleryBrowser gridClassName="galleryGrid" items={items} />;
}

function GalleryBrowser({
  items,
  gridClassName,
  withAnchors = false
}: {
  items: GalleryItem[];
  gridClassName: string;
  withAnchors?: boolean;
}) {
  const { likes, totals } = useLikes();
  const [query, setQuery] = useState("");
  const [ratio, setRatio] = useState(allRatioFilter);
  const [tag, setTag] = useState(allTagFilter);
  const [sort, setSort] = useState<SortMode>("popular");
  const [page, setPage] = useState(1);
  const filterTags = useMemo(() => uniqueFilterTags(items), [items]);
  const visibleItems = useMemo(() => {
    return sortItems(filterItems(items, query, ratio, tag), sort, likes, totals);
  }, [items, query, ratio, tag, sort, likes, totals]);
  const firstMobileId = visibleItems.find((item) => item.aspectRatio === "9:16")?.id;
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = visibleItems.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, ratio, tag, sort]);

  return (
    <section className="galleryBrowser" aria-label="Search and browse wallpaper prompts">
      <GalleryControls
        filterTags={filterTags}
        query={query}
        ratio={ratio}
        sort={sort}
        tag={tag}
        onQueryChange={setQuery}
        onRatioChange={setRatio}
        onSortChange={setSort}
        onTagChange={setTag}
      />
      {pageItems.length > 0 ? (
        <div className={gridClassName}>
          {pageItems.map((item, index) => (
            <GalleryCard
              item={item}
              index={index}
              key={item.id}
              anchorId={
                withAnchors
                  ? safePage === 1 && index === 0
                    ? "desktop"
                    : item.id === firstMobileId
                      ? "mobile"
                      : undefined
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="noResults" role="status">
          No matching wallpaper prompts. Try a broader mood, scene, color, or ratio.
        </div>
      )}
      <GalleryPagination page={safePage} totalPages={totalPages} totalItems={visibleItems.length} onPageChange={setPage} />
    </section>
  );
}

function GalleryControls({
  filterTags,
  query,
  ratio,
  sort,
  tag,
  onQueryChange,
  onRatioChange,
  onSortChange,
  onTagChange
}: {
  filterTags: string[];
  query: string;
  ratio: string;
  sort: SortMode;
  tag: string;
  onQueryChange: (query: string) => void;
  onRatioChange: (ratio: string) => void;
  onSortChange: (sort: SortMode) => void;
  onTagChange: (tag: string) => void;
}) {
  return (
    <div className="galleryControls">
      <label className="searchField">
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search mood, scene, color, prompt..."
        />
      </label>
      <div className="segmentedControl" aria-label="Ratio filter">
        {[
          [allRatioFilter, "All"],
          ["16:9", "16:9"],
          ["9:16", "9:16"]
        ].map(([value, label]) => (
          <button
            className={ratio === value ? "active" : ""}
            key={value}
            type="button"
            onClick={() => onRatioChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="selectField">
        <span>Tag</span>
        <select value={tag} onChange={(event) => onTagChange(event.target.value)}>
          <option value={allTagFilter}>All tags</option>
          {filterTags.map((filterTag) => (
            <option key={filterTag} value={filterTag}>
              {filterTag}
            </option>
          ))}
        </select>
      </label>
      <label className="selectField">
        <span>Sort</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value as SortMode)}>
          <option value="popular">Popular first</option>
          <option value="newest">Newest first</option>
        </select>
      </label>
    </div>
  );
}

function GalleryPagination({
  page,
  totalPages,
  totalItems,
  onPageChange
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) => candidate === 1 || candidate === totalPages || Math.abs(candidate - page) <= 1
  );

  return (
    <nav className="pagination" aria-label="Gallery pagination">
      <span>
        Showing {start}-{end} of {totalItems}
      </span>
      <div>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          Previous
        </button>
        {pages.map((candidate, index) => {
          const previous = pages[index - 1];
          return (
            <span className="pageGroup" key={candidate}>
              {previous && candidate - previous > 1 ? <small>...</small> : null}
              <button
                aria-current={candidate === page ? "page" : undefined}
                className={candidate === page ? "active" : ""}
                type="button"
                onClick={() => onPageChange(candidate)}
              >
                {candidate}
              </button>
            </span>
          );
        })}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </nav>
  );
}

function GalleryCard({ item, index, anchorId }: { item: GalleryItem; index: number; anchorId?: string }) {
  return (
    <article className={`wallpaperCard ${ratioClass(item.aspectRatio)}`} id={anchorId}>
      <Link className="cardLink" href={`/wallpapers/${item.slug}`}>
        {item.thumbUrl ? (
          <img src={item.thumbUrl} alt={item.title} loading="lazy" />
        ) : (
          <div className="imagePlaceholder" style={imageStyle(index)}>
            <span>{item.aspectRatio}</span>
          </div>
        )}
        <div className="cardOverlay">
          <span>{item.aspectRatio}</span>
          <strong>View prompt / download</strong>
        </div>
      </Link>
      <LikeButton itemId={item.id} compact />
    </article>
  );
}
