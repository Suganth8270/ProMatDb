"use client";

import { FormEvent, useState } from "react";

interface ZuzuChatProps {
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "zuzu" | "user";
  text: string;
}

export default function ZuzuChat({ onClose }: ZuzuChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "zuzu",
      text:
        "Hi! I'm Zuzu. 👋 I'm your ProMatDB research assistant. Ask me about proteins, biomaterials, interactions, docking, or molecular structures.",
    },
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = input.trim();

    if (!question) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: "user",
        text: question,
      },
    ]);

    setInput("");
  };

  return (
    <div
      className="
        fixed
        bottom-6
        right-6
        z-[110]
        flex
        h-[480px]
        w-[360px]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-[#d8e2dd]
        bg-[#fbfaf6]
        shadow-[0_20px_60px_rgba(20,35,30,0.18)]
      "
    >
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-[#d8e2dd]
          bg-[#eef5f1]
          px-5
          py-4
        "
      >
        <div>
          <div className="text-sm font-semibold text-[#18211f]">
            Zuzu
          </div>

          <div className="text-xs text-[#66736e]">
            ProMatDB AI Assistant
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            rounded-full
            px-2
            py-1
            text-lg
            text-[#596560]
            transition
            hover:bg-[#dfe9e4]
          "
          aria-label="Close Zuzu chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`
                max-w-[85%]
                rounded-2xl
                px-4
                py-3
                text-sm
                leading-6
                ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#137f63] text-white"
                    : "rounded-bl-md bg-white text-[#46534e] shadow-sm"
                }
              `}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="
          flex
          gap-2
          border-t
          border-[#d8e2dd]
          bg-[#fbfaf6]
          p-4
        "
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask Zuzu something..."
          className="
            min-w-0
            flex-1
            rounded-xl
            border
            border-[#d5dfda]
            bg-white
            px-4
            py-3
            text-sm
            text-[#18211f]
            outline-none
            placeholder:text-[#8a9691]
            focus:border-[#4f8b76]
          "
        />

        <button
          type="submit"
          className="
            rounded-xl
            bg-[#137f63]
            px-4
            text-sm
            font-medium
            text-white
            transition
            hover:bg-[#0f6d55]
          "
        >
          Send
        </button>
      </form>
    </div>
  );
}