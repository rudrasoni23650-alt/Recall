const http = require('http');

const putReq = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/memories/663b12d5-b406-4e51-a8cf-0e91334fb787',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('PUT Response:', data);
    
    // Now call POST
    const postReq = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/memories/process?sync=true',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log('POST Response:', data2);
      });
    });
    
    postReq.write(JSON.stringify({ memoryId: '663b12d5-b406-4e51-a8cf-0e91334fb787' }));
    postReq.end();
  });
});

putReq.write(JSON.stringify({
  memory: {
    excerpt: "Banana is yellow",
    processingStatus: "pending"
  }
}));
putReq.end();
