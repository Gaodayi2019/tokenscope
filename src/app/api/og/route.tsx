import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "TokenScope";
  const subtitle =
    searchParams.get("subtitle") || "Find the Best AI Model Access";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a1a",
          padding: "60px",
        }}
      >
        {/* Gradient orb */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(to right, #6366f1, #06b6d4)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          {title}
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#a0a0b8",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: 20,
            color: "#6366f1",
            fontWeight: 600,
          }}
        >
          token-scope.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
