import React from 'react'
import { FaMicrophone, FaBrain, FaHeart, FaUsers, FaLightbulb, FaGraduationCap, FaShieldAlt, FaChartLine } from 'react-icons/fa'

const AboutContent = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium">
                            <FaMicrophone className="text-blue-600" />
                            <span>AI-Powered Voice Analysis</span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Empowering Mental Health
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    with AI Technology
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                                At SentiVoice, we bridge the gap between AI and therapy using advanced speech-based emotion detection. 
                                Our platform empowers therapists with data-driven insights while providing users with deeper understanding of their emotional health.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">Voice Analysis</div>
                                <div className="text-sm text-gray-600">Real-time Emotion Detection</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">Expert Therapists</div>
                                <div className="text-sm text-gray-600">Professional Mental Health Care</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">Secure Platform</div>
                                <div className="text-sm text-gray-600">Privacy-First Design</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Mission */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <FaHeart className="text-blue-600 text-xl" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                            </div>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                To revolutionize mental health care by making emotional intelligence accessible through voice technology. 
                                We believe every emotion matters and every voice deserves to be heard.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    <span className="text-gray-700">AI-powered emotion recognition through voice analysis</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    <span className="text-gray-700">Data-driven insights for therapists</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                    <span className="text-gray-700">Personalized mental health support</span>
                                </div>
                            </div>
                        </div>

                        {/* Vision */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <FaLightbulb className="text-purple-600 text-xl" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
                            </div>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                To create a future where mental health support is intuitive, accessible, and personalized for everyone. 
                                We envision a world where technology enhances human connection and emotional well-being.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                                    <span className="text-gray-700">Making therapy accessible to all</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                                    <span className="text-gray-700">Bridging technology and human care</span>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                                    <span className="text-gray-700">Advancing emotional intelligence</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">What We Offer</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Comprehensive tools and features designed to enhance mental health care through innovative technology.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <FaMicrophone className="text-blue-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Voice Analysis</h3>
                            <p className="text-gray-600">
                                Advanced AI-powered emotion recognition through voice recordings, providing real-time insights into emotional states.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <FaChartLine className="text-green-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Session Tracking</h3>
                            <p className="text-gray-600">
                                Comprehensive analytics and progress tracking to monitor emotional health patterns over time.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                                <FaShieldAlt className="text-purple-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Communication</h3>
                            <p className="text-gray-600">
                                End-to-end encrypted messaging between patients and therapists for confidential communication.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                                <FaUsers className="text-indigo-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Expert Network</h3>
                            <p className="text-gray-600">
                                Connect with qualified mental health professionals and therapists through our secure platform.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                                <FaBrain className="text-pink-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Insights</h3>
                            <p className="text-gray-600">
                                Data-driven recommendations and insights to support both therapists and patients in their journey.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                                <FaGraduationCap className="text-orange-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Research-Driven</h3>
                            <p className="text-gray-600">
                                Built on cutting-edge research and continuously improved through academic collaboration and feedback.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">Meet Our Team</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Created by passionate Computer Science students from CUST, SentiVoice represents the future of mental health technology.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h3 className="text-3xl font-bold text-gray-900">Academic Excellence</h3>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    SentiVoice is a research-driven innovation developed by final-year Computer Science students from 
                                    Capital University of Science and Technology (CUST), under the expert guidance of Ms. Rabea Saleem.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <span className="text-gray-700">AI & Machine Learning Expertise</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <span className="text-gray-700">Full-Stack Development Skills</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <span className="text-gray-700">User Experience Design</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <span className="text-gray-700">Mental Health Research</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaGraduationCap className="text-white text-4xl" />
                                </div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">CUST Students</h4>
                                <p className="text-gray-600">Final Year Computer Science</p>
                            </div>
                        </div>
                    </div>


                </div>
            </section>

            {/* Closing Statement */}
            <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-white mb-6">Why Choose SentiVoice?</h3>
                    <p className="text-xl text-blue-100 leading-relaxed">
                        Because every emotion matters — and every voice deserves to be heard. 
                        We're building the future of mental health care, one voice at a time.
                    </p>
                    <div className="mt-8">
                        <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-6 py-3 rounded-full text-sm font-medium">
                            <FaHeart className="text-white" />
                            <span>Empowering Mental Health Through Technology</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default AboutContent