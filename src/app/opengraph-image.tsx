import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f3f2ee",
          color: "#191b1f",
          padding: 72,
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, color: "#7257a6" }}>
          AI Wallpaper Prompt Gallery
        </div>
        <div
          style={{
            marginTop: 28,
            width: 920,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 0.98
          }}
        >
          4K AI wallpaper prompts for original visual ideas.
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#5c6470" }}>
          Browse, filter, copy prompts, and build better wallpapers.
        </div>
      </div>
    ),
    size
  );
}
