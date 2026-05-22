async function run() {
  const urls = [
    "https://youtube-browser-api.netlify.app/transcript?v=",
    "https://youtube-transcript-coral.vercel.app/api/transcript?v=",
    "https://subtitles-youtube.vercel.app/api/transcript?v="
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url + "jNQXAC9IVRw");
      console.log(url, res.status);
    } catch(e) {}
  }
}
run();
