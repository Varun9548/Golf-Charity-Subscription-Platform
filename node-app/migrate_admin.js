const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function migrate() {
    try {
        const hashed = await bcrypt.hash('varun123', 10);
        await pool.query(
            "INSERT INTO users (first_name, last_name, email, password, is_admin) VALUES ('Varun', 'Khandelwal', 'varunkhandelwal505050@gmail.com', ?, TRUE) ON DUPLICATE KEY UPDATE is_admin = TRUE, password = ?",
            [hashed, hashed]
        );
        console.log('Admin user seeded: varunkhandelwal505050@gmail.com / varun123');
    } catch(e) { console.error('Error inserting admin details:', e); }

    process.exit(0);
}
migrate();
