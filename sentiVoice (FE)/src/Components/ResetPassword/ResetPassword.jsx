import React, { useState, useEffect } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMsgType('error');
    }
  }, [token, email]);

  /* ─── validation functions ─────────────────────────────────────── */
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (password.length > 50) {
      return 'Password must be less than 50 characters';
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must include lowercase letter';
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must include uppercase letter';
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must include number';
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must include symbol (@$!%*?&)';
    }
    
    return null;
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) {
      return 'Confirm your password';
    }
    
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.newPassword = passwordError;
    
    const confirmPasswordError = validateConfirmPassword(confirmPassword, newPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─── input handlers ──────────────────────────────────────────── */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    
    // Real-time validation
    if (touched.newPassword) {
      const error = validatePassword(value);
      setErrors(prev => ({
        ...prev,
        newPassword: error
      }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Real-time validation
    if (touched.confirmPassword) {
      const error = validateConfirmPassword(value, newPassword);
      setErrors(prev => ({
        ...prev,
        confirmPassword: error
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (field === 'newPassword') {
      const error = validatePassword(newPassword);
      setErrors(prev => ({ ...prev, newPassword: error }));
    } else if (field === 'confirmPassword') {
      const error = validateConfirmPassword(confirmPassword, newPassword);
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  /* ─── submit handler ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token || !email) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMsgType('error');
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/reset-password`, {
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
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="newPassword">
                  <span className="flex items-center">
                    New Password <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    required
                    className={`w-full pl-12 pr-12 py-4 border rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500
                               ${errors.newPassword 
                                 ? 'border-red-300 focus:ring-red-500' 
                                 : touched.newPassword && !errors.newPassword 
                                   ? 'border-green-300 focus:ring-green-500' 
                                   : 'border-gray-300'
                               }
                               disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('newPassword')}
                    disabled={isLoading}
                    aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  {touched.newPassword && !errors.newPassword && newPassword && (
                    <FaCheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                  {errors.newPassword && (
                    <FaExclamationCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-red-500" />
                  )}
                </div>
                {errors.newPassword && (
                  <p id="newPassword-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1 text-xs" />
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                  <span className="flex items-center">
                    Confirm New Password <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    className={`w-full pl-12 pr-12 py-4 border rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500
                               ${errors.confirmPassword 
                                 ? 'border-red-300 focus:ring-red-500' 
                                 : touched.confirmPassword && !errors.confirmPassword 
                                   ? 'border-green-300 focus:ring-green-500' 
                                   : 'border-gray-300'
                               }
                               disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    disabled={isLoading}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  {touched.confirmPassword && !errors.confirmPassword && confirmPassword && (
                    <FaCheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                  {errors.confirmPassword && (
                    <FaExclamationCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-red-500" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1 text-xs" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* password requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 8 characters long
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[A-Z])/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one uppercase letter
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[a-z])/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one lowercase letter
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*\d)/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one number
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[@$!%*?&])/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one special character (@$!%*?&)
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${newPassword.length <= 50 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Less than 50 characters
                  </div>
                </div>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={isLoading || !token || !email || errors.newPassword || errors.confirmPassword || !newPassword || !confirmPassword}
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