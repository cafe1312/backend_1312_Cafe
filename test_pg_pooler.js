const { Client } = require('pg');

const connectionString = 'postgresql://postgres.muryofwaiwrnnpfpvmzu:QWer12%40*1312Cafe@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require';

const client = new Client({
    connectionString: connectionString
});

console.log("Connecting using standard pg client...");
client.connect((err) => {
    if (err) {
        console.error('Connection error details:', err);
    } else {
        console.log('SUCCESSFUL connection via standard pg!');
        client.end();
    }
});
