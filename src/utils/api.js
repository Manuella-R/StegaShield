// API utility for frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('token');
};

// Make API request with timeout
const apiRequest = async (endpoint, options = {}, timeout = 10000) => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - API server may not be running')), timeout);
    });

    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(url, config),
      timeoutPromise,
    ]);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'API request failed');
    }

    if (!response.ok) {
      throw new Error(data.error || `API request failed: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Network errors or JSON parsing errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('API not available - is the server running?', error.message);
      throw new Error('API server is not available. Please ensure the backend server is running.');
    }
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  logout: () => {
    removeToken();
  },

  getCurrentUser: async () => {
    try {
      return await apiRequest('/auth/me');
    } catch (error) {
      // If API is not available, return empty response instead of throwing
      console.warn('Could not get current user:', error.message);
      throw error;
    }
  },

  updateProfile: async (updates) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  sendContactForm: async (formData) => {
    return apiRequest('/auth/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  oauthLogin: async (oauthData) => {
    const response = await apiRequest('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(oauthData),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  verify2FA: async (userId, code) => {
    const response = await apiRequest('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, code }),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  setup2FA: async () => {
    return apiRequest('/auth/2fa/setup', {
      method: 'POST',
    });
  },

  enable2FA: async (code) => {
    return apiRequest('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  disable2FA: async (password) => {
    return apiRequest('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
};

// Watermark API
export const watermarkAPI = {
  embed: async (file, watermarkType, metadata, customId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('watermark_type', watermarkType);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    if (customId && customId.trim().length > 0) {
      formData.append('custom_id', customId.trim());
    }

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/watermark/embed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.error || 'Failed to embed watermark';
      const errorWithSuggestion = error.suggestion 
        ? `${errorMessage}. ${error.suggestion}` 
        : errorMessage;
      throw new Error(errorWithSuggestion);
    }

    return response.json();
  },

  verify: async (file, metadataFile, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadataFile) {
      formData.append('metadata_file', metadataFile);
    }
    if (options.mode) {
      formData.append('mode', options.mode);
    }

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/watermark/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify watermark');
    }

    return response.json();
  },

  getUploads: async () => {
    return apiRequest('/watermark/uploads');
  },

  getReports: async () => {
    return apiRequest('/watermark/reports');
  },

  getFlagHistory: async () => {
    return apiRequest('/watermark/reports/flagged/history');
  },

  getReport: async (reportId) => {
    return apiRequest(`/watermark/reports/${reportId}`);
  },

  flagReport: async (reportId, reason, flagCategory) => {
    return apiRequest(`/watermark/reports/${reportId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason, flag_category: flagCategory }),
    });
  },

  unflagReport: async (reportId) => {
    return apiRequest(`/watermark/reports/${reportId}/unflag`, {
      method: 'POST',
    });
  },

  rateReport: async (reportId, rating, feedback) => {
    return apiRequest(`/watermark/reports/${reportId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  },

  getAverageRating: async () => {
    return apiRequest('/watermark/reports/ratings/average');
  },
};

// Payments API
export const paymentsAPI = {
  getPlans: async () => {
    return apiRequest('/payments/plans');
  },

  getCurrentPlan: async () => {
    return apiRequest('/payments/plan');
  },

  createPayment: async (planId, paymentMethod, phoneNumber, transactionCode) => {
    return apiRequest('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ 
        plan_id: planId, 
        payment_method: paymentMethod, 
        phone_number: phoneNumber,
        transaction_code: transactionCode 
      }),
    });
  },

  confirmPayment: async (paymentId, status, transactionCode) => {
    return apiRequest('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId, status, transaction_code: transactionCode }),
    });
  },

  getPaymentHistory: async () => {
    return apiRequest('/payments/history');
  },
};

// Admin API

export const adminAPI = {
  getUsers: async () => {
    return apiRequest('/admin/users');
  },

  getUser: async (userId) => {
    return apiRequest(`/admin/users/${userId}`);
  },

  updateUser: async (userId, updates) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getAnalytics: async () => {
    return apiRequest('/admin/analytics');
  },

  getLogs: async (limit = 100) => {
    return apiRequest(`/admin/logs?limit=${limit}`);
  },

  getPayments: async () => {
    return apiRequest('/admin/payments');
  },

  getPlans: async () => {
    return apiRequest('/admin/plans');
  },

  createPlan: async (planData) => {
    return apiRequest('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },

  updatePlan: async (planId, updates) => {
    return apiRequest(`/admin/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  searchUsers: async (searchTerm) => {
    return apiRequest(`/admin/users?search=${encodeURIComponent(searchTerm)}`);
  },

  deleteUser: async (userId) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  getFlaggedReports: async (category = null) => {
    const url = category ? `/admin/reports/flagged?category=${encodeURIComponent(category)}` : '/admin/reports/flagged';
    return apiRequest(url);
  },

  updateFlagStatus: async (reportId, historyId, status, resolutionNotes) => {
    return apiRequest(`/admin/reports/${reportId}/flag-status`, {
      method: 'PUT',
      body: JSON.stringify({ history_id: historyId, status, resolution_notes: resolutionNotes }),
    });
  },

  unflagReport: async (reportId) => {
    return apiRequest(`/admin/reports/${reportId}/unflag`, {
      method: 'POST',
    });
  },

  getSupportChats: async (status = null) => {
    const url = status ? `/admin/support/chats?status=${status}` : '/admin/support/chats';
    return apiRequest(url);
  },

  getSupportChat: async (chatId) => {
    return apiRequest(`/admin/support/chats/${chatId}`);
  },

  updateSupportChat: async (chatId, updates) => {
    return apiRequest(`/admin/support/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  addSupportMessage: async (chatId, message) => {
    return apiRequest(`/admin/support/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  deleteSupportChat: async (chatId) => {
    return apiRequest(`/admin/support/chats/${chatId}`, {
      method: 'DELETE',
    });
  },

  deleteTicket: async (ticketId) => {
    return apiRequest(`/admin/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },

  getAnnouncements: async (status = null) => {
    const url = status ? `/admin/announcements?status=${status}` : '/admin/announcements';
    return apiRequest(url);
  },

  createAnnouncement: async (announcementData) => {
    return apiRequest('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  },

  updateAnnouncement: async (announcementId, updates) => {
    return apiRequest(`/admin/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteAnnouncement: async (announcementId) => {
    return apiRequest(`/admin/announcements/${announcementId}`, {
      method: 'DELETE',
    });
  },

  getBlogs: async (status = null, category = null) => {
    let url = '/admin/blogs';
    const params = [];
    if (status) params.push(`status=${status}`);
    if (category) params.push(`category=${category}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiRequest(url);
  },

  createBlog: async (blogData) => {
    return apiRequest('/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  },

  updateBlog: async (postId, updates) => {
    return apiRequest(`/admin/blogs/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteBlog: async (postId) => {
    return apiRequest(`/admin/blogs/${postId}`, {
      method: 'DELETE',
    });
  },
};

// Blog API (Public)
export const blogsAPI = {
  getPublishedBlogs: async (category = null) => {
    const url = category ? `/blogs/published?category=${category}` : '/blogs/published';
    return apiRequest(url);
  },

  getBlog: async (postId) => {
    return apiRequest(`/blogs/${postId}`);
  },
};

// Support Chats API (for users)
export const chatsAPI = {
  createChat: async (subject, message, priority = 'medium') => {
    return apiRequest('/chats/create', {
      method: 'POST',
      body: JSON.stringify({ subject, message, priority }),
    });
  },

  getMyChats: async () => {
    return apiRequest('/chats/my-chats');
  },

  getChat: async (chatId) => {
    return apiRequest(`/chats/${chatId}`);
  },

  addMessage: async (chatId, message) => {
    return apiRequest(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  updateChat: async (chatId, updates) => {
    return apiRequest(`/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Announcements API
export const announcementsAPI = {
  getPublishedAnnouncements: async () => {
    return apiRequest('/announcements/published');
  },

  getAnnouncement: async (announcementId) => {
    return apiRequest(`/announcements/${announcementId}`);
  },
};

export { getToken, setToken, removeToken, API_BASE_URL };






