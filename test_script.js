const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5001/api/v1';

async function runTest() {
  try {
    // Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@orgfinance.com',
      password: 'admin123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in successfully');

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Create a business partner (Vendor)
    const vendor = await axios.post(`${API_URL}/master-data/business-partners`, {
      partner_code: `VND-TEST-${Date.now()}`,
      partner_name: 'Test Vendor',
      partner_type: 'COMPANY',
      status: 'ACTIVE'
    }, { headers });
    const vendorId = vendor.data.data.id;
    console.log('Vendor created:', vendorId);

    // 2. Create Vehicle Type
    const vt = await axios.post(`${API_URL}/master-data/logistics/vehicle-types`, {
      code: `VT-TEST-${Date.now()}`,
      name: 'Test Truck',
      status: 'ACTIVE'
    }, { headers });
    const vtId = vt.data.data.id;

    // 3. Create Driver
    const driver = await axios.post(`${API_URL}/master-data/resources/drivers`, {
      driver_code: `DRV-TEST-${Date.now()}`,
      driver_name: 'Test Driver',
      license_type: 'B1 Umum',
      employment_type: 'INTERNAL',
      status: 'ACTIVE'
    }, { headers });
    const driverId = driver.data.data.id;
    console.log('Driver created:', driverId);

    // 4. Create Vehicle
    const vehicle = await axios.post(`${API_URL}/master-data/resources/vehicles`, {
      vehicle_code: `VEH-TEST-${Date.now()}`,
      plate_number: `B ${Date.now()} TEST`,
      vehicle_type_id: vtId,
      ownership_type: 'VENDOR',
      vendor_id: vendorId,
      status: 'AVAILABLE'
    }, { headers });
    const vehicleId = vehicle.data.data.id;
    console.log('Vehicle created:', vehicleId);

    // 5. Create Customer
    const cust = await axios.post(`${API_URL}/master-data/business-partners`, {
      partner_code: `CUST-TEST-${Date.now()}`,
      partner_name: 'Test Customer',
      partner_type: 'COMPANY',
      status: 'ACTIVE'
    }, { headers });
    const custId = cust.data.data.id;

    // 6. Create Job Order
    const jo = await axios.post(`${API_URL}/job-orders`, {
      job_order_type: 'TRUCKING',
      customer_id: custId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: 'Jakarta',
      delivery_location: 'Bandung',
      service_type: 'FCL',
      status: 'DRAFT',
      created_by: 1
    }, { headers });
    const joId = jo.data.data.id;
    
    // Confirmed JO
    await axios.put(`${API_URL}/job-orders/${joId}/status`, {
      status: 'CONFIRMED',
      user_id: 1
    }, { headers });

    // 7. Create Operation
    const op = await axios.post(`${API_URL}/operations`, {
      job_order_id: joId,
      operation_date: new Date().toISOString().split('T')[0],
      created_by: 1
    }, { headers });
    const opId = op.data.data.id;
    console.log('Operation created:', opId);

    // 8. Assign Driver + Vehicle
    await axios.post(`${API_URL}/operations/${opId}/assignment`, {
      driver_id: driverId,
      vehicle_id: vehicleId,
      assigned_by: 1
    }, { headers });
    console.log('Resource assigned');

    // Verify status
    const opAssignment = await axios.get(`${API_URL}/operations/${opId}/assignment`, { headers });
    assert(opAssignment.data.data.driver_id === driverId);
    
    const driverCheck = await axios.get(`${API_URL}/master-data/resources/drivers/${driverId}`, { headers });
    assert(driverCheck.data.data.availability === 'ASSIGNED');
    console.log('Driver status verified as ASSIGNED');

    const vehicleCheck = await axios.get(`${API_URL}/master-data/resources/vehicles/${vehicleId}`, { headers });
    assert(vehicleCheck.data.data.status === 'ASSIGNED');
    console.log('Vehicle status verified as ASSIGNED');

    // Double Assignment Check for Driver
    console.log('Testing Double Assignment Check for Driver...');
    let doubleDriverFailed = false;
    try {
        const op2 = await axios.post(`${API_URL}/operations`, {
          job_order_id: joId,
          operation_date: new Date().toISOString().split('T')[0],
          created_by: 1
        }, { headers });
        const opId2 = op2.data.data.id;
        
        // Let's create another vehicle for second operation so vehicle doesn't conflict
        const vehicle2 = await axios.post(`${API_URL}/master-data/resources/vehicles`, {
          vehicle_code: `VEH-TEST-${Date.now()+1}`,
          plate_number: `B ${Date.now()+1} TEST`,
          vehicle_type_id: vtId,
          ownership_type: 'COMPANY_OWNED',
          status: 'AVAILABLE'
        }, { headers });

        await axios.post(`${API_URL}/operations/${opId2}/assignment`, {
          driver_id: driverId, // use the same driver
          vehicle_id: vehicle2.data.data.id,
          assigned_by: 1
        }, { headers });
        console.error('ERROR: Double assignment for driver succeeded, it should have failed!');
    } catch(err) {
        if(err.response && err.response.data.message.includes('Driver is currently assigned')) {
            console.log('Double Assignment Check Passed (Driver was blocked)');
        } else {
            console.error('Unexpected error during double assignment check:', err.response ? err.response.data : err.message);
        }
    }

    // 9. Release Assignment
    await axios.post(`${API_URL}/operations/${opId}/assignment/release`, {
      released_by: 1
    }, { headers });
    console.log('Resource released');

    // Verify released status
    const driverCheck2 = await axios.get(`${API_URL}/master-data/resources/drivers/${driverId}`, { headers });
    assert(driverCheck2.data.data.availability === 'AVAILABLE');
    console.log('Driver status verified as AVAILABLE');

    const vehicleCheck2 = await axios.get(`${API_URL}/master-data/resources/vehicles/${vehicleId}`, { headers });
    assert(vehicleCheck2.data.data.status === 'AVAILABLE');
    console.log('Vehicle status verified as AVAILABLE');

    console.log('End-to-End Test Passed!');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}
runTest();
