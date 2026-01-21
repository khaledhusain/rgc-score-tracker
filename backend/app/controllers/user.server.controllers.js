const Joi = require('joi');
const users = require('../models/user.server.models');

exports.create_account = (req, res) => {
  const schema = Joi.object({
    first_name: Joi.string().trim().min(1).required(),
    last_name: Joi.string().trim().min(1).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string()
      .min(6)
      .max(30)
      .pattern(/[0-9]/)
      .pattern(/[A-Z]/)
      .pattern(/[a-z]/)
      .pattern(/[^A-Za-z0-9]/)
      .required()
  }).unknown(false);

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error_message: error.details[0].message });
  }

  const user = {
    first_name: value.first_name,
    last_name: value.last_name,
    email: value.email,
    password: value.password
  };

  users.addNewUser(user, (err, id) => {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error_message: 'Email already in use' });
      }
      console.error('SQL Error:', err.message);
      return res.status(500).json({ error_message: 'Server error' });
    }
    return res.status(201).json({ user_id: id });
  });
};

exports.login = (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error_message: error.details[0].message });
  }

  const { email, password } = req.body;

  users.authenticateUser(email, password, (err, user_id) => {
    if (err === 404) {
      return res.status(400).json({ error_message: 'Invalid email or password' });
    }
    if (err) {
      console.error('Auth error:', err);
      return res.status(500).json({ error_message: 'Authentication error' });
    }

    users.getToken(user_id, (err, token) => {
      if (err) return res.status(500).json({ error_message: 'Error checking token' });

      if (token) {
        return res.status(200).json({ user_id, session_token: token });
      }

      users.setToken(user_id, (err, newToken) => {
        if (err) return res.status(500).json({ error_message: 'Error setting token' });
        return res.status(200).json({ user_id, session_token: newToken });
      });
    });
  });
};

exports.logout = (req, res) => {
  const token = req.get('X-Authorization');

  if (!token) {
    return res.status(401).json({ error_message: 'No session token provided' });
  }

  users.removeToken(token, (err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error_message: 'Error logging out' });
    }
    return res.status(200).json({ success: true });
  });
};

exports.get_user_by_id = (req, res) => {
  const schema = Joi.object({
    user_id: Joi.number().integer().positive().required()
  });

  const { error, value } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ error_message: error.details[0].message });
  }

  users.getUserById(value.user_id, (err, user) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error_message: 'Server error' });
    }
    if (!user) {
      return res.status(404).json({ error_message: 'User not found' });
    }
    return res.status(200).json(user);
  });
};

// Get current authenticated user info
exports.getMyInfo = (req, res) => {
  const userId = req.authenticatedUserID;
  users.getUserById(userId, (err, user) => {
    if (err) return res.status(500).json({ error_message: 'Server error' });
    if (!user) return res.status(404).json({ error_message: 'User not found' });
    res.json(user);
  });
};