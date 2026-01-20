const db = require('../../database');

// Create new round
exports.createRound = (userId, courseId, date, holesPlayed, callback) => {
  const query = `
    INSERT INTO rounds (user_id, course_id, date, holes_played, status, created_at)
    VALUES (?, ?, ?, ?, 'in_progress', datetime('now'))
  `;
  db.run(query, [userId, courseId, date, holesPlayed], function(err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, holes_played: holesPlayed });
  });
};

// Get all rounds for user
exports.getRoundsByUser = (userId, callback) => {
  const query = `
    SELECT r.id, r.total_score, r.date, r.status, r.holes_played, c.name as course_name
    FROM rounds r
    JOIN courses c ON r.course_id = c.id
    WHERE r.user_id = ?
    ORDER BY r.date DESC
  `;
  db.all(query, [userId], callback);
};

// Get specific round
exports.getRoundById = (roundId, callback) => {
  const query = `
    SELECT r.*, c.name as course_name
    FROM rounds r
    JOIN courses c ON r.course_id = c.id
    WHERE r.id = ?
  `;
  db.get(query, [roundId], callback);
};

// Get hole scores for round
exports.getHoleScores = (roundId, callback) => {
  const query = `
    SELECT * FROM hole_scores
    WHERE round_id = ?
    ORDER BY hole_number ASC
  `;
  db.all(query, [roundId], callback);
};

// Update hole score
exports.updateHoleScore = (roundId, holeNumber, strokes, par, putts, notes, fairwayHit, callback) => {
  const query = `
    INSERT INTO hole_scores (round_id, hole_number, strokes, par, putts, notes, fairway_hit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(round_id, hole_number) DO UPDATE SET
    strokes=excluded.strokes,
    par=excluded.par,
    putts=excluded.putts,
    notes=excluded.notes,
    fairway_hit=excluded.fairway_hit
  `;
  db.run(query, [roundId, holeNumber, strokes, par, putts, notes, fairwayHit], callback);
};

// Finalize round
exports.finalizeRound = (roundId, totalScore, notes, callback) => {
  const query = `
    UPDATE rounds SET status = 'completed', total_score = ?, notes = ?, completed_at = datetime('now')
    WHERE id = ?
  `;
  db.run(query, [totalScore, notes, roundId], callback);
};

// Delete round
exports.deleteRound = (roundId, callback) => {
  const query = `DELETE FROM rounds WHERE id = ?`;
  db.run(query, [roundId], callback);
};

// Calculate handicap for user
exports.calculateHandicap = (userId, callback) => {
  const query = `
    SELECT total_score, holes_played FROM rounds
    WHERE user_id = ? AND status = 'completed'
    ORDER BY date DESC
    LIMIT 10
  `;
  
  db.all(query, [userId], (err, rounds) => {
    if (err) return callback(err);
    
    if (!rounds || rounds.length === 0) {
      return callback(null, { handicap: 0, roundsCount: 0 });
    }

    let totalScore = 0;
    let totalHoles = 0;

    rounds.forEach(round => {
      totalScore += round.total_score;
      totalHoles += round.holes_played;
    });

    const avgScore = totalScore / rounds.length;
    const coursePar = totalHoles / rounds.length;
    const handicap = (avgScore - coursePar) * 0.96;

    callback(null, { handicap: handicap.toFixed(2), roundsCount: rounds.length });
  });
};

exports.getUserStats = (userId, days, callback) => {
    // days = 30, 90, or 9999 (All Time)
    const query = `
        SELECT r.id, r.total_score, r.date, r.holes_played, r.status, t.name as tee_name,
               (SELECT SUM(putts) FROM hole_scores WHERE round_id = r.id) as total_putts
        FROM rounds r
        LEFT JOIN tees t ON r.tee_id = t.id
        WHERE r.user_id = ? 
        AND r.status = 'completed'
        AND r.date >= date('now', '-' || ? || ' days')
        ORDER BY r.date DESC
    `;

    db.all(query, [userId, days], callback);
};