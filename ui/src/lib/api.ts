import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized access detected, redirecting to login page');
      // Clear any stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface LinkGroup {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  links: Link[];
}

export interface Link {
  id: number;
  group_id: number;
  name: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LinkGroupRequest {
  name: string;
  sort_order: number;
}

export interface LinkRequest {
  group_id: number;
  name: string;
  url: string;
  sort_order: number;
}

// Auth API
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/login', data);
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await api.post('/admin/change-password', { old_password: oldPassword, new_password: newPassword });
};

// Link Groups API
export const getLinkGroups = async (): Promise<LinkGroup[]> => {
  const response = await api.get<LinkGroup[]>('/links');
  return response.data;
};

export const getAdminLinkGroups = async (): Promise<LinkGroup[]> => {
  const response = await api.get<LinkGroup[]>('/admin/link-groups');
  return response.data;
};

export const createLinkGroup = async (data: LinkGroupRequest): Promise<{ id: number }> => {
  const response = await api.post<{ id: number }>('/admin/link-groups', data);
  return response.data;
};

export const updateLinkGroup = async (id: number, data: LinkGroupRequest): Promise<void> => {
  await api.put(`/admin/link-groups/${id}`, data);
};

export const deleteLinkGroup = async (id: number): Promise<void> => {
  await api.delete(`/admin/link-groups/${id}`);
};

// Links API
export const getLinksByGroupId = async (groupId: number): Promise<Link[]> => {
  const response = await api.get<Link[]>(`/admin/link-groups/${groupId}/links`);
  return response.data;
};

export const createLink = async (data: LinkRequest): Promise<{ id: number }> => {
  const response = await api.post<{ id: number }>('/admin/links', data);
  return response.data;
};

export const updateLink = async (id: number, data: LinkRequest): Promise<void> => {
  await api.put(`/admin/links/${id}`, data);
};

export const deleteLink = async (id: number): Promise<void> => {
  await api.delete(`/admin/links/${id}`);
};

export default api; 