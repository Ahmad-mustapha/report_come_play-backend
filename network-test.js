import dns from 'dns';
import net from 'net';

const hostnames = [
    'youmipkmbwwsvwwwvgxw.supabase.co',
    'aws-1-eu-west-1.pooler.supabase.com',
    'google.com'
];

console.log('🔍 Testing DNS Resolution and Connectivity...\n');

hostnames.forEach(hostname => {
    console.log(`Testing ${hostname}...`);
    dns.lookup(hostname, (err, address) => {
        if (err) {
            console.error(`❌ DNS Failed for ${hostname}: ${err.code}`);
        } else {
            console.log(`✅ DNS Resolved ${hostname} -> ${address}`);

            // Try TCP connect
            const port = 5432;
            const socket = new net.Socket();
            socket.setTimeout(3000);

            socket.on('connect', () => {
                console.log(`   ✅ TCP Connected to ${hostname}:${port}`);
                socket.destroy();
            });

            socket.on('timeout', () => {
                console.error(`   ❌ TCP Timeout to ${hostname}:${port}`);
                socket.destroy();
            });

            socket.on('error', (e) => {
                console.error(`   ❌ TCP Error to ${hostname}:${port}: ${e.message}`);
            });

            if (hostname !== 'google.com') {
                socket.connect(port, address);
            }
        }
    });
});
