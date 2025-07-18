import React, { useState } from 'react';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import emotions from '../../assets/emotiondetect.png';
import { api } from "../../utils/api";

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await api.post('/api/resend-verification', { email });

      // The API utility already parses the JSON response
      if (response && response.message) {
        setMessage('Verification email sent! Please check your inbox.');
        setMsgType('success');
        setEmail(''); // Clear email on success
      } else {
        setMessage('Failed to send verification email.');
        setMsgType('error');
      }
    } catch (error) {
      setMessage(error.message || 'Network error. Please try again.');
      setMsgType('error');
    } finally {
      setIsLoading(false);
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

      {/* Right -- resend verification form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Resend Verification Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
            {/* Logo and Header */}
            <div className="text-center mb-6">
              <img src={logo} alt="Logo" className="mx-auto w-16 h-16 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Resend Verification
              </h1>
              <p className="text-gray-600 text-base">
                Enter your email to receive a new verification link
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
              {/* email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                               transition duration-200 text-gray-900 placeholder-gray-500
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1B6675] text-white py-4 rounded-xl font-semibold text-base
                           hover:bg-[#0f4a5a] focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:ring-offset-2
                           transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Verification Email'
                )}
              </button>
            </form>

            {/* back to login */}
            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-[#1B6675] hover:text-[#0f4a5a] font-medium transition duration-200"
              >
                <FaArrowLeft className="mr-2" />
                Back to Login
              </Link>
            </div>

            {/* signup link */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#1B6675] font-semibold hover:text-[#0f4a5a] transition duration-200">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification; 