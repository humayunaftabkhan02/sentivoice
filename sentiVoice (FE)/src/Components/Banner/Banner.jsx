import React from 'react'
import { Link } from 'react-router-dom'
import bannerImage from '../../assets/bannerImage.png'

const Banner = () => {
    return (
        <section className="bg-[#EBEDE9] mt-[-50px] px-8 md:px-24 lg:px-52 flex flex-col lg:flex-row justify-center gap-8 lg:gap-20 items-center h-screen"> {/* Responsive padding and layout */}
          <div className="w-full lg:w-3/5 text-center">
            <h1 className="text-3xl lg:text-5xl font-bold text-[#242424]">Welcome To SentiVoice!</h1>
            <h2 className="text-xl lg:text-4xl font-bold text-[#242424] mt-4">
              Experience A New Era Of Therapy With Emotion Detection From Speech
            </h2>
            <p className="text-gray-700 mt-6 text-justify">
              Revolutionizing therapy with AI-powered emotion detection through speech,
              enabling therapists to better understand and treat their patients while
              providing patients with a more personalized experience
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link to="/login" className="bg-teal-700 text-white px-6 py-2 rounded font-semibold hover:bg-teal-800">
                Get Appointment
              </Link>
              <Link to="/signup" className="border border-gray-700 text-gray-900 px-6 py-2 rounded font-semibold hover:bg-gray-200">
                Join as a Therapist
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-2/5 md:flex justify-center hidden lg:flex"> {/* Hide image on lower screens */}
            <img src={bannerImage} alt="Emotion Icons" className="h-48 lg:h-full object-contain" />
          </div>
        </section>
      );
}

export default Banner