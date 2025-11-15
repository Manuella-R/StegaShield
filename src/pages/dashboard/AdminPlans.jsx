// src/pages/dashboard/AdminPlans.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: '',
    price: 0,
    description: '',
    max_uploads_per_week: 10,
    features: '',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPlans();
      setPlans(response.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      price: plan.price,
      description: plan.description || '',
      max_uploads_per_week: plan.max_uploads_per_week || 10,
      features: typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features || []),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingPlan) {
        // Update existing plan
        await adminAPI.updatePlan(editingPlan.plan_id, formData);
        setMessage('Plan updated successfully!');
      } else {
        // Create new plan
        await adminAPI.createPlan(formData);
        setMessage('Plan created successfully!');
      }

      setShowMessage(true);
      setShowForm(false);
      setEditingPlan(null);
      setFormData({
        plan_name: '',
        price: 0,
        description: '',
        max_uploads_per_week: 10,
        features: '',
      });
      fetchPlans();
    } catch (error) {
      setMessage(error.message || 'Failed to save plan');
      setShowMessage(true);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading plans...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Plans & Pricing</h2>

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

      <button
        onClick={() => {
          setEditingPlan(null);
          setFormData({
            plan_name: '',
            price: 0,
            description: '',
            max_uploads_per_week: 10,
            features: '',
          });
          setShowForm(true);
        }}
        style={styles.button}
      >
        Add New Plan
      </button>

      {showForm && (
        <div style={styles.card}>
          <h3>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Plan Name</label>
            <input
              style={styles.input}
              type="text"
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              placeholder="Plan name"
              required
            />

            <label style={styles.label}>Price (USD)</label>
            <input
              style={styles.input}
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              placeholder="0.00"
              step="0.01"
              required
            />

            <label style={styles.label}>Description</label>
            <textarea
              style={styles.input}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Plan description"
              rows="3"
            />

            <label style={styles.label}>Max Uploads Per Week</label>
            <input
              style={styles.input}
              type="number"
              value={formData.max_uploads_per_week}
              onChange={(e) => setFormData({ ...formData, max_uploads_per_week: parseInt(e.target.value) })}
              placeholder="10"
              required
            />

            <label style={styles.label}>Features (JSON array)</label>
            <textarea
              style={styles.input}
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder='["feature1", "feature2"]'
              rows="3"
            />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={styles.button}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPlan(null);
                }}
                style={{ ...styles.button, background: 'rgba(245, 230, 211, 0.1)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        {plans.map(plan => (
          <div key={plan.plan_id} style={styles.card}>
            <h3>{plan.plan_name}</h3>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>${plan.price}/month</p>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '1rem' }}>{plan.description}</p>
            <p><strong>Max Uploads/Week:</strong> {plan.max_uploads_per_week === -1 ? 'Unlimited' : plan.max_uploads_per_week}</p>
            <p><strong>Features:</strong> {typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features)}</p>
            <button
              onClick={() => handleEdit(plan)}
              style={styles.button}
            >
              Edit Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
