import { api } from './api';
import { logout } from './auth';

class SessionValidator {
  constructor() {
    this.checkInterval = null;
    this.isChecking = false;
    this.lastCheck = null;
    this.checkIntervalMs = 5000; // Check every 5 seconds for immediate response
  }

  // Start periodic session validation
  start() {
    if (this.checkInterval) {
      console.log('🔄 Session validator already running');
      return;
    }

    console.log('🚀 Starting session validator...');
    
    // Check immediately
    this.checkSession();
    
    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.checkIntervalMs);
  }

  // Stop periodic session validation
  stop() {
    if (this.checkInterval) {
      console.log('🛑 Stopping session validator...');
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check if current session is valid
  async checkSession() {
    // Don't check if already checking or no token
    if (this.isChecking || !localStorage.getItem('token')) {
      console.log('🔍 Session check skipped:', {
        isChecking: this.isChecking,
        hasToken: !!localStorage.getItem('token')
      });
      return;
    }

    this.isChecking = true;
    
    try {
      console.log('🔍 Checking session validity...');
      console.log('📋 Current token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await api.get('/api/auth/validate-session');
      
      console.log('📋 Session validation response:', response);
      
      if (!response.valid) {
        console.log('❌ Session invalid:', response.error);
        console.log('📋 Invalidation code:', response.code);
        
        // Handle different invalidation reasons
        switch (response.code) {
          case 'SUSPENDED':
            alert('Your account has been suspended by an administrator. Please contact support for assistance.');
            break;
          case 'EMAIL_NOT_VERIFIED':
            alert('Your email is not verified. Please check your email and verify your account.');
            break;
          case 'THERAPIST_NOT_APPROVED':
            alert('Your therapist account is pending approval. Please wait for admin approval.');
            break;
          case 'SESSION_INVALIDATED':
            alert('Your session has been invalidated. Please log in again.');
            break;
          default:
            alert('Your session is no longer valid. Please log in again.');
        }
        
        console.log('🔐 Logging out due to session invalidation...');
        logout();
        return;
      }
      
      console.log('✅ Session is valid');
      this.lastCheck = new Date();
      
    } catch (error) {
      console.error('❌ Session validation error:', error);
      console.error('📋 Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // If it's an authentication error, logout
      if (error.message.includes('Authentication failed') || 
          error.message.includes('401') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('suspended')) {
        console.log('🔐 Authentication error, logging out...');
        logout();
      }
    } finally {
      this.isChecking = false;
    }
  }

  // Force a session check (for immediate validation)
  async forceCheck() {
    await this.checkSession();
  }

  // Get last check time
  getLastCheck() {
    return this.lastCheck;
  }

  // Check if validator is running
  isRunning() {
    return this.checkInterval !== null;
  }
}

// Create singleton instance
const sessionValidator = new SessionValidator();

export default sessionValidator; 