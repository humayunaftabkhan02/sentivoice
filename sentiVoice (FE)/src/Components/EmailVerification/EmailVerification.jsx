import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import emotions from '../../assets/emotiondetect.png';
import { api } from "../../utils/api";

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'success', 'error', 'verifying'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // If token is present in URL, verify it immediately
    if (token && email) {
      verifyEmail(token, email);
    }
  }, [token, email]);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const verifyEmail = async (verificationToken, userEmail) => {
    setVerificationStatus('verifying');
    setMessage('Verifying your email...');

    // Debug logging
    console.log('🔍 Verification attempt:', {
      token: verificationToken ? `${verificationToken.substring(0, 10)}...` : 'null',
      email: userEmail,
      tokenLength: verificationToken?.length
    });

    try {
      const response = await api.post('/api/verify-email', { token: verificationToken, email: userEmail });

      // The API utility already parses the JSON response
      // So response is already the data object, not a Response object
      if (response && response.message) {
        setVerificationStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setVerificationStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setVerificationStatus('error');
      setMessage(error.message || 'Network error. Please check your connection and try again.');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage('Email address not found. Please sign up again.');
      return;
    }

    setMessage('Sending verification email...');
    setCountdown(60); // 60 second cooldown

    try {
      const response = await api.post('/api/resend-verification', { email });

      // The API utility already parses the JSON response
      if (response && response.message) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage('Failed to send verification email.');
      }
    } catch (error) {
      setMessage(error.message || 'Network error. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <FaCheckCircle className="text-green-500 text-6xl" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500 text-6xl" />;
      case 'verifying':
        return <FaSpinner className="text-[#1B6675] text-6xl animate-spin" />;
      default:
        return <FaEnvelope className="text-[#1B6675] text-6xl" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'verifying':
        return 'text-[#1B6675]';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#EBEDE9] to-[#B5D1D4]">
      {/* Left -- emotion graphic */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <img src={emotions} alt="Emotions" className="max-w-full h-auto mb-8" />
          <h2 className="text-5xl font-bold text-[#1B6675] mb-4 leading-tight">
            Giving Voice to Emotions
          </h2>
          <p className="text-[#1B6675] text-xl opacity-90">
            Empowering healing through speech
          </p>
        </div>
      </div>

      {/* Right -- verification content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Verification Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
            {/* Logo and Header */}
            <div className="text-center mb-6">
              <img src={logo} alt="Logo" className="mx-auto w-16 h-16 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Email Verification
              </h1>
              <p className="text-gray-600 text-base">
                {verificationStatus === 'pending' && 'Verify your email to activate your account'}
                {verificationStatus === 'verifying' && 'Verifying your email address...'}
                {verificationStatus === 'success' && 'Your email has been verified successfully!'}
                {verificationStatus === 'error' && 'Verification failed. Please try again.'}
              </p>
            </div>

            {/* Status Icon */}
            <div className="text-center mb-6 flex justify-center">
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <div className={`text-center mb-6 ${getStatusColor()}`}>
              <p className="text-lg font-medium">
                {message}
              </p>
            </div>

            {/* Content based on status */}
            {verificationStatus === 'pending' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    We've sent a verification email to <strong>{email}</strong>
                  </p>
                  <p className="text-blue-700 text-xs mt-2">
                    Please check your inbox and click the verification link to activate your account.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={resendVerification}
                    disabled={countdown > 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      countdown > 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#1B6675] text-white hover:bg-[#0f4a5a]'
                    }`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                  </button>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    The verification link may have expired or is invalid. Please try again or request a new verification email.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 bg-[#1B6675] text-white rounded-lg font-medium hover:bg-[#0f4a5a]"
                  >
                    Try Again
                  </button>
                  <Link
                    to="/signup"
                    className="w-full py-2 px-4 text-[#1B6675] hover:text-[#0f4a5a] font-medium text-center block"
                  >
                    Sign Up Again
                  </Link>
                </div>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    Your account has been successfully verified! You can now log in to access your account.
                  </p>
                </div>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-[#1B6675] text-white rounded-lg font-medium hover:bg-[#0f4a5a]"
                >
                  Continue to Login
                </button>
              </div>
            )}

            {/* Back to login link - only show for pending and error states */}
            {(verificationStatus === 'pending' || verificationStatus === 'error') && (
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-[#1B6675] hover:text-[#0f4a5a] font-medium transition duration-200"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 