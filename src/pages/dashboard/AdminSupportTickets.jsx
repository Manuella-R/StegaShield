// src/pages/dashboard/AdminSupportTickets.jsx
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchTickets();
    fetchAdmins();
  }, [statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? null : statusFilter;
      const response = await adminAPI.getTickets(status);
      setTickets(response.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setMessage('Failed to load tickets');
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

      await adminAPI.updateTicket(ticketId, updates);
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

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteTicket(ticketId);
      setMessage('Ticket deleted successfully');
      setShowMessage(true);
      fetchTickets();
    } catch (error) {
      setMessage(error.message || 'Failed to delete ticket');
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
          <h3>Update Ticket #{editingTicket.ticket_id}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateTicket(editingTicket.ticket_id);
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

      {/* Tickets Table */}
      <div style={styles.card}>
        <h3>All Support Tickets ({tickets.length})</h3>
        {tickets.length === 0 ? (
          <p style={{ color: 'var(--muted-cream)', textAlign: 'center', padding: '2rem' }}>
            No tickets found.
          </p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Assigned To</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const statusColors = getStatusColor(ticket.status);
                return (
                  <tr key={ticket.ticket_id}>
                    <td style={tdStyle}>{ticket.ticket_id}</td>
                    <td style={tdStyle}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--cream)' }}>
                          {ticket.user_name || ticket.user_email}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                          {ticket.user_email}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ maxWidth: '250px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--cream)' }}>
                          {ticket.subject}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted-cream)', marginTop: '0.25rem' }}>
                          {ticket.description.substring(0, 60)}
                          {ticket.description.length > 60 && '...'}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>{ticket.category}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: statusColors.bg,
                        color: statusColors.text,
                        fontSize: '0.85rem',
                      }}>
                        {statusColors.icon} {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        color: getPriorityColor(ticket.priority),
                        fontWeight: 'bold',
                      }}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {ticket.assigned_to_name || (
                        <span style={{ color: 'var(--muted-cream)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={tdStyle}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setEditingTicket(ticket);
                            setUpdateData({
                              status: ticket.status,
                              resolution: ticket.resolution || '',
                              assigned_to: ticket.assigned_to,
                              priority: ticket.priority,
                            });
                            setSelectedTicket(ticket);
                          }}
                          style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.ticket_id)}
                          style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 0, 0, 0.2)', color: '#ff6b6b' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Detail View */}
      {selectedTicket && !editingTicket && (
        <div style={styles.card}>
          <h3>Ticket Details #{selectedTicket.ticket_id}</h3>
          <div style={{ marginBottom: '1rem' }}>
            <p><strong style={{ color: 'var(--cream)' }}>Subject:</strong> {selectedTicket.subject}</p>
            <p><strong style={{ color: 'var(--cream)' }}>Description:</strong></p>
            <div style={{
              background: 'rgba(10, 2, 2, 0.4)',
              padding: '1rem',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              color: 'var(--cream)',
            }}>
              {selectedTicket.description}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            <div>
              <strong style={{ color: 'var(--cream)' }}>Category:</strong>
              <div style={{ color: 'var(--muted-cream)' }}>{selectedTicket.category}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--cream)' }}>Status:</strong>
              <div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  background: getStatusColor(selectedTicket.status).bg,
                  color: getStatusColor(selectedTicket.status).text,
                  fontSize: '0.85rem',
                }}>
                  {getStatusColor(selectedTicket.status).icon} {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--cream)' }}>Priority:</strong>
              <div style={{ color: getPriorityColor(selectedTicket.priority), fontWeight: 'bold' }}>
                {selectedTicket.priority.toUpperCase()}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--cream)' }}>Created:</strong>
              <div style={{ color: 'var(--muted-cream)' }}>
                {new Date(selectedTicket.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {selectedTicket.resolution && (
            <div style={{
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
            }}>
              <h4 style={{ color: '#00ff00', marginTop: 0 }}>Resolution:</h4>
              <p style={{ color: 'var(--cream)', whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                {selectedTicket.resolution}
              </p>
              {selectedTicket.resolved_at && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-cream)', marginTop: '0.5rem', marginBottom: 0 }}>
                  Resolved: {new Date(selectedTicket.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setSelectedTicket(null)}
            style={{ ...styles.button, marginTop: '1rem' }}
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
}

