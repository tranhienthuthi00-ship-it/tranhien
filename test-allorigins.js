async function run() {
  try {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    const html = data.contents;
    console.log("HTML length:", html.length);
    console.log("captcha?", html.includes("captcha"));
    console.log("captionTracks?", html.includes("captionTracks"));
    
    let match = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (match) {
        console.log("Found track:", JSON.parse(match[1])[0].baseUrl);
    }
  } catch(e) { console.error(e) }
}
run();
