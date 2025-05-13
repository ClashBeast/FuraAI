import { useEffect, useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { useUser } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: string;
  content: string;
  avatar: string | undefined;
};

const LOCAL_HISTORY_KEY = "furaai_chat_history";

export default function FuraAI() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
  const HUGGINGFACE_API_KEY = process.env.REACT_APP_HUGGINGFACE_API_KEY;

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (saved) {
      const parsed: Message[] = JSON.parse(saved);
      setMessages(parsed);
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I am Fura AI, your smart assistant.",
          avatar: "/fura-avatar.png"
        }
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    const newMessages = [
      ...messages,
      { role: "user", content: input, avatar: user?.imageUrl }
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistralai/mixtral-8x7b-instruct",
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response received.";
      setMessages([
        ...newMessages,
        { role: "assistant", content: reply, avatar: "/fura-avatar.png" }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error: Failed to get reply.", avatar: "/fura-avatar.png" }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageGen(prompt: string) {
    try {
      const res = await fetch("https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      });
      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `![AI Image](${imgUrl})`,
          avatar: "/fura-avatar.png"
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Image generation failed.", avatar: "/fura-avatar.png" }
      ]);
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-3xl font-bold text-black mb-4">Fura AI ✨</h1>
      <Card className="mb-4">
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              {msg.avatar && (
                <img
                  src={msg.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full mt-1"
                />
              )}
              <div>
                <strong>{msg.role === "user" ? user?.firstName || "You" : "Fura"}:</strong>
                <div className="prose prose-sm text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Input
          className="text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            (input.toLowerCase().startsWith("draw:")
              ? handleImageGen(input.replace("draw:", "").trim())
              : handleSend())
          }
          placeholder="Ask Fura or type 'draw: cute cat with crown'..."
        />
        <Button
          onClick={() => {
            if (input.toLowerCase().startsWith("draw:")) {
              handleImageGen(input.replace("draw:", "").trim());
            } else {
              handleSend();
            }
          }}
        >
          {loading ? "Thinking..." : "Send"}
        </Button>
      </div>
    </div>
  );
}