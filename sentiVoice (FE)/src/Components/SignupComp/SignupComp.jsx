import React, { useState, useEffect } from 'react'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserMd, FaUserInjured } from 'react-icons/fa'
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

    const validate = () => {
        const newErrors = {}

        const trimmedFirstName = firstName.trim()
        const trimmedLastName = lastName.trim()
        const trimmedUsername = username.trim()
        const trimmedEmail = email.trim()
        const trimmedPassword = password.trim()
        const trimmedConfirm = confirmPassword.trim()

        // First Name validation
        if (!trimmedFirstName) {
            newErrors.firstName = 'First name is required'
        } else if (trimmedFirstName.length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters'
        } else if (!/^[a-zA-Z\s]+$/.test(trimmedFirstName)) {
            newErrors.firstName = 'First name can only contain letters and spaces'
        }

        // Last Name validation
        if (!trimmedLastName) {
            newErrors.lastName = 'Last name is required'
        } else if (trimmedLastName.length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters'
        } else if (!/^[a-zA-Z\s]+$/.test(trimmedLastName)) {
            newErrors.lastName = 'Last name can only contain letters and spaces'
        }

        // Username validation
        if (!trimmedUsername) {
            newErrors.username = 'Username is required'
        } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            newErrors.username = 'Only letters, numbers, and underscores allowed'
        } else if (trimmedUsername.length < 4 || trimmedUsername.length > 20) {
            newErrors.username = 'Username must be 4–20 characters long'
        }

        // Email validation
        if (!trimmedEmail) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            newErrors.email = 'Invalid email format'
        } else {
            const domain = trimmedEmail.split('@')[1]
            if (!allowedEmailDomains.includes(domain)) {
                newErrors.email = 'Email domain is not supported'
            } else if (disposableDomains.includes(domain)) {
                newErrors.email = 'Temporary email addresses are not allowed'
            }
        }

        // Password validation
        if (!trimmedPassword) {
            newErrors.password = 'Password is required'
        } else if (
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(trimmedPassword)
        ) {
            newErrors.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and symbol'
        }

        // Confirm password
        if (!trimmedConfirm) {
            newErrors.confirmPassword = 'Confirm your password'
        } else if (trimmedConfirm !== trimmedPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        // Role validation
        if (!role) {
            newErrors.role = 'Please select your role'
        } else if (!['patient', 'therapist'].includes(role)) {
            newErrors.role = 'Invalid role selected'
        }

        return newErrors
    }

    const handleSignup = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (role === 'therapist' && !cvFile) {
            validationErrors.cvFile = 'CV/Document is required for therapists';
        }
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            setIsLoading(true);
            setMessage('');
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
                setMessage('Error: ' + err.message);
                setMessageType('error');
            } finally {
                setIsLoading(false);
            }
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
                                            className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50
                                                       focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                       transition duration-200 text-gray-900 placeholder-gray-500 text-sm"
                                            placeholder="First name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
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
                                            className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50
                                                       focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                       transition duration-200 text-gray-900 placeholder-gray-500 text-sm"
                                            placeholder="Last name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
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
                                        className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
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
                                        className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                                        className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm"
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
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
                                        className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-[#1B6675] focus:border-transparent
                                                   transition duration-200 text-gray-900 placeholder-gray-500 text-sm"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
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
                                        onClick={() => setRole('patient')}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                            role === 'patient'
                                                ? 'border-[#1B6675] bg-[#1B6675] text-white shadow-lg'
                                                : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-[#1B6675] hover:bg-[#1B6675] hover:text-white'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <FaUserInjured className="text-xl mb-1" />
                                            <span className="font-semibold text-sm">Patient</span>
                                            <span className="text-xs opacity-80">Seeking therapy</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRole('therapist')}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                            role === 'therapist'
                                                ? 'border-[#1B6675] bg-[#1B6675] text-white shadow-lg'
                                                : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-[#1B6675] hover:bg-[#1B6675] hover:text-white'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <FaUserMd className="text-xl mb-1" />
                                            <span className="font-semibold text-sm">Therapist</span>
                                            <span className="text-xs opacity-80">Providing therapy</span>
                                        </div>
                                    </button>
                                </div>
                                {errors.role && <p className="text-red-500 text-xs mt-2">{errors.role}</p>}
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
                                            onChange={e => setCvFile(e.target.files[0])}
                                            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.cvFile
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-300 hover:border-blue-400 bg-white'
                                            }`}
                                            required
                                        />
                                        {cvFile && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 truncate max-w-[60%]">{cvFile.name}</span>
                                        )}
                                    </div>
                                    {errors.cvFile && (
                                        <p className="text-red-500 text-xs mt-1">{errors.cvFile}</p>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
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