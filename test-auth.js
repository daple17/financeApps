const db = require('./server/config/db');
async function test() {
  const [users] = await db.query('SELECT * FROM users WHERE username = "superadmin"');
  if (users.length > 0) {
    const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [users[0].role_id]);
    console.log(roles[0]);
  }
  process.exit();
}
test();
