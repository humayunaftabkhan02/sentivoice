// controllers/therapistController.js
const Appointment = require('../models/appointmentModel');
const User = require('../models/dataModel');

/**
 * GET /api/therapist/:therapistUsername/patients
 * Returns a list of distinct patient usernames who have appointments with this therapist,
 * along with basic user info for each patient.
 */
exports.getTherapistPatients = async (req, res) => {
  try {
    const { therapistUsername } = req.params;

    // Find all appointments for this therapist
    const appointments = await Appointment.find({ therapistUsername }).select('patientUsername');

    // Extract distinct patient usernames
    const patientUsernames = [...new Set(appointments.map(a => a.patientUsername))];

    // Fetch those users from DB
    const patients = await User.find({
      username: { $in: patientUsernames },
      role: 'patient'
    }).select('-password'); // omit password

    return res.status(200).json({ patients });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching therapist patients:", error.message);
      }
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PUT /api/therapist/manage-patient/:patientUsername
 * Updates the patient's info fields (age, gender, diagnosis, contact).
 */
exports.updatePatientInfo = async (req, res) => {
  try {
    const { patientUsername } = req.params;
    const { diagnosis, pastSessionSummary, therapyPlan } = req.body;

    console.log('🔍 Debug - Received data:', {
      patientUsername,
      diagnosis: diagnosis ? 'present' : 'missing',
      pastSessionSummary: pastSessionSummary ? 'present' : 'missing',
      therapyPlan: therapyPlan ? `array with ${therapyPlan.length} items` : 'missing',
      therapyPlanDetails: therapyPlan
    });

    console.log('🔍 Full request body:', req.body);
    console.log('🔍 Request headers:', req.headers);

    // Validate incoming data
    if (therapyPlan && !Array.isArray(therapyPlan)) {
      console.log('❌ Invalid therapyPlan format:', typeof therapyPlan);
      return res.status(400).json({ error: 'Therapy plan must be an array' });
    }

    if (pastSessionSummary && typeof pastSessionSummary !== 'object') {
      console.log('❌ Invalid pastSessionSummary format:', typeof pastSessionSummary);
      return res.status(400).json({ error: 'Past session summary must be an object' });
    }

    // Find the patient by username
    const patient = await User.findOne({ username: patientUsername, role: 'patient' });
    if (!patient) {
      console.log('❌ Patient not found:', patientUsername);
      return res.status(404).json({ error: 'Patient not found or not a patient' });
    }

    console.log('✅ Patient found:', patient.username);
    console.log('🔍 Current patient info:', {
      hasInfo: !!patient.info,
      infoKeys: patient.info ? Object.keys(patient.info) : [],
      emergencyContact: patient.info?.emergencyContact,
      emergencyContactType: typeof patient.info?.emergencyContact,
      therapyPlan: patient.info?.therapyPlan
    });

    // Update the patient's info - directly set fields instead of spreading
    if (diagnosis !== undefined) {
      patient.info.diagnosis = diagnosis;
    }
    
    if (pastSessionSummary) {
      patient.info.pastSessionSummary = {
        ...patient.info?.pastSessionSummary,
        ...pastSessionSummary,
        // Ensure timestamp is set if we have new data
        timestamp: (pastSessionSummary.emotion || pastSessionSummary.note) ? 
          (pastSessionSummary.timestamp ? new Date(pastSessionSummary.timestamp) : new Date()) : 
          patient.info?.pastSessionSummary?.timestamp
      };
    }
    
    if (therapyPlan) {
      // If therapyPlan is an array of objects with id, step, timestamp, update only changed/new steps
      const prevPlan = (patient.info.therapyPlan || []).reduce((acc, item) => {
        if (item.id) acc[item.id] = item;
        return acc;
      }, {});
      patient.info.therapyPlan = therapyPlan.map(item => {
        // If item has no id, it's new
        if (!item.id) {
          return {
            id: Math.random().toString(36).substr(2, 9),
            step: item.step || item,
            timestamp: new Date().toISOString()
          };
        }
        // If step text changed, update timestamp
        if (prevPlan[item.id] && prevPlan[item.id].step !== item.step) {
          return {
            ...item,
            timestamp: new Date().toISOString()
          };
        }
        // Otherwise, keep as is
        return {
          ...item,
          timestamp: item.timestamp || new Date().toISOString()
        };
      });
    }

    // Ensure therapyPlan is always an array
    if (!patient.info.therapyPlan) {
      patient.info.therapyPlan = [];
    }

    // Explicitly handle emergencyContact to prevent validation errors
    if (!patient.info.emergencyContact || patient.info.emergencyContact === undefined) {
      patient.info.emergencyContact = {
        name: '',
        relationship: '',
        phone: ''
      };
    }

    console.log('🔍 EmergencyContact after processing:', {
      emergencyContact: patient.info.emergencyContact,
      emergencyContactType: typeof patient.info.emergencyContact,
      hasName: !!patient.info.emergencyContact?.name,
      hasRelationship: !!patient.info.emergencyContact?.relationship,
      hasPhone: !!patient.info.emergencyContact?.phone
    });

    // Ensure pastSessionSummary is properly structured
    if (!patient.info.pastSessionSummary) {
      patient.info.pastSessionSummary = {
        emotion: '',
        note: '',
        timestamp: new Date()
      };
    }

    // Ensure arrays are properly initialized
    if (!patient.info.allergies) {
      patient.info.allergies = [];
    }
    if (!patient.info.currentMedications) {
      patient.info.currentMedications = [];
    }
    if (!patient.info.medicalConditions) {
      patient.info.medicalConditions = [];
    }

    // Remove undefined values to prevent validation errors
    Object.keys(patient.info).forEach(key => {
      if (patient.info[key] === undefined) {
        delete patient.info[key];
      }
    });

    // Validate the structure before saving
    console.log('🔍 Final updatedInfo structure:', {
      keys: Object.keys(patient.info),
      emergencyContact: patient.info.emergencyContact,
      pastSessionSummary: patient.info.pastSessionSummary,
      therapyPlan: patient.info.therapyPlan
    });

    // Validate the updated info before saving
    console.log('🔍 Validating updated info...');
    
    console.log('💾 Saving patient...');
    console.log('🔍 Patient info before save:', {
      username: patient.username,
      infoKeys: Object.keys(patient.info || {}),
      therapyPlan: patient.info?.therapyPlan,
      diagnosis: patient.info?.diagnosis,
      emergencyContact: patient.info?.emergencyContact,
      pastSessionSummary: patient.info?.pastSessionSummary
    });
    
    try {
      const savedPatient = await patient.save();
    console.log('✅ Patient saved successfully');
      console.log('🔍 Saved patient info:', {
        username: savedPatient.username,
        therapyPlan: savedPatient.info?.therapyPlan,
        diagnosis: savedPatient.info?.diagnosis
      });
      
      return res.status(200).json({ message: 'Patient info updated', patient: savedPatient });
    } catch (saveError) {
      console.error('❌ Save error:', saveError.message);
      console.error('❌ Save error name:', saveError.name);
      console.error('❌ Save error details:', saveError);
      
      // Check if it's a validation error
      if (saveError.name === 'ValidationError') {
        console.error('❌ Validation errors:', saveError.errors);
        return res.status(400).json({ 
          error: 'Validation error', 
          details: Object.keys(saveError.errors).map(key => ({
            field: key,
            message: saveError.errors[key].message
          }))
        });
      }
      
      // Check if it's a cast error
      if (saveError.name === 'CastError') {
        console.error('❌ Cast error:', saveError);
        return res.status(400).json({ 
          error: 'Data type error', 
          details: saveError.message
        });
      }
      
      throw saveError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("❌ Error updating patient info:", error.message);
    console.error("❌ Error stack:", error.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Final version of GET /therapist/:therapistUsername/patient/:patientUsername/appointments
exports.getPatientAppointments = async (req, res) => {
  const { therapistUsername, patientUsername } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  try {
    const total = await Appointment.countDocuments({
      therapistUsername,
      patientUsername
    });

    const appointments = await Appointment.find({
      therapistUsername,
      patientUsername
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // 🛠️ ADD THIS MIDDLEWARE TO ENSURE SESSION NOTES ARE SENT IN RESPONSE
    // (Nothing extra is needed here unless you're explicitly removing `sessionNotes`)
    // But ensure you're NOT using `.select()` to exclude them accidentally.

    res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      appointments
    });
      } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err.message);
      }
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};