import React from 'react'
import { Link } from 'react-router-dom'
import { FaTwitter, FaFacebook, FaLinkedin, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'
import Logo from '../../assets/logo.png'

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid lg:grid-cols-4 gap-12">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <img src={Logo} alt="SentiVoice Logo" className="h-12 w-auto" />
                  <span className="text-2xl font-bold">SentiVoice</span>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                  SentiVoice uses AI-powered voice analysis to detect emotions and enhance therapy sessions. 
                  We provide secure messaging, appointment management, and voice-based emotional insights for better mental health care.
                </p>
                
                {/* Social Links */}
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                    <FaTwitter className="text-lg" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                    <FaFacebook className="text-lg" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                    <FaLinkedin className="text-lg" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                    <FaInstagram className="text-lg" />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
                <ul className="space-y-4">
                  <li>
                    <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-200">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/therapists" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Find Therapists
                    </Link>
                  </li>
                  <li>
                    <Link to="/services" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Our Services
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Our Services</h3>
                <ul className="space-y-4">
                  <li className="text-gray-300">Voice Emotion Analysis</li>
                  <li className="text-gray-300">Appointment Management</li>
                  <li className="text-gray-300">Secure Messaging</li>
                  <li className="text-gray-300">Report Generation</li>
                  <li className="text-gray-300">Therapist Dashboard</li>
                </ul>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="grid md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-800">
              <div>
                <h3 className="text-lg font-semibold mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="text-blue-400" />
                    <span className="text-gray-300">noreply.sentivoice@gmail.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaPhone className="text-blue-400" />
                    <span className="text-gray-300">+92 344 0791986</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="text-blue-400" />
                    <span className="text-gray-300">Islamabad, Pakistan</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Business Hours</h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Emergency Only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-gray-400 text-sm">
                  © 2025 SentiVoice. All rights reserved.
                </div>
                <div className="flex space-x-6 text-sm">
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </Link>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Terms of Service
                  </Link>
                  <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors duration-200">
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
    );
}

export default Footer