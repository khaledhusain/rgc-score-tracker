const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = 'db.sqlite';

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if(err){
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to SQLite database.');

        // 1. Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name text,
                last_name text,
                email text UNIQUE,
                password text,
                salt text,
                session_token text,
                CONSTRAINT email_unique UNIQUE (email)
            )`);

        // 2. Courses Table
        db.run(`CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT,
                holes INTEGER DEFAULT 18
            )`, () => {
                // Seed Course
                db.run(`INSERT OR IGNORE INTO courses (id, name, location, holes)
                        VALUES (1, 'Royal Golf Club Bahrain', 'Bahrain', 18)`);
            });

        // 3. Tees Table (Black, Gold, Blue, etc.)
        db.run(`CREATE TABLE IF NOT EXISTS tees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER,
                name TEXT,
                rating REAL,
                slope INTEGER,
                FOREIGN KEY(course_id) REFERENCES courses(id)
            )`, () => {
                // Seed Tees from your scorecard
                const tees = [
                    [1, 'Black', 75.9, 141],
                    [1, 'Gold', 73.9, 137],
                    [1, 'Blue', 72.1, 133],
                    [1, 'White', 73.6, 132],
                    [1, 'Red', 69.9, 126]
                ];
                tees.forEach(tee => {
                    db.run(`INSERT OR IGNORE INTO tees (course_id, name, rating, slope) VALUES (?, ?, ?, ?)`, tee);
                });
            });

        // 4. Hole Definitions (Static data from scorecard: Par, Index, Yardages)
        db.run(`CREATE TABLE IF NOT EXISTS hole_defs (
                course_id INTEGER,
                hole_number INTEGER,
                par INTEGER,
                handicap_index INTEGER,
                yardage_black INTEGER,
                yardage_gold INTEGER,
                yardage_blue INTEGER,
                yardage_white INTEGER,
                yardage_red INTEGER,
                PRIMARY KEY (course_id, hole_number)
            )`, () => {
                // SEED DATA FROM YOUR IMAGE
                const holes = [
                    // Hole, Par, Index, Black, Gold, Blue, White, Red
                    [1, 4, 9, 424, 403, 384, 349, 317],
                    [2, 3, 11, 213, 187, 176, 133, 99],
                    [3, 5, 7, 578, 522, 513, 489, 439],
                    [4, 4, 1, 487, 442, 424, 352, 317],
                    [5, 4, 5, 408, 385, 366, 312, 293],
                    [6, 4, 15, 402, 387, 372, 325, 298],
                    [7, 3, 17, 174, 140, 148, 114, 87],
                    [8, 4, 3, 461, 441, 419, 336, 326],
                    [9, 5, 13, 541, 517, 464, 412, 360],
                    // BACK 9
                    [10, 4, 16, 322, 308, 293, 258, 221],
                    [11, 4, 12, 353, 335, 309, 270, 223],
                    [12, 3, 18, 146, 136, 120, 109, 95],
                    [13, 5, 4, 587, 569, 550, 505, 449],
                    [14, 5, 14, 586, 540, 492, 441, 411],
                    [15, 4, 2, 474, 452, 421, 363, 333],
                    [16, 3, 10, 229, 217, 189, 150, 122],
                    [17, 4, 8, 429, 407, 382, 339, 304],
                    [18, 4, 6, 429, 411, 392, 349, 305]
                ];
                
                // Only insert if empty to avoid duplicates on restart
                db.get("SELECT count(*) as count FROM hole_defs", [], (err, row) => {
                    if (row && row.count === 0) {
                        const stmt = db.prepare(`INSERT INTO hole_defs VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`);
                        holes.forEach(h => stmt.run(h));
                        stmt.finalize();
                        console.log("Hole definitions seeded.");
                    }
                });
            });

        // 5. Rounds Table (Updated to include tee_id)
        db.run(`CREATE TABLE IF NOT EXISTS rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                tee_id INTEGER, 
                date DATE NOT NULL,
                holes_played INTEGER NOT NULL DEFAULT 18,
                total_score INTEGER,
                notes TEXT,
                status TEXT DEFAULT 'in_progress',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY(user_id) REFERENCES users(user_id),
                FOREIGN KEY(course_id) REFERENCES courses(id),
                FOREIGN KEY(tee_id) REFERENCES tees(id)
            )`);

        // 6. Hole Scores Table
        // Updated to include putts and notes
        db.run(`CREATE TABLE IF NOT EXISTS hole_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                round_id INTEGER NOT NULL,
                hole_number INTEGER NOT NULL,
                strokes INTEGER,
                putts INTEGER,
                notes TEXT,
                par INTEGER,
                FOREIGN KEY(round_id) REFERENCES rounds(id),
                UNIQUE(round_id, hole_number)
            )`, (err) => {
                if(err) console.log('Hole_scores table already exists');
                else console.log('Hole_scores table created');
            }
        );
    }
});

module.exports = db;