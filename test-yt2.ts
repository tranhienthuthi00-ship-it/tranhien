import TranscriptClient from 'youtube-transcript-api';
// or require
async function run() {
  try {
    const api = new TranscriptClient();
    const transcript = await api.getTranscript('jNQXAC9IVRw', { language: 'en' });
    console.log(transcript.slice(0, 2));
  } catch(e) {
    console.log(e);
  }
}
run();
