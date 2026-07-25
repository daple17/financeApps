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
  
  const headers = { Authorization: `Bearer ${token}` };
  
  const endpoints = [
    '/coa',
    '/transactions',
    '/approvals/pending',
    '/budgets',
    '/reports/dashboard-summary',
    '/users',
    '/roles'
  ];

  console.log("\n--- PHASE 6: FINANCE & ADMIN REGRESSION ---");
  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${ep}`, { headers });
      console.log(`PASS: ${ep}`);
    } catch (err) {
      console.log(`FAIL: ${ep}`, err.response?.data || err.message);
    }
  }
}
runTests();
