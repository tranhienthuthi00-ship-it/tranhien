async function run() {
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  const text = await res.text();
  console.log("allorigins text", text.substring(0, 500));
}
run();
