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
  // Added fairwayHit
  const { holeNumber, strokes, par, putts, notes, fairwayHit } = req.body; 

  if (!holeNumber || strokes === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  Round.updateHoleScore(roundId, holeNumber, strokes, par, putts, notes, fairwayHit, (err) => {
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

// DEBUG: Generate Mock Rounds
exports.generateMockRounds = (req, res) => {
    const userId = req.authenticatedUserID;
    const db = require('../../database');
    const { count = 5 } = req.body;

    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const tees = [1, 2, 3, 4, 5]; 

    let completed = 0;

    for (let i = 0; i < count; i++) {
        const daysAgo = getRandomInt(0, 90);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];
        
        const courseId = 1;
        const teeId = tees[getRandomInt(0, 4)];
        
        // 50% chance of 9 holes
        const is9Holes = Math.random() > 0.5;
        const holesPlayed = is9Holes ? 9 : 18;
        
        // Score: 36-55 for 9 holes, 72-105 for 18
        const totalScore = is9Holes ? getRandomInt(36, 55) : getRandomInt(72, 105);
        
        db.run(`INSERT INTO rounds (user_id, course_id, tee_id, date, holes_played, total_score, status, completed_at) 
                VALUES (?, ?, ?, ?, ?, ?, 'completed', datetime('now'))`, 
                [userId, courseId, teeId, dateStr, holesPlayed, totalScore], function(err) {
            
            const roundId = this.lastID;
            
            // Just generate scores to match totals
            let currentScore = 0;
            const loopHoles = holesPlayed;
            
            for(let h=1; h<=loopHoles; h++) {
                // ... same score generation logic, simplified ...
                let strokes = 4 + getRandomInt(-1, 1);
                if (h === loopHoles) strokes = totalScore - currentScore; // Force match total
                if (strokes < 1) strokes = 3; // Safety check
                
                db.run(`INSERT INTO hole_scores (round_id, hole_number, strokes, putts, par) VALUES (?, ?, ?, ?, ?)`,
                    [roundId, h, strokes, getRandomInt(1,2), 4]);
                
                currentScore += strokes;
            }
            
            completed++;
            if (completed === count) res.json({ message: `Generated ${count} rounds` });
        });
    }
};

exports.getDashboardStats = (req, res) => {
    const userId = req.authenticatedUserID;
    const days = req.query.days || 30; // Default 30

    Round.getUserStats(userId, days, (err, rounds) => {
        if (err) return res.status(500).json({ error: err.message });

        const count = rounds.length;
        if (count === 0) return res.json({ avgScore: 0, avgPutts: 0, rounds: [] });

        const totalScore = rounds.reduce((sum, r) => sum + (r.total_score || 0), 0);
        const totalPutts = rounds.reduce((sum, r) => sum + (r.total_putts || 0), 0);

        res.json({
            avgScore: (totalScore / count).toFixed(1),
            avgPutts: (totalPutts / count).toFixed(1),
            totalRounds: count,
            rounds: rounds // Return rounds for the graph/list
        });
    });
};