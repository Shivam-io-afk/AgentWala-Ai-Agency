import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#FBF7EE",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "#FDB91F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1C1F3A",
            }}
          >
            AW
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#1C1F3A",
              letterSpacing: "-0.02em",
            }}
          >
            AgentWala
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              backgroundColor: "#FAF0D7",
              color: "#9A6400",
              padding: "8px 20px",
              borderRadius: "50px",
              fontSize: "20px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
            }}
          >
            AI Receptionist for Clinics & SMBs in India
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#1C1F3A",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: "1000px",
            }}
          >
            Never miss a patient call again.
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#4A4F66",
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            Answers phone calls & WhatsApp 24×7 · Books into your calendar · Hindi, English & Hinglish
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "2px solid #ECE6D8",
            paddingTop: "24px",
            fontSize: "20px",
            color: "#727791",
            fontWeight: 600,
          }}
        >
          <span>AgentWala</span>
          <span>Rewa · Madhya Pradesh · Pan-India</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

