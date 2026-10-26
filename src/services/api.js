// CRITICAL: This reads the URL from your environment variables.
// You MUST set VITE_API_URL in your frontend deployment settings.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log('API URL configured:', API_URL); // Debug log

// Store auth data (Secure Version)
export const setAuth = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  // Clear old insecure keys if they exist
  localStorage.removeItem("esh_token");
  localStorage.removeItem("esh_landlord_email");
  localStorage.removeItem("esh_landlord_session");
};

// Clear auth data (Secure Version)
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // Clear old insecure keys if they exist
  localStorage.removeItem("esh_token");
  localStorage.removeItem("esh_landlord_email");
  localStorage.removeItem("esh_landlord_session");
};

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Fetch with timeout helper
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// Fetch with authentication
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  
  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    clearAuth();
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
}

// ========== AUTH API ==========

// Login landlord
export async function loginLandlord(email, password) {
  const response = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(errorData.message);
  }
  
  const data = await response.json();
  
  // Store auth data using secure method
  setAuth(data.token, data.landlord);
  
  return data;
}

// Change password (first login)
export async function changePassword(newPassword, force = false) {
  const response = await fetchWithAuth(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword, force }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to change password' }));
    throw new Error(errorData.message);
  }
  
  return response.json();
}

// Check auth status
export async function checkAuthStatus() {
  const response = await fetchWithAuth(`${API_URL}/api/auth/me`);
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
}

// ========== HOUSES API ==========

// GET all houses (public)
export async function getHouses() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/houses`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Server error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from server');
    }
    
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Make sure the backend is running.');
    }
    throw error;
  }
}

// POST new house (requires auth)
export async function addHouse(houseData) {
  const response = await fetchWithAuth(`${API_URL}/api/houses`, {
    method: 'POST',
    body: JSON.stringify(houseData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// PUT update house (requires auth)
export async function updateHouse(id, changes) {
  const response = await fetchWithAuth(`${API_URL}/api/houses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// DELETE house (requires auth)
export async function deleteHouse(id) {
  const response = await fetchWithAuth(`${API_URL}/api/houses/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// ========== BOOKINGS API ==========

// Create booking (public)
export async function createBooking(bookingData) {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Server error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please try again later.');
    }
    throw error;
  }
}

// Get ALL bookings (requires auth - landlord only)
export async function getBookings() {
  const response = await fetchWithAuth(`${API_URL}/api/bookings`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received from server');
  }
  
  return data;
}

// Get bookings for specific house (requires auth)
export async function getBookingsForHouse(houseId) {
  const response = await fetchWithAuth(`${API_URL}/api/bookings?houseId=${houseId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Update booking status (requires auth)
export async function updateBooking(id, changes) {
  const response = await fetchWithAuth(`${API_URL}/api/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message);
  }
  
  return response.json();
}

// ========== OTHER API ==========

// Health check
export async function checkServerHealth() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    return response.json();
  } catch (error) {
    throw new Error('Server is not reachable. Please ensure the backend is running.');
  }
}

// AI Chat (public) - FIXED: Only sends the message, not history
export async function sendChatMessage(message) {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }), // Only send the message
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Server error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to AI service. Please try again later.');
    }
    throw error;
  }
}

// ========== ADMIN API (requires auth) ==========

// Get all landlords (admin)
export async function getAllLandlords() {
  const response = await fetchWithAuth(`${API_URL}/api/admin/landlords`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch landlords');
  }
  
  return response.json();
}

// Get security logs (admin)
export async function getSecurityLogs() {
  const response = await fetchWithAuth(`${API_URL}/api/admin/security-logs`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch security logs');
  }
  
  return response.json();
}