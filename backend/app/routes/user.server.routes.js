const users = require('../controllers/user.server.controllers');
const authenticate = require('../lib/authentication');

module.exports = function(app) {
  // Register new user
  app.post('/register', users.create_account);

  // User login
  app.post('/login', users.login);

  // User logout
  app.post('/logout', users.logout);
  
  // Get user by ID
  app.get('/user/:user_id', users.get_user_by_id);
};