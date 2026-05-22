async function run() {
  try {
    const res = await fetch('https://kome.ai/api/tools/youtube-transcripts?video_id=jNQXAC9IVRw&format=1');
    const data = await res.json();
    console.log(data);
  } catch(e) { console.error(e) }
}
run();
