import React from 'react'
import { FaStar } from "react-icons/fa";
import therapistImage from '../../assets/therapist.png'

const therapists = [
    {
      name: "Dr. Emma Collins",
      image: therapistImage,
    },
    {
      name: "Ms. Olivia Bennett",
      image: therapistImage,
    },
    {
      name: "Dr. Isabella Harper",
      image: therapistImage,
    },
    {
      name: "Ms. Sophia Martinez",
      image: therapistImage,
    },
    {
        name: "Dr. Charlotte Evans",
        image: therapistImage,
      },
      {
        name: "Ms. Amelia Thompson",
        image: therapistImage,
      },
      {
        name: "Dr. Grace Anderson",
        image: therapistImage,
      },
      {
        name: "Ms. Lily Roberts",
        image: therapistImage,
      },
  ];

const Therapist = () => {
    return (
        <div className="bg-[#EBEDE9] py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Our Therapists</h2>
            <p className="text-gray-500">
              Find the perfect therapist to support your journey.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 lg:px-32"> {/* Use grid layout for responsiveness */}
            {therapists.map((therapist, index) => (
              <div
                key={index}
                    className="bg-[#EBEDE9] shadow-lg rounded-lg overflow-hidden"
              >
                <img src={therapist.image} alt={therapist.name} className="w-full h-56 object-cover" /> {/* Increased height */}
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold">{therapist.name}</h3>
                  <div className="flex justify-center mt-2 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
}

export default Therapist