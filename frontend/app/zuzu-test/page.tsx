"use client";

import ZuzuScene from "../../components/zuzu/ZuzuScene";

export default function ZuzuTestPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#eef1ef",
        color: "#18211f",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: 24,
          border: "1px solid #d5ddd8",
          borderRadius: 20,
          background: "rgba(251, 250, 246, 0.9)",
          boxShadow: "0 18px 45px rgba(24, 33, 31, 0.08)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#4f8b76",
            fontSize: 12,
            letterSpacing: "0.16em",
          }}
        >
          DEVELOPMENT ONLY
        </p>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 28,
          }}
        >
          Zuzu 3D Model Test
        </h1>

        <p
          style={{
            margin: "0 0 20px",
            color: "#596560",
          }}
        >
          Testing the completed Zuzu GLB model and its existing animation.
        </p>

        <div
          style={{
            overflow: "hidden",
            minHeight: 420,
            borderRadius: 16,
            border: "1px solid #d9e0db",
            background:
              "linear-gradient(180deg, rgba(231, 239, 236, 0.5), rgba(251, 250, 246, 0.2))",
          }}
        >
          <ZuzuScene height={420} />
        </div>

        <p
          style={{
            margin: "14px 0 0",
            color: "#596560",
            fontSize: 13,
          }}
        >
          Current animation: Idle
        </p>
      </section>
    </main>
  );
}