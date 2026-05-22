import { YoutubeTranscript } from 'youtube-transcript';
async function run() {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript('jNQXAC9IVRw');
    console.log(transcript.slice(0, 2));
  } catch(e) {
    console.log("Error", e);
  }
}
run();
