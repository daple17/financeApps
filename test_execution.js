const axios = require('axios');
const API = 'http://localhost:5000/api/v1';

async function run() {
  try {
    const login = await axios.post(`${API}/auth/login`, {
      email: 'admin@orgfinance.com',
      password: 'admin123'
    });
    const token = login.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const ops = await axios.get(`${API}/operations`);
    if (ops.data.data.length === 0) {
      console.log('No operations found to test.');
      return;
    }
    const op = ops.data.data[0];
    const id = op.id;
    console.log(`Testing operation ${op.operation_no}`);

    // Let's just try transitioning to CANCELLED to test the cancellation reason
    try {
      await axios.put(`${API}/operations/${id}/status`, {
        status: 'CANCELLED',
        cancellation_reason: 'Test cancellation'
      });
      console.log('Cancelled successfully');
    } catch (e) {
      console.log('Cancel failed:', e.response?.data);
    }
  } catch (err) {
    console.error(err.message);
  }
}
run();
