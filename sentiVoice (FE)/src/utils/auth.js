import sessionValidator from './sessionValidator';

// Authentication utility
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  
  return !!(token && username && role);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getUserInfo = () => {
  return {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
    token: localStorage.getItem('token')
  };
};

export const logout = () => {
  // Stop session validator
  sessionValidator.stop();
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  
  // Redirect to login
  window.location.href = '/login';
};

export const login = (userData) => {
  // Store user data
  localStorage.setItem('token', userData.token);
  localStorage.setItem('username', userData.username);
  localStorage.setItem('role', userData.role);
  
  // Store additional user data if provided
  if (userData.firstName) localStorage.setItem('firstName', userData.firstName);
  if (userData.lastName) localStorage.setItem('lastName', userData.lastName);
  if (userData.fullName) localStorage.setItem('fullName', userData.fullName);
  
  // Start session validator
  sessionValidator.start();
};

export const handleAuthError = (error) => {
  if (error.message.includes('Authentication failed') || 
      error.message.includes('401') || 
      error.message.includes('Unauthorized')) {
    console.log('Authentication error detected, logging out...');
    logout();
  }
}; 