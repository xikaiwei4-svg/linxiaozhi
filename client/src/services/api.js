import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: '网络错误' });
  }
);

export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
};

export const conversationAPI = {
  getConversations: () => api.get('/conversations'),
  createConversation: (data) => api.post('/conversations', data),
  getConversation: (id) => api.get(`/conversations/${id}`),
  updateConversation: (id, data) => api.put(`/conversations/${id}`, data),
  deleteConversation: (id) => api.delete(`/conversations/${id}`),
  sendMessage: (id, message) => api.post(`/conversations/${id}/messages`, message),
};

export const systemPromptAPI = {
  list: () => api.get('/system-prompts'),
  getActive: () => api.get('/system-prompts/active'),
  create: (data) => api.post('/system-prompts', data),
  update: (id, data) => api.put(`/system-prompts/${id}`, data),
  delete: (id) => api.delete(`/system-prompts/${id}`),
  activate: (id) => api.post(`/system-prompts/${id}/activate`),
};

export const knowledgeAPI = {
  list: (params) => api.get('/knowledge', { params }),
  getOne: (id) => api.get(`/knowledge/${id}`),
  upload: (formData) => api.post('/knowledge/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/knowledge/${id}`),
  search: (query) => api.post('/knowledge/search', { query }),
  mysqlList: (params) => api.get('/knowledge/mysql/list', { params }),
  mysqlStats: () => api.get('/knowledge/mysql/stats'),
  mysqlGetOne: (id) => api.get(`/knowledge/mysql/${id}`),
};

export const agentAPI = {
  getMe: () => api.get('/agents/me'),
  updateStatus: (status) => api.put('/agents/me/status', { status }),
  getQueue: () => api.get('/agents/queue'),
  acceptChat: (id) => api.post(`/agents/conversations/${id}/accept`),
  resolveChat: (id) => api.post(`/agents/conversations/${id}/resolve`),
  agentMessage: (id, content) => api.post(`/agents/conversations/${id}/agent-message`, { content }),
  transferChat: (id, reason) => api.post(`/conversations/${id}/transfer`, { reason }),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  listUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  listConversations: (params) => api.get('/admin/conversations', { params }),
};

export default api;
