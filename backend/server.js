require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool, initDatabase } = require('./database');
const { 
  createDefaultLandlord, 
  createLandlord,
  loginLandlord, 
  changePassword, 
  verifyToken,
  getSecurityLogs,
  getAllLandlords 
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow multiple origins
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://embustudentshub-1.onrender.com',
      'https://embustudentshub.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const getClientInfo = (req) => ({
  ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  userAgent: req.headers['user-agent']
});

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.landlord = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ========== AUTH ROUTES ==========

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { ip, userAgent } = getClientInfo(req);
    
    const result = await loginLandlord(email, password, ip, userAgent);
    
    res.json({
      message: "Login successful",
      token: result.token,
      landlord: result.landlord
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { ip, userAgent } = getClientInfo(req);
    
    if (!req.landlord.needsPasswordChange && !req.body.force) {
      return res.status(400).json({ message: 'Password change not required' });
    }
    
    await changePassword(req.landlord.landlordId, newPassword, ip, userAgent);
    
    res.json({ message: "Password changed successfully. Please login again." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const [landlords] = await pool.execute(
    'SELECT id, email, name, phone, password_changed FROM landlords WHERE id = ?',
    [req.landlord.landlordId]
  );
  
  if (landlords.length === 0) {
    return res.status(404).json({ message: 'Landlord not found' });
  }
  
  res.json({
    landlord: {
      ...landlords[0],
      needsPasswordChange: !landlords[0].password_changed
    }
  });
});

// ========== ADMIN ROUTES ==========

// Create new landlord (YOU create accounts for clients)
app.post("/api/admin/landlords/create", requireAuth, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const newLandlord = await createLandlord(name, email, password, phone);

    res.status(201).json({
      message: "Landlord account created successfully",
      landlord: {
        id: newLandlord.id,
        name: newLandlord.name,
        email: newLandlord.email,
        phone: newLandlord.phone,
        password: newLandlord.password
      }
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Failed to create landlord: " + error.message });
  }
});

app.get("/api/admin/landlords", requireAuth, async (req, res) => {
  try {
    const landlords = await getAllLandlords();
    res.json(landlords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/admin/security-logs", requireAuth, async (req, res) => {
  try {
    const logs = await getSecurityLogs(null, 500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== HOUSES ==========

app.get("/api/houses", async (req, res) => {
  try {
    const [houses] = await pool.execute(`
      SELECT h.*, l.email as landlord_email, l.name as landlord_name, l.phone as landlord_phone
      FROM houses h
      JOIN landlords l ON h.landlord_id = l.id
    `);
    
    const parsed = houses.map(h => ({
      ...h,
      amenities: JSON.parse(h.amenities || '[]'),
      price: h.rent,
      landlord: h.landlord_name,
      landlordEmail: h.landlord_email,
      landlordPhone: h.landlord_phone
    }));
    
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/houses/:id", async (req, res) => {
  try {
    const [houses] = await pool.execute(`
      SELECT h.*, l.email as landlord_email, l.name as landlord_name, l.phone as landlord_phone
      FROM houses h
      JOIN landlords l ON h.landlord_id = l.id
      WHERE h.id = ?
    `, [req.params.id]);
    
    if (houses.length === 0) {
      return res.status(404).json({ message: "House not found" });
    }
    
    const house = {
      ...houses[0],
      amenities: JSON.parse(houses[0].amenities || '[]'),
      price: houses[0].rent,
      landlord: houses[0].landlord_name,
      landlordEmail: houses[0].landlord_email,
      landlordPhone: houses[0].landlord_phone
    };
    
    res.json(house);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/houses", requireAuth, async (req, res) => {
  try {
    const { title, estate, type, rent, deposit, distance, status, rooms, 
            bathrooms, water, electricity, furnished, description, 
            phone, image, amenities } = req.body;
    
    const houseId = `house-${Date.now()}`;
    
    await pool.execute(
      `INSERT INTO houses (id, landlord_id, title, estate, type, rent, deposit, 
       distance, status, rooms, bathrooms, water, electricity, furnished, 
       description, phone, image, amenities) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [houseId, req.landlord.landlordId, title, estate, type, rent, deposit,
       distance, status, rooms, bathrooms, water, electricity, furnished,
       description, phone, image, JSON.stringify(amenities || [])]
    );
    
    res.status(201).json({
      message: "House added successfully.",
      house: { id: houseId, ...req.body }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/houses/:id", requireAuth, async (req, res) => {
  try {
    const [houses] = await pool.execute(
      'SELECT landlord_id FROM houses WHERE id = ?',
      [req.params.id]
    );
    
    if (houses.length === 0) {
      return res.status(404).json({ message: "House not found" });
    }
    
    if (houses[0].landlord_id !== req.landlord.landlordId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const updates = req.body;
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (key === 'amenities') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(updates[key]));
      } else {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    values.push(req.params.id);
    
    await pool.execute(
      `UPDATE houses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: "House updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/houses/:id", requireAuth, async (req, res) => {
  try {
    const [houses] = await pool.execute(
      'SELECT landlord_id FROM houses WHERE id = ?',
      [req.params.id]
    );
    
    if (houses.length === 0) {
      return res.status(404).json({ message: "House not found" });
    }
    
    if (houses[0].landlord_id !== req.landlord.landlordId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await pool.execute('DELETE FROM houses WHERE id = ?', [req.params.id]);
    
    res.json({ message: "House deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== BOOKINGS ==========

app.post("/api/bookings", async (req, res) => {
  try {
    const { houseId, name, email, phone, preferredDate, preferredTime, message, studentId } = req.body;

    const [houses] = await pool.execute('SELECT id FROM houses WHERE id = ?', [houseId]);
    if (houses.length === 0) {
      return res.status(404).json({ message: "House not found" });
    }

    const bookingId = `booking-${Date.now()}`;

    await pool.execute(
      `INSERT INTO bookings (id, house_id, name, email, phone, preferred_date, 
       preferred_time, message, student_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [bookingId, houseId, name, email, phone, preferredDate, preferredTime, message, studentId]
    );

    res.status(201).json({
      message: "Booking request submitted successfully!",
      booking: { id: bookingId, ...req.body, status: 'pending' }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATED: This route now checks for admin privileges
app.get("/api/bookings", requireAuth, async (req, res) => {
  try {
    const { houseId } = req.query;
    
    // Check if the user is an admin
    const isAdmin = req.landlord.email === 'landlord@embu.com' || 
                    req.landlord.email === 'admin@embu.com' || 
                    req.landlord.email === 'admin@gmail.com';

    let query;
    let params = [];

    if (isAdmin) {
      // ADMIN LOGIC: Fetch ALL bookings (or filtered by houseId if provided)
      if (houseId) {
        // If admin specifically asks for bookings of a specific house
        query = `
          SELECT 
            b.id, b.house_id, b.name, b.email, b.phone, b.preferred_date, 
            b.preferred_time, b.message, b.student_id, b.status, b.created_at,
            h.title as house_title, h.estate as house_estate, h.image as house_image, h.rent as house_rent
          FROM bookings b
          JOIN houses h ON b.house_id = h.id
          WHERE b.house_id = ?
          ORDER BY b.created_at DESC
        `;
        params = [houseId];
      } else {
        // Fetch ALL bookings for admin dashboard
        query = `
          SELECT 
            b.id, b.house_id, b.name, b.email, b.phone, b.preferred_date, 
            b.preferred_time, b.message, b.student_id, b.status, b.created_at,
            h.title as house_title, h.estate as house_estate, h.image as house_image, h.rent as house_rent
          FROM bookings b
          JOIN houses h ON b.house_id = h.id
          ORDER BY b.created_at DESC
        `;
        params = [];
      }
    } else {
      // LANDlord LOGIC: Fetch ONLY bookings for their own houses
      query = `
        SELECT 
          b.id, b.house_id, b.name, b.email, b.phone, b.preferred_date, 
          b.preferred_time, b.message, b.student_id, b.status, b.created_at,
          h.title as house_title, h.estate as house_estate, h.image as house_image, h.rent as house_rent
        FROM bookings b
        JOIN houses h ON b.house_id = h.id
        WHERE h.landlord_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [req.landlord.landlordId];
      
      if (houseId) {
        query += ' AND b.house_id = ?';
        params.push(houseId);
      }
    }

    const [bookings] = await pool.execute(query, params);
    
    const formatted = bookings.map(b => ({
      id: b.id,
      houseId: b.house_id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      preferredDate: b.preferred_date,
      preferredTime: b.preferred_time,
      message: b.message,
      studentId: b.student_id,
      status: b.status,
      createdAt: b.created_at,
      houseTitle: b.house_title,
      houseEstate: b.house_estate,
      houseImage: b.house_image,
      houseRent: b.house_rent
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: "Failed to fetch bookings: " + error.message });
  }
});

app.put("/api/bookings/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const [bookings] = await pool.execute(`
      SELECT b.id FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.id = ? AND h.landlord_id = ?
    `, [req.params.id, req.landlord.landlordId]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }
    
    await pool.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    res.json({ message: "Booking updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== AI CHAT ==========

const aiResponses = {
  greeting: [
    "Hello! Welcome to Embu Student Homes. How can I help you find your perfect student accommodation today?",
    "Hi there! I'm here to help you find a great place near University of Embu. What are you looking for?",
  ],
  rent: [
    "Our listings range from KSh 4,000 to KSh 15,000 per month depending on the type and location.",
    "Rent varies by estate and house type. Kangaru and Dallas areas have options from KSh 4,000 to KSh 10,000.",
  ],
  location: [
    "We have properties in Kangaru, Dallas, Muthatari, and other areas near University of Embu.",
    "Popular student areas include Kangaru (closest to campus), Dallas (affordable), and Muthatari (good amenities).",
  ],
  booking: [
    "You can book a viewing by clicking the 'Book Viewing' button on any house listing.",
    "To book a viewing, simply go to any house page and fill out the booking form.",
  ],
  amenities: [
    "Most of our listings include water, electricity, security, and WiFi.",
    "Common amenities include 24/7 water, prepaid electricity, security, and internet access.",
  ],
  contact: [
    "You can contact landlords directly through the phone number or WhatsApp button on each listing.",
    "Each listing shows the landlord's phone number. You can call directly or use WhatsApp.",
  ],
  default: [
    "I'm not sure I understand. You can ask me about rent prices, locations, amenities, booking viewings, or how to contact landlords.",
    "Could you rephrase that? I can help you with information about houses, pricing, locations, and the booking process.",
  ],
};

function getAIResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.match(/hello|hi|hey/)) return randomResponse(aiResponses.greeting);
  if (lowerMsg.match(/rent|price|cost/)) return randomResponse(aiResponses.rent);
  if (lowerMsg.match(/location|area|estate/)) return randomResponse(aiResponses.location);
  if (lowerMsg.match(/book|viewing/)) return randomResponse(aiResponses.booking);
  if (lowerMsg.match(/amenities|water|electricity/)) return randomResponse(aiResponses.amenities);
  if (lowerMsg.match(/contact|phone/)) return randomResponse(aiResponses.contact);
  
  return randomResponse(aiResponses.default);
}

function randomResponse(responses) {
  return responses[Math.floor(Math.random * responses.length)];
}

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: "Message required" });
  
  res.json({
    message: getAIResponse(message),
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", service: "Embu Homes API", timestamp: new Date().toISOString() });
});

// Backend homepage
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Embu Students Hub backend is running!"
  });
});

async function startServer() {
  try {
    await initDatabase();
    await createDefaultLandlord();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Default login: landlord@embu.com / Embu123!`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();