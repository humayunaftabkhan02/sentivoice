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

        const mailOptions = {
            from: `"SentiVoice Contact Form" <${process.env.GMAIL_USER}>`,
            to: process.env.CONTACT_EMAIL || 'humayunaftabkhan02@gmail.com',
            subject: `SentiVoice Contact: Message from ${sanitizedName}`,
            replyTo: sanitizedEmail,
            text: `From: ${sanitizedName}\nEmail: ${sanitizedEmail}\n\nMessage:\n${sanitizedMessage}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>SentiVoice Contact Form Submission</h2>
                    <p><strong>From:</strong> ${sanitizedName}</p>
                    <p><strong>Email:</strong> ${sanitizedEmail}</p>
                    <hr>
                    <p><strong>Message:</strong></p>
                    <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
                </div>
            `
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