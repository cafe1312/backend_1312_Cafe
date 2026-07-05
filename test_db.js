const net = require('net');

const client = new net.Socket();
client.setTimeout(5000);

console.log("Connecting to db.muryofwaiwrnnpfpvmzu.supabase.co on port 6543...");
client.connect(6543, 'db.muryofwaiwrnnpfpvmzu.supabase.co', () => {
    console.log('SUCCESS: Reachable on 6543!');
    client.destroy();
});

client.on('error', (err) => {
    console.error('ERROR reaching database on 6543:', err.message);
    client.destroy();
});

client.on('timeout', () => {
    console.error('TIMEOUT: Connection timed out on 6543');
    client.destroy();
});

const clientDirect = new net.Socket();
clientDirect.setTimeout(5000);
console.log("Connecting to db.muryofwaiwrnnpfpvmzu.supabase.co on port 5432...");
clientDirect.connect(5432, 'db.muryofwaiwrnnpfpvmzu.supabase.co', () => {
    console.log('SUCCESS: Reachable on 5432!');
    clientDirect.destroy();
});

clientDirect.on('error', (err) => {
    console.error('ERROR reaching database on 5432:', err.message);
    clientDirect.destroy();
});

clientDirect.on('timeout', () => {
    console.error('TIMEOUT: Connection timed out on 5432');
    clientDirect.destroy();
});
