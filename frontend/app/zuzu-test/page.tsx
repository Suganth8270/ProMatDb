"use client";

import { useState } from "react";

import ZuzuScene from "../../components/zuzu/ZuzuScene";
import {
  ZUZU_CHARACTER_STATES,
  type ZuzuCharacterState,
} from "../../components/zuzu/types";

export default function ZuzuTestPage() {
  const [characterState, setCharacterState] = useState<ZuzuCharacterState>("idle");

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
        <p style={{ margin: "0 0 8px", color: "#4f8b76", fontSize: 12, letterSpacing: "0.16em" }}>
          DEVELOPMENT ONLY
        </p>
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Zuzu character test</h1>
        <p style={{ margin: "0 0 20px", color: "#596560" }}>
          Select a controlled animation state to inspect the isolated Phase 1A character.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {ZUZU_CHARACTER_STATES.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setCharacterState(state)}
              aria-pressed={characterState === state}
              style={{
                border: `1px solid ${characterState === state ? "#4f8b76" : "#cbd5d0"}`,
                borderRadius: 999,
                padding: "8px 13px",
                background: characterState === state ? "#4f8b76" : "#fbfaf6",
                color: characterState === state ? "#ffffff" : "#26332e",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {state}
            </button>
          ))}
        </div>

        <div
          style={{
            overflow: "hidden",
            minHeight: 420,
            borderRadius: 16,
            border: "1px solid #d9e0db",
            background: "linear-gradient(180deg, rgba(231, 239, 236, 0.5), rgba(251, 250, 246, 0.2))",
          }}
        >
          <ZuzuScene characterState={characterState} height={420} />
        </div>

        <p style={{ margin: "14px 0 0", color: "#596560", fontSize: 13 }}>
          Active state: <strong>{characterState}</strong>
        </p>
      </section>
    </main>
  );
}
