// src/Components/LoginComp/LoginComp.jsx
import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import emotions  from '../../assets/emotiondetect.png';
import logo      from '../../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../utils/auth';

const LoginComp = () => {
  /* ─── local state ─────────────────────────────────────────────── */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [message,  setMessage]  = useState('');
  const [msgType,  setMsgType]  = useState('');        // 'success' | 'error'
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  // Email domain restrictions (same as signup)
  const allowedEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com', 'sentivoice.com'];
  const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com'];

  /* ─── validation functions ─────────────────────────────────────── */
  const validateEmail = (email) => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      return 'Email is required';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Invalid email format';
    }
    
    const domain = trimmedEmail.split('@')[1];
    if (!allowedEmailDomains.includes(domain)) {
      return 'Email domain is not supported';
    }
    
    if (disposableDomains.includes(domain)) {
      return 'Temporary email addresses are not allowed';
    }
    
    return null;
  };

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
    
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─── input handlers ──────────────────────────────────────────── */
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Real-time validation
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({
        ...prev,
        email: error
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Real-time validation
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({
        ...prev,
        password: error
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (field === 'email') {
      const error = validateEmail(email);
      setErrors(prev => ({ ...prev, email: error }));
    } else if (field === 'password') {
      const error = validatePassword(password);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  /* ─── check for remembered credentials ────────────────────────── */
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const rememberedMe = localStorage.getItem('rememberMe');
    
    if (rememberedMe === 'true' && rememberedEmail && rememberedPassword) {
      setEmail(rememberedEmail);
      setPassword(rememberedPassword);
      setRememberMe(true);
    }
  }, []);

  /* ─── login handler ───────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/login`, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        })
      });

      /* 1) ───── success ────────────────────────────────────────── */
      if (res.ok) {
        const { role, username, isTherapistApproved, token, firstName, lastName, fullName } = await res.json();

        // (1.a) therapist still waiting for approval → block login
        if (role === 'therapist' && !isTherapistApproved) {
          setMessage(
            'Your account is awaiting admin approval. Please try again later.'
          );
          setMsgType('error');
          setIsLoading(false);
          return;                    // ⬅ nothing stored, no redirect
        }

        // (1.b) handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email.trim());
          localStorage.setItem('rememberedPassword', password.trim());
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }

        // (1.c) login accepted → persist & redirect using new login function
        login({
          username,
          role,
          token,
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: fullName || ''
        });

        setMessage('Login successful');
        setMsgType('success');

        setTimeout(() => {
          if      (role === 'therapist') navigate('/therapist-dashboard');
          else if (role === 'patient')   navigate('/patient-dashboard');
          else if (role === 'admin')     navigate('/admin-dashboard');
          else                           navigate('/home');
        }, 1200);

        return;
      }

      /* 2) ───── any error (non-200) ────────────────────────────── */
      const err = await res.json();           // may contain .error from API
      
      // Handle email verification error
      if (err.error && err.error.includes('email verification')) {
        setMessage('Please verify your email before logging in. Check your inbox for the verification link.');
        setMsgType('error');
        setIsLoading(false);
        return;
      }
      
      setMessage(err.error || 'Login failed');
      setMsgType('error');
      setIsLoading(false);

    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      setMsgType('error');
      setIsLoading(false);
    }
  };

  /* ─── UI ──────────────────────────────────────────────────────── */
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

      {/* Right -- login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
            {/* Back to Home Button */}
            <div className="mb-6">
              <Link 
                to="/" 
                className="inline-flex items-center text-[#1B6675] hover:text-[#0f4a5a] font-medium transition duration-200 group"
              >
                <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Home
              </Link>
            </div>

            {/* Logo and Header */}
            <div className="text-center mb-8">
              <img src={logo} alt="Logo" className="mx-auto w-20 h-20 mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-lg">
                Sign in to your account
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
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    className={`w-full pl-12 pr-10 py-4 border rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500
                               ${errors.email 
                                 ? 'border-red-300 focus:ring-red-500' 
                                 : touched.email && !errors.email 
                                   ? 'border-green-300 focus:ring-green-500' 
                                   : 'border-gray-300'
                               }`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur('email')}
                    disabled={isLoading}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {touched.email && !errors.email && email && (
                    <FaCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                  {errors.email && (
                    <FaExclamationCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />
                  )}
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1 text-xs" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className={`w-full pl-4 pr-12 py-4 border rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500
                               ${errors.password 
                                 ? 'border-red-300 focus:ring-red-500' 
                                 : touched.password && !errors.password 
                                   ? 'border-green-300 focus:ring-green-500' 
                                   : 'border-gray-300'
                               }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    disabled={isLoading}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1 text-xs" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* extras */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#1B6675] bg-gray-100 border-gray-300 rounded focus:ring-[#1B6675] focus:ring-2" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-[#1B6675] hover:text-[#0f4a5a] font-medium transition duration-200">
                  Forgot Password?
                </Link>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={isLoading || (email.trim() === '' || password.trim() === '')}
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* signup link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#1B6675] font-semibold hover:text-[#0f4a5a] transition duration-200">
                  Create one now
                </Link>
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Need to verify your email?{' '}
                <Link to="/resend-verification" className="text-[#1B6675] font-semibold hover:text-[#0f4a5a] transition duration-200">
                  Resend verification
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComp;