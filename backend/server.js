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




// ------------------- USERS (CRUD for tblUsers) -------------------

//  GET all users from tblUsers
app.get('/users', (req, res) => {
  const sql = 'SELECT userId, firstName, lastName, email, role FROM tblUsers';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST to create/register a new user in tblUsers
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

//DELETE a user by userId from tblUsers
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
// ------------------- COURSES CRUD (tblCourses) -------------------

// GET all courses (optional: filter by instructorId)
app.get('/courses', (req, res) => {
  const { instructorId } = req.query;
  let sql = 'SELECT * FROM tblCourses';
  const params = [];

  if (instructorId) {
    sql += ' WHERE instructorId = ?';
    params.push(instructorId);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// GET a single course by courseId
app.get('/courses/:id', (req, res) => {
  const sql = 'SELECT * FROM tblCourses WHERE courseId = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json(row);
  });
});

// POST create a new course
app.post('/courses', (req, res) => {
  const { courseName, courseCode, instructorId, term } = req.body;

  if (!courseName || !courseCode || !instructorId || !term) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO tblCourses (courseName, courseCode, instructorId, term)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [courseName, courseCode, instructorId, term], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ courseId: this.lastID });
  });
});

// PUT update a course by ID
app.put('/courses/:id', (req, res) => {
  const { courseName, courseCode, term } = req.body;
  const sql = `
    UPDATE tblCourses
    SET courseName = ?, courseCode = ?, term = ?
    WHERE courseId = ?
  `;
  db.run(sql, [courseName, courseCode, term, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json({ message: 'Course updated' });
  });
});

// DELETE a course by ID
app.delete('/courses/:id', (req, res) => {
  const sql = 'DELETE FROM tblCourses WHERE courseId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json({ message: 'Course deleted' });
  });
});

//===================Enrollment CRUD (tblEnrollments )==============================================

// GET all enrollments (tblEnrollments)
app.get('/enrollments', (req, res) => {
  const { courseId, userId } = req.query;

  let sql = 'SELECT * FROM tblEnrollments';
  const params = [];

  if (courseId) {
    sql += ' WHERE courseId = ?';
    params.push(courseId);
  } else if (userId) {
    sql += ' WHERE userId = ?';
    params.push(userId);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST create a new enrollment (tblEnrollments)
app.post('/enrollments', (req, res) => {
  const { userId, courseId, status } = req.body;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'userId and courseId are required' });
  }

  const sql = `
    INSERT INTO tblEnrollments (userId, courseId, status)
    VALUES (?, ?, ?)
  `;
  db.run(sql, [userId, courseId, status || 'enrolled'], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ enrollmentId: this.lastID });
  });
});

// DELETE an enrollment by ID (tblEnrollments)
app.delete('/enrollments/:id', (req, res) => {
  const sql = 'DELETE FROM tblEnrollments WHERE enrollmentId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Enrollment not found' });
    res.status(200).json({ message: 'Enrollment deleted' });
  });
});

//===================Group CRUD (tblCourseGroups)==============================================

// GET all groups for a course (tblCourseGroups)
app.get('/groups', (req, res) => {
  const { courseId } = req.query;

  if (!courseId) return res.status(400).json({ error: 'Missing courseId' });

  const sql = 'SELECT * FROM tblCourseGroups WHERE courseId = ?';
  db.all(sql, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST create a group for a course (tblCourseGroups)
app.post('/groups', (req, res) => {
  const { courseId, groupName } = req.body;

  if (!courseId || !groupName) {
    return res.status(400).json({ error: 'Missing courseId or groupName' });
  }

  const sql = `
    INSERT INTO tblCourseGroups (courseId, groupName)
    VALUES (?, ?)
  `;
  db.run(sql, [courseId, groupName], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ groupId: this.lastID });
  });
});

// DELETE a group by groupId (tblCourseGroups)
app.delete('/groups/:id', (req, res) => {
  const sql = 'DELETE FROM tblCourseGroups WHERE groupId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Group not found' });
    res.status(200).json({ message: 'Group deleted' });
  });
});


//===================Group Membership CRUD (tblGroupMembers) GROUP MEMBER TABLE IS WITHIN THE GROUP TABLE [THEY ARE LINKED]==============================================

// GET all members in a group (tblGroupMembers)
app.get('/group-members', (req, res) => {
  const { groupId } = req.query;

  if (!groupId) return res.status(400).json({ error: 'Missing groupId' });

  const sql = `
    SELECT gm.userId, u.firstName, u.lastName, u.email
    FROM tblGroupMembers gm
    JOIN tblUsers u ON gm.userId = u.userId
    WHERE gm.groupId = ?
  `;

  db.all(sql, [groupId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST add user to a group (tblGroupMembers)
app.post('/group-members', (req, res) => {
  const { groupId, userId } = req.body;

  if (!groupId || !userId) {
    return res.status(400).json({ error: 'Missing groupId or userId' });
  }

  const sql = `
    INSERT INTO tblGroupMembers (groupId, userId)
    VALUES (?, ?)
  `;
  db.run(sql, [groupId, userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'User added to group' });
  });
});

// DELETE a user from a group (tblGroupMembers)
app.delete('/group-members', (req, res) => {
  const { groupId, userId } = req.body;

  if (!groupId || !userId) {
    return res.status(400).json({ error: 'Missing groupId or userId' });
  }

  const sql = `
    DELETE FROM tblGroupMembers
    WHERE groupId = ? AND userId = ?
  `;
  db.run(sql, [groupId, userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Membership not found' });
    res.status(200).json({ message: 'User removed from group' });
  });
});

//===================Assessment CRUD (tblAssessments)==============================================

// GET all assessments for a course (tblAssessments)
app.get('/assessments', (req, res) => {
  const { courseId } = req.query;

  if (!courseId) return res.status(400).json({ error: 'Missing courseId' });

  const sql = 'SELECT * FROM tblAssessments WHERE courseId = ?';
  db.all(sql, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// GET a single assessment by ID (tblAssessments)
app.get('/assessments/:id', (req, res) => {
  const sql = 'SELECT * FROM tblAssessments WHERE assessmentId = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Assessment not found' });
    res.status(200).json(row);
  });
});

// POST create new assessment (tblAssessments)
app.post('/assessments', (req, res) => {
  const { courseId, name, description, startDate, endDate, createdBy } = req.body;

  if (!courseId || !name || !createdBy) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO tblAssessments (courseId, name, description, startDate, endDate, createdBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [courseId, name, description || null, startDate || null, endDate || null, createdBy];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ assessmentId: this.lastID });
  });
});

// PUT update assessment (tblAssessments)
app.put('/assessments/:id', (req, res) => {
  const { name, description, startDate, endDate } = req.body;

  const sql = `
    UPDATE tblAssessments
    SET name = ?, description = ?, startDate = ?, endDate = ?
    WHERE assessmentId = ?
  `;
  const params = [name, description, startDate, endDate, req.params.id];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Assessment not found' });
    res.status(200).json({ message: 'Assessment updated' });
  });
});

// DELETE assessment (tblAssessments)
app.delete('/assessments/:id', (req, res) => {
  const sql = 'DELETE FROM tblAssessments WHERE assessmentId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Assessment not found' });
    res.status(200).json({ message: 'Assessment deleted' });
  });
});


//===================Assessment Questions CRUD (tblAssessmentQuestions)==============================================

// GET all questions for an assessment (tblAssessmentQuestions)
app.get('/questions', (req, res) => {
  const { assessmentId } = req.query;

  if (!assessmentId) return res.status(400).json({ error: 'Missing assessmentId' });

  const sql = 'SELECT * FROM tblAssessmentQuestions WHERE assessmentId = ?';
  db.all(sql, [assessmentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST create a new question (tblAssessmentQuestions)
app.post('/questions', (req, res) => {
  const { assessmentId, questionText, questionType, optionsJson } = req.body;

  if (!assessmentId || !questionText || !questionType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO tblAssessmentQuestions (assessmentId, questionText, questionType, optionsJson)
    VALUES (?, ?, ?, ?)
  `;
  const params = [assessmentId, questionText, questionType, optionsJson || null];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ questionId: this.lastID });
  });
});

// DELETE a question (tblAssessmentQuestions)
app.delete('/questions/:id', (req, res) => {
  const sql = 'DELETE FROM tblAssessmentQuestions WHERE questionId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Question not found' });
    res.status(200).json({ message: 'Question deleted' });
  });
});
//===================Assessment Responses CRUD (tblAssessmentResponses)==============================================

// GET all responses by a reviewer for an assessment (tblAssessmentResponses)
app.get('/responses', (req, res) => {
  const { assessmentId, reviewerId } = req.query;

  if (!assessmentId || !reviewerId) {
    return res.status(400).json({ error: 'Missing assessmentId or reviewerId' });
  }

  const sql = `
    SELECT * FROM tblAssessmentResponses
    WHERE assessmentId = ? AND reviewerId = ?
  `;
  db.all(sql, [assessmentId, reviewerId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST submit a new response (tblAssessmentResponses)
app.post('/responses', (req, res) => {
  const { assessmentId, questionId, reviewerId, revieweeId, responseText } = req.body;

  if (!assessmentId || !questionId || !reviewerId || !revieweeId || responseText == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO tblAssessmentResponses
    (assessmentId, questionId, reviewerId, revieweeId, responseText)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [assessmentId, questionId, reviewerId, revieweeId, responseText];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ responseId: this.lastID });
  });
});

// DELETE a response (tblAssessmentResponses)
app.delete('/responses/:id', (req, res) => {
  const sql = 'DELETE FROM tblAssessmentResponses WHERE responseId = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Response not found' });
    res.status(200).json({ message: 'Response deleted' });
  });
});





// Start the server testing statement -delete later
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});