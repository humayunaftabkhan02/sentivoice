/* utils/generatePdfReport.js */
const PDFDocument = require('pdfkit');
const path        = require('path');

const sum = arr => arr.reduce((a, b) => a + b, 0);

async function generatePdfReport(analysisData, patientName) {
  return new Promise((resolve, reject) => {
    try {
      /* ------------------------------------------------------------ */
      /* 1.  Set up PDF and fonts                                     */
      /* ------------------------------------------------------------ */
      const doc = new PDFDocument({ margin: 55 });
      const fontDir = path.join(__dirname, 'fonts');
      doc.registerFont('Unicode',      path.join(fontDir, 'DejaVuSans.ttf'));
      doc.registerFont('Unicode-Bold', path.join(fontDir, 'DejaVuSans-Bold.ttf'));
      doc.font('Unicode');

      const buffers = [];
      doc.on('data',  c => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));

      const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      /* -------------------------  HEADER  ------------------------- */
      const now = new Date();

      doc.fillColor('#1D3F80')
         .font('Unicode-Bold')
         .fontSize(20)
         .text('Therapist Session Analysis Report', doc.page.margins.left, 65);

      doc.fontSize(9)
         .font('Unicode')
         .fillColor('black')
         .text(`Date: ${now.toLocaleDateString()}`, doc.page.margins.left, 70, {
           width: pageW, align: 'right'
         })
         .text(`Time: ${now.toLocaleTimeString()}`, {
           width: pageW, align: 'right'
         });

      /* ---------------------- SESSION META ----------------------- */
      doc.moveDown(2);
      doc.fontSize(11);

      doc.font('Unicode-Bold').text('Session Type: ', { continued: true })
         .font('Unicode').text('Voice Emotion Analysis');

      doc.font('Unicode-Bold').text('Analysis Method: ', { continued: true })
         .font('Unicode').text('SentiVoice AI-Based Emotion Detection');

      doc.font('Unicode-Bold').text('Patient Name: ', { continued: true })
         .font('Unicode').text(patientName?.trim() ? patientName : 'N/A');

      /* divider */
      doc.moveDown(0.8);
      const dividerY = doc.y;
      doc.save()
         .moveTo(doc.page.margins.left, dividerY)
         .lineTo(doc.page.margins.left + pageW, dividerY)
         .lineWidth(2)
         .stroke('#1D3F80')
         .restore();

      doc.moveDown(1.5);

      /* -------------------- LEFT COLUMN CARDS -------------------- */
      const cardW       = 270;
      const gap         = 30;
      const rightColX   = doc.page.margins.left + cardW + gap;

      const cardPad     = 16;
      const primaryY    = doc.y;
      const primaryH    = 75;

      // Primary Analysis card
      doc.save()
         .roundedRect(doc.page.margins.left, primaryY, cardW, primaryH, 8)
         .fill('#F1F2F6')
         .restore();

      doc.fillColor('#1D3F80').font('Unicode-Bold').fontSize(13)
         .text('Primary Analysis', doc.page.margins.left + cardPad, primaryY + cardPad);

      doc.font('Unicode-Bold').fillColor('black').fontSize(12)
         .text('Detected Emotion: ', doc.page.margins.left + cardPad, doc.y + 6, { continued: true })
         .font('Unicode')
         .text(analysisData.emotion || 'N/A');

      // Technical Markers card
      const techY = primaryY + primaryH + 25;
      const techH = 150;

      doc.save()
         .roundedRect(doc.page.margins.left, techY, cardW, techH, 8)
         .fill('#F1F2F6')
         .restore();

      doc.fillColor('#1D3F80').font('Unicode-Bold').fontSize(11.5)
         .text('Technical Markers', doc.page.margins.left + cardPad, techY + cardPad);

      const markers = [
        { key: 'mfcc1',          label: 'Speech Energy (MFCC1)' },
        { key: 'mfcc40',         label: 'Vocal Tone (MFCC40)'  },
        { key: 'chroma',         label: 'Pitch (Chroma)'       },
        { key: 'melspectrogram', label: 'Intensity (Melspec)'  },
        { key: 'contrast',       label: 'Contrast'             },
        { key: 'tonnetz',        label: 'Harmonic (Tonnetz)'   }
      ];

      doc.font('Unicode').fillColor('black').fontSize(9.8);
      let mY = techY + cardPad + 18;
      markers.forEach(({ key, label }) => {
        const v = analysisData[key] !== undefined ? parseFloat(analysisData[key]).toFixed(4) : 'N/A';
        doc.text(`${label}: ${v}`, doc.page.margins.left + cardPad, mY);
        mY += 13.5;
      });

      /* ----------------- RIGHT COLUMN TABLE ----------------- */
      const tableStartY = techY + techH + 20;  //  ← NO OVERLAP
      const colW   = [40, 90, 65, 65, 65, 70, 70];
      const tableW = sum(colW);
      const tableX = doc.page.width - doc.page.margins.right - tableW;

      // Table title
      doc.font('Unicode-Bold').fontSize(13)
         .fillColor('black')
         .text('Feature Thresholds by Emotion', tableX, tableStartY, {
           width: tableW, align: 'center'
         });

      // Table headers and data
      const headers = ['Sr No.', 'Features', 'Sad', 'Happy', 'Angry', 'Calm', 'Surprise'];
      const rows = [
        ['1', 'MFCC1',          '≤ -32.5',  '≥ 15.2', '≥ 28.7', '-10.3 – 5.8',  '≥ 22.4'],
        ['2', 'MFCC40',         '≤ -5.8',   '≥ 3.2',  '≥ 4.5',  '-2.1 – 1.8',   '≥ 2.9'],
        ['3', 'Chroma',         '≤ 0.35',   '≥ 0.65', '≥ 0.75', '0.45 – 0.55',  '≥ 0.70'],
        ['4', 'Melspectrogram', '≤ -15.2',  '≥ 12.5', '≥ 18.3', '-8.4 – 6.2',   '≥ 14.8'],
        ['5', 'Contrast',       '≤ 22.5',   '≥ 45.8', '≥ 52.3', '30.2 – 40.5',  '≥ 48.7'],
        ['6', 'Tonnetz',        '≤ -0.42',  '≥ 0.38', '≥ 0.45', '-0.15 – 0.25', '≥ 0.40']
      ];

      let tx = tableX, ty = tableStartY + 25;

      headers.forEach((h, i) => {
        doc.rect(tx, ty, colW[i], 22).fillAndStroke('#1D3F80', '#1D3F80');
        doc.fillColor('white').font('Unicode-Bold').fontSize(9)
           .text(h, tx + 2, ty + 6, { width: colW[i] - 4, align: 'center' });
        tx += colW[i];
      });

      ty += 22;
      rows.forEach(row => {
        tx = tableX;
        row.forEach((cell, i) => {
          doc.rect(tx, ty, colW[i], 20).stroke();
          doc.fillColor('black').font('Unicode').fontSize(9)
             .text(cell, tx + 2, ty + 5, { width: colW[i] - 4, align: 'center' });
          tx += colW[i];
        });
        ty += 20;
      });

      doc.end();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating PDF:', err.message);
      }
      reject(err);
    }
  });
}

module.exports = { generatePdfReport };