const roundController = require('../controllers/round.server.controllers');
const authenticate = require('../lib/authentication');

module.exports = function(app) {
  // Create new round
  app.post('/rounds', authenticate, roundController.createRound);

  // Get all rounds for user
  app.get('/rounds', authenticate, roundController.getRounds);

  // Get specific round with hole scores
  app.get('/rounds/:roundId', authenticate, roundController.getRound);

  // Update hole score during play
  app.patch('/rounds/:roundId/hole/:holeNumber', authenticate, roundController.updateHoleScore);

  // Finalize round with score and notes
  app.post('/rounds/:roundId/finalize', authenticate, roundController.finalizeRound);

  // Delete round
  app.delete('/rounds/:roundId', authenticate, roundController.deleteRound);

  // Get user handicap
  app.get('/my/handicap', authenticate, roundController.getHandicap);
};