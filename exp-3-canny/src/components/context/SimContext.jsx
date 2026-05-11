import { createContext, useState, useRef, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useSpeechController } from "../features/speech/useSpeechController";
export const SimContext = createContext(null);

export const SimContextProvider = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  // Sim State
  const [tutorStepsSim, setTutorStepsSim] = useState([]); //Tutor steps list
  const [tutorStepSim, setTutorStepSim] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState({
    original: false,
    image: false,
    gKernel: false,
    myBlurButton: false,
    myPadButton: false,
    myPadBlurButton: false,
    mySobelButton: false,
    myQuantButton: false,
    myNonMaxButton: false,
    myThresButton: false,
    myNextButton: false,
    padded: false,
    startBlur: false,
    padBlur: false,
    blurred: false,
    sobelx: false,
    sobely: false,
    convolutedx: false,
    convolutedy: false,
    gradient: false,
    quantize: false,
    supressed: false,
    finalGrid: false,
  });
  const [prevStepSim, setPrevStepSim] = useState(0);
  const [isTutorOpenSim, setIsTutorOpenSim] = useState(false);
  const tutorBtnRefSim = useRef(null);
  const [showWelcomeSim, setShowWelcomeSim] = useState(true);

  const previousSpeechKeyRef = useRef("");
  const previousPlayStateRef = useRef(true);
  const {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    sentences,
    currentSentenceIndex,
  } = useSpeechController();

  // Show welcome modal on initial load for sim
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeSim(true);
      speak(
        "",
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [speak]);

  const startTutorSim = () => {
    setTutorStepSim(0);
    setIsTutorOpenSim(true);
  };

  const handleTutorNextSim = () => {
    if (tutorStepSim < tutorStepsSim.length - 1) {
      setPrevStepSim(tutorStepSim);
      setTutorStepSim(tutorStepSim + 1);
    } else {
      setIsTutorOpenSim(false);
      setTutorStepSim(0);
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

  const welcomeText =
    "";
  const currentTutorText = tutorStepsSim[tutorStepSim]?.content || "";

  const activeSpeechText = isTutorOpenSim
    ? currentTutorText
    : showWelcomeSim
      ? welcomeText
      : "";
  const activeSpeechKey = `${isTutorOpenSim ? "tutor" : showWelcomeSim ? "welcome" : "idle"}:${activeSpeechText}`;

  const handleSpeechToggleSim = () => {
    if (!activeSpeechText) {
      return;
    }

    if (isSpeaking && !isPaused) {
      setIsSimPlaying(false);
      return;
    }

    if (isPaused) {
      setIsSimPlaying(true);
      return;
    }

    setIsSimPlaying(true);
    speak(activeSpeechText);
  };

  useEffect(() => {
    if (previousSpeechKeyRef.current !== activeSpeechKey) {
      stop();
      previousSpeechKeyRef.current = activeSpeechKey;
    }

    if (!activeSpeechText || (!isTutorOpenSim && !isSimPlaying) || isPaused) {
      return;
    }

    speak(activeSpeechText);
  }, [activeSpeechKey, activeSpeechText, isPaused, isSimPlaying, speak, stop]);

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
        speak,
        pause,
        resume,
        stop,
        sentences,
        currentSentenceIndex,
        isSpeaking,
        isPaused,

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
