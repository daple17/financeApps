const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@orgfinance.com', password: 'admin123'
    });
    const token = loginRes.data.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('Fetching users to test token...');
    await axios.get('http://localhost:3000/api/v1/auth/me', { headers });
    console.log('Token is valid.');
    
    // Create Job Order to get a fresh operation
    console.log('Creating job order...');
    const joRes = await axios.post('http://localhost:3000/api/v1/job-orders', {
      customer_id: 1, type: 'EXPORT', date: '2026-07-25', status: 'DRAFT'
    }, { headers });
    const joId = joRes.data.data.id;
    
    // 3. Create Operation
    const opRes = await axios.post('http://localhost:3000/api/v1/operations', {
      job_order_id: joId, priority: 'HIGH', operation_date: '2026-07-25', status: 'PLANNING'
    }, { headers });
    const opId = opRes.data.data.id;
    console.log('Operation created:', opId);

    // 4. Try to Complete without POD - Should Fail
    try {
      await axios.put(`http://localhost:3000/api/v1/operations/${opId}/status`, {
        status: 'COMPLETED'
      }, { headers });
      console.log('ERROR: Completed without POD!');
    } catch (e) {
      console.log('Validation success (prevented completion):', e.response?.data?.message || e.message);
    }

    // 5. Assign resource to move forward
    await axios.post(`http://localhost:3000/api/v1/operations/${opId}/assign`, {
      driver_id: 1, vehicle_id: 1
    }, { headers });

    // 6. Transition to DELIVERED
    const states = ['READY', 'STARTED', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DESTINATION', 'DELIVERED'];
    for (const state of states) {
      await axios.put(`http://localhost:3000/api/v1/operations/${opId}/status`, {
        status: state
      }, { headers });
    }
    console.log('Operation reached DELIVERED');

    // 7. Submit POD
    fs.writeFileSync('dummy.jpg', 'dummy content');
    const form = new FormData();
    form.append('recipient_name', 'Budi');
    form.append('delivery_date', '2026-07-25');
    form.append('delivery_time', '14:00');
    form.append('received_condition', 'Good');
    form.append('file', fs.createReadStream('dummy.jpg'));
    
    const podRes = await axios.post(`http://localhost:3000/api/v1/operations/${opId}/documents/pod`, form, {
      headers: { ...headers, ...form.getHeaders() }
    });
    console.log('POD Submitted:', podRes.data.status);
    const podId = podRes.data.data.id;

    // 8. Verify POD
    await axios.put(`http://localhost:3000/api/v1/operations/${opId}/documents/pod/${podId}/verify`, {
      action: 'VERIFY'
    }, { headers });
    console.log('POD Verified');

    // 9. Complete Operation
    await axios.put(`http://localhost:3000/api/v1/operations/${opId}/status`, {
      status: 'COMPLETED'
    }, { headers });
    console.log('Operation COMPLETED successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}
test();
