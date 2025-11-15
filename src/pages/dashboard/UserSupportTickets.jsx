// src/pages/dashboard/UserSupportTickets.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { ticketsAPI } from '../../utils/api';

export default function UserSupportTickets() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'Other',
    priority: 'medium',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketsAPI.getMyTickets();
      setTickets(response.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setMessage('Failed to load tickets');
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await ticketsAPI.createTicket(formData);
      setMessage('Ticket created successfully! We will respond soon.');
      setShowMessage(true);
      setShowCreateForm(false);
      setFormData({ subject: '', description: '', category: 'Other', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      setMessage(error.message || 'Failed to create ticket');
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
    return <div style={styles.container}>Loading your tickets...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={styles.h2}>My Support Tickets</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.button}
        >
          {showCreateForm ? 'Cancel' : '+ New Ticket'}
        </button>
      </div>

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

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div style={styles.card}>
          <h3>Create New Support Ticket</h3>
          <form onSubmit={handleCreateTicket}>
            <label style={styles.label}>Subject</label>
            <input
              style={styles.input}
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              required
            />

            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about your issue..."
              required
            />

            <label style={styles.label}>Category</label>
            <select
              style={styles.select}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Payment Issue">Payment Issue</option>
              <option value="Other">Other</option>
            </select>

            <label style={styles.label}>Priority</label>
            <select
              style={styles.select}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <button type="submit" style={styles.button}>
              Submit Ticket
            </button>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div style={styles.card}>
        <h3>Your Tickets ({tickets.length})</h3>
        {tickets.length === 0 ? (
          <p style={{ color: 'var(--muted-cream)', textAlign: 'center', padding: '2rem' }}>
            No tickets yet. Click "New Ticket" to create one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets.map(ticket => {
              const statusColors = getStatusColor(ticket.status);
              return (
                <div
                  key={ticket.ticket_id}
                  style={{
                    background: selectedTicket?.ticket_id === ticket.ticket_id 
                      ? 'rgba(245, 230, 211, 0.1)' 
                      : 'rgba(10, 2, 2, 0.4)',
                    border: `1px solid ${statusColors.bg}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setSelectedTicket(
                    selectedTicket?.ticket_id === ticket.ticket_id ? null : ticket
                  )}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: 'var(--cream)', margin: 0 }}>
                      {ticket.subject}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: statusColors.bg,
                        color: statusColors.text,
                        fontSize: '0.85rem',
                      }}>
                        {statusColors.icon} {ticket.status.replace('_', ' ')}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: getPriorityColor(ticket.priority),
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                      }}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>
                    <span>Category: {ticket.category}</span>
                    <span>•</span>
                    <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                    {ticket.updated_at !== ticket.created_at && (
                      <>
                        <span>•</span>
                        <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>
                      </>
                    )}
                  </div>

                  {selectedTicket?.ticket_id === ticket.ticket_id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(245, 230, 211, 0.2)' }}>
                      <p style={{ color: 'var(--cream)', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                        {ticket.description}
                      </p>

                      {ticket.assigned_to_name && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>
                          <strong>Assigned to:</strong> {ticket.assigned_to_name}
                        </p>
                      )}

                      {ticket.resolution && (
                        <div style={{
                          background: 'rgba(0, 255, 0, 0.1)',
                          border: '1px solid rgba(0, 255, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginTop: '1rem',
                        }}>
                          <h5 style={{ color: '#00ff00', marginTop: 0, marginBottom: '0.5rem' }}>Resolution:</h5>
                          <p style={{ color: 'var(--cream)', whiteSpace: 'pre-wrap', margin: 0 }}>
                            {ticket.resolution}
                          </p>
                          {ticket.resolved_at && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted-cream)', marginTop: '0.5rem', marginBottom: 0 }}>
                              Resolved: {new Date(ticket.resolved_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedTicket || selectedTicket.ticket_id !== ticket.ticket_id ? (
                    <p style={{ color: 'var(--muted-cream)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {ticket.description.substring(0, 100)}
                      {ticket.description.length > 100 && '...'}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

