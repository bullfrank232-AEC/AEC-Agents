import { ImageResponse } from "next/og";

export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
          color: "white",
          fontSize: 88,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        BT
      </div>
    ),
    { width: 192, height: 192 }
  );
}
