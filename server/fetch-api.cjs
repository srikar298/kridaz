const http = require('http');

http.get('http://localhost:3000/api/user/turf/all', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const saavik = parsed.turfs.find(t => t.name.includes('SAAVIK'));
      if (saavik) {
        console.log('generatedSlots type:', typeof saavik.generatedSlots);
        console.log('generatedSlots isArray:', Array.isArray(saavik.generatedSlots));
        console.log('generatedSlots sample:', JSON.stringify(saavik.generatedSlots).substring(0, 100));
      } else {
        console.log('SAAVIK not found in API response');
      }
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', console.error);
