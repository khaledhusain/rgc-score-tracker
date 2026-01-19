const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = 'db.sqlite';

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if(err){
        console.log(err.message);
        throw err;
    }else{
        console.log('Connected to SQLite database.');

        db.run(`CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name text,
                last_name text,
                email text UNIQUE,
                password text,
                salt text,
                session_token text,
                CONSTRAINT email_unique UNIQUE (email)
            )`, (err) => {
                if(err) console.log('Users table already exists');
                else console.log('Users table created');
            }
        );

        db.run(`CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT,
                holes INTEGER DEFAULT 18,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if(err) console.log('Courses table already exists');
                else console.log('Courses table created');
            }
        );

        db.run(`CREATE TABLE IF NOT EXISTS rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                date DATE NOT NULL,
                holes_played INTEGER NOT NULL DEFAULT 18,
                total_score INTEGER,
                notes TEXT,
                status TEXT DEFAULT 'in_progress',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY(user_id) REFERENCES users(user_id),
                FOREIGN KEY(course_id) REFERENCES courses(id)
            )`, (err) => {
                if(err) console.log('Rounds table already exists');
                else console.log('Rounds table created');
            }
        );

        db.run(`CREATE TABLE IF NOT EXISTS hole_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                round_id INTEGER NOT NULL,
                hole_number INTEGER NOT NULL,
                strokes INTEGER,
                par INTEGER,
                FOREIGN KEY(round_id) REFERENCES rounds(id),
                UNIQUE(round_id, hole_number)
            )`, (err) => {
                if(err) console.log('Hole_scores table already exists');
                else console.log('Hole_scores table created');
            }
        );

        db.run(`INSERT OR IGNORE INTO courses (name, location, holes)
                VALUES ('Royal Golf Club Bahrain', 'Bahrain', 18)`, (err) => {
                if(err) console.log('Courses already seeded');
                else console.log('Courses seeded');
            }
        );
    }
});

module.exports = db;