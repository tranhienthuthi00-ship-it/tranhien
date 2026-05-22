async function fetchCaptionsCustom(videoId) {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await response.text();
      console.log(html.substring(0, 500));
      console.log(html.includes("captionTracks"));
      console.log(html.includes("captcha"));
    } catch(e) {}
}
fetchCaptionsCustom('jNQXAC9IVRw');
