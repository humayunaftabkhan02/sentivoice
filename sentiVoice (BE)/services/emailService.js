const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    // Clean the app password by removing spaces
    const cleanAppPassword = process.env.GMAIL_APP_PASS ? 
      process.env.GMAIL_APP_PASS.replace(/\s/g, '') : '';
    
    if (!process.env.GMAIL_USER || !cleanAppPassword) {
      throw new Error('Email configuration is incomplete. Check GMAIL_USER and GMAIL_APP_PASS environment variables.');
    }
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: cleanAppPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email, token, username) {
    // Validate inputs
    if (!email || !token || !username) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Missing required parameters for verification email');
      }
      return false;
    }
    
    const verificationUrl = `${process.env.FRONTEND_URL}/email-verification?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"SentiVoice" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify Your SentiVoice Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00786F; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">SentiVoice</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Welcome to SentiVoice!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${username},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up with SentiVoice! To complete your registration and start using our platform, 
              please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #00786F; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #00786F; word-break: break-all; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              This verification link will expire in 24 hours. If you didn't create an account with SentiVoice, 
              you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 SentiVoice. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email sending error:', error.message);
      }
      return false;
    }
  }

  async sendResendVerificationEmail(email, token, username) {
    // Validate inputs
    if (!email || !token || !username) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Missing required parameters for resend verification email');
      }
      return false;
    }
    
    const verificationUrl = `${process.env.FRONTEND_URL}/email-verification?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"SentiVoice" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'SentiVoice - Email Verification (Resent)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00786F; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">SentiVoice</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Email Verification</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${username},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              You requested a new verification email. Please click the button below to verify your email address:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #00786F; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you didn't request this email, you can safely ignore it.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 SentiVoice. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email sending error:', error.message);
      }
      return false;
    }
  }

  async sendPasswordResetEmail(email, token, username) {
    // Validate inputs
    if (!email || !token || !username) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Missing required parameters for password reset email');
      }
      return false;
    }
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"SentiVoice" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'SentiVoice - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00786F; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">SentiVoice</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Password Reset Request</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${username},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #00786F; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #00786F; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              This reset link will expire in 1 hour. If you didn't request a password reset, 
              you can safely ignore this email and your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 SentiVoice. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email sending error:', error.message);
      }
      return false;
    }
  }
}

module.exports = new EmailService(); 