const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbSource = './db/platform_data.db';
const HTTP_PORT = 8000;
const db = new sqlite3.Database(dbSource);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'I am alive' });
});

// Register a new user (with password hashing)
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email.endsWith('.edu')) return res.status(400).json({ error: '.edu email required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();

  const query = `INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`;
  db.run(query, [id, name, email, hashedPassword], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ status: 'success', id });
  });
});

// Get all users
app.get('/users', (req, res) => {
  db.all('SELECT id, name, email FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// DELETE a user
app.delete('/users/:id', (req, res) => {
  const query = `DELETE FROM users WHERE id = ?`;
  db.run(query, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ status: 'success', message: 'User deleted' });
  });
});

// CRUD for tblToDoItems (like in class)
app.get('/todoitem', (req, res) => {
  db.all('SELECT * FROM tblToDoItems', [], (err, rows) => {
    if (err) return res.status(400).json({ status: 'error', message: err.message });
    res.status(200).json({ status: 'success', items: rows });
  });
});

app.post('/todoitem', (req, res) => {
  const strTaskID = uuidv4();
  const { name, duedatetime, description, status, priority, location } = req.body;

  let strStatus = status?.toLowerCase();
  let strPriority = priority?.toLowerCase();
  let strMessage = '';

  if (!name || name.length < 1) strMessage += 'Name must be at least one character. ';
  if (!description || description.length < 10) strMessage += 'Description must be at least ten characters. ';
  if (!['new', 'complete', 'pending'].includes(strStatus)) strMessage += 'Invalid status. ';
  if (!['low', 'medium', 'high'].includes(strPriority)) strMessage += 'Invalid priority. ';
  if (!location || location.length < 1) strMessage += 'Location must be at least one character. ';

  if (strMessage.length > 0) return res.status(400).json({ message: strMessage });

  const query = `INSERT INTO tblToDoItems VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [strTaskID, name, description, duedatetime, strPriority, location, strStatus];

  db.run(query, params, function (err) {
    if (err) return res.status(400).json({ status: 'error', message: err.message });
    res.status(201).json({ status: 'success', taskid: strTaskID });
  });
});

app.put('/todoitem/:taskid', (req, res) => {
  const strTaskID = req.params.taskid;
  const { name, duedatetime, description, status, priority, location } = req.body;

  let strStatus = status?.toLowerCase();
  let strPriority = priority?.toLowerCase();
  let strMessage = '';

  if (!name || name.length < 1) strMessage += 'Name must be at least one character. ';
  if (!description || description.length < 10) strMessage += 'Description must be at least ten characters. ';
  if (!['new', 'complete', 'pending'].includes(strStatus)) strMessage += 'Invalid status. ';
  if (!['low', 'medium', 'high'].includes(strPriority)) strMessage += 'Invalid priority. ';
  if (!location || location.length < 1) strMessage += 'Location must be at least one character. ';

  if (strMessage.length > 0) return res.status(400).json({ message: strMessage });

  const query = `
    UPDATE tblToDoItems
    SET Name = ?, Description = ?, DueDateTime = ?, Priority = ?, Location = ?, Status = ?
    WHERE TaskID = ?
  `;
  const params = [name, description, duedatetime, strPriority, location, strStatus, strTaskID];

  db.run(query, params, function (err) {
    if (err) return res.status(400).json({ status: 'error', message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'TaskID not found' });
    res.status(200).json({ status: 'success', message: 'Task updated successfully' });
  });
});

app.delete('/todoitem/:taskid', (req, res) => {
  const strTaskID = req.params.taskid;
  const query = `DELETE FROM tblToDoItems WHERE TaskID = ?`;

  db.run(query, [strTaskID], function (err) {
    if (err) return res.status(400).json({ status: 'error', message: err.message });
    res.status(200).json({ status: 'success', message: 'Task deleted' });
  });
});

app.listen(HTTP_PORT, () => {
  console.log('App listening on', HTTP_PORT);
});