// src/pages/dashboard/SupportChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { chatsAPI } from '../../utils/api';

export default function SupportChat() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [newChatPriority, setNewChatPriority] = useState('medium');
  const messagesEndRef = useRef(null);

  // Automated message suggestions with responses
  const automatedMessages = [
    {
      prompt: "I need help with watermark embedding",
      response: "Thank you for reaching out! I can help you with watermark embedding. Please let me know:\n1. What watermark type are you trying to use (robust, semi-fragile, or hybrid)?\n2. What error message are you seeing, if any?\n3. What size is your image?\n\nOur support team will respond shortly with detailed assistance."
    },
    {
      prompt: "My verification report seems incorrect",
      response: "I understand your concern about the verification report. To help you better, could you please:\n1. Share the report ID\n2. Describe what seems incorrect\n3. Let me know if you've flagged the report already\n\nOur team will review it and get back to you within 24 hours."
    },
    {
      prompt: "I'm having trouble downloading my watermarked image",
      response: "I'm sorry to hear you're having trouble downloading your watermarked image. Let's troubleshoot:\n1. Are you seeing any error messages?\n2. What browser are you using?\n3. Have you tried refreshing the page?\n\nIf the issue persists, please try using a different browser or clearing your cache. Our technical team is here to help!"
    },
    {
      prompt: "How do I verify a watermarked image?",
      response: "To verify a watermarked image:\n1. Go to the 'Verify Image' section\n2. Upload the watermarked image\n3. Upload the metadata JSON file you downloaded during embedding\n4. Select the matching watermark profile\n5. Click 'Run Verification'\n\nThe system will analyze the image and show you the verification results with detailed explanations."
    },
    {
      prompt: "I want to report a bug or technical issue",
      response: "Thank you for reporting this! To help us fix it quickly, please provide:\n1. A detailed description of the issue\n2. Steps to reproduce the problem\n3. Any error messages you're seeing\n4. Your browser and operating system\n\nWe'll investigate and get back to you as soon as possible. Your feedback helps us improve!"
    }
  ];

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await chatsAPI.getMyChats();
      setChats(response.chats || []);
      if (response.chats && response.chats.length > 0 && !selectedChat) {
        setSelectedChat(response.chats[0].chat_id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await chatsAPI.getChat(chatId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatSubject.trim() || !newChatMessage.trim()) {
      alert('Please provide both subject and message');
      return;
    }
    setCreatingChat(true);
    try {
      await chatsAPI.createChat(newChatSubject, newChatMessage, newChatPriority);
      setNewChatSubject('');
      setNewChatMessage('');
      setNewChatPriority('medium');
      setCreatingChat(false);
      await loadChats();
    } catch (error) {
      alert('Failed to create chat: ' + error.message);
      setCreatingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      await chatsAPI.addMessage(selectedChat, newMessage);
      setNewMessage('');
      await loadMessages(selectedChat);
      await loadChats();
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleAutomatedMessage = async (autoMsg) => {
    if (!selectedChat) return;
    try {
      // Send user's message
      await chatsAPI.addMessage(selectedChat, autoMsg.prompt);
      await loadMessages(selectedChat);
      await loadChats();
      
      // Wait a moment, then show automated response
      // Note: In production, this would be handled by backend automation
      setTimeout(async () => {
        // For now, we'll add it as a temporary message in the UI
        // In production, this would come from a backend bot/service
        const tempResponse = {
          message_id: `temp-${Date.now()}`,
          chat_id: selectedChat,
          message: autoMsg.response,
          is_admin: true,
          admin_name: 'Support Bot',
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempResponse]);
        scrollToBottom();
      }, 1500);
    } catch (error) {
      console.error('Failed to send automated message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#ffa500';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#00aa88';
      case 'closed': return '#999';
      default: return '#999';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4d4f';
      case 'high': return '#ff9800';
      case 'medium': return '#ffa500';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading support tickets...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Support & Help</h2>
      <p style={{ color: 'var(--muted-cream)', marginBottom: '2rem' }}>
        Contact our support team for assistance with verification reports, technical issues, or general questions.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', height: '600px' }}>
        {/* Chats List */}
        <div style={{
          width: '300px',
          background: 'rgba(10, 2, 2, 0.6)',
          border: '1px solid rgba(245, 230, 211, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          overflowY: 'auto',
        }}>
          <button
            onClick={() => setCreatingChat(!creatingChat)}
            style={{
              ...styles.button,
              width: '100%',
              marginBottom: '1rem',
              background: creatingChat ? 'var(--dark-red)' : 'var(--accent-gold)',
              color: creatingChat ? 'var(--cream)' : 'var(--dark-red)',
            }}
          >
            {creatingChat ? 'Cancel' : '+ New Chat'}
          </button>

          {creatingChat && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <input
                type="text"
                placeholder="Subject"
                value={newChatSubject}
                onChange={(e) => setNewChatSubject(e.target.value)}
                style={{
                  ...styles.input,
                  width: '100%',
                  marginBottom: '0.75rem',
                }}
              />
              <textarea
                placeholder="Message"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                style={{
                  ...styles.input,
                  width: '100%',
                  minHeight: '100px',
                  marginBottom: '0.75rem',
                }}
              />
              <select
                value={newChatPriority}
                onChange={(e) => setNewChatPriority(e.target.value)}
                style={{
                  ...styles.select,
                  width: '100%',
                  marginBottom: '0.75rem',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                onClick={handleCreateChat}
                style={{
                  ...styles.button,
                  width: '100%',
                }}
              >
                Create Chat
              </button>
            </div>
          )}

          <div style={{ fontSize: '0.9rem', color: 'var(--muted-cream)', marginBottom: '0.75rem' }}>
            Your Chats ({chats.length})
          </div>
          {chats.map((chat) => (
            <div
              key={chat.chat_id}
              onClick={() => setSelectedChat(chat.chat_id)}
              style={{
                background: selectedChat === chat.chat_id 
                  ? 'rgba(245, 230, 211, 0.15)' 
                  : 'rgba(245, 230, 211, 0.05)',
                border: `1px solid ${selectedChat === chat.chat_id ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.1)'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                fontWeight: 600, 
                color: 'var(--cream)',
                marginBottom: '0.25rem',
                fontSize: '0.95rem',
              }}>
                {chat.subject}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--muted-cream)',
                marginBottom: '0.25rem',
              }}>
                {new Date(chat.created_at).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: `rgba(${getStatusColor(chat.status).slice(1)}, 0.2)`,
                  color: getStatusColor(chat.status),
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  {chat.status}
                </span>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: `rgba(${getPriorityColor(chat.priority).slice(1)}, 0.2)`,
                  color: getPriorityColor(chat.priority),
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  {chat.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10, 2, 2, 0.6)',
          border: '1px solid rgba(245, 230, 211, 0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {selectedChat ? (
            <>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(245, 230, 211, 0.2)',
                background: 'rgba(245, 230, 211, 0.05)',
              }}>
                <h3 style={{ margin: 0, color: 'var(--cream)' }}>
                  {chats.find(t => t.chat_id === selectedChat)?.subject || 'Chat'}
                </h3>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--muted-cream)',
                  marginTop: '0.25rem',
                }}>
                  Status: <span style={{ color: getStatusColor(chats.find(t => t.chat_id === selectedChat)?.status) }}>
                    {chats.find(t => t.chat_id === selectedChat)?.status}
                  </span>
                </div>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    style={{
                      alignSelf: msg.is_admin ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      background: msg.is_admin 
                        ? 'rgba(245, 230, 211, 0.2)' 
                        : 'rgba(245, 230, 211, 0.1)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: `1px solid ${msg.is_admin ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.2)'}`,
                    }}
                  >
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted-cream)',
                      marginBottom: '0.25rem',
                      fontWeight: 600,
                    }}>
                      {msg.is_admin 
                        ? `Admin${msg.admin_name ? `: ${msg.admin_name}` : ''}` 
                        : currentUser?.name || 'You'}
                    </div>
                    <div style={{ color: 'var(--cream)', lineHeight: 1.6 }}>
                      {msg.message}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted-cream)',
                      marginTop: '0.25rem',
                    }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Automated Message Suggestions */}
              {messages.length === 0 && (
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid rgba(245, 230, 211, 0.2)',
                  background: 'rgba(245, 230, 211, 0.03)',
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--muted-cream)',
                    marginBottom: '0.75rem',
                    fontWeight: 600,
                  }}>
                    Quick Help Suggestions:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    {automatedMessages.map((autoMsg, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAutomatedMessage(autoMsg)}
                        style={{
                          background: 'rgba(245, 230, 211, 0.1)',
                          border: '1px solid rgba(245, 230, 211, 0.2)',
                          borderRadius: '6px',
                          padding: '0.75rem',
                          color: 'var(--cream)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(245, 230, 211, 0.15)';
                          e.target.style.borderColor = 'var(--accent-gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(245, 230, 211, 0.1)';
                          e.target.style.borderColor = 'rgba(245, 230, 211, 0.2)';
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {autoMsg.prompt}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--muted-cream)',
                          fontStyle: 'italic',
                        }}>
                          Click to send and get automated help
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(245, 230, 211, 0.2)',
                background: 'rgba(245, 230, 211, 0.05)',
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      ...styles.input,
                      minHeight: '60px',
                      resize: 'none',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      ...styles.button,
                      padding: '0.75rem 1.5rem',
                      alignSelf: 'flex-end',
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--muted-cream)',
            }}>
              {chats.length === 0 
                ? 'No chats yet. Create a new chat to get started!'
                : 'Select a chat to view messages'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

