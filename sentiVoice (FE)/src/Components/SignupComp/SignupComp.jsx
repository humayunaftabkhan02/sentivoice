import React, { useState, useEffect } from 'react'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserMd, FaUserInjured, FaArrowLeft, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import signupImage from '../../assets/signupImg.png'
import { api } from "../../utils/api";

const SignupComp = () => {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [role, setRole] = useState('')
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const [cvFile, setCvFile] = useState(null);
    const location = useLocation();

    // Check for role parameter in URL and set it
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const roleParam = urlParams.get('role');
        if (roleParam === 'therapist' && !role) {
            setRole('therapist');
        }
    }, [location.search, role]);

    const allowedEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com']
    const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com']

    /* ─── validation functions ─────────────────────────────────────── */
    const validateFirstName = (firstName) => {
        const trimmed = firstName.trim();
        if (!trimmed) return 'First name is required';
        if (trimmed.length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s]+$/.test(trimmed)) return 'First name can only contain letters and spaces';
        return null;
    };

    const validateLastName = (lastName) => {
        const trimmed = lastName.trim();
        if (!trimmed) return 'Last name is required';
        if (trimmed.length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s]+$/.test(trimmed)) return 'Last name can only contain letters and spaces';
        return null;
    };

    const validateUsername = (username) => {
        const trimmed = username.trim();
        if (!trimmed) return 'Username is required';
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Only letters, numbers, and underscores allowed';
        if (trimmed.length < 4 || trimmed.length > 20) return 'Username must be 4–20 characters long';
        return null;
    };

    const validateEmail = (email) => {
        const trimmed = email.trim();
        if (!trimmed) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Invalid email format';
        
        const domain = trimmed.split('@')[1];
        if (!allowedEmailDomains.includes(domain)) return 'Email domain is not supported';
        if (disposableDomains.includes(domain)) return 'Temporary email addresses are not allowed';
        
        return null;
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password.length > 50) return 'Password must be less than 50 characters';
        if (!/(?=.*[a-z])/.test(password)) return 'Password must include lowercase letter';
        if (!/(?=.*[A-Z])/.test(password)) return 'Password must include uppercase letter';
        if (!/(?=.*\d)/.test(password)) return 'Password must include number';
        if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must include symbol (@$!%*?&)';
        return null;
    };

    const validateConfirmPassword = (confirmPassword, password) => {
        if (!confirmPassword) return 'Confirm your password';
        if (confirmPassword !== password) return 'Passwords do not match';
        return null;
    };

    const validateRole = (role) => {
        if (!role) return 'Please select your role';
        if (!['patient', 'therapist'].includes(role)) return 'Invalid role selected';
        return null;
    };

    const validateCvFile = (file, role) => {
        if (role === 'therapist' && !file) return 'CV/Document is required for therapists';
        if (file && file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB';
        return null;
    };

    const validateForm = () => {
        const newErrors = {};
        
        newErrors.firstName = validateFirstName(firstName);
        newErrors.lastName = validateLastName(lastName);
        newErrors.username = validateUsername(username);
        newErrors.email = validateEmail(email);
        newErrors.password = validatePassword(password);
        newErrors.confirmPassword = validateConfirmPassword(confirmPassword, password);
        newErrors.role = validateRole(role);
        newErrors.cvFile = validateCvFile(cvFile, role);
        
        // Remove null values
        Object.keys(newErrors).forEach(key => {
            if (newErrors[key] === null) delete newErrors[key];
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* ─── input handlers ──────────────────────────────────────────── */
    const handleFieldChange = (field, value) => {
        // Update the field value
        switch (field) {
            case 'firstName':
                setFirstName(value);
                break;
            case 'lastName':
                setLastName(value);
                break;
            case 'username':
                setUsername(value);
                break;
            case 'email':
                setEmail(value);
                break;
            case 'password':
                setPassword(value);
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                break;
            default:
                break;
        }

        // Real-time validation if field has been touched
        if (touched[field]) {
            let error = null;
            switch (field) {
                case 'firstName':
                    error = validateFirstName(value);
                    break;
                case 'lastName':
                    error = validateLastName(value);
                    break;
                case 'username':
                    error = validateUsername(value);
                    break;
                case 'email':
                    error = validateEmail(value);
                    break;
                case 'password':
                    error = validatePassword(value);
                    break;
                case 'confirmPassword':
                    error = validateConfirmPassword(value, password);
                    break;
                default:
                    break;
            }
            
            setErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        
        // Validate on blur
        let error = null;
        switch (field) {
            case 'firstName':
                error = validateFirstName(firstName);
                break;
            case 'lastName':
                error = validateLastName(lastName);
                break;
            case 'username':
                error = validateUsername(username);
                break;
            case 'email':
                error = validateEmail(email);
                break;
            case 'password':
                error = validatePassword(password);
                break;
            case 'confirmPassword':
                error = validateConfirmPassword(confirmPassword, password);
                break;
            default:
                break;
        }
        
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        
        // Clear CV file error if switching to patient
        if (newRole === 'patient') {
            setErrors(prev => ({ ...prev, cvFile: null }));
        }
        
        // Validate role
        const error = validateRole(newRole);
        setErrors(prev => ({ ...prev, role: error }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCvFile(file);
        
        // Validate file
        const error = validateCvFile(file, role);
        setErrors(prev => ({ ...prev, cvFile: error }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }
        
            setIsLoading(true);
            setMessage('');
        setErrors({});

            try {
                const formData = new FormData();
                formData.append('firstName', firstName.trim());
                formData.append('lastName', lastName.trim());
                formData.append('username', username.trim());
                formData.append('email', email.trim());
                formData.append('password', password.trim());
                formData.append('role', role);
                if (role === 'therapist' && cvFile) {
                    formData.append('cvDocument', cvFile);
                }

                const response = await api.post('/api/signup', formData);

                if (response && response.message) {
                    setMessage('Account created successfully! Please check your email for verification.');
                    setMessageType('success');
                    setTimeout(() => navigate(`/email-verification?email=${encodeURIComponent(email.trim())}`), 2000);
                } else {
                    setMessage('Signup failed - unexpected response format');
                    setMessageType('error');
                }
            } catch (err) {
            // Handle specific error messages from server
            let errorMessage = 'Error signing up user';
            let fieldErrors = {};
            
            if (err.response && err.response.data) {
                if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                }
                
                // Handle field-specific errors from server
                if (err.response.data.errors) {
                    fieldErrors = err.response.data.errors;
                }
                
                // Handle specific username/email already exists errors
                if (err.response.data.message) {
                    const message = err.response.data.message.toLowerCase();
                    if (message.includes('username') && message.includes('already')) {
                        fieldErrors.username = 'Username is already taken';
                    } else if (message.includes('email') && message.includes('already')) {
                        fieldErrors.email = 'Email is already registered';
                    }
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setMessage(errorMessage);
                setMessageType('error');
            setErrors(fieldErrors);
            } finally {
                setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-[#EBEDE9] to-[#B5D1D4]">
            {/* Left */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-6">
                <div className="text-center max-w-lg">
                    <h1 className="text-4xl font-bold text-gray-800 mb-3">Join SentiVoice Today!</h1>
                    <p className="text-[#1B6675] font-bold text-xl mb-6">Sign up now and take the first step towards a better you.</p>
                    <img src={signupImage} alt="Signup" className="w-full h-auto" />
                </div>
            </div>

            {/* Right */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md">
                    {/* Signup Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                        {/* Back to Home Button */}
                        <div className="mb-4">
                            <Link 
                                to="/" 
                                className="inline-flex items-center text-[#1B6675] hover:text-[#0f4a5a] font-medium transition duration-200 group"
                            >
                                <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                                Back to Home
                            </Link>
                        </div>

                        {/* Logo and Header */}
                        <div className="text-center mb-6">
                            <img src={logo} alt="Logo" className="mx-auto w-16 h-16 mb-4" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                Create Account
                            </h1>
                            <p className="text-gray-600 text-base">
                                Join our community today
                            </p>
                        </div>

                        {/* feedback banner */}
                        {message && (
                            <div
                                className={`w-full p-3 mb-4 rounded-xl border ${
                                    messageType === 'success'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        {messageType === 'success' ? (
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="ml-2">
                                        <p className="text-sm font-medium">{message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* form */}
                        <form className="space-y-4" onSubmit={handleSignup} noValidate encType="multipart/form-data">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                                        <span className="flex items-center">
                                            First Name <span className="text-red-500 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                        <input
                                            type="text"
                                            className={`w-full pl-9 pr-10 py-3 border rounded-lg bg-gray-50
                                                       focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                       transition duration-200 text-gray-900 placeholder-gray-500 text-sm
                                                       ${errors.firstName 
                                                         ? 'border-red-300 focus:ring-red-500' 
                                                         : touched.firstName && !errors.firstName 
                                                           ? 'border-green-300 focus:ring-green-500' 
                                                           : 'border-gray-300'
                                                       }`}
                                            placeholder="First name"
                                            value={firstName}
                                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                            onBlur={() => handleBlur('firstName')}
                                            disabled={isLoading}
                                            aria-describedby={errors.firstName ? "firstName-error" : undefined}
                                        />
                                        {touched.firstName && !errors.firstName && firstName && (
                                            <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
                                        )}
                                        {errors.firstName && (
                                            <FaExclamationCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm" />
                                        )}
                                    </div>
                                    {errors.firstName && (
                                        <p id="firstName-error" className="text-red-500 text-xs mt-1 flex items-center">
                                            <FaExclamationCircle className="mr-1 text-xs" />
                                            {errors.firstName}
                                        </p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                                        <span className="flex items-center">
                                            Last Name <span className="text-red-500 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                        <input
                                            type="text"
                                            className={`w-full pl-9 pr-10 py-3 border rounded-lg bg-gray-50
                                                       focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                       transition duration-200 text-gray-900 placeholder-gray-500 text-sm
                                                       ${errors.lastName 
                                                         ? 'border-red-300 focus:ring-red-500' 
                                                         : touched.lastName && !errors.lastName 
                                                           ? 'border-green-300 focus:ring-green-500' 
                                                           : 'border-gray-300'
                                                       }`}
                                            placeholder="Last name"
                                            value={lastName}
                                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                            onBlur={() => handleBlur('lastName')}
                                            disabled={isLoading}
                                            aria-describedby={errors.lastName ? "lastName-error" : undefined}
                                        />
                                        {touched.lastName && !errors.lastName && lastName && (
                                            <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
                                        )}
                                        {errors.lastName && (
                                            <FaExclamationCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm" />
                                        )}
                                    </div>
                                    {errors.lastName && (
                                        <p id="lastName-error" className="text-red-500 text-xs mt-1 flex items-center">
                                            <FaExclamationCircle className="mr-1 text-xs" />
                                            {errors.lastName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
                                    <span className="flex items-center">
                                        Username <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        className={`w-full pl-9 pr-10 py-3 border rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm
                                                   ${errors.username 
                                                     ? 'border-red-300 focus:ring-red-500' 
                                                     : touched.username && !errors.username 
                                                       ? 'border-green-300 focus:ring-green-500' 
                                                       : 'border-gray-300'
                                                   }`}
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => handleFieldChange('username', e.target.value)}
                                        onBlur={() => handleBlur('username')}
                                        disabled={isLoading}
                                        aria-describedby={errors.username ? "username-error" : undefined}
                                    />
                                    {touched.username && !errors.username && username && (
                                        <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
                                    )}
                                    {errors.username && (
                                        <FaExclamationCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm" />
                                    )}
                                </div>
                                {errors.username && (
                                    <p id="username-error" className="text-red-500 text-xs mt-1 flex items-center">
                                        <FaExclamationCircle className="mr-1 text-xs" />
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                                    <span className="flex items-center">
                                        Email <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        className={`w-full pl-12 pr-10 py-3 border rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm
                                                   ${errors.email 
                                                     ? 'border-red-300 focus:ring-red-500' 
                                                     : touched.email && !errors.email 
                                                       ? 'border-green-300 focus:ring-green-500' 
                                                       : 'border-gray-300'
                                                   }`}
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        disabled={isLoading}
                                        aria-describedby={errors.email ? "email-error" : undefined}
                                    />
                                    {touched.email && !errors.email && email && (
                                        <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm" />
                                    )}
                                    {errors.email && (
                                        <FaExclamationCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm" />
                                    )}
                                </div>
                                {errors.email && (
                                    <p id="email-error" className="text-red-500 text-xs mt-1 flex items-center">
                                        <FaExclamationCircle className="mr-1 text-xs" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                    <span className="flex items-center">
                                        Password <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className={`w-full pl-3 pr-10 py-3 border rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm
                                                   ${errors.password 
                                                     ? 'border-red-300 focus:ring-red-500' 
                                                     : touched.password && !errors.password 
                                                       ? 'border-green-300 focus:ring-green-500' 
                                                       : 'border-gray-300'
                                                   }`}
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => handleFieldChange('password', e.target.value)}
                                        onBlur={() => handleBlur('password')}
                                        disabled={isLoading}
                                        aria-describedby={errors.password ? "password-error" : undefined}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p id="password-error" className="text-red-500 text-xs mt-1 flex items-center">
                                        <FaExclamationCircle className="mr-1 text-xs" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                                    <span className="flex items-center">
                                        Confirm Password <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className={`w-full pl-3 pr-10 py-3 border rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm
                                                   ${errors.confirmPassword 
                                                     ? 'border-red-300 focus:ring-red-500' 
                                                     : touched.confirmPassword && !errors.confirmPassword 
                                                       ? 'border-green-300 focus:ring-green-500' 
                                                       : 'border-gray-300'
                                                   }`}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                        onBlur={() => handleBlur('confirmPassword')}
                                        disabled={isLoading}
                                        aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={isLoading}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p id="confirmPassword-error" className="text-red-500 text-xs mt-1 flex items-center">
                                        <FaExclamationCircle className="mr-1 text-xs" />
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <span className="flex items-center">
                                        Role <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange('patient')}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                            role === 'patient'
                                                ? 'border-[#1B6675] bg-[#1B6675] text-white shadow-lg'
                                                : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-[#1B6675] hover:bg-[#1B6675] hover:text-white'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        <div className="flex flex-col items-center">
                                            <FaUserInjured className="text-xl mb-1" />
                                            <span className="font-semibold text-sm">Patient</span>
                                            <span className="text-xs opacity-80">Seeking therapy</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange('therapist')}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                            role === 'therapist'
                                                ? 'border-[#1B6675] bg-[#1B6675] text-white shadow-lg'
                                                : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-[#1B6675] hover:bg-[#1B6675] hover:text-white'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        <div className="flex flex-col items-center">
                                            <FaUserMd className="text-xl mb-1" />
                                            <span className="font-semibold text-sm">Therapist</span>
                                            <span className="text-xs opacity-80">Providing therapy</span>
                                        </div>
                                    </button>
                                </div>
                                {errors.role && (
                                    <p className="text-red-500 text-xs mt-2 flex items-center">
                                        <FaExclamationCircle className="mr-1 text-xs" />
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            {/* CV/Document Upload for Therapists */}
                            {role === 'therapist' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center">
                                            Upload CV/Document <span className="text-red-500 ml-1">*</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileChange}
                                            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.cvFile
                                                    ? 'border-red-400 bg-red-50'
                                                    : touched.cvFile && !errors.cvFile
                                                      ? 'border-green-300 bg-green-50'
                                                    : 'border-gray-300 hover:border-blue-400 bg-white'
                                            }`}
                                            disabled={isLoading}
                                            aria-describedby={errors.cvFile ? "cvFile-error" : undefined}
                                        />
                                        {cvFile && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 truncate max-w-[60%]">{cvFile.name}</span>
                                        )}
                                    </div>
                                    {errors.cvFile && (
                                        <p id="cvFile-error" className="text-red-500 text-xs mt-1 flex items-center">
                                            <FaExclamationCircle className="mr-1 text-xs" />
                                            {errors.cvFile}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading || !firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !role || (role === 'therapist' && !cvFile)}
                                className="w-full bg-[#1B6675] text-white py-3 rounded-lg font-semibold text-base
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
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        {/* login link */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#1B6675] font-semibold hover:text-[#0f4a5a] transition duration-200">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupComp