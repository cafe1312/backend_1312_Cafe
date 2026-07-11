process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.muryofwaiwrnnpfpvmzu:QWer12%40*1312Cafe@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&sslaccept=accept_invalid_certs&pgbouncer=true';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT id, total_amount, status, created_at FROM orders;");
  const completed = res.rows.filter(o => o.status === 'COMPLETED');
  const sum = completed.reduce((s, o) => s + parseFloat(o.total_amount), 0);
  console.log("All orders:", res.rows);
  console.log("Completed Orders Sum:", sum);
}

main()
  .catch(console.error)
  .finally(() => client.end());
