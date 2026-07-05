const dns = require('dns');

const host = 'db.muryofwaiwrnnpfpvmzu.supabase.co';

dns.resolve4(host, (err, addresses) => {
    if (err) {
        console.log('No IPv4 (A) records:', err.message);
    } else {
        console.log('IPv4 (A) records found:', addresses);
    }
});

dns.resolve6(host, (err, addresses) => {
    if (err) {
        console.log('No IPv6 (AAAA) records:', err.message);
    } else {
        console.log('IPv6 (AAAA) records found:', addresses);
    }
});
