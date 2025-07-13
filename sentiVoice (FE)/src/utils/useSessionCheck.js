import { useEffect } from 'react';
import { api } from './api';
import { logout } from './auth';

// Hook to check session validity on component mount
export const useSessionCheck = () => {
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        console.log('🔍 Checking session on component mount...');
        const response = await api.get('/auth/validate-session');
        
        if (!response.valid) {
          console.log('❌ Session invalid on mount:', response.error);
          
          switch (response.code) {
            case 'SUSPENDED':
              alert('Your account has been suspended by an administrator. Please contact support for assistance.');
              break;
            case 'SESSION_INVALIDATED':
              alert('Your session has been invalidated. Please log in again.');
              break;
            default:
              alert('Your session is no longer valid. Please log in again.');
          }
          
          logout();
        } else {
          console.log('✅ Session valid on mount');
        }
      } catch (error) {
        console.error('❌ Session check failed on mount:', error);
        
        // If it's an authentication error, logout
        if (error.message.includes('Authentication failed') || 
            error.message.includes('401') || 
            error.message.includes('Unauthorized') ||
            error.message.includes('suspended')) {
          logout();
        }
      }
    };

    checkSession();
  }, []); // Only run on mount
}; 