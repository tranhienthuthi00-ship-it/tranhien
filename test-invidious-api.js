async function test() {
  const api = "https://inv.thepixora.com";
  const videoId = "jNQXAC9IVRw";
  
  // Try default
  const url = `${api}/api/v1/captions/${videoId}?label=English`;
  console.log("Fetching captions with label from", url);
  try {
    const res = await fetch(url);
    const content = await res.text();
    console.log("Status:", res.status);
    console.log("Response text length:", content.length);
    console.log("Response starts with:\n", content.substring(0, 400));
  } catch(e) {
    console.error(e);
  }
}
test();
