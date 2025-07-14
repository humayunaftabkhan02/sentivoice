// controllers/appointmentController.js
const Appointment = require('../models/appointmentModel');
const Notification = require('../models/notificationModel');
const User = require('../models/dataModel');
const Payment = require('../models/paymentModel');

/**
 * CREATE (schedule) a new appointment.
 * Body must contain:
 *  - patientUsername
 *  - therapistUsername
 *  - date
 *  - time
 *  - initiatorRole: "patient" or "therapist"
 */
exports.createAppointment = async (req, res) => {
  try {
    const { patientUsername, therapistUsername, date, time, initiatorRole, sessionType } = req.body;

    // 🛡️ Validate users
    const patient = await User.findOne({ username: patientUsername, role: 'patient' });
    const therapist = await User.findOne({ username: therapistUsername, role: 'therapist' });
    if (!patient || !therapist) {
      return res.status(400).json({ error: 'Invalid patient or therapist username/role' });
    }

    // 🔍 Check for existing booking for this slot
    const existing = await Appointment.findOne({
      therapistUsername,
      date,
      time,
      status: { $in: ["Accepted"] }  // ✅ Only block real active bookings
    });

    // ⛔ Prevent duplicate pending/accepted appointments with the same therapist
    const duplicate = await Appointment.findOne({
      patientUsername,
      therapistUsername,
      status: { $in: ["Pending", "Accepted"] }
    });
    if (duplicate) {
      return res.status(409).json({
        error: "You already have a pending or accepted appointment with this therapist."
      });
    }

    // 🕒 Prevent booking for past times
    const now = new Date();
    const bookingDateTime = new Date(`${date} ${time}`);
    if (bookingDateTime < now) {
      return res.status(400).json({ error: "Cannot book an appointment in the past." });
    }

    if (existing) {
      return res.status(409).json({
        error: "❌ This time slot is already booked. Please choose a different one."
      });
    }

    // Validate initiator role
    if (!['patient', 'therapist'].includes(initiatorRole)) {
      return res.status(400).json({ error: "Invalid initiator role. Must be 'patient' or 'therapist'" });
    }

    // 🚫 Prevent therapist from scheduling manually
    if (initiatorRole === "therapist") {
      return res.status(403).json({ error: "Therapists are not allowed to schedule appointments manually." });
    }

    // ✅ Create appointment
    const appointment = new Appointment({
      patientUsername,
      therapistUsername,
      date,
      time,
      status: 'Pending',
      initiatorRole,
      sessionType
    });
    await appointment.save();

    const patientFullName = patient.info?.firstName && patient.info?.lastName
    ? `${patient.info.firstName} ${patient.info.lastName}`
    : patientUsername;

    // 🔔 Notifications for both users
    await Notification.create({
      recipientUsername: patientUsername,
      message: `Your appointment has been created for ${date} at ${time}. Awaiting therapist approval.`,
      appointmentId: appointment._id,
    });
    await Notification.create({
      recipientUsername: therapistUsername,
      message: `New appointment request from ${patientFullName} for ${date} at ${time}.`,
      appointmentId: appointment._id,
    });

    return res.status(201).json({ message: '✅ Appointment created successfully', appointment });

      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating appointment:', error.message);
      }
    return res.status(500).json({ error: '❌ Internal server error' });
  }
};

/**
 * ACCEPT appointment
 */
exports.acceptAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = 'Accepted';
    await appointment.save();

    // Notify both parties
    const userA = appointment.patientUsername;
    const userB = appointment.therapistUsername;

    // e.g. "Appointment on 2025-03-05 at 10:00 AM was accepted."
    await Notification.create({
      recipientUsername: userA,
      message: `Your appointment on ${appointment.date} at ${appointment.time} was accepted by the therapist.`,
      appointmentId: appointment._id,
    });
    await Notification.create({
      recipientUsername: userB,
      message: `You accepted an appointment for ${appointment.date} at ${appointment.time}.`,
      appointmentId: appointment._id,
    });

    return res.status(200).json({ message: 'Appointment accepted' });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error accepting appointment:', error.message);
      }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * REJECT appointment
 */
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = 'Rejected';
    await appointment.save();

    // If appointment has a payment and payment is approved, set to Refund Pending
    if (appointment.paymentId) {
      const payment = await Payment.findById(appointment.paymentId);
      if (payment && payment.status === 'Approved') {
        payment.status = 'Refund Pending';
        await payment.save();
        await Notification.create({
          recipientUsername: appointment.patientUsername,
          message: `Your payment is being refunded because your appointment was not accepted. The refund is being processed.`,
          paymentId: payment._id,
        });
      }
    }

    // Notify both parties
    const userA = appointment.patientUsername;
    const userB = appointment.therapistUsername;

    await Notification.create({
      recipientUsername: userA,
      message: `Your appointment on ${appointment.date} at ${appointment.time} was rejected by the therapist.`,
      appointmentId: appointment._id,
    });
    await Notification.create({
      recipientUsername: userB,
      message: `You rejected an appointment for ${appointment.date} at ${appointment.time}.`,
      appointmentId: appointment._id,
    });

    return res.status(200).json({ message: 'Appointment rejected' });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rejecting appointment:', error.message);
      }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * CANCEL appointment
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = 'Canceled';
    if (reason) {
      appointment.reason = reason;
    }
    await appointment.save();

    // If appointment has a payment and payment is approved, set to Refund Pending
    if (appointment.paymentId) {
      const payment = await Payment.findById(appointment.paymentId);
      if (payment && payment.status === 'Approved') {
        payment.status = 'Refund Pending';
        await payment.save();
        await Notification.create({
          recipientUsername: appointment.patientUsername,
          message: `Your payment is being refunded because your appointment was canceled. The refund is being processed.`,
          paymentId: payment._id,
        });
      }
    }

    // Notify both sides
    await Notification.create({
      recipientUsername: appointment.patientUsername,
      message: `Your appointment on ${appointment.date} at ${appointment.time} was canceled.`,
      appointmentId: appointment._id,
    });
    await Notification.create({
      recipientUsername: appointment.therapistUsername,
      message: `Appointment on ${appointment.date} at ${appointment.time} was canceled.`,
      appointmentId: appointment._id,
    });

    return res.status(200).json({ message: 'Appointment canceled' });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error canceling appointment:', error.message);
      }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * RESCHEDULE appointment => status: "Pending",
 * Overwrite initiatorRole with reschedulerRole
 */
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason, reschedulerRole } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // 🕒 Prevent rescheduling to past time
    const now = new Date();
    const rescheduleDateTime = new Date(`${newDate} ${newTime}`);
    if (rescheduleDateTime < now) {
      return res.status(400).json({ error: "Cannot reschedule to a past time." });
    }

    appointment.date = newDate;
    appointment.time = newTime;
    appointment.status = 'Pending';
    appointment.initiatorRole = reschedulerRole; // NOW the rescheduling side is initiator
    if (reason) {
      appointment.reason = reason;
    }

    await appointment.save();

    // Notify both parties
    await Notification.create({
      recipientUsername: appointment.patientUsername,
      message: `Your appointment was rescheduled to ${newDate} at ${newTime}. Awaiting therapist approval.`,
      appointmentId: appointment._id,
    });
    await Notification.create({
      recipientUsername: appointment.therapistUsername,
      message: `Appointment rescheduled to ${newDate} at ${newTime}. Awaiting your approval.`,
      appointmentId: appointment._id,
    });

    return res.status(200).json({ message: 'Appointment rescheduled, pending acceptance' });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rescheduling appointment:', error.message);
      }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const markPastAppointmentsAsFinished = async () => {
  try {
    const now = new Date();

    const acceptedAppointments = await Appointment.find({ status: 'Accepted' });

    for (const appointment of acceptedAppointments) {
      const fullDateTimeStr = `${appointment.date} ${appointment.time}`;
      const appointmentDateTime = new Date(fullDateTimeStr);

      if (appointmentDateTime < now) {
        appointment.status = 'Finished';
        await appointment.save();
      }
    }
      } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error marking appointments as finished:", err.message);
      }
  }
};

/**
 * GET /appointments?username=...&role=...
 */
exports.getAppointmentsByUsername = async (req, res) => {
  try {
    // ✅ NEW LINE — updates statuses before continuing
    await markPastAppointmentsAsFinished();

    const { username, role } = req.query;
    if (!username || !role) {
      return res.status(400).json({ error: 'username and role are required' });
    }

    let filter = {};
    if (role === 'patient') {
      filter.patientUsername = username;
    } else if (role === 'therapist') {
      filter.therapistUsername = username;
    } else {
      return res.status(400).json({ error: 'role must be patient or therapist' });
    }

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 }).lean();

    for (let appointment of appointments) {
      try {
        const patient = await User.findOne({ username: appointment.patientUsername });
        if (patient?.info?.firstName && patient?.info?.lastName) {
          appointment.patientFullName = `${patient.info.firstName} ${patient.info.lastName}`;
        } else {
          appointment.patientFullName = appointment.patientUsername;
        }
      } catch {
        appointment.patientFullName = appointment.patientUsername;
      }

      try {
        const therapist = await User.findOne({ username: appointment.therapistUsername });
        if (therapist?.info?.firstName && therapist?.info?.lastName) {
          appointment.therapistFullName = `Dr. ${therapist.info.firstName} ${therapist.info.lastName}`;
        } else {
          appointment.therapistFullName = `Dr. ${appointment.therapistUsername}`;
        }
      } catch {
        appointment.therapistFullName = `Dr. ${appointment.therapistUsername}`;
      }
    }

    return res.status(200).json({ appointments });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching appointments:', error.message);
      }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBookedTimes = async (req, res) => {
  const { therapist, date } = req.query;

  try {
    const appointments = await Appointment.find({
      therapistUsername: therapist,
      date,
      status: { $in: ["Accepted"] }  // ✅ only block real bookings
    });
    
    const times = appointments.map(a => a.time);
    res.json({ bookedTimes: times });
      } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching booked slots:", err.message);
      }
    res.status(500).json({ error: "Server error" });
  }
};

exports.getTherapistAvailability = async (req, res) => {
  const { therapistUsername } = req.params;

  try {
    const therapist = await User.findOne({ username: therapistUsername, role: 'therapist' });

    if (!therapist || !therapist.info?.availability) {
      return res.status(404).json({ error: 'Therapist or availability not found' });
    }
    // Optionally filter by session type if provided in query
    const { sessionType } = req.query;
    let slots = [];
    if (sessionType === 'in-person') {
      slots = therapist.info.availability.inPerson || [];
    } else if (sessionType === 'online') {
      slots = therapist.info.availability.online || [];
    } else {
      slots = [
        ...(therapist.info.availability.inPerson || []),
        ...(therapist.info.availability.online || [])
      ];
    }
    return res.status(200).json({ slots });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching availability:", error.message);
      }
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateSessionNote = async (req, res) => {
  const { appointmentId } = req.params;
  const { note } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.sessionNotes = appointment.sessionNotes || [];
    appointment.sessionNotes.push({ note });

    await appointment.save();

    // Refetch to confirm what got saved
    const updated = await Appointment.findById(appointmentId);

    return res.status(200).json({ message: "Note added", appointment: updated });
      } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Save Error:", err.message);
      }
    return res.status(500).json({ error: "Server error" });
  }
};

exports.deleteSessionNote = async (req, res) => {
  const { appointmentId, noteIndex } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (!appointment.sessionNotes || appointment.sessionNotes.length <= noteIndex) {
      return res.status(400).json({ error: "Invalid note index" });
    }

    // Remove the note at the given index
    appointment.sessionNotes.splice(noteIndex, 1);
    await appointment.save();

    return res.status(200).json({ message: "Note deleted", appointment });
      } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error deleting note:", err.message);
      }
    return res.status(500).json({ error: "Server error" });
  }
};