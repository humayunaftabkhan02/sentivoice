import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom' // Import Navigate
import './index.css'
import App from './App.jsx'
import WebsitePage from './Pages/Website.jsx' // Import the new WebsitePage component
import Therapists from './Pages/Therapists.jsx'
import Login from './Pages/Login.jsx'
import Signup from './Pages/Signup.jsx'
import EmailVerificationPage from './Pages/EmailVerificationPage.jsx';
import ForgotPassword from './Components/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from './Components/ResetPassword/ResetPassword.jsx';
import ResendVerification from './Components/ResendVerification/ResendVerification.jsx';
import BookAppointment from './Pages/BookAppointment';
import TherapistDashboard from "./Pages/TherapistDashboard";
import TherapistAppointmentCalendar from './Pages/TherapistAppointmentCalendar.jsx';
import TherapistPatientManagement from './Pages/TherapistPatientManagement.jsx';
import TherapistReports from './Pages/TherapistReports.jsx';
import P_Dashboard from './Pages/PatientDashboard.jsx'
import TherapistMessaging from './Pages/TherapistMessaging.jsx'
import TherapistSettings from './Pages/TherapistSettings.jsx'
import PatientMessaging from './Pages/PatientMessaging.jsx'
import PatientSettings from './Pages/PatientSettings.jsx'
import AppointmentHistory from './Pages/AppointmentHistory.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import ComingSoon from './Pages/ComingSoon.jsx'
import Services from './Pages/Services.jsx'
import About from './Pages/About.jsx'
import Contact from './Pages/Contact.jsx'
import TherapistApproval from './Pages/TherapistApproval.jsx';
import AdminDashboard    from './Pages/AdminDashboard.jsx';
import PaymentApproval    from './Pages/PaymentApproval.jsx';
import PaymentHistory from "./Pages/PaymentHistory.jsx";
import PaymentSettings from "./Pages/PaymentSettings.jsx";
import AdminSettings from "./Pages/AdminSettings.jsx";
import AdminUserList from "./Pages/AdminUserList.jsx";
import RefundRequests from './Pages/RefundRequests.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} /> {/* Redirect root to /home */}
        <Route path="/home" element={<WebsitePage />} /> {/* /home route */}
        <Route path="/therapists" element={<Therapists />} /> {/* /therapist route */}
        <Route path="/login" element={<Login />} /> {/* /login route */}
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Signup />} /> {/* /signup route */}
        <Route path="/email-verification" element={<EmailVerificationPage />} /> {/* /email-verification route */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
		            {/* Patient-Specific Routes */}
        {/* 
          "requiredRole='patient'" means ONLY a user with role 'patient' 
          can access these pages. If they're not logged in or role mismatch, 
          they'll be redirected to /login.
        */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute requiredRole="patient">
              <P_Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute requiredRole="patient">
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pa-messaging"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientMessaging />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pa-settings"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pa-appointment-history"
          element={
            <ProtectedRoute requiredRole="patient">
              <AppointmentHistory />
            </ProtectedRoute>
          }
        />

        {/* Therapist-Specific Routes */}
        <Route
          path="/therapist-dashboard"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointment-calendar"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistAppointmentCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-management"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistPatientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/th-messaging"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistMessaging />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist-reports"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/th-settings"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
        }/>
        <Route path="/therapist-approval" element={
          <ProtectedRoute requiredRole="admin"><TherapistApproval /></ProtectedRoute>
        }/>
        <Route path="/payments" element={
          <ProtectedRoute requiredRole="admin"><PaymentApproval /></ProtectedRoute>
        }/>
        <Route path="/payment-approval" element={
          <ProtectedRoute requiredRole="admin"><PaymentApproval /></ProtectedRoute>
        }/>
        <Route path="/payment-history" element={
          <ProtectedRoute requiredRole="admin"><PaymentHistory /></ProtectedRoute>
        }/>
        <Route path="/payment-settings" element={
          <ProtectedRoute requiredRole="admin"><PaymentSettings /></ProtectedRoute>
        }/>
        <Route path="/admin-settings" element={
          <ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>
        }/>
        <Route path="/admin-user-list" element={
          <ProtectedRoute requiredRole="admin"><AdminUserList /></ProtectedRoute>
        }/>
        <Route path="/refund-requests" element={
          <ProtectedRoute requiredRole="admin"><RefundRequests /></ProtectedRoute>
        }/>
        {/* Catch-all: If no route matches, go to /home */}
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)