
async function test() {
    console.log('--- START ---');
    const urls = [
        'http://localhost:5000/health',
        'http://localhost:5000/api/v1/auth/me',
        'http://localhost:5000/api/v1/users/profile',
        'http://localhost:5000/api/v1/fields'
    ];
    for (const u of urls) {
        try {
            const r = await fetch(u);
            console.log(`${u} => ${r.status} ${r.statusText}`);
        } catch (e) {
            console.log(`${u} => ERROR ${e.message}`);
        }
    }
    console.log('--- END ---');
}
test();
