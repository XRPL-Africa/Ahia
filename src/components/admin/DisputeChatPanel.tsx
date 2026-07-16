"use client";

import { useState, useEffect, useRef } from "react";
import { Dispute } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Send, Loader } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  role: "buyer" | "seller" | "admin";
}

interface DisputeChatPanelProps {
  dispute: Dispute;
  onClose: () => void;
}

export default function DisputeChatPanel({
  dispute,
  onClose,
}: DisputeChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Mock data - replace with actual API call
        setMessages([
          {
            id: "1",
            sender: "Buyer",
            message: "Item arrived damaged",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            role: "buyer",
          },
          {
            id: "2",
            sender: "Seller",
            message: "I'll check with shipping. Can you send photos?",
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            role: "seller",
          },
          {
            id: "3",
            sender: "Buyer",
            message: "Sending photos now",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            role: "buyer",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [dispute.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      // Mock sending - replace with actual API call
      const adminMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "Admin",
        message: newMessage,
        timestamp: new Date().toISOString(),
        role: "admin",
      };
      setMessages((prev) => [...prev, adminMessage]);
      setNewMessage("");
    } finally {
      setSending(false);
    }
  };

  const getMessageColor = (role: string) => {
    switch (role) {
      case "buyer":
        return "bg-blue-50 border-l-4 border-l-blue-500";
      case "seller":
        return "bg-orange-50 border-l-4 border-l-orange-500";
      case "admin":
        return "bg-green-50 border-l-4 border-l-ahia-success";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl h-96 flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-lg">
            Dispute Chat - {dispute.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 py-4 px-2 bg-gray-50 rounded-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader size={20} className="animate-spin mr-2" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No messages yet
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg max-w-xs ${getMessageColor(msg.role)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">
                    {msg.sender}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type admin message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={sending}
            className="rounded-xl border-gray-200"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="rounded-xl bg-ahia-sunset hover:opacity-90 text-white px-4"
          >
            <Send size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
