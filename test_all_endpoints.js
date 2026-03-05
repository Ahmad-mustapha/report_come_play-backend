const API_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
let token = '';
let userId = '';
let fieldId = '';
let notificationId = '';

import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const log = (msg, data = null) => {
    const timestamp = new Date().toISOString();
    let output = `[${timestamp}] ${msg}\n`;
    if (data) output += JSON.stringify(data, null, 2) + '\n';
    console.log(msg);
    fs.appendFileSync('test_results.log', output);
};

async function api(endpoint, method = 'GET', body = null, authHeaders = {}) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders
        },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
        throw { response: { status: response.status, data } };
    }
    return data;
}

async function runTests() {
    fs.writeFileSync('test_results.log', '--- TEST RUN START ---\n');

    try {
        // 1. REGISTER
        log('Testing: POST /auth/register');
        const regRes = await api('/auth/register', 'POST', {
            fullName: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'REPORTER'
        });
        log('✅ Register Success');
        token = regRes.data.token;
        userId = regRes.data.user.id;

        // MANUALLY VERIFY USER IN DB
        await prisma.user.update({
            where: { id: userId },
            data: { emailVerified: true }
        });
        log('✅ Manual Verification Success');

        const authHeaders = { 'Authorization': `Bearer ${token}` };

        // 2. GET PROFILE
        log('Testing: GET /users/profile');
        const profileRes = await api('/users/profile', 'GET', null, authHeaders);
        log('✅ Get Profile Success');

        // 3. UPDATE PROFILE
        log('Testing: PUT /users/profile');
        await api('/users/profile', 'PUT', { bankName: 'GTBank', accountNumber: '0123456789' }, authHeaders);
        log('✅ Update Profile Success');

        // 4. CREATE FIELD
        log('Testing: POST /fields');
        const fieldRes = await api('/fields', 'POST', {
            name: `Arena ${Date.now()}`,
            location: 'Lagos Island',
            surfaceType: 'Artificial Turf',
            fieldSize: '5-a-side',
            images: ['http://a.com/1.jpg', 'http://a.com/2.jpg', 'http://a.com/3.jpg']
        }, authHeaders);
        log('✅ Create Field Success');
        fieldId = fieldRes.data.field.id;

        // 5. GET REPORTS
        log('Testing: GET /users/reports');
        const reportsRes = await api('/users/reports', 'GET', null, authHeaders);
        log('✅ Get Reports Success', { count: reportsRes.data.reports.length });

        // 6. GET PAYOUTS
        log('Testing: GET /users/payouts');
        const pRes = await api('/users/payouts', 'GET', null, authHeaders);
        log('✅ Get Payouts Success');

        // 7. GET NOTIFICATIONS
        log('Testing: GET /users/notifications');
        const nRes = await api('/users/notifications', 'GET', null, authHeaders);
        log('✅ Get Notifications Success');

        log('🎉 ALL ENDPOINTS VERIFIED SUCCESSFULLY!');
    } catch (err) {
        log('❌ TEST FAILED', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data
        });
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
