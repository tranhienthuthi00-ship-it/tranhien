const fs = require('fs');
const https = require('https');
https.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', (res) => {
  if (res.statusCode === 302) {
    https.get(res.headers.location, (res2) => {
      res2.pipe(fs.createWriteStream('yt-dlp'));
      res2.on('end', () => console.log('Downloaded'));
    });
  } else {
    res.pipe(fs.createWriteStream('yt-dlp'));
    res.on('end', () => console.log('Downloaded'));
  }
});
