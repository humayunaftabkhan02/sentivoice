import React, { useState } from 'react'
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser, FaPaperPlane, FaClock, FaShieldAlt, FaHeadset, FaMicrophone, FaBrain, FaHeart, FaCheckCircle, FaTimes } from 'react-icons/fa'
import { api } from "../../utils/api";

const ContactContent = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })

    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const MAX_MESSAGE_LENGTH = 500

    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com']
    const disposableDomains = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com']

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const validate = () => {
        const newErrors = {}
        const nameTrimmed = formData.name.trim()
        const emailTrimmed = formData.email.trim()
        const messageTrimmed = formData.message.trim()

        // Name Validation
        if (!nameTrimmed) {
            newErrors.name = 'Full name is required'
        } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(nameTrimmed)) {
            newErrors.name = 'Only first and last name allowed (letters only)'
        } else if (nameTrimmed.length < 3 || nameTrimmed.length > 30) {
            newErrors.name = 'Name must be between 3 and 30 characters'
        }

        // Email Validation
        if (!emailTrimmed) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
            newErrors.email = 'Invalid email format'
        } else {
            const domain = emailTrimmed.split('@')[1]
            if (!allowedDomains.includes(domain)) {
                newErrors.email = 'Invalid e-mail address'
            } else if (disposableDomains.includes(domain)) {
                newErrors.email = 'Disposable email addresses are not allowed'
            }
        }

        // Message Validation
        if (!messageTrimmed) {
            newErrors.message = 'Message is required'
        } else if (messageTrimmed.length < 30) {
            newErrors.message = 'Message must be at least 30 characters'
        } else if (messageTrimmed.length > MAX_MESSAGE_LENGTH) {
            newErrors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`
        } else if (/https?:\/\//i.test(messageTrimmed) || /<script/i.test(messageTrimmed)) {
            newErrors.message = 'Links or code are not allowed in the message'
        }

        return newErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = validate()
        setErrors(validationErrors)

        if (Object.keys(validationErrors).length === 0) {
            setIsSubmitting(true)
            try {
                const response = await api.post('/api/contact', {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    message: formData.message.trim()
                })

                // If we reach here, the request was successful
                setSubmitted(true)
                setFormData({ name: '', email: '', message: '' })
                setTimeout(() => setSubmitted(false), 5000)
                
            } catch (err) {
                console.error('Contact form error:', err)
                alert(err.message || 'Failed to send message. Please try again.')
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Success Notification */}
            {submitted && (
                <div className="fixed top-4 right-4 z-50" style={{
                    animation: 'slideInRight 0.5s ease-out'
                }}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-green-200 p-6 max-w-md transform transition-all duration-300 hover:scale-105">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                                    <FaCheckCircle className="text-green-600 text-xl" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Message Sent Successfully!
                                </h3>
                                <p className="text-gray-600 text-sm mb-3">
                                    Thank you for reaching out. We'll get back to you within 24 hours.
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <FaEnvelope className="text-gray-400" />
                                    <span>Sent to: noreply.sentivoice@gmail.com</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSubmitted(false)}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>
                    </div>
                    <style jsx>{`
                        @keyframes slideInRight {
                            from {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }
                    `}</style>
                </div>
            )}

            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium">
                            <FaEnvelope className="text-blue-600" />
                            <span>Get in Touch</span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Contact
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    SentiVoice
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                                Have questions about our voice analysis technology or mental health platform? 
                                We're here to help you get the support you need.
                            </p>
                        </div>

                        {/* Contact Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                                <div className="text-sm text-gray-600">Support Available</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">Quick</div>
                                <div className="text-sm text-gray-600">Response Time</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">Expert</div>
                                <div className="text-sm text-gray-600">Team Support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information Section */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                                <p className="text-gray-600 mb-8">Reach out to us through any of the following channels:</p>
                                
                                <div className="space-y-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <FaEnvelope className="text-blue-600 text-xl" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                                            <p className="text-gray-600">noreply.sentivoice@gmail.com</p>
                                            <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <FaPhone className="text-green-600 text-xl" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                                            <p className="text-gray-600">+92 344 0791986</p>
                                            <p className="text-sm text-gray-500">Mon-Fri, 9AM-6PM</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <FaMapMarkerAlt className="text-purple-600 text-xl" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                                            <p className="text-gray-600">Capital University of Science and Technology</p>
                                            <p className="text-sm text-gray-500">Islamabad, Pakistan</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-100">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Send us a Message</h2>
                                    <p className="text-gray-600">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                                </div>
                                
                                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-3 flex items-center space-x-2">
                                            <FaUser className="text-blue-600" />
                                            <span>Full Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            disabled={isSubmitting}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500'
                                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                                            <span>⚠</span>
                                            <span>{errors.name}</span>
                                        </p>}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-3 flex items-center space-x-2">
                                            <FaEnvelope className="text-blue-600" />
                                            <span>Email Address</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email address"
                                            disabled={isSubmitting}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500'
                                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        {errors.email && <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                                            <span>⚠</span>
                                            <span>{errors.email}</span>
                                        </p>}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-3 flex items-center space-x-2">
                                            <FaPaperPlane className="text-blue-600" />
                                            <span>Message</span>
                                        </label>
                                        <textarea
                                            name="message"
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows="5"
                                            maxLength={MAX_MESSAGE_LENGTH + 100}
                                            placeholder="Tell us about your inquiry or how we can help you..."
                                            disabled={isSubmitting}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none ${
                                                errors.message || formData.message.length > MAX_MESSAGE_LENGTH
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-200 focus:border-blue-500'
                                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        ></textarea>
                                        <div className="flex justify-between items-center mt-2">
                                            {errors.message && <p className="text-red-500 text-sm flex items-center space-x-1">
                                                <span>⚠</span>
                                                <span>{errors.message}</span>
                                            </p>}
                                            <p className={`text-sm ml-auto ${
                                                formData.message.length > MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-gray-500'
                                            }`}>
                                                {formData.message.length}/{MAX_MESSAGE_LENGTH}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-2 ${
                                            isSubmitting 
                                                ? 'bg-gray-400 text-white cursor-not-allowed' 
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>Sending Message...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaPaperPlane className="text-sm" />
                                                <span>Send Message</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Features Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">How We Support You</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our dedicated team is here to help you with any questions about our platform and services.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaHeadset className="text-blue-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">24/7 Support</h3>
                            <p className="text-gray-600 text-sm">Round-the-clock assistance for urgent inquiries</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaClock className="text-green-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Quick Response</h3>
                            <p className="text-gray-600 text-sm">We typically respond within 24 hours</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaShieldAlt className="text-purple-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Secure Communication</h3>
                            <p className="text-gray-600 text-sm">All communications are encrypted and secure</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaBrain className="text-indigo-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Expert Team</h3>
                            <p className="text-gray-600 text-sm">Knowledgeable staff ready to assist you</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h3>
                    <p className="text-xl text-blue-100 leading-relaxed mb-8">
                        Have questions about our voice analysis technology or need help getting started? 
                        Our team is here to support your mental health journey.
                    </p>
                </div>
            </section>
        </div>
    )
}

export default ContactContent
