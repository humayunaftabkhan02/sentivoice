const nodemailer = require('nodemailer');

exports.sendContactEmail = async (req, res) => {
    const { name, email, message } = req.body;

    // Input validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Sanitize inputs
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedMessage = message.trim().substring(0, 2000);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASS,
            },
        });

        // Create a well-designed HTML email template
        const htmlEmailTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SentiVoice Contact Form Submission</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f8fafc;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }
                    .header p {
                        margin: 10px 0 0 0;
                        opacity: 0.9;
                        font-size: 16px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .info-section {
                        background-color: #f8fafc;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    .info-item {
                        display: flex;
                        align-items: center;
                        margin-bottom: 15px;
                        padding: 12px;
                        background-color: white;
                        border-radius: 6px;
                        border-left: 4px solid #3b82f6;
                    }
                    .info-item:last-child {
                        margin-bottom: 0;
                    }
                    .info-label {
                        font-weight: 600;
                        color: #374151;
                        min-width: 80px;
                        margin-right: 15px;
                    }
                    .info-value {
                        color: #6b7280;
                        flex: 1;
                    }
                    .message-section {
                        background-color: #fefefe;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 25px;
                    }
                    .message-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                    }
                    .message-content {
                        color: #4b5563;
                        line-height: 1.7;
                        white-space: pre-wrap;
                    }
                    .footer {
                        background-color: #f8fafc;
                        padding: 20px 30px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer p {
                        margin: 0;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .icon {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        margin-right: 8px;
                        background-color: #3b82f6;
                        border-radius: 50%;
                        position: relative;
                    }
                    .icon::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 8px;
                        height: 8px;
                        background-color: white;
                        border-radius: 50%;
                    }
                    @media only screen and (max-width: 600px) {
                        .container {
                            margin: 10px;
                            border-radius: 8px;
                        }
                        .header {
                            padding: 20px;
                        }
                        .content {
                            padding: 20px;
                        }
                        .info-item {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .info-label {
                            margin-bottom: 5px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📧 New Contact Form Submission</h1>
                        <p>SentiVoice Platform</p>
                    </div>
                    
                    <div class="content">
                        <div class="info-section">
                            <div class="info-item">
                                <span class="info-label">👤 Name:</span>
                                <span class="info-value">${sanitizedName}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📧 Email:</span>
                                <span class="info-value">${sanitizedEmail}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">🕒 Time:</span>
                                <span class="info-value">${new Date().toLocaleString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZoneName: 'short'
                                })}</span>
                            </div>
                        </div>
                        
                        <div class="message-section">
                            <div class="message-title">
                                <span class="icon"></span>
                                Message
                            </div>
                            <div class="message-content">${sanitizedMessage.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This message was sent from the SentiVoice contact form.</p>
                        <p>Please respond to the user's email address for any inquiries.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"SentiVoice Contact Form" <${process.env.GMAIL_USER}>`,
            to: 'noreply.sentivoice@gmail.com',
            subject: `📧 SentiVoice Contact: Message from ${sanitizedName}`,
            replyTo: sanitizedEmail,
            text: `From: ${sanitizedName}\nEmail: ${sanitizedEmail}\nTime: ${new Date().toLocaleString()}\n\nMessage:\n${sanitizedMessage}`,
            html: htmlEmailTemplate
        }        

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Email sent successfully' });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error sending contact email:', error.message);
        }
        return res.status(500).json({ error: 'Failed to send email' });
    }
};