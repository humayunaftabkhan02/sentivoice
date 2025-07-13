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
async function sendAudioReportToTherapist(patientData, therapistUsername, analysisData) {
  const pdfElement = document.createElement("div");
  pdfElement.style.width = "800px";
  pdfElement.style.fontFamily = "Arial, sans-serif";
  pdfElement.style.padding = "20px";
  pdfElement.style.background = "#fff";
  
  pdfElement.innerHTML = `
    <div style="border-bottom: 4px solid #1D3F80; padding-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="color: #1D3F80; font-size: 24px;">Voice Emotion Analysis Report</h1>
        <div style="text-align: right; font-size: 12px;">
          <p>Date: ${analysisData.analysisDate}</p>
          <p>Time: ${analysisData.analysisTime}</p>
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 14px;">
        <p><strong>Patient:</strong> ${patientData.info?.firstName || ""} ${patientData.info?.lastName || ""}</p>
        <p><strong>Session Type:</strong> Voice Emotion Analysis</p>
        <p><strong>Analysis Method:</strong> SentiVoice AI-Based Emotion Detection</p>
      </div>
    </div>
    
    <div style="display: flex; margin-top: 20px;">
      <!-- Left side - Analysis Results -->
      <div style="flex: 1; margin-right: 20px;">
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1D3F80; margin-top: 0;">Primary Analysis</h3>
          <p style="font-size: 18px;"><strong>Detected Emotion: </strong><span style="color: #1D3F80;">${analysisData.emotion}</span></p>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
          <h3 style="color: #1D3F80; margin-top: 0; font-size: 14px;">Technical Markers</h3>
          <div style="font-size: 12px;">
            <p style="margin: 4px 0;"><strong>Speech Energy (MFCC1): </strong>${analysisData.mfcc1}</p>
            <p style="margin: 4px 0;"><strong>Vocal Tone (MFCC40): </strong>${analysisData.mfcc40}</p>
            <p style="margin: 4px 0;"><strong>Pitch (Chroma): </strong>${analysisData.chroma}</p>
            <p style="margin: 4px 0;"><strong>Intensity (Melspectrogram): </strong>${analysisData.melspectrogram}</p>
            <p style="margin: 4px 0;"><strong>Contrast: </strong>${analysisData.contrast}</p>
            <p style="margin: 4px 0;"><strong>Harmonic (Tonnetz): </strong>${analysisData.tonnetz}</p>
          </div>
        </div>
      </div>
      
      <!-- Right side - Recommendations -->
      <div style="flex: 1;">
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
          <h3 style="color: #1D3F80; margin-top: 0;">Automated Analysis Notes</h3>
          <p style="font-size: 14px;">This voice analysis was automatically generated and sent to provide real-time insights into the patient's emotional state during the appointment booking process.</p>
          <p style="font-size: 12px; margin-top: 10px; color: #666;">Generated automatically by SentiVoice AI system</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(pdfElement);

  try {
    const canvas = await html2canvas(pdfElement);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    
    // Convert PDF to base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    
    // Send to backend
    const response = await api.post('/reports/send-audio-analysis', {
      data: {
        patientUsername: patientData.username,
        therapistUsername: therapistUsername,
        patientName: `${patientData.info?.firstName || ""} ${patientData.info?.lastName || ""}`.trim(),
        emotion: analysisData.emotion,
        analysisData: analysisData,
        pdfData: pdfBase64,
        fileName: `${patientData.info?.firstName || patientData.username}_Voice_Analysis_${new Date().toISOString().split('T')[0]}.pdf`,
        reportType: 'voice_analysis'
      }
    });

    if (response.status !== 200) {
      throw new Error('Failed to send audio analysis report');
    }

    return response.data;
  } finally {
    document.body.removeChild(pdfElement);
  }
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