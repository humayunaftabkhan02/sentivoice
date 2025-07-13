import React from 'react'

const AboutContent = () => {
    return (
        <div className="bg-[#EBEDE9] text-gray-800">
            {/* Hero Section */}
            <section className="py-20 text-center">
                <div className="max-w-4xl mx-auto px-6">
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Empowering Mental Health with AI
                    </h1>
                    <p className="text-xl text-gray-700">
                        At SentiVoice, we use speech-based emotion detection to bridge the gap between AI and therapy.
                    </p>
                </div>
            </section>

            {/* Info Cards */}
            <section className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition duration-300 ease-in-out">
                    <h2 className="text-2xl font-semibold text-blue-700 mb-4">What We Do</h2>
                    <p className="text-gray-600">
                        We offer AI-powered emotion recognition through voice analysis, enabling therapists to make data-driven decisions and users to gain insight into their emotional health. Our tools include real-time analytics, session tracking, and secure communication.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition duration-300 ease-in-out">
                    <h2 className="text-2xl font-semibold text-purple-700 mb-4">Our Vision</h2>
                    <p className="text-gray-600">
                        To make mental health support intuitive, accessible, and personalized for everyone — using the power of voice. We believe in building a future where emotional intelligence is at the heart of technology.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition duration-300 ease-in-out">
                    <h2 className="text-2xl font-semibold text-pink-700 mb-4">Meet the Team</h2>
                    <p className="text-gray-600">
                        Created by final-year Computer Science students from CUST, SentiVoice is a research-driven innovation under the guidance of Dr. Abdul Basit Siddiqui. Our combined expertise in AI, full-stack development, and user experience fuels the mission behind this platform.
                    </p>
                </div>
            </section>

            {/* Closing Statement */}
            <section className="bg-[#EBEDE9] py-12">
                <div className="max-w-3xl mx-auto text-center px-6">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800">Why SentiVoice?</h3>
                    <p className="text-lg text-gray-700">
                        Because every emotion matters — and every voice deserves to be heard.
                    </p>
                </div>
            </section>
        </div>
    )
}

export default AboutContent