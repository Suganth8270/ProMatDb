"use client";

import { useEffect, useState } from "react";
import ZuzuScene from "./ZuzuScene";
import ZuzuChat from "./ZuzuChat";

type ZuzuPosition = {
  top: string;
  left: string;
};

const positions: ZuzuPosition[] = [
  {
    top: "18%",
    left: "82%",
  },
  {
    top: "68%",
    left: "78%",
  },
  {
    top: "72%",
    left: "12%",
  },
  {
    top: "22%",
    left: "10%",
  },
  {
    top: "42%",
    left: "76%",
  },
];

export default function ZuzuCompanion() {
  const [positionIndex, setPositionIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPositionIndex((current) => (current + 1) % positions.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const position = positions[positionIndex];

  return (
    <>
      <div
        className="fixed z-[100] pointer-events-auto cursor-pointer"
        style={{
          top: position.top,
          left: position.left,
          width: "175px",
          height: "210px",
          transition:
            "top 4s cubic-bezier(0.4, 0, 0.2, 1), left 4s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "top, left",
        }}
        onClick={() => setChatOpen(true)}
        aria-label="Open Zuzu AI chat"
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setChatOpen(true);
          }
        }}
      >
        <ZuzuScene height={210} />
      </div>

      {chatOpen && (
        <ZuzuChat onClose={() => setChatOpen(false)} />
      )}
    </>
  );
}