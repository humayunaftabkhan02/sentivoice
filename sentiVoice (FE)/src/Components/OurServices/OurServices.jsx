import React from 'react'
import { FaUserMd, FaBrain, FaCalendarAlt, FaShieldAlt, FaChartLine, FaComments, FaMicrophone, FaFileAlt } from 'react-icons/fa'
import emotionDetectImage from '../../assets/emotiondetect.png'

const OurServices = ({ backgroundClass = 'bg-gray-50' }) => {
  const services = [
    {
      icon: <FaMicrophone className="text-3xl" />,
      title: "Voice Emotion Analysis",
      description: "Record your voice and get AI-powered emotion detection. Our system analyzes voice patterns to identify emotional states and provides insights to therapists.",
      color: "blue",
      features: ["10-120 Second Recordings", "Real-time Analysis", "Emotion Detection"]
    },
    {
      icon: <FaCalendarAlt className="text-3xl" />,
      title: "Appointment Management",
      description: "Book, reschedule, and manage therapy appointments with licensed therapists. Choose between in-person and online sessions.",
      color: "green",
      features: ["Easy Scheduling", "Session Types", "Reschedule/Cancel"]
    },
    {
      icon: <FaComments className="text-3xl" />,
      title: "Secure Messaging",
      description: "Communicate privately with your therapist through encrypted messaging. Share files, emojis, and maintain ongoing conversations.",
      color: "purple",
      features: ["Real-time Chat", "File Sharing", "Encrypted Messages"]
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        icon: "text-blue-600",
        border: "border-blue-200",
        hover: "hover:border-blue-300"
      },
      green: {
        bg: "bg-green-50",
        icon: "text-green-600",
        border: "border-green-200",
        hover: "hover:border-green-300"
      },
      purple: {
        bg: "bg-purple-50",
        icon: "text-purple-600",
        border: "border-purple-200",
        hover: "hover:border-purple-300"
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <section className={`py-20 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FaShieldAlt className="text-blue-600" />
            <span>Our Services</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Comprehensive Mental Health
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Platform
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            SentiVoice combines voice analysis technology with traditional therapy to provide a unique mental health care experience.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const colors = getColorClasses(service.color);
            return (
              <div 
                key={index}
                className={`group relative bg-white rounded-2xl p-8 border-2 ${colors.border} ${colors.hover} transition-all duration-300 hover:shadow-xl hover:-translate-y-2`}
              >
                {/* Icon */}
                <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={colors.icon}>
                    {service.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Features */}
                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${colors.icon.replace('text-', 'bg-')}`}></div>
                      <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-2xl ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>
              </div>
            );
          })}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20 bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Advanced Features for
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Better Care
                </span>
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our platform provides comprehensive tools for both patients and therapists to enhance the therapy experience.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaFileAlt className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Report Generation</h4>
                    <p className="text-sm text-gray-600">Get detailed PDF reports with voice analysis and emotional insights.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaComments className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Real-time Messaging</h4>
                    <p className="text-sm text-gray-600">Secure chat with file sharing and emoji support.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaShieldAlt className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Privacy First</h4>
                    <p className="text-sm text-gray-600">End-to-end encryption and secure data handling.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaUserMd className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Therapist Dashboard</h4>
                    <p className="text-sm text-gray-600">Comprehensive tools for managing patients and appointments.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={emotionDetectImage} 
                alt="Voice Emotion Detection Technology" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <FaMicrophone className="text-blue-600 text-xl" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FaBrain className="text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OurServices