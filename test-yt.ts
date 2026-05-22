import { Innertube } from 'youtubei.js';
async function run() {
  const yt = await Innertube.create();
  const info = await yt.getInfo('jNQXAC9IVRw');
  try {
    const transcript = await info.getTranscript();
    console.log(transcript.transcript.content.body.initial_segments.slice(0, 2));
  } catch(e) {
    console.error("error getTranscript", e);
  }
}
run().catch(console.error);
