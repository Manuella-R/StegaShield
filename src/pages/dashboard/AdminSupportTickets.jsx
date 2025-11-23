// src/pages/dashboard/AdminSupportTickets.jsx
import React, { useState, useEffect, useRef } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { adminAPI } from '../../utils/api';

export default function AdminSupportTickets() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution: '',
    assigned_to: null,
    priority: '',
  });
  const [allAdmins, setAllAdmins] = useState([]);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
    fetchAdmins();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.chat_id || selectedTicket.ticket_id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await adminAPI.getSupportChat(chatId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    const chatId = selectedTicket.chat_id || selectedTicket.ticket_id;
    try {
      await adminAPI.addSupportMessage(chatId, newMessage);
      setNewMessage('');
      await loadMessages(chatId);
      await fetchTickets();
    } catch (error) {
      setMessage(error.message || 'Failed to send message');
      setShowMessage(true);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? null : statusFilter;
      const response = await adminAPI.getSupportChats(status);
      setTickets(response.chats || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setMessage('Failed to load chats');
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await adminAPI.getUsers();
      const admins = response.users?.filter(u => 
        u.role === 'admin' || u.role === 'developer' || u.role === 'moderator'
      ) || [];
      setAllAdmins(admins);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleUpdateTicket = async (ticketId) => {
    setMessage('');
    try {
      const updates = {};
      if (updateData.status) updates.status = updateData.status;
      if (updateData.resolution) updates.resolution = updateData.resolution;
      if (updateData.assigned_to !== null) updates.assigned_to = updateData.assigned_to || null;
      if (updateData.priority) updates.priority = updateData.priority;

      await adminAPI.updateSupportChat(ticketId, updates);
      setMessage('Ticket updated successfully!');
      setShowMessage(true);
      setEditingTicket(null);
      setUpdateData({ status: '', resolution: '', assigned_to: null, priority: '' });
      fetchTickets();
    } catch (error) {
      setMessage(error.message || 'Failed to update ticket');
      setShowMessage(true);
    }
  };

  const handleDeleteTicket = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteSupportChat(chatId);
      setMessage('Chat deleted successfully');
      setShowMessage(true);
      fetchTickets();
    } catch (error) {
      setMessage(error.message || 'Failed to delete chat');
      setShowMessage(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(255, 165, 0, 0.2)', text: '#ffa500', icon: '⏳' };
      case 'in_progress': return { bg: 'rgba(0, 150, 255, 0.2)', text: '#0096ff', icon: '🔄' };
      case 'resolved': return { bg: 'rgba(0, 255, 0, 0.2)', text: '#00ff00', icon: '✅' };
      case 'closed': return { bg: 'rgba(128, 128, 128, 0.2)', text: '#808080', icon: '🔒' };
      default: return { bg: 'rgba(128, 128, 128, 0.2)', text: '#808080', icon: '❓' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff0000';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa500';
      case 'low': return '#00c800';
      default: return 'var(--muted-cream)';
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading tickets...</div>;
  }

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  };

  const thStyle = {
    borderBottom: '2px solid rgba(245, 230, 211, 0.2)',
    padding: '0.75rem',
    textAlign: 'left',
    background: 'rgba(245, 230, 211, 0.1)',
    color: 'var(--cream)',
  };

  const tdStyle = {
    borderBottom: '1px solid rgba(245, 230, 211, 0.1)',
    padding: '0.75rem',
    color: 'var(--muted-cream)',
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Support Tickets Management</h2>

      {showMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'rgba(245, 230, 211, 0.1)',
          border: '1px solid rgba(245, 230, 211, 0.3)',
          borderRadius: '8px',
          color: 'var(--accent-gold)',
        }}>
          {message}
          <button onClick={() => setShowMessage(false)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'in_progress', 'resolved', 'closed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === status ? 'var(--accent-gold)' : 'transparent',
              color: statusFilter === status ? 'var(--dark-red)' : 'var(--cream)',
              border: '1px solid rgba(245, 230, 211, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {status.replace('_', ' ')} ({tickets.filter(t => status === 'all' || t.status === status).length})
          </button>
        ))}
      </div>

      {/* Edit Ticket Form */}
      {editingTicket && (
        <div style={styles.card}>
          <h3>Update Chat #{editingTicket.chat_id || editingTicket.ticket_id}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateTicket(editingTicket.chat_id || editingTicket.ticket_id);
          }}>
            <label style={styles.label}>Status</label>
            <select
              style={styles.select}
              value={updateData.status || editingTicket.status}
              onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <label style={styles.label}>Priority</label>
            <select
              style={styles.select}
              value={updateData.priority || editingTicket.priority}
              onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <label style={styles.label}>Assign To</label>
            <select
              style={styles.select}
              value={updateData.assigned_to !== null ? updateData.assigned_to : (editingTicket.assigned_to || '')}
              onChange={(e) => setUpdateData({ ...updateData, assigned_to: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">Unassigned</option>
              {allAdmins.map(admin => (
                <option key={admin.user_id} value={admin.user_id}>
                  {admin.name} ({admin.role})
                </option>
              ))}
            </select>

            <label style={styles.label}>Resolution</label>
            <textarea
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              value={updateData.resolution || editingTicket.resolution || ''}
              onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
              placeholder="How was this ticket resolved?"
            />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={styles.button}>
                Update Ticket
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTicket(null);
                  setUpdateData({ status: '', resolution: '', assigned_to: null, priority: '' });
                }}
                style={{ ...styles.button, background: 'rgba(245, 230, 211, 0.1)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chats List and Chat Interface */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Chats List */}
        <div style={{
          width: '350px',
          background: 'rgba(10, 2, 2, 0.6)',
          border: '1px solid rgba(245, 230, 211, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--cream)' }}>
            All Chats ({tickets.length})
          </h3>
          {tickets.length === 0 ? (
            <p style={{ color: 'var(--muted-cream)', textAlign: 'center', padding: '2rem' }}>
              No chats found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tickets.map(ticket => {
                const statusColors = getStatusColor(ticket.status);
                return (
                  <div
                    key={ticket.chat_id || ticket.ticket_id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setEditingTicket(null);
                    }}
                    style={{
                      background: selectedTicket?.chat_id === (ticket.chat_id || ticket.ticket_id)
                        ? 'rgba(245, 230, 211, 0.15)'
                        : 'rgba(245, 230, 211, 0.05)',
                      border: `1px solid ${selectedTicket?.chat_id === (ticket.chat_id || ticket.ticket_id) ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.1)'}`,
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                      {ticket.subject}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>
                      {ticket.user_name || ticket.user_email}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: statusColors.bg,
                        color: statusColors.text,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {ticket.status}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: `rgba(${getPriorityColor(ticket.priority).slice(1)}, 0.2)`,
                        color: getPriorityColor(ticket.priority),
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Interface - shown when ticket is selected */}
        {selectedTicket && !editingTicket ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            background: 'rgba(10, 2, 2, 0.6)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(245, 230, 211, 0.2)',
              background: 'rgba(245, 230, 211, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--cream)' }}>
                  {selectedTicket.subject}
                </h3>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--muted-cream)',
                  marginTop: '0.25rem',
                  display: 'flex',
                  gap: '1rem',
                }}>
                  <span>
                    Status: <span style={{ color: getStatusColor(selectedTicket.status).text }}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </span>
                  <span>
                    Priority: <span style={{ color: getPriorityColor(selectedTicket.priority) }}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </span>
                  <span>
                    User: {selectedTicket.user_name || selectedTicket.user_email}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setEditingTicket(selectedTicket);
                    setUpdateData({
                      status: selectedTicket.status,
                      resolution: '',
                      assigned_to: null,
                      priority: selectedTicket.priority,
                    });
                  }}
                  style={{
                    background: 'rgba(245, 230, 211, 0.1)',
                    border: '1px solid rgba(245, 230, 211, 0.3)',
                    color: 'var(--cream)',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Update Status
                </button>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setMessages([]);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(245, 230, 211, 0.3)',
                    color: 'var(--cream)',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
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
                      : msg.user_name || selectedTicket.user_name || 'User'}
                  </div>
                  <div style={{ color: 'var(--cream)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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
                  placeholder="Type your response..."
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
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 2, 2, 0.6)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '12px',
            color: 'var(--muted-cream)',
            height: '600px',
          }}>
            {tickets.length === 0 
              ? 'No chats available'
              : 'Select a chat to view and respond'}
          </div>
        )}
      </div>

    </div>
  );
}

