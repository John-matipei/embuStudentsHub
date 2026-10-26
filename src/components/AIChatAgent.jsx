import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { sendChatMessage } from "../services/api";

export default function AIChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your Embu Homes assistant. I can help you find student accommodation, answer questions about rent, locations, amenities, and booking viewings. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const chatWindow = document.querySelector('.ai-chat-window');
      const chatButton = document.querySelector('.ai-chat-button');
      
      if (isOpen && chatWindow && !chatWindow.contains(e.target) && !chatButton?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date().toISOString() },
    ]);

    setIsLoading(true);

    try {
      console.log("Sending message to AI:", userMessage);
      const response = await sendChatMessage(userMessage, messages);
      
      console.log("Received response from AI:", response);
      
      if (!response.message) {
        throw new Error("Invalid response from server");
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: response.message, 
          timestamp: new Date().toISOString() 
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection or try again later.", 
          timestamp: new Date().toISOString() 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const openChat = () => {
    setIsOpen(true);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm your Embu Homes assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const suggestedQuestions = [
    "What are the rent prices?",
    "Which areas are near campus?",
    "How do I book a viewing?",
    "What amenities are included?",
  ];

  return (
    <>
      {/* Chat Button - Only show when chat is closed */}
      {!isOpen && (
        <button
          className="ai-chat-button"
          onClick={openChat}
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
          <span>Ask AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <Bot size={22} />
              <span>Embu Homes Assistant</span>
            </div>
            <div className="ai-chat-header-actions">
              <button 
                className="ai-chat-clear"
                onClick={clearChat}
                title="Clear conversation"
                aria-label="Clear chat"
              >
                New chat
              </button>
              <button 
                className="ai-chat-close"
                onClick={closeChat}
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-message ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div className="ai-message-avatar">
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="ai-message-content">
                  <p>{msg.content}</p>
                  <span className="ai-message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="ai-message assistant">
                <div className="ai-message-avatar">
                  <Bot size={16} />
                </div>
                <div className="ai-message-content">
                  <div className="ai-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length < 3 && (
            <div className="ai-suggested-questions">
              <p>Quick questions:</p>
              <div className="ai-suggestions">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .ai-chat-button {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          background: linear-gradient(135deg, #1d7c43, #0d5a30);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(23, 107, 58, 0.35);
          transition: all 0.3s ease;
        }

        .ai-chat-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(23, 107, 58, 0.45);
        }

        .ai-chat-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          max-height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e0e7e1;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .ai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1d7c43, #0d5a30);
          color: white;
        }

        .ai-chat-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 15px;
        }

        .ai-chat-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-chat-clear {
          padding: 6px 12px;
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-chat-clear:hover {
          background: rgba(255,255,255,0.25);
        }

        .ai-chat-close {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-chat-close:hover {
          background: rgba(255,255,255,0.25);
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          max-height: 380px;
          background: #f8faf9;
        }

        .ai-message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-message.user {
          flex-direction: row-reverse;
        }

        .ai-message-avatar {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          background: #e9f6ed;
          color: #176b3a;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ai-message.user .ai-message-avatar {
          background: #176b3a;
          color: white;
        }

        .ai-message-content {
          max-width: 260px;
          padding: 12px 16px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e0e7e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .ai-message.user .ai-message-content {
          background: #176b3a;
          color: white;
          border-color: #176b3a;
        }

        .ai-message-content p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        .ai-message-time {
          display: block;
          margin-top: 6px;
          font-size: 10px;
          color: #89938d;
        }

        .ai-message.user .ai-message-time {
          color: rgba(255,255,255,0.7);
        }

        .ai-typing {
          display: flex;
          gap: 4px;
          padding: 8px 4px;
        }

        .ai-typing span {
          width: 6px;
          height: 6px;
          background: #89938d;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }

        .ai-suggested-questions {
          padding: 12px 20px;
          background: white;
          border-top: 1px solid #e0e7e1;
        }

        .ai-suggested-questions p {
          margin: 0 0 10px;
          font-size: 11px;
          color: #68736c;
          font-weight: 600;
        }

        .ai-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ai-suggestions button {
          padding: 8px 14px;
          background: #e9f6ed;
          color: #176b3a;
          border: none;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-suggestions button:hover {
          background: #176b3a;
          color: white;
        }

        .ai-chat-input {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #e0e7e1;
        }

        .ai-chat-input input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .ai-chat-input input:focus {
          border-color: #176b3a;
        }

        .ai-chat-input button {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          background: #176b3a;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-chat-input button:hover:not(:disabled) {
          background: #0d5a30;
        }

        .ai-chat-input button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        @media (max-width: 500px) {
          .ai-chat-window {
            right: 10px;
            left: 10px;
            width: auto;
            bottom: 10px;
            top: 10px;
            max-height: none;
            border-radius: 16px;
          }

          .ai-chat-messages {
            max-height: none;
          }
          
          .ai-chat-button {
            right: 16px;
            bottom: 16px;
            padding: 12px 18px;
          }
          
          .ai-chat-button span {
            display: none;
          }
        }
      `}</style>
    </>
  );
}