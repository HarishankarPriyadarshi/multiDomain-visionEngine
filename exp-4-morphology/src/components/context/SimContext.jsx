import { createContext, useState, useRef, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useSpeechController } from "../features/speech/useSpeechController";
import { getSimAudio } from "../features/speech/simAudio";

export const SimContext = createContext(null);

export const SimContextProvider = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  // Sim State
  const [tutorStepsSim, setTutorStepsSim] = useState([]); //Tutor steps list
  const [tutorStepSim, setTutorStepSim] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState(false);
  const [prevStepSim, setPrevStepSim] = useState(0);
  const [isTutorOpenSim, setIsTutorOpenSim] = useState(false);
  const tutorBtnRefSim = useRef(null);
  const [showWelcomeSim, setShowWelcomeSim] = useState(false);

  const previousSpeechKeyRef = useRef("");
  const lastSpokenKeyRef = useRef("");
  const previousPlayStateRef = useRef(true);
  const {
    playAudio,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    sentences,
    currentSentenceIndex,
  } = useSpeechController();

  const startTutorSim = () => {
    setShowWelcomeSim(false);
    setTutorStepSim(0);
    setIsTutorOpenSim(true);
    setIsSimPlaying(true);
  };

  const openTutorWelcomeSim = () => {
    stop();
    setTutorStepSim(0);
    setIsTutorOpenSim(false);
    setIsSimPlaying(false);
    setShowWelcomeSim(true);
  };

  const handleTutorNextSim = () => {
    if (tutorStepSim < tutorStepsSim.length - 1) {
      setPrevStepSim(tutorStepSim);
      setTutorStepSim(tutorStepSim + 1);
    } else {
      setIsTutorOpenSim(false);
      setTutorStepSim(0);
      setIsSimPlaying(false);
      stop();
    }
  };

  const handleTutorBackSim = () => {
    if (tutorStepSim > 0) {
      setTutorStepSim(tutorStepSim - 1);
    }
  };
  const resetTutorSim = () => {
    setTutorStepSim(0);
    setIsTutorOpenSim(false);
    setIsSimPlaying(false);
    setShowWelcomeSim(false);
    stop();
  };

  const currentStepSim = tutorStepsSim[tutorStepSim];

  const computedStepSim = isMobile
    ? {
        ...currentStepSim,
        placement: "bottom",
        offset: [80, -832],
      }
    : currentStepSim;

  const welcomeText = tutorStepsSim[0]?.content || "";
  const currentTutorText = tutorStepsSim[tutorStepSim]?.content || "";

  const activeSpeechText = isTutorOpenSim
    ? currentTutorText
    : showWelcomeSim
      ? welcomeText
      : "";
  const activeAudioId = isTutorOpenSim
    ? currentStepSim?.audioId
    : showWelcomeSim
      ? tutorStepsSim[0]?.audioId
      : "";
  const { audioSrc: activeAudioSrc, audioTimestamps: activeAudioTimestamps } =
    getSimAudio(activeAudioId);
  const activeSpeechKey = `${isTutorOpenSim ? "tutor" : showWelcomeSim ? "welcome" : "idle"}:${activeAudioId}:${activeSpeechText}`;

  const handleSpeechToggleSim = () => {
    if (!activeSpeechText || !activeAudioSrc) {
      return;
    }

    if (isSpeaking && !isPaused) {
      setIsSimPlaying(false);
    } else if (isPaused) {
      setIsSimPlaying(true);
    } else {
      lastSpokenKeyRef.current = activeSpeechKey;
      setIsSimPlaying(true);
      void playAudio(activeAudioSrc, activeSpeechText, activeAudioTimestamps);
    }
  };

  useEffect(() => {
    if (previousSpeechKeyRef.current !== activeSpeechKey) {
      stop();
      previousSpeechKeyRef.current = activeSpeechKey;
      lastSpokenKeyRef.current = "";
    }

    if (
      !activeSpeechText ||
      !isSimPlaying ||
      isPaused ||
      lastSpokenKeyRef.current === activeSpeechKey
    ) {
      return;
    }

    lastSpokenKeyRef.current = activeSpeechKey;
    void playAudio(activeAudioSrc, activeSpeechText, activeAudioTimestamps);
  }, [
    activeAudioSrc,
    activeAudioTimestamps,
    activeSpeechKey,
    activeSpeechText,
    isPaused,
    isSimPlaying,
    playAudio,
    stop,
  ]);

  useEffect(() => {
    const wasPlaying = previousPlayStateRef.current;

    if (wasPlaying && !isSimPlaying) {
      pause();
    }

    if (!wasPlaying && isSimPlaying && isPaused) {
      resume();
    }

    previousPlayStateRef.current = isSimPlaying;
  }, [isPaused, isSimPlaying, pause, resume]);

  return (
    <SimContext.Provider
      value={{
        isMobile,
        pause,
        resume,
        stop,
        sentences,
        currentSentenceIndex,
        isSpeaking,
        isPaused,
        isPausedSpeaking: isPaused,

        // Simulation State
        tutorStepsSim,
        setTutorStepsSim,
        handleSpeechToggleSim,
        tutorBtnRefSim,
        isSimPlaying,
        setIsSimPlaying,
        prevStepSim,
        setPrevStepSim,
        isTutorOpenSim,
        setIsTutorOpenSim,
        showWelcomeSim,
        setShowWelcomeSim,
        startTutorSim,
        openTutorWelcomeSim,
        handleTutorNextSim,
        handleTutorBackSim,
        currentStepSim,
        computedStepSim,
        tutorStepSim,
        setTutorStepSim,
        resetTutorSim,
      }}
    >
      {children}
    </SimContext.Provider>
  );
};
