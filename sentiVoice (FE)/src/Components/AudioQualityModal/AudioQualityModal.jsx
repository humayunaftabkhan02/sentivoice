import React from 'react';
import { FaMicrophone, FaVolumeUp, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';

const AudioQualityModal = ({ 
  isOpen, 
  onClose, 
  onReRecord, 
  qualityAnalysis, 
  errorType 
}) => {
  if (!isOpen) return null;

  const getErrorIcon = () => {
    switch (errorType) {
      case 'audio_quality':
        return <FaVolumeUp className="text-orange-500 text-4xl" />;
      case 'feature_extraction':
        return <FaMicrophone className="text-red-500 text-4xl" />;
      default:
        return <FaExclamationTriangle className="text-yellow-500 text-4xl" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'audio_quality':
        return 'Audio Quality Issue';
      case 'feature_extraction':
        return 'Voice Recording Problem';
      default:
        return 'Recording Issue';
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case 'audio_quality':
        return 'Your voice recording has quality issues that may affect the emotion analysis.';
      case 'feature_extraction':
        return 'We couldn\'t extract clear speech features from your recording.';
      default:
        return 'There was an issue with your voice recording.';
    }
  };

  const renderQualityDetails = () => {
    if (!qualityAnalysis) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <FaVolumeUp className="mr-2 text-blue-600" />
          Audio Analysis
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <span className="font-medium text-gray-700">Duration:</span>
            <span className="ml-2 text-gray-600">
              {qualityAnalysis.duration ? `${qualityAnalysis.duration.toFixed(1)}s` : 'Unknown'}
            </span>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <span className="font-medium text-gray-700">Volume:</span>
            <span className="ml-2 text-gray-600">
              {qualityAnalysis.max_amplitude ? `${(qualityAnalysis.max_amplitude * 100).toFixed(1)}%` : 'Unknown'}
            </span>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <span className="font-medium text-gray-700">Energy:</span>
            <span className="ml-2 text-gray-600">
              {qualityAnalysis.rms_energy ? `${(qualityAnalysis.rms_energy * 100).toFixed(1)}%` : 'Unknown'}
            </span>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <span className="font-medium text-gray-700">Sample Rate:</span>
            <span className="ml-2 text-gray-600">
              {qualityAnalysis.sample_rate ? `${qualityAnalysis.sample_rate}Hz` : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    if (!qualityAnalysis?.suggestions || qualityAnalysis.suggestions.length === 0) {
      return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Suggestions
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">Speak at a consistent volume - not too quiet or too loud</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">Record in a quiet room without echo or background noise</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">Speak for at least 10 seconds and under 2 minutes for optimal analysis</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">Test your microphone before recording to ensure it's working</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">Keep a distance of 6-12 inches from your microphone</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">Speak naturally and avoid sudden volume changes</span>
            </li>
          </ul>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Suggestions
        </h4>
        <ul className="space-y-3">
          {qualityAnalysis.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">•</span>
              <span className="text-gray-700">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getErrorIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{getErrorTitle()}</h3>
              <p className="text-sm text-gray-600 mt-1">{getErrorDescription()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {renderQualityDetails()}
          {renderSuggestions()}

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={onReRecord}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaMicrophone className="text-lg" />
              <span>Re-record Voice</span>
            </button>
          </div>

          {/* Warning */}
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-amber-800 leading-relaxed">
                Note: Poor audio quality will affect emotion analysis accuracy. Please re-record your voice for accurate results.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioQualityModal; 