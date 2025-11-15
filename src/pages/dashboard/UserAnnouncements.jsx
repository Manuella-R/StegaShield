// src/pages/dashboard/UserAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { announcementsAPI } from '../../utils/api';

export default function UserAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await announcementsAPI.getPublishedAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading announcements...</div>;
  }

  const cardStyle = {
    background: 'rgba(10, 2, 2, 0.6)',
    border: '1px solid rgba(245, 230, 211, 0.2)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    cursor: selectedAnnouncement ? 'default' : 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>📢 Announcements</h2>
      <p style={{ color: 'var(--muted-cream)', marginBottom: '2rem' }}>
        Stay updated with the latest news, features, and updates from StegaShield.
      </p>

      {announcements.length === 0 ? (
        <div style={styles.card}>
          <p style={{ color: 'var(--muted-cream)', textAlign: 'center' }}>
            No announcements available at the moment.
          </p>
        </div>
      ) : (
        <div>
          {announcements.map(announcement => (
            <div
              key={announcement.announcement_id}
              style={{
                ...cardStyle,
                border: selectedAnnouncement?.announcement_id === announcement.announcement_id 
                  ? '2px solid var(--accent-gold)' 
                  : '1px solid rgba(245, 230, 211, 0.2)',
              }}
              onClick={() => setSelectedAnnouncement(
                selectedAnnouncement?.announcement_id === announcement.announcement_id 
                  ? null 
                  : announcement
              )}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h3 style={{ 
                  color: 'var(--accent-gold)', 
                  margin: 0,
                  fontSize: '1.25rem',
                }}>
                  {announcement.title}
                </h3>
                <span style={{
                  fontSize: '0.85rem',
                  color: 'var(--muted-cream)',
                  whiteSpace: 'nowrap',
                }}>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {selectedAnnouncement?.announcement_id === announcement.announcement_id ? (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ 
                    color: 'var(--cream)', 
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {announcement.content}
                  </p>
                  <p style={{ 
                    marginTop: '1rem',
                    fontSize: '0.85rem',
                    color: 'var(--muted-cream)',
                  }}>
                    Posted by {announcement.created_by_name || 'Admin'}
                  </p>
                </div>
              ) : (
                <p style={{ 
                  color: 'var(--muted-cream)', 
                  marginTop: '0.5rem',
                }}>
                  {announcement.content.substring(0, 150)}
                  {announcement.content.length > 150 && '...'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

