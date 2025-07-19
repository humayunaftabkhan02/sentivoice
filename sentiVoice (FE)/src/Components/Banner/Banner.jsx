import React from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaPlay, FaMicrophone, FaBrain, FaShieldAlt, FaUserMd, FaCalendarAlt, FaComments } from 'react-icons/fa'
import bannerImage from '../../assets/bannerImage.png'

const Banner = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  <FaMicrophone className="text-blue-600" />
                  <span>AI-Powered Voice Analysis</span>
                </div>

                {/* Main Heading */}
                <div className="space-y-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Voice-Powered
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      Mental Health Care
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    SentiVoice analyzes your voice recordings to detect emotions and provide insights to therapists. 
                    Book appointments, communicate securely, and get personalized mental health care.
                  </p>
                </div>

                {/* Features */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaBrain className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Voice Analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaUserMd className="text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Expert Therapists</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaShieldAlt className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Secure Messaging</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 relative z-20">
                  <Link 
                    to="/book-appointment" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span>Book Appointment</span>
                    <FaArrowRight className="ml-2" />
                  </Link>
                  
                  <Link 
                    to="/signup?role=therapist" 
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-200 cursor-pointer relative z-10"
                    onClick={() => console.log('Join as Therapist clicked')}
                  >
                    <FaPlay className="mr-2" />
                    <span>Join as Therapist</span>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6 pt-8 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">Voice Analysis</div>
                    <div className="text-sm text-gray-600">Emotion Detection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">Secure Chat</div>
                    <div className="text-sm text-gray-600">Real-time Messaging</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">Easy Booking</div>
                    <div className="text-sm text-gray-600">Simple Scheduling</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Image */}
              <div className="relative">
                <div className="relative z-10">
                  <img 
                    src={bannerImage} 
                    alt="SentiVoice Platform" 
                    className="w-full h-auto max-w-lg mx-auto drop-shadow-2xl"
                  />
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center pointer-events-none">
                  <FaMicrophone className="text-blue-600 text-xl" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center pointer-events-none">
                  <FaBrain className="text-green-600" />
                </div>
                
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-3xl -z-10 transform rotate-3 pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </section>
    );
}

export default Banner