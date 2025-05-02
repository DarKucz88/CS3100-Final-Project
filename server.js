const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 8000;

// Database connection
const dbPath = path.join(__dirname, '../db/platform_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Root check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend is running' });
});




// ------------------- USERS -------------------

// GET all users
app.get('/users', (req, res) => {
  const sql = 'SELECT userId, firstName, lastName, email, role FROM tblUsers';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST register new user
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!email.endsWith('.edu')) {
    return res.status(400).json({ error: 'Email must end with .edu' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO tblUsers (firstName, lastName, email, passwordHash, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [firstName, lastName, email, passwordHash, role];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'User created', userId: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to hash password' });
  }
});

// DELETE a user by userId
app.delete('/users/:id', (req, res) => {
  const sql = 'DELETE FROM tblUsers WHERE userId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted' });
  });
});

// ---------------------------------------------

// Start the server testing statement -delete later
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});