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

  console.log("\n--- E2E: JOB ORDER TO OPERATION LIFECYCLE ---");

  try {
    // 1. Fetch random masters to use
    const customers = await axios.get(`${BASE_URL}/master-data/business-partners?role=CUSTOMER`, { headers });
    const customerId = customers.data.data[0]?.id || 1;
    
    // Create Job Order
    const joPayload = {
      job_order_number: `JO-TEST-${Date.now()}`,
      job_type: 'EXPORT',
      service_type_id: 1,
      customer_id: customerId,
      status: 'DRAFT',
      date: new Date().toISOString().split('T')[0]
    };
    
    let joRes;
    try {
      joRes = await axios.post(`${BASE_URL}/job-orders`, joPayload, { headers });
      console.log("PASS: Create Job Order", joRes.data.data.job_order_number);
    } catch (e) {
      console.log("FAIL: Create Job Order", e.response?.data || e.message);
      return;
    }
    
    const joId = joRes.data.data.id;
    
    // Create Operation
    const opPayload = {
      job_order_id: joId,
      operation_type: 'EXPORT',
      status: 'PLANNING',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    };
    
    let opRes;
    try {
      opRes = await axios.post(`${BASE_URL}/operations`, opPayload, { headers });
      console.log("PASS: Create Operation", opRes.data.data.operation_number);
    } catch (e) {
      console.log("FAIL: Create Operation", e.response?.data || e.message);
      return;
    }
    
    const opId = opRes.data.data.id;
    
    // Fetch available driver & vehicle
    const drivers = await axios.get(`${BASE_URL}/master-data/resources/drivers?status=AVAILABLE`, { headers });
    const vehicles = await axios.get(`${BASE_URL}/master-data/resources/vehicles?status=AVAILABLE`, { headers });
    
    const driverId = drivers.data.data[0]?.id;
    const vehicleId = vehicles.data.data[0]?.id;
    
    if (!driverId || !vehicleId) {
      console.log("SKIP: No available driver or vehicle");
      return;
    }
    
    // Assign Resource
    try {
      await axios.post(`${BASE_URL}/operations/${opId}/resources`, { driver_id: driverId, vehicle_id: vehicleId }, { headers });
      console.log("PASS: Assign Resources (Driver & Vehicle)");
    } catch (e) {
      console.log("FAIL: Assign Resources", e.response?.data || e.message);
      return;
    }
    
    // Try transitions
    const transitions = ['READY', 'STARTED', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DESTINATION', 'DELIVERED'];
    
    for (const status of transitions) {
      try {
        await axios.put(`${BASE_URL}/operations/${opId}/status`, { status }, { headers });
        console.log(`PASS: Transition to ${status}`);
      } catch (e) {
        console.log(`FAIL: Transition to ${status}`, e.response?.data || e.message);
        return;
      }
    }
    
    // Try to complete without POD
    try {
      await axios.put(`${BASE_URL}/operations/${opId}/status`, { status: 'COMPLETED' }, { headers });
      console.log(`FAIL: Completed WITHOUT POD! (Should be rejected)`);
    } catch (e) {
      if (e.response?.status === 400) {
        console.log(`PASS: Rejected completion without verified POD.`);
      } else {
        console.log(`FAIL: Rejected completion with wrong error code`, e.response?.status);
      }
    }
    
  } catch (err) {
    console.log("CRITICAL E2E ERROR:", err.message);
  }
}
runTests();
