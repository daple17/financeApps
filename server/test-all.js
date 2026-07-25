const http = require('http');

const endpoints = [
  '/api/v1/master-data/business-partners?role=CUSTOMER&status=ACTIVE',
  '/api/v1/master-data/logistics/service-types?status=ACTIVE',
  '/api/v1/master-data/logistics/cargo-units?status=ACTIVE',
  '/api/v1/master-data/logistics/vehicle-types?status=ACTIVE',
  '/api/v1/master-data/logistics/container-types?status=ACTIVE',
  '/api/v1/master-data/locations/ports?status=ACTIVE',
  '/api/v1/master-data/locations/warehouses?status=ACTIVE'
];

async function testAuth() {
  const data = JSON.stringify({ email: 'admin@orgfinance.com', password: 'password123' });
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body).data.accessToken));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testEndpoints(token) {
  for (const path of endpoints) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    await new Promise((resolve, reject) => {
      const req = http.request(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`[${res.statusCode}] ${path}`);
          if (res.statusCode !== 200) {
             console.log(`Error Response: ${body}`);
          } else {
             const json = JSON.parse(body);
             console.log(`Data Type: ${Array.isArray(json) ? 'Array' : typeof json}`);
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.end();
    });
  }
}

testAuth().then(testEndpoints).catch(console.error);
