const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:5001/api/v1/auth/login', { username: 'admin', password: 'password123' });
    const token = login.data.data.accessToken;
    const res = await axios.get('http://localhost:5001/api/v1/master-data/business-partners', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Response data type:", Array.isArray(res.data) ? "Array" : typeof res.data);
    if (!Array.isArray(res.data)) {
      console.log("Keys:", Object.keys(res.data));
    }
  } catch (err) {
    console.error(err.message);
  }
}
test();
