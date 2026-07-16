import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * Shared renderer behind both opengraph-image.tsx and twitter-image.tsx —
 * social platforms request these as two separate routes, but the artwork
 * is identical, so this is the one place that actually builds it.
 *
 * The wordmark is drawn as text rather than embedding hqlogo.png — satori's
 * bundle (JSX + CSS + every embedded image, base64-inflated) is capped at
 * 500KB, so this only carries one image: a small dedicated thumbnail
 * (public/og-dashboard-thumb.png, ~250KB) rather than the full hero-quality
 * screenshot.
 */
export async function renderOgImage(): Promise<ImageResponse> {
  const dashboard = await readFile(join(process.cwd(), "public/og-dashboard-thumb.png"));
  const dashboardSrc = `data:image/png;base64,${dashboard.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#101d33",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -120,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: "radial-gradient(circle, rgba(190,90,30,0.4) 0%, rgba(190,90,30,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 0 0 76px",
            width: "54%",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 44, fontWeight: 700 }}>
            <span style={{ color: "#fdfbf6" }}>AUDAX</span>
            <span style={{ color: "#be5a1e", marginLeft: 14 }}>HQ</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 40,
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.25,
              color: "#fdfbf6",
              maxWidth: 520,
            }}
          >
            Run your business from one command center.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 21,
              lineHeight: 1.5,
              color: "#aeb8cb",
              maxWidth: 480,
            }}
          >
            Clients, pipeline, revenue tracking, meetings, time, and tasks — all in one workspace.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "46%",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- satori/next-og image generation, not a page-rendered <img> */}
          <img
            src={dashboardSrc}
            alt=""
            width={720}
            style={{
              position: "absolute",
              left: 40,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
            }}
          />
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
