import { handleAuthError } from './auth';

// API utility for making authenticated requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Get auth headers
const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  // Always include Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Token found and added to headers');
  } else {
    console.log('❌ No token found in localStorage');
  }
  
  // Only set Content-Type for non-multipart requests
  // For multipart (FormData), let the browser set the Content-Type with boundary
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  console.log('📋 Headers generated:', Object.keys(headers), isMultipart ? '(FormData)' : '(JSON)');
  return headers;
};

// Generic API request function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isMultipart = options.body instanceof FormData;
  const config = {
    headers: getAuthHeaders(isMultipart),
    ...options
  };

  try {
    console.log('API Request:', url, {
      method: config.method,
      headers: config.headers,
      bodyType: isMultipart ? 'FormData' : 'JSON',
      bodyKeys: isMultipart ? Array.from(options.body?.keys() || []) : Object.keys(options.body || {}),
      authHeader: config.headers.Authorization ? 'Bearer [TOKEN]' : 'None'
    });
    
    const response = await fetch(url, config);
    
    console.log('API Response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('API Error Response:', errorData);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        const authError = new Error('Authentication failed. Please log in again.');
        handleAuthError(authError);
        throw authError;
      }
      
      // Handle session invalidation
      if (response.status === 401 && errorData.code === 'SESSION_INVALIDATED') {
        console.log('🔐 Session invalidated, logging out...');
        const sessionError = new Error('Your session has been invalidated. Please log in again.');
        handleAuthError(sessionError);
        throw sessionError;
      }
      
      // Handle suspended user
      if (response.status === 403 && errorData.error && errorData.error.includes('suspended')) {
        console.log('🚫 User suspended, logging out...');
        alert('Your account has been suspended by an administrator. Please contact support for assistance.');
        const suspendError = new Error('Account suspended');
        handleAuthError(suspendError);
        throw suspendError;
      }
      
      // Handle network errors
      if (response.status === 0) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('API Success Response:', data);
      return data;
    } else {
      const text = await response.text();
      console.log('API Success Response (text):', text);
      return text;
    }
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle fetch network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
    }
    
    throw error;
  }
};

// Specific API functions
export const api = {
  // GET request
  get: (endpoint, data, options = {}) => apiRequest(endpoint, {
    method: 'GET',
    ...options
  }),
  
  // POST request
  post: (endpoint, data, options = {}) => {
    const isFormData = data instanceof FormData;
    const headers = getAuthHeaders(isFormData);
    
    // For FormData, don't set Content-Type - let the browser set it with boundary
    if (isFormData) {
      delete headers['Content-Type'];
    }
    
    return apiRequest(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers,
      ...options
    });
  },
  
  // PUT request
  put: (endpoint, data, options = {}) => {
    const isFormData = data instanceof FormData;
    const headers = getAuthHeaders(isFormData);
    
    // For FormData, don't set Content-Type - let the browser set it with boundary
    if (isFormData) {
      delete headers['Content-Type'];
    }
    
    return apiRequest(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      headers,
      ...options
    });
  },
  
  // DELETE request
  delete: (endpoint, options = {}) => apiRequest(endpoint, {
    method: 'DELETE',
    ...options
  })
}; 