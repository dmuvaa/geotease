import { ImageResponse } from "next/og";

export const alt = "GeoTease — Think you know where it is?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3efe6",
          color: "#1c1915",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", background: "#d64532", width: "72px", height: "12px" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: 8, color: "#5e584e" }}>GEOTEASE</div>
          <div style={{ fontSize: 84, lineHeight: 0.95, marginTop: 28, maxWidth: 900 }}>
            Think you know where it is?
          </div>
          <div style={{ fontSize: 32, marginTop: 28, color: "#5e584e" }}>Clues. Maps. One location.</div>
        </div>
        <div style={{ fontSize: 28 }}>geotease.com</div>
      </div>
    ),
    { ...size },
  );
}
