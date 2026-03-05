
async function runTest() {
    console.log('--- START ---');
    const tests = [
        { url: 'http://localhost:5000/health', method: 'GET' },
        { url: 'http://localhost:5000/api/v1/auth/me', method: 'GET' },
        { url: 'http://localhost:5000/api/v1/auth/login', method: 'POST' },
        { url: 'http://localhost:5000/api/v1/fields', method: 'GET' }
    ];
    for (const test of tests) {
        try {
            const res = await fetch(test.url, { method: test.method });
            console.log(`${test.method} ${test.url} => ${res.status} ${res.statusText}`);
            if (res.status === 404) {
                const body = await res.json();
                console.log('    -> 404 Body:', body);
            }
        } catch (e) {
            console.log(`${test.method} ${test.url} => ERROR ${e.message}`);
        }
    }
    console.log('--- END ---');
}
runTest();
