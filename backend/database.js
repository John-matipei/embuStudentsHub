// database.js (POSTGRESQL VERSION - REPLACES YOUR CURRENT FILE)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing PostgreSQL database...');

    // 1. Landlords Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS landlords (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        name VARCHAR(255),
        is_default_account BOOLEAN DEFAULT FALSE,
        password_changed BOOLEAN DEFAULT FALSE,
        login_attempts INT DEFAULT 0,
        last_login TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);

    // 2. Security Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        landlord_id INT REFERENCES landlords(id),
        action VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL
      )
    `);

    // 3. Houses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS houses (
        id VARCHAR(100) PRIMARY KEY,
        landlord_id INT NOT NULL REFERENCES landlords(id),
        title VARCHAR(255) NOT NULL,
        estate VARCHAR(100),
        type VARCHAR(50),
        rent INT,
        deposit INT,
        distance VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Vacant',
        rooms INT DEFAULT 1,
        bathrooms INT DEFAULT 1,
        water VARCHAR(50),
        electricity VARCHAR(50),
        furnished BOOLEAN DEFAULT FALSE,
        description TEXT,
        phone VARCHAR(50),
        image TEXT,
        amenities TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL
      )
    `);

    // 4. Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(100) PRIMARY KEY,
        house_id VARCHAR(100) NOT NULL REFERENCES houses(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        preferred_date DATE NOT NULL,
        preferred_time VARCHAR(50),
        message TEXT,
        student_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL
      )
    `);

    console.log('Database tables initialized successfully in PostgreSQL.');
    
    // Create default landlord if not exists
    const checkUser = await client.query('SELECT id FROM landlords WHERE email = $1', ['landlord@embu.com']);
    if (checkUser.rows.length === 0) {
      const bcrypt = require('bcrypt'); // Ensure bcrypt is installed
      const hashedPassword = await bcrypt.hash('Embu123!', 10);
      await client.query(
        'INSERT INTO landlords (email, password_hash, name, is_default_account) VALUES ($1, $2, $3, $4)',
        ['landlord@embu.com', hashedPassword, 'Default Admin', true]
      );
      console.log('Default landlord account created: landlord@embu.com / Embu123!');
    }

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };