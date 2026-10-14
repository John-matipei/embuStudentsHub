const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'embu_homes',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false
});

// Initialize database tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Landlords table - only ONE TIMESTAMP with CURRENT_TIMESTAMP
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS landlords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        name VARCHAR(255),
        is_default_account TINYINT(1) DEFAULT 0,
        password_changed TINYINT(1) DEFAULT 0,
        login_attempts INT DEFAULT 0,
        last_login TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);
    
    // Security logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        landlord_id INT,
        action VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success TINYINT(1),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL
      )
    `);
    
    // Houses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS houses (
        id VARCHAR(100) PRIMARY KEY,
        landlord_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        estate VARCHAR(100),
        type VARCHAR(50),
        rent INT,
        deposit INT,
        distance VARCHAR(50),
        status ENUM('Vacant', 'Occupied') DEFAULT 'Vacant',
        rooms INT DEFAULT 1,
        bathrooms INT DEFAULT 1,
        water VARCHAR(50),
        electricity VARCHAR(50),
        furnished TINYINT(1) DEFAULT 0,
        description TEXT,
        phone VARCHAR(50),
        image LONGTEXT,
        amenities TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL
      )
    `);
    
    // Bookings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(100) PRIMARY KEY,
        house_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        preferred_date DATE NOT NULL,
        preferred_time VARCHAR(50),
        message TEXT,
        student_id VARCHAR(100),
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL
      )
    `);
    
    console.log('Database tables initialized successfully');
    connection.release();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = { pool, initDatabase };