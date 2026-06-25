import QRCode from 'qrcode';

/**
 * Generates a Data URL for a QR Code.
 * @param {string} text - The data to encode
 * @returns {Promise<string>} - Promise resolving to base64 Data URL
 */
export async function generateQRDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR Generation failed', err);
    throw err;
  }
}

/**
 * Generates an Emergency SOS QR payload.
 * Focuses on critical vitals.
 */
export async function generateEmergencyQR(snapshot) {
  if (!snapshot || !snapshot.data) return null;
  
  const { data } = snapshot;
  
  const safeStr = (str, maxLen = 100) => {
    if (!str) return 'N/A';
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
  };

  const payload = {
    t: 'SOS',
    n: safeStr(data.full_name, 50),
    bt: safeStr(data.blood_type, 10),
    al: safeStr(data.allergies, 150),
    con: safeStr(data.medical_conditions, 150),
    cn: safeStr(data.emergency_contact_name, 50),
    cp: safeStr(data.emergency_contact_phone, 20)
  };
  
  try {
    const jsonStr = JSON.stringify(payload);
    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const pdfUrl = `${baseUrl}/api/qr/pdf?payload=${base64Str}`;
    return await generateQRDataUrl(pdfUrl);
  } catch (e) {
    console.error("SOS QR generation failed", e);
    return null;
  }
}

/**
 * Generates an Express Intake QR payload.
 * Focuses on full context for reception desk.
 */
export async function generateExpressIntakeQR(snapshot) {
  if (!snapshot || !snapshot.data) return null;
  
  const { data } = snapshot;
  
  // Helper to safely truncate strings to avoid exceeding QR code limits
  const safeStr = (str, maxLen = 100) => {
    if (!str) return 'N/A';
    const s = String(str);
    return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
  };

  const payload = {
    t: 'INTAKE', // Shorter keys to save space
    id: data.id || 'N/A',
    n: safeStr(data.full_name, 50),
    e: safeStr(data.email, 50),
    ph: safeStr(data.phone, 20),
    bt: safeStr(data.blood_type, 10),
    al: safeStr(data.allergies, 100),
    med: safeStr(data.active_medications, 200),
    con: safeStr(data.medical_conditions, 200)
  };
  
  try {
    const jsonStr = JSON.stringify(payload);
    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const pdfUrl = `${baseUrl}/api/qr/pdf?payload=${base64Str}`;
    return await generateQRDataUrl(pdfUrl);
  } catch (e) {
    console.error("Intake QR generation failed", e);
    return null;
  }
}
