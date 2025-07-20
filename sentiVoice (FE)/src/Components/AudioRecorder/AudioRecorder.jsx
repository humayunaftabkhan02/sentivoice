import { AudioRecorder } from 'react-audio-voice-recorder';
import { FaMicrophone, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { generateAndSendPatientReport } from '../../utils/generatePDF.js';
import { api } from "../../utils/api";
import { useState } from 'react';

// Modern Progress Indicator Component
const UploadProgressIndicator = ({ isVisible, progress, status, message }) => {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <FaSpinner className="animate-spin text-blue-600" />;
      case 'success':
        return <FaCheckCircle className="text-green-600" />;
      case 'error':
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaSpinner className="animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50';
      case 'success':
        return 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50';
      case 'error':
        return 'border-red-100 bg-gradient-to-r from-red-50 to-pink-50';
      default:
        return 'border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50';
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div className={`max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 ${getStatusColor()} overflow-hidden animate-scale-in`}>
        {/* Header */}
        <div className="p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            {getStatusIcon()}
            <h3 className="text-lg font-semibold text-gray-800">
              {status === 'processing' && 'Processing Voice Recording'}
              {status === 'success' && 'Upload Complete'}
              {status === 'error' && 'Upload Failed'}
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            {message || 'Please wait while we analyze your voice recording...'}
          </p>
        </div>

        {/* Progress Bar */}
        {status === 'processing' && (
          <div className="px-6 pb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Progress Steps */}
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 ${progress >= 25 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  progress >= 25 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {progress >= 25 ? '✓' : '1'}
                </div>
                <span className="text-sm">Converting audio format</span>
              </div>
              
              <div className={`flex items-center space-x-3 ${progress >= 50 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  progress >= 50 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {progress >= 50 ? '✓' : '2'}
                </div>
                <span className="text-sm">Analyzing audio quality</span>
              </div>
              
              <div className={`flex items-center space-x-3 ${progress >= 75 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  progress >= 75 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {progress >= 75 ? '✓' : '3'}
                </div>
                <span className="text-sm">Processing voice data</span>
              </div>
              
              <div className={`flex items-center space-x-3 ${progress >= 100 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  progress >= 100 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {progress >= 100 ? '✓' : '4'}
                </div>
                <span className="text-sm">Saving recording</span>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Message */}
        {(status === 'success' || status === 'error') && (
          <div className="px-6 pb-6">
            <div className={`p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {(status === 'success' || status === 'error') && (
          <div className="px-6 pb-6">
            <button
              onClick={() => {
                if (status === 'success') {
                  // Close the modal and continue
                  window.location.reload();
                } else {
                  // Close the modal and allow retry
                  window.location.reload();
                }
              }}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                status === 'success' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {status === 'success' ? 'Continue' : 'Try Again'}
            </button>
            
            {/* Auto-close indicator */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                {status === 'success' ? 'This will close automatically in 3 seconds' : 'This will close automatically in 5 seconds'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert Blob to WAV Blob
async function convertToWav(blob) {
  // Decode audio data
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Encode as WAV
  function encodeWAV(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let samples;
    if (numChannels === 2) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      samples = interleave(left, right);
    } else {
      samples = audioBuffer.getChannelData(0);
    }

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * bitDepth / 8, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
  }

  function interleave(left, right) {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let inputIndex = 0;
    for (let index = 0; index < length;) {
      result[index++] = left[inputIndex];
      result[index++] = right[inputIndex];
      inputIndex++;
    }
    return result;
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  return encodeWAV(audioBuffer);
}

// Function to analyze audio quality in real-time
async function analyzeAudioQuality(audioBlob) {
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
    
    // Send directly to Flask app for quality analysis
    const flaskUrl = 'https://sentivoice-flask-273777154059.us-central1.run.app/api/predict';
    console.log('🔍 Sending to Flask app:', flaskUrl);
    
    const response = await fetch(flaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: base64
      })
    });
    
    console.log('📊 Flask response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('⚠️ Flask error response:', errorData);
      return errorData; // Return the error data
    }
    
    const data = await response.json();
    console.log('✅ Flask success response:', data);
    return data;
  } catch (error) {
    console.error('Error analyzing audio quality:', error);
    return null;
  }
}

// Function to send audio analysis report to therapist
async function sendAudioReportToTherapist(patientData, therapistUsername, audioBlob) {
  // Create FormData to send audio file
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_recording.wav');
  formData.append('patientUsername', patientData.username);
  formData.append('therapistUsername', therapistUsername);
  formData.append('patientName', `${patientData.info?.firstName || ""} ${patientData.info?.lastName || ""}`.trim());
    
  // Send to backend for processing
  const response = await api.post('/reports/send-audio-analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    });

    if (response.status !== 200) {
      throw new Error('Failed to send audio analysis report');
    }

    return response.data;
}

export default function AudioRecorderComponent({ 
  therapistUsername,
  therapistFullName,
  patientData,
  onReportSent,
  onAudioQualityError 
}) {
  const [uploadProgress, setUploadProgress] = useState({
    isVisible: false,
    progress: 0,
    status: 'idle', // 'idle', 'processing', 'success', 'error'
    message: '',
  });

  const addAudioElement = async (blob) => {
    try {
      setUploadProgress({ isVisible: true, progress: 0, status: 'processing', message: 'Starting voice recording processing...' });

      // Step 1: Convert to WAV (25%)
      setUploadProgress(prev => ({ ...prev, progress: 25, message: 'Converting audio format...' }));
      const wavBlob = await convertToWav(blob);
      
      // Step 2: Check recording duration (35%)
      setUploadProgress(prev => ({ ...prev, progress: 35, message: 'Analyzing recording duration...' }));
      const arrayBuffer = await wavBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = audioBuffer.duration;
      
      console.log('⏱️ Recording duration:', duration, 'seconds');
      
      // Check if recording is too long (over 2 minutes)
      if (duration > 120) {
        console.log('⚠️ Recording too long:', duration, 'seconds');
        setUploadProgress(prev => ({ 
          ...prev, 
          progress: 100, 
          status: 'error', 
          message: 'Recording is too long. Please keep it under 2 minutes for optimal analysis.' 
        }));
        
        if (onAudioQualityError) {
          onAudioQualityError({
            error_type: 'audio_quality',
            quality_analysis: {
              duration: duration,
              issues: ['Audio is too long'],
              suggestions: ['Please keep your recording under 2 minutes for optimal analysis']
            },
            message: 'Recording is too long. Please keep it under 2 minutes.'
          });
        } else {
          alert('Recording is too long. Please keep it under 2 minutes for optimal analysis.');
        }
        return; // Don't save the recording
      }
      
      // Step 3: Analyze audio quality (50%)
      setUploadProgress(prev => ({ ...prev, progress: 50, message: 'Analyzing audio quality...' }));
      console.log('🔍 Analyzing audio quality...');
      const qualityResult = await analyzeAudioQuality(wavBlob);
      console.log('📊 Quality result:', qualityResult);
      
      if (qualityResult && (qualityResult.status === "error" || qualityResult.error_type)) {
        // Audio quality issue detected
        console.log('⚠️ Audio quality issue detected:', qualityResult);
        console.log('🎯 Error type:', qualityResult.error_type);
        console.log('📝 Message:', qualityResult.message);
        console.log('📊 Analysis:', qualityResult.quality_analysis);
        
        setUploadProgress(prev => ({ 
          ...prev, 
          progress: 100, 
          status: 'error', 
          message: qualityResult.message || 'Audio quality issue detected. Please re-record with better quality.' 
        }));
        
        if (onAudioQualityError) {
          console.log('📞 Calling onAudioQualityError with:', {
            error_type: qualityResult.error_type,
            quality_analysis: qualityResult.quality_analysis,
            message: qualityResult.message,
            suggestions: qualityResult.suggestions || qualityResult.quality_analysis?.suggestions
          });
          onAudioQualityError({
            error_type: qualityResult.error_type,
            quality_analysis: qualityResult.quality_analysis,
            message: qualityResult.message,
            suggestions: qualityResult.suggestions || qualityResult.quality_analysis?.suggestions
          });
        } else {
          // Fallback alert if no error handler provided
          let errorMessage = "Audio quality issue detected:\n\n";
          if (qualityResult.quality_analysis?.suggestions) {
            errorMessage += qualityResult.quality_analysis.suggestions.join('\n');
          } else if (qualityResult.suggestions) {
            errorMessage += qualityResult.suggestions.join('\n');
          } else {
            errorMessage += "• Please speak louder and more clearly\n";
            errorMessage += "• Record in a quiet environment\n";
            errorMessage += "• Speak for at least 2-3 seconds\n";
            errorMessage += "• Check that your microphone is working";
          }
          alert(errorMessage);
        }
        return; // Don't save the recording
      }
      
      // Step 4: Process voice data (75%)
      setUploadProgress(prev => ({ ...prev, progress: 75, message: 'Processing voice data...' }));
      
      // Audio quality is good, save the recording
      console.log('✅ Audio quality check passed');
      
      // Step 5: Save recording (100%)
      setUploadProgress(prev => ({ ...prev, progress: 100, message: 'Saving recording...' }));
      
      if (onReportSent) {
        // Pass the blob data to parent for later processing
        onReportSent(null, therapistUsername, wavBlob);
      }
      
      // Success state
      setUploadProgress(prev => ({ 
        ...prev, 
        status: 'success', 
        message: 'Voice recording saved successfully! Your emotional assessment has been recorded and will be processed for emotion analysis when you submit your booking.' 
      }));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setUploadProgress({ isVisible: false, progress: 0, status: 'idle', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error processing recording:', error);
      setUploadProgress(prev => ({ 
        ...prev, 
        progress: 100, 
        status: 'error', 
        message: 'Error processing voice recording. Please try again.' 
      }));
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setUploadProgress({ isVisible: false, progress: 0, status: 'idle', message: '' });
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4 w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FaMicrophone className="text-blue-600 text-lg" />
            <span className="text-sm font-semibold text-blue-800">Recording Requirement</span>
          </div>
          <p className="text-sm text-blue-700 text-center">
            Please record for <strong>at least 10 seconds</strong> and <strong>under 2 minutes</strong> for optimal analysis
          </p>
        </div>
      </div>
      
      <AudioRecorder
        onRecordingComplete={addAudioElement}
        audioTrackConstraints={{
          noiseSuppression: true,
          echoCancellation: true,
        }}
        onNotAllowedOrFound={(err) => console.table(err)}
        mediaRecorderOptions={{
          audioBitsPerSecond: 128000,
        }}
      />
      <br/>
      <UploadProgressIndicator
        isVisible={uploadProgress.isVisible}
        progress={uploadProgress.progress}
        status={uploadProgress.status}
        message={uploadProgress.message}
      />
    </div>
  );
}