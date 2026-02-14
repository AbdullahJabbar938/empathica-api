// src/services/apiClient.ts
import axios from 'axios';

// Determine base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the same origin (Nginx will route /api to backend)
    return window.location.origin;
  }
  // In development, include the port and /api path
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// Create axios instance
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('empathica_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Handle errors
    if (error.response) {
      // Server responded with error
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
      });
      
      // Handle specific error cases
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('empathica_token');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      if (error.response.status === 404) {
        console.error('Endpoint not found. Check if backend is running and routes are correct.');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response received:', {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
export const api = {
  get: async (url: string, config?: any) => {
    const response = await apiClient.get(url, config);
    return response.data;
  },
  
  post: async (url: string, data?: any, config?: any) => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },
  
  put: async (url: string, data?: any, config?: any) => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },
  
  patch: async (url: string, data?: any, config?: any) => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },
  
  delete: async (url: string, config?: any) => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },
  
  // Test connection
  testConnection: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      };
    }
  },
};

export { apiClient };