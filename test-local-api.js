async function run() {
  const url = "http://localhost:3000/api/transcript?videoId=jNQXAC9IVRw";
  console.log("Fetching from", url);
  try {
     const res = await fetch(url);
     const doc = await res.json();
     console.log("got doc", doc);
  } catch(e) {
     console.error(e);
  }
}
run();
