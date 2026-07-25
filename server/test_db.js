const UserModel = require('./models/userModel');
async function run() {
  try {
    const user = await UserModel.findByEmail('admin@orgfinance.com');
    console.log("User:", user);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
run();
