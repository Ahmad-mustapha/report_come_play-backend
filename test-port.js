import net from 'net';

const host = 'aws-1-eu-west-1.pooler.supabase.com';
const port = 6543;

const client = new net.Socket();
client.setTimeout(5000);

console.log(`Testing connection to ${host}:${port}...`);

client.connect(port, host, () => {
    console.log('SUCCESS: Connected to port ' + port);
    client.destroy();
});

client.on('error', (err) => {
    console.error('ERROR:', err.message);
    client.destroy();
});

client.on('timeout', () => {
    console.error('ERROR: Connection timed out');
    client.destroy();
});

