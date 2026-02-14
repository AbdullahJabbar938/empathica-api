// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'],             // Error rate less than 10%
  },
};

// Test data
const testUser = {
  email: 'performance@test.com',
  password: 'Test123!@#',
};

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginRes = http.post('http://localhost:5000/api/auth/login', {
    email: testUser.email,
    password: testUser.password,
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  authToken = JSON.parse(loginRes.body).data.token;
  
  return { authToken };
}

export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Test endpoints
  const endpoints = [
    { method: 'GET', path: '/api/reflections' },
    { method: 'GET', path: '/api/reflections/stats' },
    { 
      method: 'POST', 
      path: '/api/reflections',
      body: JSON.stringify({
        text: 'Performance test reflection ' + Math.random(),
        emotionLabel: 'joy',
        emotionScore: 0.8,
      })
    },
    { method: 'GET', path: '/api/users/profile' },
  ];

  // Randomly select an endpoint to test
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const url = `http://localhost:5000${endpoint.path}`;
  const res = http.request(endpoint.method, url, endpoint.body, params);
  
  // Check response
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  
  sleep(1); // Wait 1 second between requests
}

export function teardown(data) {
  // Cleanup test data
  http.del('http://localhost:5000/api/users/test-cleanup', null, {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
    },
  });
}