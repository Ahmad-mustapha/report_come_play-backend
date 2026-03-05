
import fs from 'fs';
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('test_log.txt', msg + '\n');
};

async function runTest() {
    if (fs.existsSync('test_log.txt')) fs.unlinkSync('test_log.txt');
    log('--- START ---');
    const tests = [
        { url: 'http://localhost:5000/health', method: 'GET' },
        { url: 'http://localhost:5000/api/v1/auth/me', method: 'GET' },
        { url: 'http://localhost:5000/api/v1/auth/login', method: 'POST' },
        { url: 'http://localhost:5000/api/v1/fields', method: 'GET' }
    ];
    for (const test of tests) {
        try {
            const res = await fetch(test.url, { method: test.method });
            log(`${test.method} ${test.url} => ${res.status} ${res.statusText}`);
            if (res.status === 404) {
                try {
                    const body = await res.json();
                    log('    -> 404 Body: ' + JSON.stringify(body));
                } catch (e) { log('    -> Could not parse 404 body'); }
            }
        } catch (e) {
            log(`${test.method} ${test.url} => ERROR ${e.message}`);
        }
    }
    log('--- END ---');
}
runTest();
