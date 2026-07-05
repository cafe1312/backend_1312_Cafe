const dns = require('dns');
const net = require('net');

const poolerHost = 'aws-0-ap-northeast-1.pooler.supabase.com';

dns.resolve4(poolerHost, (err, addresses) => {
    if (err) {
        console.error('IPv4 resolution failed:', err.message);
    } else {
        console.log('IPv4 addresses resolved:', addresses);
        
        // Test connection
        const client = new net.Socket();
        client.setTimeout(5000);
        console.log(`Connecting to ${poolerHost} on port 6543...`);
        client.connect(6543, poolerHost, () => {
            console.log('SUCCESS: Reachable on 6543 (IPv4 pooler)!');
            client.destroy();
        });
        client.on('error', (e) => {
            console.error('ERROR reaching pooler:', e.message);
            client.destroy();
        });
        client.on('timeout', () => {
            console.error('TIMEOUT reaching pooler');
            client.destroy();
        });
    }
});
