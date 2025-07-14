import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Function to generate complete patient report PDF (profile + appointment history)
export const generateCompletePatientReport = async (patient, appointmentHistory = []) => {
  const pdf = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  
  let currentY = margin;
  let pageNumber = 1;

  // Helper function to add new page
  const addNewPage = () => {
    pdf.addPage();
    currentY = margin;
    pageNumber++;
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (estimatedHeight) => {
    if (currentY + estimatedHeight > pageHeight - margin) {
      addNewPage();
    }
  };

  // Helper function to add text with proper spacing
  const addTextWithSpacing = (text, x, y, maxWidth, fontSize = 12, lineSpacing = 1.2) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * lineSpacing;
    
    lines.forEach((line, index) => {
      pdf.text(line, x, y + (index * lineHeight));
    });
    
    return lines.length * lineHeight;
  };

  // Helper function to add section header with proper spacing
  const addSectionHeader = (title, y) => {
    // Add extra space before section header
    const newY = y + 10;
    
    pdf.setFontSize(16);
    pdf.setTextColor(29, 63, 128); // #1D3F80
    pdf.setFont(undefined, 'bold');
    pdf.text(title, margin, newY);
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'normal');
    
    return newY + 20; // Return position after header with extra spacing
  };

  // Helper function to add field with proper spacing
  const addField = (label, value, y) => {
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text(label + ':', margin, y);
    
    const labelWidth = pdf.getTextWidth(label + ':');
    const valueX = margin + labelWidth + 8;
    const valueWidth = contentWidth - labelWidth - 8;
    
    pdf.setFont(undefined, 'normal');
    const height = addTextWithSpacing(value || 'Not specified', valueX, y, valueWidth, 11, 1.3);
    
    return y + height + 12; // Return position after field with extra spacing
  };

  // Page 1: Header and Patient Information
  pdf.setFillColor(29, 63, 128);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('SENTIVOICE', pageWidth/2, 15, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('PATIENT COMPREHENSIVE REPORT', pageWidth/2, 30, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth/2, 42, { align: 'center' });
  
  currentY = 70; // Start content well below header

  // Patient Information Section
  currentY = addSectionHeader('PATIENT INFORMATION', currentY);
  
  currentY = addField('Full Name', `${patient.info?.firstName || ""} ${patient.info?.lastName || ""}`, currentY);
  currentY = addField('Age', patient.info?.age?.toString(), currentY);
  currentY = addField('Contact', patient.info?.contact, currentY);
  
  checkPageBreak(40);
  currentY = addSectionHeader('MEDICAL ASSESSMENT', currentY);
  
  currentY = addField('Diagnosis', patient.info?.diagnosis, currentY);
  currentY = addField('Primary Emotion', patient.info?.pastSessionSummary?.emotion, currentY);
  
  checkPageBreak(40);
  currentY = addSectionHeader('THERAPY PLAN', currentY);
  
  if (patient.info?.therapyPlan && patient.info.therapyPlan.length > 0) {
    patient.info.therapyPlan.forEach((plan, index) => {
      let planText;
      if (typeof plan === 'object' && plan !== null) {
        planText = `${index + 1}. ${plan.step ? plan.step : JSON.stringify(plan)}`;
      } else {
        planText = `${index + 1}. ${plan}`;
      }
      const height = addTextWithSpacing(planText, margin + 10, currentY, contentWidth - 10, 11, 1.4);
      currentY += height + 8; // Add extra spacing between plan items
    });
  } else {
    const height = addTextWithSpacing('No therapy plan items defined', margin, currentY, contentWidth, 11, 1.3);
    currentY += height + 8;
  }
  
  checkPageBreak(40);
  currentY = addSectionHeader('SESSION SUMMARY', currentY);
  
  const summaryHeight = addTextWithSpacing(patient.info?.pastSessionSummary?.note || 'No notes available', margin, currentY, contentWidth, 11, 1.4);
  currentY += summaryHeight + 20; // Extra spacing after session summary

  // Appointment History - Start new page
  addNewPage();
  
  // Header for appointment history page
  pdf.setFillColor(29, 63, 128);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('APPOINTMENT HISTORY', pageWidth/2, 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`${patient.info?.firstName || ""} ${patient.info?.lastName || ""}`, pageWidth/2, 25, { align: 'center' });
  
  currentY = 40;

  if (appointmentHistory.length > 0) {
    appointmentHistory.forEach((appointment, index) => {
      // Check if we need a new page for this appointment
      const appointmentHeight = 100 + (appointment.sessionNotes?.length * 25 || 0);
      checkPageBreak(appointmentHeight);
      
      // Appointment header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Appointment ${index + 1}`, margin + 5, currentY + 10);
      
      // Status badge
      const status = appointment.status;
      let statusColor;
      switch(status) {
        case 'Accepted': statusColor = [76, 175, 80]; break;
        case 'Pending': statusColor = [255, 193, 7]; break;
        case 'Rejected': statusColor = [244, 67, 54]; break;
        default: statusColor = [158, 158, 158];
      }
      
      pdf.setTextColor(...statusColor);
      pdf.setFontSize(10);
      pdf.text(status, pageWidth - margin - 30, currentY + 10);
      
      currentY += 25; // Extra spacing after appointment header
      
      // Appointment details
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      currentY = addField('Date', appointment.date, currentY);
      currentY = addField('Time', appointment.time, currentY);
      currentY = addField('Session Type', appointment.sessionType === 'in-person' ? 'In-person' : appointment.sessionType === 'online' ? 'Online' : 'N/A', currentY);
      currentY = addField('Reason', appointment.reason, currentY);
      
      // Session notes
      if (appointment.sessionNotes && appointment.sessionNotes.length > 0) {
        checkPageBreak(40);
        currentY = addSectionHeader('SESSION NOTES', currentY);
        
        appointment.sessionNotes.forEach((note, noteIndex) => {
          const noteText = `Note ${noteIndex + 1}: ${note.note}`;
          const noteHeight = addTextWithSpacing(noteText, margin + 10, currentY, contentWidth - 10, 10, 1.3);
          currentY += noteHeight + 5;
          
          const timestamp = new Date(note.timestamp).toLocaleString();
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text(timestamp, margin + 10, currentY);
          currentY += 10; // Extra spacing after timestamp
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
        });
      }
      
      currentY += 15; // Extra spacing after appointment
      
      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 20; // Extra spacing after separator
    });
  } else {
    currentY = addSectionHeader('NO APPOINTMENT HISTORY', currentY);
    const height = addTextWithSpacing('No appointments found for this patient.', margin, currentY, contentWidth, 11, 1.3);
    currentY += height + 10;
  }

  // Footer on each page
  const addFooter = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Page ${pageNumber}`, pageWidth/2, pageHeight - 10, { align: 'center' });
    pdf.text('SentiVoice Patient Management System', pageWidth/2, pageHeight - 5, { align: 'center' });
  };

  // Add footer to all pages
  for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
    pdf.setPage(i);
    addFooter();
  }
  
  const patientName = `${patient.info?.firstName || ""} ${patient.info?.lastName || ""}`.trim() || patient.username;
  pdf.save(`${patientName.replace(/\s+/g, '_')}_Complete_Report.pdf`);
};

// Keep the old function for backward compatibility
export const generatePatientProfilePDF = async (patient) => {
  return generateCompletePatientReport(patient, []);
};

// Function to generate appointment history PDF (for history export)
export const generateAppointmentHistoryPDF = async (patient, appointmentHistory) => {
  const pdfElement = document.createElement("div");
  pdfElement.style.width = "800px";
  pdfElement.style.fontFamily = "Arial, sans-serif";
  pdfElement.style.padding = "20px";
  pdfElement.style.background = "#fff";
  pdfElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #1D3F80; padding-bottom: 10px;">
      <div style="display: flex; align-items: center;">
        <h1 style="color: #1D3F80; font-size: 24px; margin: 0;">SentiVoice Appointment History</h1>
      </div>
      <div style="text-align: right; font-size: 12px; color: #666;">Generated on ${new Date().toLocaleDateString()}</div>
    </div>

    <div style="margin-top: 20px;">
      <!-- Patient Header -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1D3F80; font-size: 20px; margin: 0 0 10px 0;">Patient Information</h2>
        <p style="margin: 5px 0; font-size: 16px;"><strong>Name:</strong> ${patient.info?.firstName || ""} ${patient.info?.lastName || ""}</p>
        <p style="margin: 5px 0;"><strong>Patient ID:</strong> ${patient._id.slice(-8)}</p>
      </div>

      <!-- Appointment History -->
      <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #1D3F80; font-size: 20px; margin: 0 0 15px 0;">Appointment History</h2>
        ${appointmentHistory.length > 0 
          ? appointmentHistory.map((appointment, index) => `
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #fafafa;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="color: #333; font-size: 16px; margin: 0;">Appointment #${index + 1}</h3>
                <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; 
                  background: ${appointment.status === 'Accepted' ? '#d4edda' : 
                              appointment.status === 'Pending' ? '#fff3cd' : 
                              appointment.status === 'Rejected' ? '#f8d7da' : '#e2e3e5'};
                  color: ${appointment.status === 'Accepted' ? '#155724' : 
                          appointment.status === 'Pending' ? '#856404' : 
                          appointment.status === 'Rejected' ? '#721c24' : '#383d41'};">
                  ${appointment.status}
                </span>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                <div>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${appointment.date}</p>
                  <p style="margin: 5px 0;"><strong>Time:</strong> ${appointment.time}</p>
                </div>
                <div>
                  <p style="margin: 5px 0;"><strong>Initiator:</strong> ${appointment.initiatorRole}</p>
                  <p style="margin: 5px 0;"><strong>Reason:</strong> ${appointment.reason || "Not specified"}</p>
                </div>
              </div>

              ${appointment.sessionNotes && appointment.sessionNotes.length > 0 
                ? `<div style="margin-top: 10px;">
                    <h4 style="color: #333; font-size: 14px; margin: 0 0 8px 0;">Session Notes:</h4>
                    ${appointment.sessionNotes.map((note, noteIndex) => `
                      <div style="background: #fff; border-left: 3px solid #1D3F80; padding: 10px; margin-bottom: 8px;">
                        <p style="margin: 0 0 5px 0; font-weight: bold;">Note #${noteIndex + 1}</p>
                        <p style="margin: 0 0 5px 0;">${note.note}</p>
                        <p style="margin: 0; font-size: 11px; color: #666;">
                          ${new Date(note.timestamp).toLocaleString()}
                        </p>
                      </div>
                    `).join("")}
                  </div>`
                : `<p style="margin: 10px 0 0 0; color: #666; font-style: italic;">No session notes available</p>`
              }
            </div>
          `).join("")
          : `<div style="text-align: center; padding: 40px; color: #666;">
              <p style="font-size: 16px; margin: 0;">No appointment history available</p>
            </div>`
        }
      </div>

      <!-- Summary -->
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h3 style="color: #1D3F80; font-size: 16px; margin: 0 0 10px 0;">Summary</h3>
        <p style="margin: 5px 0;"><strong>Total Appointments:</strong> ${appointmentHistory.length}</p>
        <p style="margin: 5px 0;"><strong>Accepted:</strong> ${appointmentHistory.filter(a => a.status === 'Accepted').length}</p>
        <p style="margin: 5px 0;"><strong>Pending:</strong> ${appointmentHistory.filter(a => a.status === 'Pending').length}</p>
        <p style="margin: 5px 0;"><strong>Rejected/Canceled:</strong> ${appointmentHistory.filter(a => a.status === 'Rejected' || a.status === 'Canceled').length}</p>
      </div>
    </div>
  `;

  document.body.appendChild(pdfElement);

  try {
    const canvas = await html2canvas(pdfElement);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    
    const patientName = `${patient.info?.firstName || ""} ${patient.info?.lastName || ""}`.trim() || patient.username;
    pdf.save(`${patientName.replace(/\s+/g, '_')}_Appointment_History.pdf`);
  } finally {
    document.body.removeChild(pdfElement);
  }
};

// Function to generate PDF and send to therapist
export const generateAndSendPatientReport = async (patient, history, therapistUsername, message) => {
  const pdfElement = document.createElement("div");
  pdfElement.style.width = "800px";
  pdfElement.style.fontFamily = "Arial, sans-serif";
  pdfElement.style.padding = "20px";
  pdfElement.style.background = "#fff";
  pdfElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #1D3F80; padding-bottom: 10px;">
      <div style="display: flex; align-items: center;">
        <h1 style="color: #1D3F80; font-size: 24px;">SentiVoice Patient Report</h1>
      </div>
      <div style="text-align: right; font-size: 12px;">${new Date().toLocaleDateString()}</div>
    </div>

    <div style="display: flex; margin-top: 20px;">
      <!-- Left Column -->
      <div style="width: 60%; padding-right: 20px;">
        <p><strong>Full Name:</strong> ${patient.info?.firstName || ""} ${patient.info?.lastName || ""}</p>
        <p><strong>Age:</strong> ${patient.info?.age || "N/A"}</p>
        <p><strong>Contact:</strong> ${patient.info?.contact || "N/A"}</p>
        <p><strong>Diagnosis:</strong> ${patient.info?.diagnosis || "N/A"}</p>

        <h3 style="margin-top: 15px; font-size: 16px;"><strong>Therapy Plan:</strong></h3>
        <ul>
          ${(patient.info?.therapyPlan || []).map(plan => `<li>• ${plan}</li>`).join("")}
        </ul>

        <h3 style="margin-top: 15px; font-size: 16px;"><strong>Appointment History:</strong></h3>
        ${history.map((a, i) => `
          <div key="${i}" style="margin-bottom: 8px;">
            <p><strong>Date:</strong> ${a.date} | <strong>Time:</strong> ${a.time} | <strong>Status:</strong> ${a.status}</p>
            <p><strong>Session Notes:</strong></p>
                ${(a.sessionNotes && a.sessionNotes.length > 0)
                ? a.sessionNotes.map((n, j) => `
                    <p style="margin-left: 10px;">🗒️ ${n.note} <br />
                        <span style="font-size: 10px; color: gray;">${new Date(n.timestamp).toLocaleString()}</span>
                    </p>
                    `).join("")
                : `<p style="margin-left: 10px;">N/A</p>`
                }
          </div>
        `).join("")}
      </div>

      <!-- Right Column -->
      <div style="width: 40%; background: #EEF2FA; padding: 15px; border-radius: 8px;">
        <h3 style="font-size: 16px;"><strong>Past Session Summary</strong></h3><br />
        <p><strong>Emotion:</strong> ${patient.info?.pastSessionSummary?.emotion || "N/A"}</p>
        <p><strong>Therapist Note:</strong> ${patient.info?.pastSessionSummary?.note || "N/A"}</p>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-left: 4px solid #1D3F80;">
      <h3 style="margin: 0; color: #1D3F80;"><strong>Patient Message:</strong></h3>
      <p style="margin: 10px 0;">${message}</p>
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
    
    // Send to backend using the api utility for proper authentication
    const { api } = await import('../utils/api.js');
    
    const response = await api.post('/reports/send', {
      patientUsername: patient.username,
      therapistUsername: therapistUsername,
      patientName: `${patient.info?.firstName || ""} ${patient.info?.lastName || ""}`.trim(),
      message: message,
      pdfData: pdfBase64,
      fileName: `${patient.info?.firstName || patient.username}_Report_${new Date().toISOString().split('T')[0]}.pdf`
    });

    return response;
  } finally {
    document.body.removeChild(pdfElement);
  }
};