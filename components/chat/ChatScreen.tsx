// src/components/chat/ChatScreen.tsx
// Ahia - Campus Marketplace | Real-Time Chat
// Task 2: Chat Interface with WebSockets, message status, image attachments

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: "text" | "image" | "listing_preview" | "escrow_link";
  imageUrl?: string;
  listingPreview?: {
    listingId: string;
    title: string;
    price: number;
    currency: "XRP" | "NGN";
    thumbnailUrl: string;
  };
  escrowLink?: {
    transactionId: string;
    amount: number;
    status: "pending" | "active" | "completed" | "disputed";
  };
  status: MessageStatus;
  timestamp: Date;
  editedAt?: Date;
}

export interface ChatParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  campus: string;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface Chat {
  id: string;
  participants: ChatParticipant[];
  listingId?: string;
  listingTitle?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── WebSocket Manager ────────────────────────────────────────────────────────

type WSEvent =
  | { type: "message"; payload: ChatMessage }
  | { type: "typing"; payload: { chatId: string; userId: string; isTyping: boolean } }
  | { type: "status"; payload: { messageId: string; status: MessageStatus } }
  | { type: "presence"; payload: { userId: string; isOnline: boolean; lastSeen?: Date } }
  | { type: "read"; payload: { chatId: string; userId: string; messageId: string } };

type WSEventHandler = (event: WSEvent) => void;

class ChatWebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Set<WSEventHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingQueue: string[] = [];
  private reconnectDelay = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private chatId: string;
  private userId: string;

  constructor(chatId: string, userId: string) {
    this.chatId = chatId;
    this.userId = userId;
  }

  connect(wsUrl: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.flush();
      this.startHeartbeat();
      // Join the chat room
      this.send({ type: "join", chatId: this.chatId, userId: this.userId });
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        this.handlers.forEach((h) => h(data));
      } catch {
        console.warn("[WS] Failed to parse message", event.data);
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.scheduleReconnect(wsUrl);
    };

    this.ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      this.ws?.close();
    };
  }

  send(data: Record<string, unknown>): void {
    const payload = JSON.stringify(data);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.pendingQueue.push(payload);
    }
  }

  private flush(): void {
    while (this.pendingQueue.length > 0) {
      const payload = this.pendingQueue.shift()!;
      this.ws?.send(payload);
    }
  }

  private scheduleReconnect(wsUrl: string): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.MAX_RECONNECT_DELAY
      );
      this.connect(wsUrl);
    }, this.reconnectDelay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "ping" });
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }

  subscribe(handler: WSEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }
}

// ─── Hook: useChat ─────────────────────────────────────────────────────────────

interface UseChatOptions {
  chatId: string;
  currentUserId: string;
  recipientId: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  recipientTyping: boolean;
  sendMessage: (content: string, type?: ChatMessage["type"]) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
  retryFailed: (messageId: string) => void;
}

export const useChat = ({
  chatId,
  currentUserId,
  recipientId,
}: UseChatOptions): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientTyping, setRecipientTyping] = useState(false);

  const wsManager = useRef<ChatWebSocketManager | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    const manager = new ChatWebSocketManager(chatId, currentUserId);
    wsManager.current = manager;

    const unsubscribe = manager.subscribe((event) => {
      switch (event.type) {
        case "message":
          if (event.payload.chatId === chatId) {
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === event.payload.id);
              if (exists) return prev;
              return [...prev, event.payload];
            });
            // Auto-mark as read if recipient's message
            if (event.payload.senderId === recipientId) {
              manager.send({
                type: "read",
                chatId,
                userId: currentUserId,
                messageId: event.payload.id,
              });
            }
          }
          break;

        case "typing":
          if (
            event.payload.chatId === chatId &&
            event.payload.userId === recipientId
          ) {
            setRecipientTyping(event.payload.isTyping);
          }
          break;

        case "status":
          setMessages((prev) =>
            prev.map((m) =>
              m.id === event.payload.messageId
                ? { ...m, status: event.payload.status }
                : m
            )
          );
          break;

        case "read":
          if (event.payload.chatId === chatId && event.payload.userId === recipientId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id <= event.payload.messageId && m.senderId === currentUserId
                  ? { ...m, status: "read" as MessageStatus }
                  : m
              )
            );
          }
          break;
      }
    });

    const WS_URL = `wss://api.ahia.app/ws/chat?chatId=${chatId}&userId=${currentUserId}`;
    manager.connect(WS_URL);
    setIsConnected(true);

    // Load message history
    loadHistory();

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [chatId, currentUserId, recipientId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await ChatService.getMessages(chatId);
      setMessages(history);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(
    async (content: string, type: ChatMessage["type"] = "text") => {
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        chatId,
        senderId: currentUserId,
        recipientId,
        content,
        type,
        status: "sending",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const sentMsg = await ChatService.sendMessage(chatId, {
          senderId: currentUserId,
          recipientId,
          content,
          type,
        });

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...sentMsg, status: "sent" } : m))
        );

        wsManager.current?.send({
          type: "message",
          payload: sentMsg,
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: "failed" } : m
          )
        );
      }
    },
    [chatId, currentUserId, recipientId]
  );

  const sendImage = useCallback(
    async (file: File) => {
      const tempId = `temp-img-${Date.now()}`;
      const localUrl = URL.createObjectURL(file);

      const optimisticMsg: ChatMessage = {
        id: tempId,
        chatId,
        senderId: currentUserId,
        recipientId,
        content: "",
        type: "image",
        imageUrl: localUrl,
        status: "sending",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const uploadedUrl = await ChatService.uploadImage(file);
        const sentMsg = await ChatService.sendMessage(chatId, {
          senderId: currentUserId,
          recipientId,
          content: "",
          type: "image",
          imageUrl: uploadedUrl,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...sentMsg, status: "sent" } : m
          )
        );

        URL.revokeObjectURL(localUrl);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: "failed" } : m
          )
        );
      }
    },
    [chatId, currentUserId, recipientId]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      wsManager.current?.send({
        type: "typing",
        chatId,
        userId: currentUserId,
        isTyping,
      });

      // Auto-stop typing after 3s
      if (isTyping) {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
          wsManager.current?.send({
            type: "typing",
            chatId,
            userId: currentUserId,
            isTyping: false,
          });
        }, 3000);
      }
    },
    [chatId, currentUserId]
  );

  const markAsRead = useCallback(
    (messageId: string) => {
      wsManager.current?.send({
        type: "read",
        chatId,
        userId: currentUserId,
        messageId,
      });
    },
    [chatId, currentUserId]
  );

  const retryFailed = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "sending" } : m
        )
      );

      await sendMessage(msg.content, msg.type);
    },
    [messages, sendMessage]
  );

  return {
    messages,
    isConnected,
    isLoading,
    recipientTyping,
    sendMessage,
    sendImage,
    sendTypingIndicator,
    markAsRead,
    retryFailed,
  };
};

// ─── Message Status Icon ───────────────────────────────────────────────────────

export const MessageStatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
  const statusMap: Record<MessageStatus, { icon: string; color: string; label: string }> = {
    sending: { icon: "⏳", color: "#9CA3AF", label: "Sending" },
    sent: { icon: "✓", color: "#9CA3AF", label: "Sent" },
    delivered: { icon: "✓✓", color: "#9CA3AF", label: "Delivered" },
    read: { icon: "✓✓", color: "#10B981", label: "Read" },
    failed: { icon: "!", color: "#EF4444", label: "Failed" },
  };

  const { icon, color, label } = statusMap[status];

  return (
    <span
      aria-label={label}
      style={{
        fontSize: 10,
        color,
        fontWeight: status === "read" ? 700 : 400,
        marginLeft: 4,
      }}
    >
      {icon}
    </span>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────

export const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      fontSize: 12,
      color: "#6B7280",
    }}
  >
    <div style={{ display: "flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#9CA3AF",
            display: "inline-block",
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
    <span>{name} is typing...</span>
  </div>
);

// ─── Chat Screen Component ─────────────────────────────────────────────────────

export interface ChatScreenProps {
  chatId: string;
  currentUserId: string;
  recipient: ChatParticipant;
  listingId?: string;
  onBack: () => void;
  onViewListing: (listingId: string) => void;
  onViewEscrow: (transactionId: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  chatId,
  currentUserId,
  recipient,
  listingId,
  onBack,
  onViewListing,
  onViewEscrow,
}) => {
  const {
    messages,
    isConnected,
    isLoading,
    recipientTyping,
    sendMessage,
    sendImage,
    sendTypingIndicator,
    markAsRead,
    retryFailed,
  } = useChat({ chatId, currentUserId, recipientId: recipient.id });

  const [inputText, setInputText] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, recipientTyping]);

  // Mark visible messages as read
  useEffect(() => {
    const unread = messages.filter(
      (m) => m.senderId === recipient.id && m.status !== "read"
    );
    unread.forEach((m) => markAsRead(m.id));
  }, [messages, recipient.id, markAsRead]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInputText("");
    sendTypingIndicator(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    sendTypingIndicator(e.target.value.length > 0);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAttaching(true);
    try {
      await sendImage(file);
    } finally {
      setIsAttaching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const dateStr = formatDate(msg.timestamp);
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ date: dateStr, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>←</button>
        <div style={styles.headerUser}>
          <div style={styles.avatarWrapper}>
            {recipient.avatarUrl ? (
              <img src={recipient.avatarUrl} alt="" style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>
                {recipient.displayName[0].toUpperCase()}
              </div>
            )}
            {recipient.isOnline && <div style={styles.onlineDot} />}
          </div>
          <div>
            <div style={styles.recipientName}>{recipient.displayName}</div>
            <div style={styles.recipientStatus}>
              {recipient.isOnline
                ? "Online"
                : recipient.lastSeen
                ? `Last seen ${formatRelativeTime(recipient.lastSeen)}`
                : recipient.campus}
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          {!isConnected && (
            <span style={styles.offlineBadge}>Reconnecting...</span>
          )}
        </div>
      </div>

      {/* Listing Preview Banner */}
      {listingId && (
        <button
          onClick={() => onViewListing(listingId)}
          style={styles.listingBanner}
        >
          <span>🏷️</span>
          <span style={styles.listingBannerText}>View listing</span>
          <span>›</span>
        </button>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={styles.messageList}>
        {isLoading ? (
          <div style={styles.loadingState}>Loading messages...</div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div style={styles.dateSeparator}>
                <span style={styles.dateSeparatorText}>{group.date}</span>
              </div>
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.senderId === currentUserId}
                  onRetry={retryFailed}
                  onViewEscrow={onViewEscrow}
                  onViewListing={onViewListing}
                />
              ))}
            </div>
          ))
        )}
        {recipientTyping && (
          <TypingIndicator name={recipient.displayName} />
        )}
      </div>

      {/* Input Bar */}
      <div style={styles.inputBar}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={styles.attachButton}
          disabled={isAttaching}
          title="Attach image"
        >
          {isAttaching ? "⏳" : "📎"}
        </button>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={styles.textInput}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            ...styles.sendButton,
            opacity: inputText.trim() ? 1 : 0.4,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

// ─── Message Bubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onRetry: (id: string) => void;
  onViewEscrow: (txId: string) => void;
  onViewListing: (listingId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  onRetry,
  onViewEscrow,
  onViewListing,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: 4,
        padding: "2px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          background: isMine ? "#1D4ED8" : "#F3F4F6",
          color: isMine ? "#fff" : "#111827",
          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: message.type === "image" ? 4 : "10px 14px",
          position: "relative",
        }}
      >
        {/* Image message */}
        {message.type === "image" && message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Shared image"
            style={{
              width: "100%",
              maxWidth: 240,
              borderRadius: 14,
              display: "block",
            }}
          />
        )}

        {/* Text message */}
        {message.type === "text" && (
          <span style={{ fontSize: 15, lineHeight: 1.4 }}>{message.content}</span>
        )}

        {/* Listing preview */}
        {message.type === "listing_preview" && message.listingPreview && (
          <button
            onClick={() => onViewListing(message.listingPreview!.listingId)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 12,
              padding: 10,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {message.listingPreview.title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {message.listingPreview.price} {message.listingPreview.currency}
            </div>
          </button>
        )}

        {/* Escrow link */}
        {message.type === "escrow_link" && message.escrowLink && (
          <button
            onClick={() => onViewEscrow(message.escrowLink!.transactionId)}
            style={{
              background: "rgba(16,185,129,0.2)",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: 12,
              padding: 10,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>
              🔒 Escrow Payment
            </div>
            <div style={{ fontSize: 13 }}>
              {message.escrowLink.amount} XRP — {message.escrowLink.status}
            </div>
          </button>
        )}

        {/* Timestamp + status */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 4,
            gap: 2,
          }}
        >
          <span style={{ fontSize: 10, opacity: 0.6 }}>
            {formatTime(message.timestamp)}
          </span>
          {isMine && <MessageStatusIcon status={message.status} />}
        </div>

        {/* Retry on failure */}
        {message.status === "failed" && (
          <button
            onClick={() => onRetry(message.id)}
            style={{
              fontSize: 11,
              color: "#EF4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginTop: 4,
              display: "block",
            }}
          >
            Failed — tap to retry
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Chat List Screen ──────────────────────────────────────────────────────────

export interface ChatListScreenProps {
  currentUserId: string;
  onSelectChat: (chat: Chat, recipient: ChatParticipant) => void;
  onBack: () => void;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  currentUserId,
  onSelectChat,
  onBack,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadChats();
  }, [currentUserId]);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const data = await ChatService.getChats(currentUserId);
      setChats(data);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const recipient = chat.participants.find((p) => p.id !== currentUserId);
    return recipient?.displayName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const getRecipient = (chat: Chat): ChatParticipant | undefined =>
    chat.participants.find((p) => p.id !== currentUserId);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>←</button>
        <h2 style={styles.headerTitle}>Messages</h2>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading ? (
          <div style={styles.loadingState}>Loading...</div>
        ) : filteredChats.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ color: "#6B7280" }}>No conversations yet</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
              Start by messaging a seller
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const recipient = getRecipient(chat);
            if (!recipient) return null;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat, recipient)}
                style={styles.chatListItem}
              >
                <div style={styles.avatarWrapper}>
                  {recipient.avatarUrl ? (
                    <img src={recipient.avatarUrl} alt="" style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarFallback}>
                      {recipient.displayName[0].toUpperCase()}
                    </div>
                  )}
                  {recipient.isOnline && <div style={styles.onlineDot} />}
                </div>
                <div style={styles.chatListInfo}>
                  <div style={styles.chatListRow}>
                    <span style={styles.chatListName}>{recipient.displayName}</span>
                    <span style={styles.chatListTime}>
                      {chat.lastMessage
                        ? formatRelativeTime(chat.lastMessage.timestamp)
                        : ""}
                    </span>
                  </div>
                  {chat.listingTitle && (
                    <div style={styles.chatListListing}>
                      🏷️ {chat.listingTitle}
                    </div>
                  )}
                  <div style={styles.chatListRow}>
                    <span style={styles.chatListPreview}>
                      {chat.lastMessage?.type === "image"
                        ? "📷 Photo"
                        : chat.lastMessage?.content || "Start a conversation"}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span style={styles.unreadBadge}>{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#fff",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #E5E7EB",
    background: "#fff",
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#111827",
  },
  headerUser: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#1D4ED8",
    padding: 4,
  },
  avatarWrapper: { position: "relative", flexShrink: 0 },
  avatar: { width: 42, height: 42, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#DBEAFE",
    color: "#1D4ED8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#10B981",
    border: "2px solid #fff",
  },
  recipientName: { fontWeight: 600, fontSize: 15, color: "#111827" },
  recipientStatus: { fontSize: 12, color: "#6B7280" },
  offlineBadge: {
    fontSize: 11,
    background: "#FEF3C7",
    color: "#D97706",
    padding: "2px 8px",
    borderRadius: 20,
  },
  listingBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    background: "#EFF6FF",
    border: "none",
    borderBottom: "1px solid #BFDBFE",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    color: "#1D4ED8",
    fontSize: 13,
  },
  listingBannerText: { flex: 1, fontWeight: 500 },
  messageList: { flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8 },
  loadingState: {
    display: "flex",
    justifyContent: "center",
    padding: 40,
    color: "#9CA3AF",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 60,
    color: "#111827",
  },
  dateSeparator: {
    display: "flex",
    justifyContent: "center",
    margin: "12px 0",
  },
  dateSeparatorText: {
    fontSize: 11,
    color: "#9CA3AF",
    background: "#F9FAFB",
    padding: "2px 10px",
    borderRadius: 20,
    border: "1px solid #E5E7EB",
  },
  inputBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "10px 12px",
    borderTop: "1px solid #E5E7EB",
    background: "#fff",
  },
  attachButton: {
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    border: "1px solid #E5E7EB",
    borderRadius: 20,
    padding: "10px 14px",
    fontSize: 15,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    maxHeight: 100,
    lineHeight: 1.4,
  },
  sendButton: {
    background: "#1D4ED8",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 40,
    height: 40,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #E5E7EB",
    borderRadius: 20,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#F9FAFB",
  },
  chatListItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    border: "none",
    background: "none",
    cursor: "pointer",
    width: "100%",
    borderBottom: "1px solid #F3F4F6",
    textAlign: "left",
  },
  chatListInfo: { flex: 1, minWidth: 0 },
  chatListRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatListName: { fontWeight: 600, fontSize: 15, color: "#111827" },
  chatListTime: { fontSize: 12, color: "#9CA3AF", flexShrink: 0 },
  chatListListing: {
    fontSize: 11,
    color: "#6B7280",
    margin: "2px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chatListPreview: {
    fontSize: 13,
    color: "#6B7280",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  },
  unreadBadge: {
    background: "#1D4ED8",
    color: "#fff",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 7px",
    flexShrink: 0,
    marginLeft: 8,
  },
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

const formatDate = (date: Date): string => {
  const today = new Date();
  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const formatTime = (date: Date): string =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatRelativeTime = (date: Date): string => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

// ─── Stub Service ──────────────────────────────────────────────────────────────

const ChatService = {
  getMessages: async (_chatId: string): Promise<ChatMessage[]> => [],
  sendMessage: async (
    _chatId: string,
    _data: Partial<ChatMessage>
  ): Promise<ChatMessage> => ({} as ChatMessage),
  uploadImage: async (_file: File): Promise<string> => "",
  getChats: async (_userId: string): Promise<Chat[]> => [],
};

export default ChatScreen;
