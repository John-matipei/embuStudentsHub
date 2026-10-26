require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. DATABASE CONNECTION CONFIGURATION
// ==========================================

// ==========================================
// 1. DATABASE CONNECTION CONFIGURATION
// ==========================================

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

let sslConfig = false;

// Check if running in production (Render)
const isProduction = process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production';

if (isProduction) {
  // Production (Render): Enable SSL without file verification
  // This is required for Aiven but we skip CA file verification
  sslConfig = {
    rejectUnauthorized: false
  };
  console.log('✓ Production mode: SSL enabled (rejectUnauthorized: false) for Aiven');
} else if (process.env.DB_SSL_CA && process.env.DB_SSL_CA !== '') {
  // Local development with SSL certificate file
  if (!fs.existsSync(process.env.DB_SSL_CA)) {
    console.error(`❌ CRITICAL ERROR: SSL Certificate file not found at ${process.env.DB_SSL_CA}`);
    process.exit(1);
  }
  sslConfig = { ca: fs.readFileSync(process.env.DB_SSL_CA) };
  console.log('✓ SSL Certificate loaded for local development.');
} else {
  console.log('⚠️ SSL not configured. Using standard connection (local development only).');
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3300,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'embu_homes',
  ssl: sslConfig,
  connectionLimit: 10
};

const initPool = mysql.createPool(dbConfig);

// ==========================================
// 2. AUTOMATIC TABLE CREATION LOGIC
// ==========================================
async function initDatabase() {
  console.log('Checking database schema...');
  
  try {
    await initPool.execute(`
      CREATE TABLE IF NOT EXISTS landlords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'landlord',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Landlords table ready');

    await initPool.execute(`
      CREATE TABLE IF NOT EXISTS houses (
        id VARCHAR(255) PRIMARY KEY,
        landlord_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        estate VARCHAR(255),
        type VARCHAR(50),
        rent DECIMAL(10, 2),
        deposit DECIMAL(10, 2),
        distance VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        rooms INT,
        bathrooms INT,
        description TEXT,
        phone VARCHAR(20),
        image TEXT,
        amenities JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (landlord_id) REFERENCES landlords(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Houses table ready');

    await initPool.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        house_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        preferred_date DATE,
        preferred_time VARCHAR(50),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        student_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Bookings table ready');

    await initPool.execute(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255),
        landlord_id INT,
        action VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        success INT DEFAULT 0,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (landlord_id) REFERENCES landlords(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Security Logs table ready - Updated with email field');

    // Create default admin if not exists
    await createDefaultAdmin();

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Helper: Create default admin user
async function createDefaultAdmin() {
  try {
    const [admins] = await initPool.execute('SELECT id FROM landlords WHERE email = ?', ['admin@embu.com']);
    
    if (admins.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await initPool.execute(
        'INSERT INTO landlords (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['System Administrator', 'admin@embu.com', hashedPassword, '0700000000', 'admin']
      );
      console.log('✓ Default admin created: admin@embu.com / Admin@123');
    } else {
      // Ensure role is admin
      await initPool.execute('UPDATE landlords SET role = ? WHERE email = ?', ['admin', 'admin@embu.com']);
      console.log('✓ Admin user verified');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
  }
}

// ==========================================
// 3. SERVER SETUP
// ==========================================
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true })); // ✅ Correct

const pool = mysql.createPool(dbConfig);

// ==========================================
// 4. SECURITY LOGGING FUNCTION
// ==========================================
async function logSecurityEvent(email, landlordId, action, ipAddress, success, details) {
  try {
    await pool.execute(
      `INSERT INTO security_logs (email, landlord_id, action, ip_address, success, details) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, landlordId, action, ipAddress, success, details]
    );
    console.log(`[Security Log] ${action} - Email: ${email || 'N/A'} - IP: ${ipAddress || 'N/A'} - Success: ${success}`);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// ==========================================
// 5. AUTH MIDDLEWARE
// ==========================================
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    req.landlord = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.landlord.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==========================================
// 6. AUTH ROUTES
// ==========================================

// LOGIN - Returns role for frontend routing
app.post("/api/auth/login", async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
  const { email, password } = req.body;
  
  try {
    const [landlords] = await pool.execute('SELECT * FROM landlords WHERE email = ?', [email]);
    
    if (landlords.length === 0) {
      // Log failed login attempt - user not found
      await logSecurityEvent(
        email || 'Unknown',
        null,
        'LOGIN_FAILED_USER_NOT_FOUND',
        ipAddress,
        0,
        `Login attempt with non-existent email: ${email || 'Unknown'}`
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const landlord = landlords[0];
    const validPassword = await bcrypt.compare(password, landlord.password_hash);
    
    if (!validPassword) {
      // Log failed login attempt - wrong password
      await logSecurityEvent(
        email,
        landlord.id,
        'LOGIN_FAILED_WRONG_PASSWORD',
        ipAddress,
        0,
        `Login attempt with wrong password for email: ${email}`
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        landlordId: landlord.id, 
        email: landlord.email,
        role: landlord.role || 'landlord'
      },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '24h'}
    );
    
    // Log successful login
    await logSecurityEvent(
      email,
      landlord.id,
      'LOGIN_SUCCESS',
      ipAddress,
      1,
      `Successful login for user: ${email}`
    );
    
    // Return role so frontend can route correctly
    res.json({
      message: "Login successful",
      token: token,
      landlord: {
        id: landlord.id,
        email: landlord.email,
        name: landlord.name,
        role: landlord.role || 'landlord',
        phone: landlord.phone
      },
      redirectTo: landlord.role === 'admin' ? '/admin/dashboard' : '/landlord'
  });
    
  } catch (error) {
    // Log unexpected error during login
    await logSecurityEvent(
      email || 'Unknown',
      null,
      'LOGIN_ERROR',
      ipAddress,
      0,
      `Login error: ${error.message}`
    );
    res.status(500).json({ message: error.message });
  }
});

// CHECK ROLE - Helper for frontend
app.get("/api/auth/check-role", requireAuth, async (req, res) => {
  res.json({
    role: req.landlord.role,
    isAdmin: req.landlord.role === 'admin',
    email: req.landlord.email
  });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO landlords (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, 'landlord']
    );

    res.status(201).json({ message: "Account created successfully. Please login." });
  } catch (error) {
    if (error.code === 'ER_DuplicateEntry') {
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Failed to create account: " + error.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const [landlords] = await pool.execute(
    'SELECT id, email, name, phone, role FROM landlords WHERE id = ?',
    [req.landlord.landlordId]
  );
  
  if (landlords.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({ landlord: landlords[0] });
});

// ==========================================
// 7. ADMIN ROUTES (Protected)
// ==========================================

// Get all landlords (admin only)
app.get("/api/admin/landlords", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [landlords] = await pool.execute('SELECT id, name, email, phone, role, created_at FROM landlords');
    res.json(landlords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get security logs (admin only)
app.get("/api/admin/security-logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [logs] = await pool.execute('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 500');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Promote user to admin (admin only)
app.put("/api/admin/promote/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.execute('UPDATE landlords SET role = ? WHERE id = ?', ['admin', req.params.id]);
    res.json({ message: "User promoted to admin successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all houses with landlord info (admin view)
app.get("/api/admin/houses", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [houses] = await pool.execute(`
      SELECT h.*, l.name as landlord_name, l.email as landlord_email
      FROM houses h
      JOIN landlords l ON h.landlord_id = l.id
    `);
    res.json(houses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all bookings (admin view)
app.get("/api/admin/bookings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [bookings] = await pool.execute(`
      SELECT b.*, h.title as house_title, h.estate as house_estate
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete any house (admin only)
app.delete("/api/admin/houses/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM houses WHERE id = ?', [req.params.id]);
    res.json({ message: "House deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 8. HELPER: Safe Amenities Parser
// ==========================================
function parseAmenities(amenitiesData) {
  let amenities = [];
  try {
    if (amenitiesData) {
      const parsed = JSON.parse(amenitiesData);
      if (Array.isArray(parsed)) {
        amenities = parsed;
      } else if (typeof parsed === 'string') {
        amenities = [parsed];
      }
    }
  } catch (e) {
    if (typeof amenitiesData === 'string') {
      if (amenitiesData.includes(',')) {
        amenities = amenitiesData.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        amenities = [amenitiesData.trim()];
      }
    }
  }
  return amenities;
}

// ==========================================
// 9. HOUSES ROUTES
// ==========================================

app.get("/api/houses", async (req, res) => {
  try {
    const [houses] = await pool.execute(`
      SELECT 
        h.id, h.title, h.estate, h.type, h.rent, h.deposit, 
        h.distance, h.status, h.rooms, h.bathrooms, 
        h.description, h.phone, h.image, h.amenities, 
        h.created_at, h.landlord_id,
        l.email as landlord_email, l.name as landlord_name, l.phone as landlord_phone
      FROM houses h
      INNER JOIN landlords l ON h.landlord_id = l.id
      WHERE h.status = 'available' OR h.status = 'Vacant' OR h.status = 'Available'
    `);
    
    const parsed = houses.map(h => ({
      ...h,
      amenities: parseAmenities(h.amenities),
      price: h.rent,
      landlord: h.landlord_name,
      landlordEmail: h.landlord_email,
      landlordPhone: h.landlord_phone
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error("CRITICAL ERROR in /api/houses:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

app.get("/api/my-houses", requireAuth, async (req, res) => {
  try {
    const [landlordCheck] = await pool.execute('SELECT id FROM landlords WHERE id = ?', [req.landlord.landlordId]);
    if (landlordCheck.length === 0) {
      return res.status(403).json({ message: "Landlord account not found." });
    }

    const [houses] = await pool.execute(`
      SELECT h.*, l.email as landlord_email, l.name as landlord_name, l.phone as landlord_phone
      FROM houses h
      JOIN landlords l ON h.landlord_id = l.id
      WHERE h.landlord_id = ?
    `, [req.landlord.landlordId]);
    
    const parsed = houses.map(h => ({
      ...h,
      amenities: parseAmenities(h.amenities),
      price: h.rent,
      landlord: h.landlord_name,
      landlordEmail: h.landlord_email,
      landlordPhone: h.landlord_phone
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error("CRITICAL ERROR in /api/my-houses:", error);
    res.status(500).json({ message: "Database error: " + error.message });
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
      amenities: parseAmenities(houses[0].amenities),
      price: houses[0].rent,
      landlord: houses[0].landlord_name,
      landlordEmail: houses[0].landlord_email,
      landlordPhone: houses[0].landlord_phone
    };
    
    res.json(house);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

app.post("/api/houses", requireAuth, async (req, res) => {
  try {
    const {
      title, estate, type, rent, deposit, distance,
      status, rooms, bathrooms, description, phone, image, amenities
    } = req.body;

    const houseId = `house-${Date.now()}`;
    const amenitiesJson = Array.isArray(amenities) ? JSON.stringify(amenities) : JSON.stringify([]);

    await pool.execute(
      `INSERT INTO houses (id, landlord_id, title, estate, type, rent, deposit, 
       distance, status, rooms, bathrooms, description, phone, image, amenities) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        houseId, 
        req.landlord.landlordId, 
        title || null,
        estate || null,
        type || 'Single Room',
        Number(rent) || 0,
        Number(deposit) || 0,
        distance || null,
        status || 'available',
        Number(rooms) || 1,
        Number(bathrooms) || 1,
        description || null,
        phone || null,
        image || null,
        amenitiesJson
      ]
    );
    
    res.status(201).json({
      message: "House added successfully.",
      house: { id: houseId, ...req.body }
    });
  } catch (error) {
    res.status(500)({ message: error.message });
  }
});

app.put("/api/houses/:id", requireAuth, async (req, res) => {
  try {
    const [houses] = await pool.execute('SELECT landlord_id FROM houses WHERE id = ?', [req.params.id]);
    
    if (houses.length === 0) {
      return res.status(404).json({ message: "House not found" });
    }
    
    // Allow admin to edit any house, landlord only their own
    if (houses[0].landlord_id !== req.landlord.landlordId && req.landlord.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const updates = req.body;
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (key === 'amenities') {
        fields.push(`${key} = ?`);
        values.push(Array.isArray(updates[key]) ? JSON.stringify(updates[key]) : JSON.stringify([]));
      } else {
        fields.push(`${key} = ?`);
        values.push(updates[key] !== undefined ? updates[key] : null);
      }
    });
    
    values.push(req.params.id);
    
    await pool.execute(`UPDATE houses SET ${fields.join(', ')} WHERE id = ?`, values);
    
    res.json({ message: "House updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/houses/:id", requireAuth, async (req, res) => {
  try {
    const [houses] = await pool.execute('SELECT landlord_id FROM houses WHERE id = ?', [req.params.id]);
    
    if (houses.length === 0) {
      return res.status(404).json({ message: "House not found" });
    }
    
    // Allow admin to delete any house, landlord only their own
    if (houses[0].landlord_id !== req.landlord.landlordId && req.landlord.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await pool.execute('DELETE FROM houses WHERE id = ?', [req.params.id]);
    
    res.json({ message: "House deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 10. BOOKINGS ROUTES
// ==========================================
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

app.get("/api/bookings", requireAuth, async (req, res) => {
  try {
    const { houseId } = req.query;
    const isAdmin = req.landlord.role === 'admin';

    let query;
    let params = [];

    if (isAdmin) {
      if (houseId) {
        query = `
          SELECT b.id, b.house_id, b.name, b.email, b.phone, b.preferred_date, 
            b.preferred_time, b.message, b.student_id, b.status, b.created_at,
            h.title as house_title, h.estate as house_estate, h.image as house_image, h.rent as house_rent
          FROM bookings b
          JOIN houses h ON b.house_id = h.id
          WHERE b.house_id = ?
          ORDER BY b.created_at DESC
        `;
        params = [houseId];
      } else {
        query = `
          SELECT b.id, b.house_id, b.name, b.email, b.phone, b.preferred_date, 
            b.preferred_time, b.message, b.student_id, b.status, b.created_at,
            h.title as house_title, h.estate as house_estate, h.image as house_image, h.rent as house_rent
          FROM bookings b
          JOIN houses h ON b.house_id = h.id
          ORDER BY b.created_at DESC
        `;
        params = [];
      }
    } else {
      query = `
        SELECT b.id, b.house_id, b.name, b.email, b.phone, b.preferred_date, 
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
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/bookings/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const [bookings] = await pool.execute(`
      SELECT b.id FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.id = ? AND (h.landlord_id = ? OR ? = 'admin')
    `, [req.params.id, req.landlord.landlordId, req.landlord.role]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }
    
    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    
    res.json({ message: "Booking updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 11. AI CHAT ROUTES
// ==========================================
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
    "Popular student areas include Kangaru, Baggik (closest to campus), Dallas (affordable), and Muthatari (good amenities).",
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

// ==========================================
// 12. HEALTH CHECK & STARTUP
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", service: "Embu Homes API", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Embu Students Hub backend is running!"
  });
});

async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Database connected and schema verified.`);
      console.log(`\n🔑 Admin login: admin@embu.com / Admin@123`);
      console.log(`🔒 Use /api/auth/register endpoint to create landlords.`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();