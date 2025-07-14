import React, { useState } from 'react'
import { api } from "../../utils/api";

const ContactContent = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })

    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)

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
            try {
                const response = await api.post('/api/contact', {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    message: formData.message.trim()
                })

                if (response.ok) {
                    setSubmitted(true)
                    setFormData({ name: '', email: '', message: '' })
                    setTimeout(() => setSubmitted(false), 4000)
                } else {
                    const data = await response.json()
                    alert(data.error || 'Failed to send message.')
                }
            } catch (err) {
                alert('Network error while sending message.')
            }
        }
    }

    return (
        <section className="bg-[#EBEDE9] py-20 px-6">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-md p-8">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Get in Touch</h3>
                        <p className="text-gray-700 mb-4">Reach out to us through any of the following:</p>
                        <ul className="text-gray-600 space-y-3">
                            <li><strong>Email:</strong> contact@sentivoice.com</li>
                            <li><strong>Phone:</strong> +92 300 1234567</li>
                            <li><strong>Address:</strong> Capital University of Science and Technology, Islamabad</li>
                        </ul>
                    </div>
                </div>

                {/* Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-md p-10">
                        <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">Contact Us</h2>
                        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                            {/* Name */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full border rounded px-4 py-2 focus:outline-none ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full border rounded px-4 py-2 focus:outline-none ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Message</label>
                                <textarea
                                    name="message"
                                    required
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="5"
                                    maxLength={MAX_MESSAGE_LENGTH + 100}
                                    className={`w-full border rounded px-4 py-2 focus:outline-none ${
                                        errors.message || formData.message.length > MAX_MESSAGE_LENGTH
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                ></textarea>
                                <div className="flex justify-between text-sm mt-1">
                                    {errors.message && <p className="text-red-500">{errors.message}</p>}
                                    <p className={`ml-auto ${
                                        formData.message.length > MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-gray-500'
                                    }`}>
                                        {formData.message.length}/{MAX_MESSAGE_LENGTH}
                                    </p>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full bg-teal-700 text-white font-semibold py-3 rounded hover:bg-teal-800 transition"
                            >
                                Send Message
                            </button>
                        </form>

                        {/* Toast */}
                        {submitted && (
                            <div className="mt-6 bg-green-100 text-green-800 px-4 py-3 rounded shadow text-center">
                                ✅ Message sent successfully!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ContactContent
