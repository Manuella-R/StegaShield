// src/pages/dashboard/AdminAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await adminAPI.getAnalytics();
        setAnalytics(response);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div style={styles.container}>No analytics data available</div>;
  }

  // Prepare chart data
  const uploadsByTypeData = analytics.uploads_by_type || [];
  const verificationResultsData = analytics.verification_results || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>System Analytics</h2>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={styles.card}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>{analytics.users || 0}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Uploads</h3>
          <p style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>{analytics.uploads || 0}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>${analytics.revenue?.successful_revenue || 0}</p>
        </div>
        <div style={styles.card}>
          <h3>Successful Payments</h3>
          <p style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>{analytics.revenue?.total_payments || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
        {/* Uploads by Type */}
        <div style={styles.card}>
          <h3>Uploads by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={uploadsByTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="operation_type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Verification Results */}
        <div style={styles.card}>
          <h3>Verification Results</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={verificationResultsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {verificationResultsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
