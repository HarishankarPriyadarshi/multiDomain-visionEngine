import homePageAudioTimestamps from "./homePageAudioTimestamps.json";

const homePageAudioFiles = import.meta.glob(
  "../../../assets/audios/homePageAudio/*.wav",
  { eager: true, query: "?url", import: "default" },
);

const DEFAULT_HOME_PAGE_AUDIO_ID = "step2.instruction.wav";

export const getHomePageAudio = (audioId) => {
  const requestedPath = `../../../assets/audios/homePageAudio/${audioId}`;
  const audioIdToPlay = homePageAudioFiles[requestedPath]
    ? audioId
    : DEFAULT_HOME_PAGE_AUDIO_ID;
  const audioPath = `../../../assets/audios/homePageAudio/${audioIdToPlay}`;
 return {
    audioSrc: homePageAudioFiles[audioPath] || "",
    audioTimestamps: homePageAudioTimestamps[audioIdToPlay] || [],
  };
};

export const addHomePageAudioToSteps = (steps) =>
  steps.map((step) => ({
    ...step,
    ...getHomePageAudio(step.audioId),
  }));