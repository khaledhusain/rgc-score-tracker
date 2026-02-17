const roundController = require('../controllers/round.server.controllers');
const authenticate = require('../lib/authentication');

module.exports = function(app) {
  app.post('/rounds', authenticate, roundController.createRound);
  app.get('/rounds', authenticate, roundController.getRounds);
  app.get('/rounds/:roundId', authenticate, roundController.getRound);
  app.patch('/rounds/:roundId/hole/:holeNumber', authenticate, roundController.updateHoleScore);
  app.post('/rounds/:roundId/finalize', authenticate, roundController.finalizeRound);
  app.delete('/rounds/:roundId', authenticate, roundController.deleteRound);
  app.get('/my/handicap', authenticate, roundController.getHandicap);
  app.get('/course/details', authenticate, roundController.getCourseDetails);
  app.post('/debug/seed', authenticate, roundController.generateMockRounds);
  app.get('/my/stats', authenticate, roundController.getDashboardStats);
  app.get('/my/profile', authenticate, roundController.getProfile);
  app.get('/my/profile/v2', authenticate, roundController.getProfile);
};