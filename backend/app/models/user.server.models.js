const crypto = require('crypto');
const db = require('../../database');

// Generate salt for password hashing
exports.generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Hash password with salt
exports.hashPassword = (password, salt) => {
  return crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
};

// Add new user
exports.addNewUser = (user, callback) => {
  const salt = exports.generateSalt();
  const hashedPassword = exports.hashPassword(user.password, salt);

  const query = `
    INSERT INTO users (first_name, last_name, email, password, salt)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [user.first_name, user.last_name, user.email, hashedPassword, salt], function(err) {
    if (err) return callback(err);
    callback(null, this.lastID);
  });
};

// Authenticate user by email and password
exports.authenticateUser = (email, password, callback) => {
  const query = `SELECT user_id, password, salt FROM users WHERE email = ?`;
  
  db.get(query, [email], (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(404); // User not found

    // Verify password
    const hashedPassword = exports.hashPassword(password, user.salt);
    if (hashedPassword === user.password) {
      callback(null, user.user_id);
    } else {
      callback(404); // Password mismatch
    }
  });
};

// Generate session token
exports.generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.setToken = (user_id, callback) => {
  const token = exports.generateToken();
  const query = `UPDATE users SET session_token = ? WHERE user_id = ?`;

  db.run(query, [token, user_id], (err) => {
    if (err) return callback(err);
    callback(null, token);
  });
};

exports.getToken = (user_id, callback) => {
  const query = `SELECT session_token FROM users WHERE user_id = ?`;

  db.get(query, [user_id], (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, null);
    callback(null, user.session_token);
  });
};

exports.getIDFromToken = (token, callback) => {
  const query = `SELECT user_id FROM users WHERE session_token = ?`;

  db.get(query, [token], (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, null);
    callback(null, user.user_id);
  });
};

// Remove session token (logout)
exports.removeToken = (token, callback) => {
  const query = `UPDATE users SET session_token = NULL WHERE session_token = ?`;

  db.run(query, [token], (err) => {
    if (err) return callback(err);
    callback(null);
  });
};

exports.getUserById = (user_id, callback) => {
  const query = `
    SELECT user_id, first_name, last_name, email FROM users WHERE user_id = ?
  `;

  db.get(query, [user_id], callback);
};