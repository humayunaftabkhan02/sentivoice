import { AudioRecorder } from 'react-audio-voice-recorder';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { generateAndSendPatientReport } from '../../utils/generatePDF.js';
import { api } from "../../utils/api";

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

export default function AudioRecorderComponent({ therapistUsername,
                                                therapistFullName,
                                                patientData,
                                                onReportSent}) {
  const addAudioElement = async (blob) => {
    // Convert to WAV
    const wavBlob = await convertToWav(blob);
    
    // Store the recording locally for later processing
    // Don't send report immediately - wait for admin approval
    
    try {
      // Just save the recording and notify parent component
      if (onReportSent) {
        // Pass the blob data to parent for later processing
        onReportSent(null, therapistUsername, wavBlob);
      }
      
      alert(`✅ Voice recording saved successfully!\n\nYour voice recording has been saved and will be processed for emotion analysis when you submit your booking.`);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('Error saving voice recording. Please try again.');
    }
  };

  return (
    <div>
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
    </div>
  );
}