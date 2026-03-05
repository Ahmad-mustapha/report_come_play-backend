
async function testEndpoints() {
    console.log('🔍 Testing Local Backend Endpoints (api/v1)...');

    const results = [];

    // 1. Root and Health
    try {
        const root = await fetch('http://localhost:5000/');
        results.push({ name: 'Root (v0)', status: root.status, ok: root.ok });

        const health = await fetch('http://localhost:5000/health');
        results.push({ name: 'Health', status: health.status, ok: health.ok });
    } catch (e) {
        console.error('❌ Could not connect to local server on port 5000.');
        return;
    }

    const BASE_URL = 'http://localhost:5000/api/v1';

    // 2. Auth Endpoints
    const authEndpoints = ['/auth/me', '/auth/login', '/auth/register'];
    for (const ep of authEndpoints) {
        try {
            const res = await fetch(`${BASE_URL}${ep}`, { method: ep === '/auth/me' ? 'GET' : 'POST' });
            results.push({ name: `api/v1${ep}`, status: res.status, ok: res.status !== 404 });
        } catch (e) {
            results.push({ name: `api/v1${ep}`, error: e.message });
        }
    }

    // 3. User Endpoints
    const userEndpoints = ['/users/profile', '/users/payouts'];
    for (const ep of userEndpoints) {
        try {
            const res = await fetch(`${BASE_URL}${ep}`);
            results.push({ name: `api/v1${ep}`, status: res.status, ok: res.status !== 404 });
        } catch (e) {
            results.push({ name: `api/v1${ep}`, error: e.message });
        }
    }

    // 4. Fields Endpoints
    const fieldEndpoints = ['/fields'];
    for (const ep of fieldEndpoints) {
        try {
            const res = await fetch(`${BASE_URL}${ep}`);
            results.push({ name: `api/v1${ep}`, status: res.status, ok: res.status !== 404 });
        } catch (e) {
            results.push({ name: `api/v1${ep}`, error: e.message });
        }
    }

    console.table(results);
}

testEndpoints();
