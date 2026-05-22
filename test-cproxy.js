async function run() {
  try {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const html = await res.text();
    console.log("corsproxy.io length:", html.length);
    console.log("captcha?", html.includes("captcha"));
    console.log("captionTracks?", html.includes("captionTracks"));
  } catch(e) { console.log(e) }
}
run();
