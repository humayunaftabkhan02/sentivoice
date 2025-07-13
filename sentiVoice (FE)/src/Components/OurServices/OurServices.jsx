import React from 'react'
import appointmentImage from '../../assets/appointment.png'

const OurServices = ({ backgroundClass = 'bg-white' }) => {
  return (
      <section className={`py-16 px-8 text-center ${backgroundClass}`}>
          <h2 className="text-4xl font-bold text-gray-800 mb-10">Our Services</h2>
          <div className="flex flex-col lg:flex-row justify-center space-y-8 lg:space-y-0 lg:space-x-8">
            {/* Therapy Sessions Card */}
            <div className="bg-white shadow-md rounded-lg p-6 w-full lg:w-96 border"> {/* Responsive width */}
              <img src="https://em-content.zobj.net/source/microsoft-teams/364/woman-health-worker_1f469-200d-2695-fe0f.png" alt="Therapy Sessions" className="h-32 w-32 object-contain mb-4 mx-auto" /> {/* Adjusted image size */}
              <h3 className="text-lg font-bold text-[#20757C] mb-2">Therapy Sessions</h3>
              <p className="text-gray-700">
                Transform your therapy experience with real-time emotion detection,
                personalized insights, and secure communication to support your
                mental health journey.
              </p>
            </div>
            {/* Personalized Therapy Plans Card */}
            <div className="bg-white shadow-md rounded-lg p-6 w-full lg:w-96 border"> {/* Responsive width */}
              <img src="https://cdn3d.iconscout.com/3d/premium/thumb/medical-shield-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--protection-healthcare-pack-illustrations-3684958.png" alt="Personalized Therapy Plans" className="h-32 w-32 object-contain mb-4 mx-auto" /> {/* Adjusted image size */}
              <h3 className="text-lg font-bold text-[#20757C] mb-2">Personalized Therapy Plans</h3>
              <p className="text-gray-700">
                Receive tailored therapy plans based on real-time emotional insights,
                ensuring a customized approach to your mental health and well-being.
              </p>
            </div>
            {/* Appointment Management Card */}
            <div className="bg-white shadow-md rounded-lg p-6 w-full lg:w-96 border"> {/* Responsive width */}
              <img src={appointmentImage} alt="Appointment Management" className="h-32 w-32 object-contain mb-4 mx-auto" /> {/* Adjusted image size */}
              <h3 className="text-lg font-bold text-[#20757C] mb-2">Appointment Management</h3>
              <p className="text-gray-700">
                Easily schedule, reschedule, or cancel appointments with automatic
                reminders to keep your therapy sessions on track.
              </p>
            </div>
          </div>
        </section>
      );
}

export default OurServices