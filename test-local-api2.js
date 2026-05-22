async function run() {
  const url = "http://localhost:3000/api/transcript?videoId=dQw4w9WgXcQ";
  try {
     const res = await fetch(url);
     const doc = await res.json();
     console.log("got doc", doc);
  } catch(e) { console.error(e); }
}
run();
