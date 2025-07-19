import React from 'react'
import { FaMicrophone, FaBrain, FaHeart, FaUserMd, FaCalendarAlt, FaComments, FaShieldAlt, FaGraduationCap, FaAward, FaClock, FaMapMarkerAlt, FaSearch, FaFilter, FaStar, FaUsers, FaLock } from "react-icons/fa";

const Therapist = () => {
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
                            <FaUserMd className="text-blue-600" />
                            <span>Expert Mental Health Professionals</span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Connect with Expert
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Therapists
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                                Find qualified mental health professionals who are committed to your well-being. 
                                Our platform connects you with licensed therapists who use SentiVoice's advanced voice analysis technology.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 pt-12">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">Licensed</div>
                                <div className="text-sm text-gray-600">Verified Professionals</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">Voice Analysis</div>
                                <div className="text-sm text-gray-600">AI-Powered Insights</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">Secure</div>
                                <div className="text-sm text-gray-600">End-to-End Encryption</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-indigo-600 mb-2">Flexible</div>
                                <div className="text-sm text-gray-600">Multiple Specializations</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Specializations Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">Specialization Areas</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our therapists specialize in various areas of mental health care, ensuring you find the right expertise for your needs.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaBrain className="text-blue-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Clinical Psychology</h3>
                            <p className="text-gray-600 mb-4">
                                Expert diagnosis and treatment of mental health disorders including anxiety, depression, and mood disorders.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Licensed Professionals</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaHeart className="text-green-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Marriage & Family Therapy</h3>
                            <p className="text-gray-600 mb-4">
                                Specialized counseling for couples and families to improve communication and strengthen relationships.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Relationship Experts</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaGraduationCap className="text-purple-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Child Psychology</h3>
                            <p className="text-gray-600 mb-4">
                                Specialized care for children and adolescents with expertise in developmental psychology and behavioral therapy.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Child Development</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaShieldAlt className="text-indigo-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Trauma Therapy</h3>
                            <p className="text-gray-600 mb-4">
                                Evidence-based approaches for PTSD and trauma recovery using proven therapeutic techniques.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Trauma-Informed Care</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaUsers className="text-pink-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Addiction Psychology</h3>
                            <p className="text-gray-600 mb-4">
                                Specialized treatment for substance abuse and behavioral addictions with recovery support programs.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Recovery Support</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                                <FaMicrophone className="text-orange-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Voice Analysis Therapy</h3>
                            <p className="text-gray-600 mb-4">
                                Innovative approach using AI-powered voice emotion detection for deeper therapeutic insights.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">AI-Enhanced Care</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Simple steps to connect with the right therapist for your mental health journey.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-2xl font-bold text-blue-600">1</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Search & Filter</h3>
                            <p className="text-gray-600">
                                Use our advanced search to find therapists by specialization, location, experience, and availability.
                            </p>
                        </div>

                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-2xl font-bold text-green-600">2</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Review Profiles</h3>
                            <p className="text-gray-600">
                                View detailed profiles, specializations, experience, and patient reviews to make an informed choice.
                            </p>
                        </div>

                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-2xl font-bold text-purple-600">3</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Book & Connect</h3>
                            <p className="text-gray-600">
                                Schedule appointments and start your therapy journey with voice analysis technology for enhanced care.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Features */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8 mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">Platform Features</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Advanced tools and features designed to enhance your therapy experience.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaMicrophone className="text-blue-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Voice Analysis</h3>
                            <p className="text-gray-600 text-sm">AI-powered emotion detection for deeper therapeutic insights.</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaCalendarAlt className="text-green-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Easy Scheduling</h3>
                            <p className="text-gray-600 text-sm">Flexible appointment booking with calendar integration.</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaLock className="text-purple-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Secure Messaging</h3>
                            <p className="text-gray-600 text-sm">End-to-end encrypted communication with your therapist.</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
                                <FaStar className="text-indigo-600 text-2xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Verified Reviews</h3>
                            <p className="text-gray-600 text-sm">Authentic patient reviews and ratings for informed decisions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-white mb-6">Ready to Find Your Therapist?</h3>
                    <p className="text-xl text-blue-100 leading-relaxed mb-8">
                        Start your journey to better mental health with qualified professionals who use cutting-edge voice analysis technology.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default Therapist