import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaTimes, FaVolumeUp } from 'react-icons/fa';

const AudioAnalysisProgressModal = ({ 
  isOpen, 
  onClose, 
  onAnalysisComplete,
  onAnalysisError,
  audioBlob 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const steps = [
    { name: 'Preparing audio...', duration: 1000 },
    { name: 'Converting to WAV format...', duration: 1500 },
    { name: 'Analyzing audio quality...', duration: 2000 },
    { name: 'Processing voice features...', duration: 2500 },
    { name: 'Finalizing analysis...', duration: 1000 }
  ];

  useEffect(() => {
    if (isOpen && audioBlob) {
      startAnalysis();
    }
  }, [isOpen, audioBlob]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate progress through steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].name);
        
        // Calculate progress for this step
        const stepProgress = (i / steps.length) * 100;
        const nextStepProgress = ((i + 1) / steps.length) * 100;
        
        // Animate progress for this step
        const progressIncrement = (nextStepProgress - stepProgress) / 20; // 20 updates per step
        for (let j = 0; j < 20; j++) {
          await new Promise(resolve => setTimeout(resolve, steps[i].duration / 20));
          setProgress(stepProgress + (progressIncrement * j));
        }
      }

      // Perform actual analysis
      setCurrentStep('Analyzing voice quality...');
      const qualityResult = await analyzeAudioQuality(audioBlob);
      
      if (qualityResult && (qualityResult.status === "error" || qualityResult.error_type)) {
        setIsAnalyzing(false);
        // Call the error handler to show AudioQualityModal
        if (onAnalysisError) {
          onAnalysisError({
            type: qualityResult.error_type || 'analysis_error',
            message: qualityResult.message || 'Audio quality analysis failed',
            qualityAnalysis: qualityResult.quality_analysis
          });
        }
        return;
      }

      // Success
      setProgress(100);
      setCurrentStep('Analysis complete!');
      setIsAnalyzing(false);
      
      // Call success callback after a brief delay
      setTimeout(() => {
        if (onAnalysisComplete) {
          onAnalysisComplete(qualityResult);
        }
      }, 1000);

    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      // Call the error handler for network errors
      if (onAnalysisError) {
        onAnalysisError({
          type: 'network_error',
          message: 'Failed to analyze audio. Please check your connection and try again.',
          qualityAnalysis: null
        });
      }
    }
  };

  // Function to analyze audio quality (same as in AudioRecorder)
  const analyzeAudioQuality = async (audioBlob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }
      
      const base64 = btoa(binary);
      
      // Send to Flask app for quality analysis
      const flaskUrl = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:8080/api/predict';
      
      const response = await fetch(flaskUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return errorData;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing audio quality:', error);
      throw error;
    }
  };

  const handleClose = () => {
    if (!isAnalyzing) {
      onClose();
    }
  };



  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {isAnalyzing ? (
                <div className="relative">
                  <FaVolumeUp className="text-blue-600 text-4xl animate-pulse" />
                  <FaSpinner className="text-blue-400 text-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>
              ) : (
                <FaCheckCircle className="text-green-500 text-4xl animate-bounce" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {isAnalyzing ? 'Analyzing Voice Recording' : 'Analysis Complete'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isAnalyzing ? 'Please wait while we process your audio...' : 'Your voice has been successfully analyzed'}
              </p>
            </div>
          </div>
          {!isAnalyzing && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="text-lg" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isAnalyzing ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Current Step */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 animate-pulse">
                <div className="flex items-center space-x-3">
                  <FaMicrophone className="text-blue-600 text-lg" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{currentStep}</p>
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-2">Analysis in Progress</p>
                    <p className="text-xs text-amber-700">
                      We're analyzing your voice quality, volume, and speech patterns. This helps ensure accurate emotion analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-start space-x-3">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-2">Analysis Complete</p>
                    <p className="text-xs text-green-700">
                      Your voice recording has been successfully analyzed and saved. You can now proceed with your appointment booking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaCheckCircle className="text-lg" />
                <span>Continue</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AudioAnalysisProgressModal; 