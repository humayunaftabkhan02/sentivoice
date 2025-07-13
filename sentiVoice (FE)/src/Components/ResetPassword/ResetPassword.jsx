import React, { useState, useEffect } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import emotions from '../../assets/emotiondetect.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMsgType('error');
    }
  }, [token, email]);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    if (password.length < minLength) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character (@$!%*?&)';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token || !email) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMsgType('error');
      return;
    }

    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage(passwordError);
      setMsgType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setMsgType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          email, 
          newPassword 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMsgType('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(data.error || 'Failed to reset password');
        setMsgType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMsgType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#EBEDE9] to-[#B5D1D4]">
      {/* Left -- emotion graphic */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8">
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

      {/* Right -- reset password form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Reset Password Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <img src={logo} alt="Logo" className="mx-auto w-20 h-20 mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600 text-lg">
                Create your new password
              </p>
            </div>

            {/* feedback banner */}
            {message && (
              <div
                className={`w-full p-4 mb-6 rounded-xl border ${
                  msgType === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {msgType === 'success' ? (
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-4 pr-12 py-4 border border-gray-300 rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-4 pr-12 py-4 border border-gray-300 rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* password requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    At least 8 characters long
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    At least one uppercase letter
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    At least one lowercase letter
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    At least one number
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    At least one special character (@$!%*?&)
                  </div>
                </div>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={isLoading || !token || !email}
                className="w-full bg-[#1B6675] text-white py-4 rounded-xl font-semibold text-lg
                           hover:bg-[#0f4a5a] focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:ring-offset-2
                           transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* back to login */}
            <div className="mt-8 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-[#1B6675] hover:text-[#0f4a5a] font-medium transition duration-200"
              >
                <FaArrowLeft className="mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 