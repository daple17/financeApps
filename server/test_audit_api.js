const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5001/api/v1';
let token = null;

async function runTests() {
  console.log("--- PHASE 2 & 5: AUTHENTICATION SMOKE TEST ---");
  try {
    // 1. Invalid login
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: 'admin@orgfinance.com', password: 'wrongpassword' });
      console.log("FAIL: Invalid login succeeded (expected to fail)");
    } catch (err) {
      if (err.response && err.response.status === 401) {
         console.log("PASS: Invalid login rejected with 401");
      } else {
         console.log(`FAIL: Invalid login rejected with wrong code: ${err.response?.status}`);
      }
    }

    // 2. Valid login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: 'admin@orgfinance.com', password: 'admin123' });
    if (loginRes.data && loginRes.data.data && loginRes.data.data.accessToken) {
       token = loginRes.data.data.accessToken;
       console.log("PASS: Valid login succeeded, token received");
    } else {
       console.log("FAIL: Valid login succeeded but no token");
    }

    // 3. Protected endpoint
    const meRes = await axios.get(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (meRes.data && meRes.data.data && meRes.data.data.email === 'admin@orgfinance.com') {
       console.log("PASS: Authenticated page (me) protected and accessible");
    } else {
       console.log("FAIL: /auth/me did not return correct user");
    }
  } catch (err) {
    console.log("CRITICAL AUTH ERROR:", err.message);
    return;
  }

  console.log("\n--- PHASE 3: MASTER DATA VALIDATION ---");
  const masterDataEndpoints = [
    '/master-data/business-partners?role=CUSTOMER&status=ACTIVE',
    '/master-data/locations/countries',
    '/master-data/locations/ports',
    '/master-data/locations/warehouses',
    '/master-data/logistics/vehicle-types',
    '/master-data/logistics/container-types',
    '/master-data/logistics/cargo-units',
    '/master-data/logistics/service-types',
    '/master-data/resources/drivers',
    '/master-data/resources/vehicles'
  ];

  for (const ep of masterDataEndpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${ep}`, { headers: { Authorization: `Bearer ${token}` } });
      const isArray = Array.isArray(res.data) || Array.isArray(res.data.data);
      if (res.status === 200 && isArray) {
        console.log(`PASS: ${ep}`);
      } else {
        console.log(`FAIL: ${ep} (Status: ${res.status}, isArray: ${isArray})`);
      }
    } catch (err) {
      console.log(`FAIL: ${ep} - ${err.response?.status} ${err.message}`);
    }
  }
}

runTests();

  console.log("\n--- PHASE 4: JOB ORDER & OPERATIONS REGRESSION ---");
  try {
    // 1. Fetch Job Orders
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
