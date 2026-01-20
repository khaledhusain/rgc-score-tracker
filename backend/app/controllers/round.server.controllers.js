const Round = require('../models/round.server.models');

// Create new round
exports.createRound = (req, res) => {
  const { courseId, date, holesPlayed } = req.body;
  const userId = req.authenticatedUserID;

  if (!courseId || !date || !holesPlayed) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (![9, 18].includes(holesPlayed)) {
    return res.status(400).json({ error: 'holesPlayed must be 9 or 18' });
  }

  Round.createRound(userId, courseId, date, holesPlayed, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ roundId: result.id, holesPlayed: result.holes_played });
  });
};

// Get all rounds for user
exports.getRounds = (req, res) => {
  const userId = req.authenticatedUserID;

  Round.getRoundsByUser(userId, (err, rounds) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rounds);
  });
};

// Get specific round
exports.getRound = (req, res) => {
  const { roundId } = req.params;

  Round.getRoundById(roundId, (err, round) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    Round.getHoleScores(roundId, (err, holes) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ...round, holes });
    });
  });
};

// Update hole score
exports.updateHoleScore = (req, res) => {
  const { roundId } = req.params;
  const { holeNumber, strokes, par, putts, notes } = req.body; // Added putts and notes

  if (!holeNumber || strokes === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Pass new fields to model
  Round.updateHoleScore(roundId, holeNumber, strokes, par, putts, notes, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
};

// Finalize round
exports.finalizeRound = (req, res) => {
  const { roundId } = req.params;
  const { totalScore, notes } = req.body;

  if (totalScore === undefined) {
    return res.status(400).json({ error: 'totalScore required' });
  }

  Round.finalizeRound(roundId, totalScore, notes || '', (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
};

// Delete round
exports.deleteRound = (req, res) => {
  const { roundId } = req.params;

  Round.deleteRound(roundId, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
};

// Get user handicap
exports.getHandicap = (req, res) => {
  const userId = req.authenticatedUserID;
  console.log("Handicap requested for user:", userId); // Debug line

  Round.calculateHandicap(userId, (err, handicap) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(handicap);
  });
};

exports.getCourseDetails = (req, res) => {
    const db = require('../../database');
    
    // Get Tees
    db.all("SELECT * FROM tees WHERE course_id = 1", [], (err, tees) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ tees });
    });
};