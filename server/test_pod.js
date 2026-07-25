const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5001/api/v1';

async function runTest() {
  let token;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: 'admin@orgfinance.com', password: 'admin123' });
    token = loginRes.data.data.accessToken;
  } catch (err) {
    console.error("Login failed", err.message);
    return;
  }
  
  const headers = { Authorization: `Bearer ${token}` };
  const opId = 5;

  try {
    console.log("--- PHASE 5: POD & COMPLETION ---");
    
    const form = new FormData();
    form.append('file', fs.createReadStream("/Users/macbook/financeApps/server/test.pdf"));
    form.append('recipient_name', 'Testing Recipient');
    form.append('recipient_company', 'Test Corp');
    form.append('delivery_date', '2026-07-25');
    form.append('delivery_time', '10:00');
    form.append('received_condition', 'GOOD');
    
    // Submit POD
    await axios.post(`${BASE_URL}/operations/${opId}/pod`, form, { headers: { ...headers, ...form.getHeaders() } });
    console.log("PASS: POD Submitted successfully");
    
    // Verify POD
    await axios.put(`${BASE_URL}/operations/${opId}/pod/verify`, { action: 'VERIFY' }, { headers });
    console.log("PASS: POD Verified");
    
    // Complete Operation
    await axios.put(`${BASE_URL}/operations/${opId}/status`, { status: 'COMPLETED' }, { headers });
    console.log("PASS: Operation Completed successfully after POD verification");
    
  } catch (err) {
    console.log("FAIL: POD / Completion API", err.response?.data || err.message);
  }
}
runTest();
