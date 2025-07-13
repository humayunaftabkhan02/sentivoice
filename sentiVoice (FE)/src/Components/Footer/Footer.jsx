import React from 'react'
import Logo from '../../assets/logo.png'


const Footer = () => {
    return (
        <footer className="bg-[#EBEDE9] py-20 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start">
            {/* Left Section */}
            <div className="text-center md:text-left md:w-1/3">
              <img
                src={Logo}
                alt="SentiVoice Logo"
                className="h-16 mx-auto md:mx-0"
              />
              <p className="text-gray-700 mt-4 max-w-xs">
                SentiVoice uses AI-powered emotion detection through speech to
                enhance therapy, offering personalized plans, real-time insights,
                and secure communication for both patients and therapists.
              </p>
            </div>
            
            {/* Middle Section */}
            <div className="flex flex-wrap justify-center md:justify-between mt-6 md:mt-0 md:w-1/2">
              <div className="mx-6">
                <h3 className="font-bold text-gray-900">Quick Links</h3>
                <ul className="mt-2 space-y-2">
                  <li><a href="#" className="text-gray-700 hover:underline">Home</a></li>
                  <li><a href="#" className="text-gray-700 hover:underline">About</a></li>
                  <li><a href="#" className="text-gray-700 hover:underline">Therapists</a></li>
                  <li><a href="#" className="text-gray-700 hover:underline">Services</a></li>
                  <li><a href="#" className="text-gray-700 hover:underline">Contact</a></li>
                </ul>
              </div>
              <div className="mx-6">
                <h3 className="font-bold text-gray-900">Services</h3>
                <ul className="mt-2 space-y-2">
                  <li>Therapy Sessions</li>
                  <li>Personalized Therapy Plans</li>
                  <li>Appointment Management</li>
                </ul>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="text-center md:text-left mt-6 md:mt-0 md:w-1/6">
              <h3 className="font-bold text-gray-900">Location</h3>
              <p className="text-gray-700 mt-2">Islamabad, Pakistan</p>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-300 mt-6 pt-4 text-center text-gray-700">
            &copy;2025 All Rights Reserved
          </div>
        </footer>
      );
}

export default Footer