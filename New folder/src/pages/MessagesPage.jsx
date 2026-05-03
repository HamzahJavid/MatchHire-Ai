import { useState } from "react";
import { motion } from "framer-motion";
import "../styles/MessagesPage.css";

const mockConversations = [
  {
    _id: "match_1",
    job: { title: "Senior React Developer", company: "Tech Corp" },
    seeker: { fullName: "Alice Johnson" },
    hirer: { fullName: "John Davis" },
    latestMessage: {
      text: "Great! We conducted the AI screening and your results are excellent - 87/100.",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      sender: "hirer",
    },
    unreadCount: 1,
  },
  {
    _id: "match_2",
    job: { title: "Backend Engineer - Python", company: "Innovation Labs" },
    seeker: { fullName: "Carol Williams" },
    hirer: { fullName: "Sarah Brown" },
    latestMessage: {
      text: "Perfect! Thursday at 3 PM EST works for me.",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      sender: "seeker",
    },
    unreadCount: 0,
  },
];

const mockMessages = [
  {
    _id: "msg_1",
    sender: { fullName: "John Davis", _id: "recruiter_1" },
    text: "Hi Alice! Congratulations on the match! We're impressed with your profile.",
    type: "text",
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "msg_2",
    sender: { fullName: "Alice Johnson", _id: "seeker_1" },
    text: "Thank you! I'm very interested in the Senior React Developer position.",
    type: "text",
    isRead: true,
    createdAt: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "msg_3",
    sender: { fullName: "John Davis", _id: "recruiter_1" },
    text: "Great! We conducted the AI screening and your results are excellent - 87/100. Your technical knowledge is impressive!",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "msg_4",
    sender: { fullName: "John Davis", _id: "recruiter_1" },
    text: "Would you be available for a final round interview next week? Let's schedule it for Monday at 2 PM PT.",
    type: "text",
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
];

export default function MessagesPage({ currentUserId = "seeker_1", currentUserName = "Alice Johnson", role = "seeker" }) {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  function handleSendMessage() {
    if (!newMessage.trim()) return;

    const message = {
      _id: `msg_${Date.now()}`,
      sender: { fullName: currentUserName, _id: currentUserId },
      text: newMessage,
      type: "text",
      isRead: true,
      createdAt: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate response after 2 seconds
    setTimeout(() => {
      const response = {
        _id: `msg_${Date.now()}`,
        sender: { fullName: role === "seeker" ? selectedConversation.hirer.fullName : selectedConversation.seeker.fullName, _id: "other" },
        text: "Thanks for your message! I'll get back to you soon.",
        type: "text",
        isRead: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, 2000);
  }

  const otherParty = role === "seeker" ? selectedConversation.hirer : selectedConversation.seeker;

  return (
    <div className="messages-container">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="messages-wrapper"
      >
        {/* Header */}
        <div className="messages-header">
          <h1>💬 Messages</h1>
          <p>Stay connected with your matches</p>
        </div>

        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-list">
            <h3>Conversations</h3>
            <div className="conv-items">
              {mockConversations.map((conv) => (
                <motion.div
                  key={conv._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={`conv-item ${selectedConversation._id === conv._id ? "active" : ""}`}
                >
                  <div className="conv-avatar">
                    {(role === "seeker" ? conv.hirer.fullName : conv.seeker.fullName)
                      .charAt(0)
                      .toUpperCase()}
                    {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                  </div>

                  <div className="conv-info">
                    <div className="conv-top">
                      <h4>
                        {role === "seeker" ? conv.hirer.fullName : conv.seeker.fullName}
                      </h4>
                      <span className="conv-time">
                        {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="conv-job">{conv.job.title}</p>
                    <p className="conv-preview">{conv.latestMessage.text.substring(0, 40)}...</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  <div className="chat-header-info">
                    <h2>{otherParty.fullName}</h2>
                    <p>{selectedConversation.job.title}</p>
                  </div>
                  <div className="chat-header-actions">
                    <button className="icon-btn">📞</button>
                    <button className="icon-btn">📹</button>
                    <button className="icon-btn">ℹ️</button>
                  </div>
                </div>

                {/* Messages */}
                <div className="messages-body">
                  {messages.map((message, index) => {
                    const isOwn = message.sender._id === currentUserId;
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
                              {message.sender.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div
                            className={`message-bubble ${message.type === "system" ? "system" : ""}`}
                          >
                            {message.type === "system" ? (
                              <div className="system-message">
                                <span className="system-icon">ℹ️</span>
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
                  })}
                </div>

                {/* Input Area */}
                <div className="message-input-area">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <button className="attach-btn">📎</button>
                    <button
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      ➤
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
