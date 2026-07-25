const axios = require('axios');
const BASE_URL = 'http://localhost:5001/api/v1';

async function runTests() {
  let token = null;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: 'admin@orgfinance.com', password: 'admin123' });
    token = loginRes.data.data.accessToken;
  } catch (err) {
    console.error("Failed to login", err.message);
    return;
  }

  console.log("\n--- PHASE 4: JOB ORDER & OPERATIONS REGRESSION ---");
  try {
    const joListRes = await axios.get(`${BASE_URL}/job-orders`, { headers: { Authorization: `Bearer ${token}` } });
    if (joListRes.status === 200 && Array.isArray(joListRes.data.data)) {
      console.log("PASS: Job Orders LIST");
    } else {
      console.log("FAIL: Job Orders LIST", joListRes.status);
    }
  } catch (err) {
    console.log("FAIL: Job Orders API", err.message);
  }
}

runTests();
