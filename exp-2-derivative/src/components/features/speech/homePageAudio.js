import homePageAudioTimestamps from "./homePageAudioTimestamps.json";

const homePageAudioFiles = import.meta.glob(
  "../../../assets/audios/homePageAudio/*.wav",
  { eager: true, query: "?url", import: "default" },
);

// Set a fallback filename only when testing simulations with incomplete recordings.
const DEFAULT_HOME_PAGE_AUDIO_ID = null;

export const getHomePageAudio = (audioId) => {
  const requestedPath = `../../../assets/audios/homePageAudio/${audioId}`;
  const audioIdToPlay = homePageAudioFiles[requestedPath]
    ? audioId
    : DEFAULT_HOME_PAGE_AUDIO_ID;
  const audioPath = audioIdToPlay
    ? `../../../assets/audios/homePageAudio/${audioIdToPlay}`
    : null;

  return {
    audioSrc: audioPath ? homePageAudioFiles[audioPath] || "" : "",
    audioTimestamps: audioIdToPlay
      ? homePageAudioTimestamps[audioIdToPlay] || []
      : [],
  };
};

export const addHomePageAudioToSteps = (steps) =>
  steps.map((step) => ({
    ...step,
    ...getHomePageAudio(step.audioId),
  }));