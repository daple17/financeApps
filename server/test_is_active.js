const UserModel = require('./models/userModel');
async function test() {
  const user = await UserModel.findByEmail('admin@orgfinance.com');
  console.log('is_active:', user.is_active, 'type:', typeof user.is_active);
}
test().catch(console.error);
