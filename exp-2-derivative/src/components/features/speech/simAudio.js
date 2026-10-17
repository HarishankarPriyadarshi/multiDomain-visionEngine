import simAudioTimestamps from "./simAudioTimestamps.json";

const simAudioFiles = import.meta.glob(
  "../../../assets/audios/conceptPageAudio/*.wav",
  { eager: true, query: "?url", import: "default" },
);

const DEFAULT_SIM_AUDIO_ID = "step2.instruction.mp3";

export const getSimAudio = (audioId) => {
  
  const requestedPath = `../../../assets/audios/conceptPageAudio/${audioId}`;
  const audioIdToPlay = simAudioFiles[requestedPath]
    ? audioId
    : DEFAULT_SIM_AUDIO_ID;
  const audioFileToPlay = audioIdToPlay.replace(/\.mp3$/, ".wav");
  const audioPath = `../../../assets/audios/conceptPageAudio/${audioFileToPlay}`;

  return {
    audioSrc: simAudioFiles[audioPath] || "",
    audioTimestamps: simAudioTimestamps[audioIdToPlay] || [],
  };
};

export const addSimAudioToSteps = (steps) =>
  steps.map((step) => ({
    ...step,
    ...getSimAudio(step.audioId),
  }));