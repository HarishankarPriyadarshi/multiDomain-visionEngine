import simAudioTimestamps from "./simAudioTimestamps.json";

const simAudioFiles = import.meta.glob(
  "../../../assets/audios/conceptPageAudio/*.wav",
  { eager: true, query: "?url", import: "default" },
);

// Set a fallback filename only when testing simulations with incomplete recordings.
const DEFAULT_SIM_AUDIO_ID = null;

export const getSimAudio = (audioId) => {
  
  const requestedPath = `../../../assets/audios/conceptPageAudio/${audioId}`;
  const audioIdToPlay = simAudioFiles[requestedPath]
    ? audioId
    : DEFAULT_SIM_AUDIO_ID;
  const audioPath = audioIdToPlay
    ? `../../../assets/audios/conceptPageAudio/${audioIdToPlay.replace(/\.mp3$/, ".wav")}`
    : null;

  return {
    audioSrc: audioPath ? simAudioFiles[audioPath] || "" : "",
    audioTimestamps: audioIdToPlay
      ? simAudioTimestamps[audioIdToPlay] || []
      : [],
  };
};

export const addSimAudioToSteps = (steps) =>
  steps.map((step) => ({
    ...step,
    ...getSimAudio(step.audioId),
  }));