import { ImageResponse } from "next/og";

export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "32%",
          padding: "15%",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: "100%",
            height: "100%",
            color: "#ffffff",
          }}
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 2 8a7 7 0 0 1-7 7Zm-2 3c-1.42 0-2.5-1.08-2.5-2.5 0-1.42 1.08-2.5 2.5-2.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
