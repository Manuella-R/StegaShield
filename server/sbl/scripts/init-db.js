// server/scripts/init-db.js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'database', 'stegasheild.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Initializing database...');
console.log('Database path:', dbPath);

try {
  // Create or connect to database
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Read and execute schema
  if (fs.existsSync(schemaPath)) {
    console.log('Reading schema from:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ Schema executed successfully');
  } else {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
  }

  // Check if admin user exists, if not create it with hashed password
  const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@stegasheild.com');
  
  if (!adminUser) {
    console.log('Creating default admin user...');
    // Hash the password 'admin123' synchronously
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    const insertAdmin = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, plan_id, email_verified)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertAdmin.run(
      'Admin User',
      'admin@stegasheild.com',
      passwordHash,
      'admin',
      3, // Enterprise plan
      1  // Email verified
    );
    console.log('✅ Default admin user created');
    console.log('   Email: admin@stegasheild.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change this password in production!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();
  
  console.log('✅ Database initialized successfully!');
  console.log('📊 Tables created:', tables.map(t => t.name).join(', '));
  
  db.close();
  console.log('✅ Database connection closed');
  
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
}
