import React from 'react'
import Header from '../Components/Header/Header'
import OurServices from '../Components/OurServices/OurServices'
import Footer from '../Components/Footer/Footer'
import { FaMicrophone, FaBrain, FaHeart, FaUserMd, FaCalendarAlt, FaComments, FaShieldAlt, FaGraduationCap, FaAward, FaClock, FaMapMarkerAlt, FaSearch, FaFilter, FaStar, FaUsers, FaLock, FaFileAlt, FaChartLine, FaCog, FaMobile } from 'react-icons/fa'

const Services = () => {
    return (
        <>
            <Header />
            
            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-sm font-medium">
                            <FaCog className="text-blue-600" />
                            <span>Comprehensive Mental Health Services</span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Complete Mental Health
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Platform
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                                SentiVoice combines cutting-edge voice analysis technology with traditional therapy to provide a unique and comprehensive mental health care experience.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 pt-12">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">Voice Analysis</div>
                                <div className="text-sm text-gray-600">AI-Powered Insights</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">Secure Platform</div>
                                <div className="text-sm text-gray-600">End-to-End Encryption</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">Expert Therapists</div>
                                <div className="text-sm text-gray-600">Licensed Professionals</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-indigo-600 mb-2">24/7 Access</div>
                                <div className="text-sm text-gray-600">Always Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Services Section */}
            <OurServices backgroundClass="bg-white" />

            {/* Technology Features Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">Advanced Technology</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our platform leverages cutting-edge technology to enhance the therapy experience and provide deeper insights.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaMicrophone className="text-blue-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Voice Emotion Detection</h3>
                            <p className="text-gray-600 mb-4">
                                Advanced AI algorithms analyze voice patterns to detect emotional states and provide real-time insights to therapists.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">10-120 second recordings</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Real-time analysis</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Emotion classification</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaChartLine className="text-green-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Progress Tracking</h3>
                            <p className="text-gray-600 mb-4">
                                Comprehensive analytics and progress monitoring to track emotional health patterns over time.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Session history</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Emotion trends</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Progress reports</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaShieldAlt className="text-purple-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Infrastructure</h3>
                            <p className="text-gray-600 mb-4">
                                Enterprise-grade security with end-to-end encryption and HIPAA-compliant data handling.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">End-to-end encryption</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">HIPAA compliant</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Secure messaging</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Benefits Section */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">Platform Benefits</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Discover how SentiVoice's comprehensive platform benefits both patients and therapists.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* For Patients */}
                        <div className="space-y-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <FaHeart className="text-blue-600 text-xl" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">For Patients</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaCalendarAlt className="text-green-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Easy Appointment Booking</h4>
                                        <p className="text-gray-600">Schedule sessions with licensed therapists at your convenience.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaMicrophone className="text-purple-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Voice Analysis Insights</h4>
                                        <p className="text-gray-600">Get deeper understanding of your emotional patterns through AI analysis.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaComments className="text-indigo-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Secure Communication</h4>
                                        <p className="text-gray-600">Private messaging with your therapist for ongoing support.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaFileAlt className="text-orange-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Progress Reports</h4>
                                        <p className="text-gray-600">Detailed reports tracking your emotional health journey.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* For Therapists */}
                        <div className="space-y-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <FaUserMd className="text-purple-600 text-xl" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">For Therapists</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaBrain className="text-blue-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Insights</h4>
                                        <p className="text-gray-600">Get data-driven insights to enhance your therapeutic approach.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaUsers className="text-green-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Patient Management</h4>
                                        <p className="text-gray-600">Comprehensive dashboard to manage patients and appointments.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaChartLine className="text-purple-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Progress Analytics</h4>
                                        <p className="text-gray-600">Track patient progress with detailed analytics and reports.</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <FaMobile className="text-indigo-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Flexible Platform</h4>
                                        <p className="text-gray-600">Access your practice from anywhere with our mobile-friendly platform.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-white mb-6">Ready to Experience Better Mental Health Care?</h3>
                    <p className="text-xl text-blue-100 leading-relaxed mb-8">
                        Join thousands of patients and therapists who trust SentiVoice for comprehensive mental health care with cutting-edge voice analysis technology.
                    </p>
                </div>
            </section>
            
            <Footer />
        </>
    )
}

export default Services