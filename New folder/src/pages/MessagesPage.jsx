import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { messageAPI } from "../services/api";
import "../styles/MessagesPage.css";

function getOtherParty(match, currentUserId) {
  if (!match) return { fullName: "Conversation" };
  const seekerId = match.seeker?._id || match.seeker;
  return String(seekerId) === String(currentUserId)
    ? match.hirer || { fullName: "Hirer" }
    : match.seeker || { fullName: "Seeker" };
}

export default function MessagesPage({ currentUser, role = "seeker" }) {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = currentUser?._id || currentUser?.id || null;
  const initialMatchId = location.state?.matchId || null;

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      setLoading(true);
      setError("");
      try {
        const response = await messageAPI.getConversations();
        if (!active) return;
        const data = response.data || [];
        setConversations(data);

        const preferred = initialMatchId
          ? data.find((conversation) => String(conversation._id) === String(initialMatchId))
          : data[0] || null;

        setSelectedConversation(preferred);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load conversations.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      active = false;
    };
  }, [initialMatchId]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      if (!selectedConversation?._id) {
        setMessages([]);
        return;
      }

      try {
        const response = await messageAPI.getMessages(selectedConversation._id);
        if (!active) return;
        setMessages(response.data?.messages || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load messages.");
      }
    }

    loadMessages();
    return () => {
      active = false;
    };
  }, [selectedConversation]);

  const otherParty = useMemo(
    () => getOtherParty(selectedConversation, currentUserId),
    [selectedConversation, currentUserId],
  );

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConversation?._id) return;

    const text = newMessage.trim();
    setSending(true);
    setError("");

    try {
      const response = await messageAPI.sendMessage(selectedConversation._id, text);
      const created = response.data;
      setMessages((prev) => [...prev, created]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((conv) =>
          String(conv._id) === String(selectedConversation._id)
            ? {
                ...conv,
                latestMessage: created,
                unreadCount: 0,
              }
            : conv,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="messages-container">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="messages-wrapper"
      >
        <div className="messages-header">
          <h1>Messages</h1>
          <p>Stay connected with your live matches.</p>
        </div>

        {error && <div className="swipe-error">{error}</div>}

        <div className="messages-layout">
          <div className="conversations-list">
            <h3>Conversations</h3>
            <div className="conv-items">
              {loading ? (
                <div className="conv-item">Loading conversations…</div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => {
                  const party = getOtherParty(conv, currentUserId);
                  const latest = conv.latestMessage?.text || "No messages yet";
                  return (
                    <motion.div
                      key={conv._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedConversation(conv)}
                      className={`conv-item ${selectedConversation?._id === conv._id ? "active" : ""}`}
                    >
                      <div className="conv-avatar">
                        {(party.fullName || "C").charAt(0).toUpperCase()}
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>

                      <div className="conv-info">
                        <div className="conv-top">
                          <h4>{party.fullName || "Conversation"}</h4>
                          <span className="conv-time">
                            {conv.latestMessage?.createdAt
                              ? new Date(conv.latestMessage.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <p className="conv-job">{conv.job?.title || "Matched role"}</p>
                        <p className="conv-preview">{latest.substring(0, 60)}</p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="conv-item">No conversations yet.</div>
              )}
            </div>
          </div>

          <div className="chat-area">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <h2>{otherParty.fullName || "Conversation"}</h2>
                    <p>{selectedConversation.job?.title || "Matched role"}</p>
                  </div>
                  <div className="chat-header-actions">
                    <button className="icon-btn">ℹ</button>
                  </div>
                </div>

                <div className="messages-body">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const senderId = message.sender?._id || message.sender;
                      const isOwn = String(senderId) === String(currentUserId);
                      const showTimestamp =
                        index === 0 ||
                        new Date(message.createdAt).toDateString() !==
                          new Date(messages[index - 1].createdAt).toDateString();

                      return (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {showTimestamp && (
                            <div className="message-timestamp">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </div>
                          )}

                          <div className={`message-row ${isOwn ? "own" : ""}`}>
                            {!isOwn && (
                              <div className="message-avatar">
                                {(message.sender?.fullName || "U").charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div
                              className={`message-bubble ${message.type === "system" ? "system" : ""}`}
                            >
                              {message.type === "system" ? (
                                <div className="system-message">
                                  <span className="system-icon">ℹ</span>
                                  {message.text}
                                </div>
                              ) : (
                                message.text
                              )}
                            </div>

                            {!isOwn && (
                              <span className="message-status">
                                {message.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="no-selection">
                      <p>No messages yet in this conversation.</p>
                    </div>
                  )}
                </div>

                <div className="message-input-area">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      disabled={sending}
                    />
                    <button className="attach-btn">📎</button>
                    <button
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      ➤
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>{loading ? "Loading conversations…" : "Select a conversation to start messaging."}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
