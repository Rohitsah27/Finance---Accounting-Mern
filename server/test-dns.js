import dns from 'node:dns';

console.log('Resolving SRV records for _mongodb._tcp.cluster0.8kh4syh.mongodb.net...');

dns.resolveSrv('_mongodb._tcp.cluster0.8kh4syh.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV resolve error with default DNS:', err.message);

    // Try with Google DNS
    console.log('Trying with Google DNS 8.8.8.8...');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    dns.resolveSrv('_mongodb._tcp.cluster0.8kh4syh.mongodb.net', (err2, addresses2) => {
      if (err2) {
        console.error('SRV resolve error with Google DNS:', err2.message);
      } else {
        console.log('SRV resolve success with Google DNS:', addresses2);
      }
    });
  } else {
    console.log('SRV resolve success with default DNS:', addresses);
  }
});
