import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Validates phone number for any country using libphonenumber-js
 * @param {string} phone - Phone number to validate
 * @param {string|object} country - Country code (e.g., 'US', 'PK', 'NO') or country object from PhoneInput
 * @returns {object} - { isValid: boolean, error: string|null, formattedNumber: string|null }
 */
export const validatePhoneNumber = (phone, country) => {
  // Handle empty phone
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: "Phone number is required",
      formattedNumber: null
    };
  }

  try {
    // Extract country code from PhoneInput country object
    // PhoneInput passes country as an object with iso2, dialCode, etc.
    let countryCode;
    if (typeof country === 'object' && country !== null) {
      countryCode = country.iso2 || country.countryCode;
    } else {
      countryCode = country;
    }
    
    if (!countryCode) {
      return {
        isValid: false,
        error: "Please select a country",
        formattedNumber: null
      };
    }

    // Ensure countryCode is a string
    const countryCodeStr = String(countryCode).toUpperCase();

    // Add + prefix if not present
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Parse the phone number - let libphonenumber-js detect the country from the phone number itself
    const phoneNumber = parsePhoneNumberFromString(phoneWithPlus);
    
    if (!phoneNumber) {
      return {
        isValid: false,
        error: "Invalid phone number format",
        formattedNumber: null
      };
    }

    // Check if the number is valid
    if (!phoneNumber.isValid()) {
      // Fallback validation for cases where libphonenumber-js is too strict
      // Check if the number has the correct country calling code and reasonable length
      const nationalNumber = phoneNumber.nationalNumber;
      const cleanNumber = nationalNumber.replace(/\D/g, '');
      
      // Get expected country calling code for the selected country
      const countryCallingCodes = {
        'NO': '47', 'US': '1', 'CA': '1', 'GB': '44', 'PK': '92', 'AU': '61',
        'DE': '49', 'FR': '33', 'IN': '91', 'BR': '55', 'IT': '39', 'ES': '34',
        'NL': '31', 'SE': '46', 'DK': '45', 'FI': '358', 'CH': '41', 'AT': '43',
        'BE': '32', 'IE': '353', 'NZ': '64', 'ZA': '27', 'MX': '52', 'AR': '54',
        'CL': '56', 'CO': '57', 'PE': '51', 'VE': '58', 'EG': '20', 'SA': '966',
        'AE': '971', 'QA': '974', 'KW': '965', 'BH': '973', 'OM': '968',
        'JO': '962', 'LB': '961', 'SY': '963', 'IQ': '964', 'IR': '98', 'TR': '90',
        'IL': '972', 'TH': '66', 'VN': '84', 'MY': '60', 'SG': '65', 'PH': '63',
        'ID': '62', 'JP': '81', 'KR': '82', 'CN': '86', 'TW': '886', 'HK': '852',
        'MO': '853'
      };
      
      // Country-specific length validation
      const countryLengths = {
        'US': 10,
        'CA': 10,
        'GB': [10, 11],
        'NO': 8,
        'PK': 10,
        'AU': 9,
        'DE': [10, 11, 12],
        'FR': 10,
        'IN': 10,
        'BR': [10, 11],
        'IT': [9, 10],
        'ES': 9,
        'NL': 9,
        'SE': 9,
        'DK': 8,
        'FI': 9,
        'CH': 9,
        'AT': [10, 11, 12, 13],
        'BE': 9,
        'IE': 9,
        'NZ': 9,
        'ZA': 9,
        'MX': 10,
        'AR': 10,
        'CL': 9,
        'CO': 10,
        'PE': 9,
        'VE': 10,
        'EG': 10,
        'SA': 9,
        'AE': 9,
        'QA': 8,
        'KW': 8,
        'BH': 8,
        'OM': 8,
        'JO': 9,
        'LB': 8,
        'SY': 9,
        'IQ': 10,
        'IR': 10,
        'TR': 10,
        'IL': 9,
        'TH': 9,
        'VN': 10,
        'MY': 9,
        'SG': 8,
        'PH': 10,
        'ID': 9,
        'JP': 10,
        'KR': 10,
        'CN': 11,
        'TW': 9,
        'HK': 8,
        'MO': 8
      };
      
      const expectedCallingCode = countryCallingCodes[countryCodeStr];
      const hasCorrectCountryCode = expectedCallingCode && phoneNumber.countryCallingCode === expectedCallingCode;
      
      // Check country-specific length requirements
      const expectedLength = countryLengths[countryCodeStr];
      let hasCorrectLength = false;
      
      if (expectedLength) {
        if (Array.isArray(expectedLength)) {
          hasCorrectLength = expectedLength.includes(cleanNumber.length);
        } else {
          hasCorrectLength = cleanNumber.length === expectedLength;
        }
      } else {
        // If no specific length requirement, use general range (7-12 digits)
        hasCorrectLength = cleanNumber.length >= 7 && cleanNumber.length <= 12;
      }
      
      // If it has the correct country code and length, accept it
      if (hasCorrectCountryCode && hasCorrectLength) {
        const formattedNumber = phoneNumber.format('E.164');
        return {
          isValid: true,
          error: null,
          formattedNumber: formattedNumber
        };
      }
      
      return {
        isValid: false,
        error: "Phone number is not valid",
        formattedNumber: null
      };
    }

    // Verify the country matches what was selected
    const detectedCountry = phoneNumber.country;
    
    if (detectedCountry && detectedCountry.toUpperCase() !== countryCodeStr) {
      return {
        isValid: false,
        error: `Phone number does not match the selected country (${countryCodeStr})`,
        formattedNumber: null
      };
    }

    // Get the formatted international number
    const formattedNumber = phoneNumber.format('E.164'); // +1234567890 format

    // Additional validation for specific countries with known length requirements
    const nationalNumber = phoneNumber.nationalNumber;
    const cleanNumber = nationalNumber.replace(/\D/g, '');
    
    // Country-specific length validation
    const countryLengths = {
      'US': 10,
      'CA': 10,
      'GB': [10, 11],
      'NO': 8,
      'PK': 10,
      'AU': 9,
      'DE': [10, 11, 12],
      'FR': 10,
      'IN': 10,
      'BR': [10, 11],
      'IT': [9, 10],
      'ES': 9,
      'NL': 9,
      'SE': 9,
      'DK': 8,
      'FI': 9,
      'CH': 9,
      'AT': [10, 11, 12, 13],
      'BE': 9,
      'IE': 9,
      'NZ': 9,
      'ZA': 9,
      'MX': 10,
      'AR': 10,
      'CL': 9,
      'CO': 10,
      'PE': 9,
      'VE': 10,
      'EG': 10,
      'SA': 9,
      'AE': 9,
      'QA': 8,
      'KW': 8,
      'BH': 8,
      'OM': 8,
      'JO': 9,
      'LB': 8,
      'SY': 9,
      'IQ': 10,
      'IR': 10,
      'TR': 10,
      'IL': 9,
      'TH': 9,
      'VN': 10,
      'MY': 9,
      'SG': 8,
      'PH': 10,
      'ID': 9,
      'JP': 10,
      'KR': 10,
      'CN': 11,
      'TW': 9,
      'HK': 8,
      'MO': 8
    };

    const expectedLength = countryLengths[countryCodeStr];
    
    if (expectedLength) {
      if (Array.isArray(expectedLength)) {
        if (!expectedLength.includes(cleanNumber.length)) {
          return {
            isValid: false,
            error: `Phone number must be ${expectedLength.join(' or ')} digits for ${countryCodeStr}`,
            formattedNumber: null
          };
        }
      } else {
        if (cleanNumber.length !== expectedLength) {
          return {
            isValid: false,
            error: `Phone number must be exactly ${expectedLength} digits for ${countryCodeStr}`,
            formattedNumber: null
          };
        }
      }
    }

    return {
      isValid: true,
      error: null,
      formattedNumber: formattedNumber
    };

  } catch (error) {
    console.error('Phone validation error:', error);
    return {
      isValid: false,
      error: "Invalid phone number format",
      formattedNumber: null
    };
  }
};

/**
 * Formats phone number for display
 * @param {string} phone - Phone number to format
 * @param {string|object} country - Country code or country object
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone, country) => {
  if (!phone) return '';
  
  try {
    const countryCode = country?.iso2 || country;
    if (!countryCode) return phone;
    
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumberFromString(phoneWithPlus, countryCode);
    
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('INTERNATIONAL'); // +1 234 567 8900 format
    }
    
    return phone;
  } catch (error) {
    return phone;
  }
};

/**
 * Gets country code from phone number
 * @param {string} phone - Phone number
 * @returns {string|null} - Country code or null
 */
export const getCountryFromPhone = (phone) => {
  if (!phone) return null;
  
  try {
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumberFromString(phoneWithPlus);
    
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.country;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Default country for PhoneInput component
 */
export const DEFAULT_COUNTRY = 'US'; 