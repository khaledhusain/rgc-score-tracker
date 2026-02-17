const users = require('../controllers/user.server.controllers');
const authenticate = require('../lib/authentication');

module.exports = function(app) {
  app.post('/register', users.create_account);
  app.post('/login', users.login);
  app.post('/logout', users.logout);
  app.get('/user/:user_id', users.get_user_by_id);
  app.get('/my/info', authenticate, users.getMyInfo);
};