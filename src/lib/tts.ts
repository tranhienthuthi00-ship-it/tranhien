export const getPreferredVoice = (voices: SpeechSynthesisVoice[]) => {
  const preferredVoiceName = localStorage.getItem("preferredVoice");
  if (preferredVoiceName) {
    const voice = voices.find(v => v.name === preferredVoiceName);
    if (voice) return voice;
  }
  const sortedEn = [...voices.filter(v => v.lang.startsWith("en"))].sort((a, b) => {
    const name = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
    const getScore = (v: SpeechSynthesisVoice) => {
      const n = name(v);
      if (n.includes("natural")) return 100;
      if (n.includes("online")) return 90;
      if (n.includes("google")) return 80;
      if (n.includes("premium")) return 70;
      if (n.includes("neural")) return 60;
      if (n.includes("samantha")) return 50;
      if (n.includes("apple") || n.includes("macos")) return 40;
      if (n.includes("microsoft") || n.includes("desktop")) return 30;
      return 0;
    };
    return getScore(b) - getScore(a);
  });
  return sortedEn[0] || voices[0];
};

export const getPreferredRate = () => {
  const r = localStorage.getItem("preferredRate");
  return r ? parseFloat(r) : 0.9;
};

export const getPreferredPitch = () => {
  const p = localStorage.getItem("preferredPitch");
  return p ? parseFloat(p) : 1.0;
};
