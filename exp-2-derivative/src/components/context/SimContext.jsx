import { createContext, useState, useRef, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useSpeechController } from "../features/speech/useSpeechController";
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
  const [showWelcomeSim, setShowWelcomeSim] = useState(true);

  const previousSpeechKeyRef = useRef("");
  const lastSpokenKeyRef = useRef("");

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
        "Welcome to the Gradient Convolution Visualization experiment. In this simulation, you will observe how edge detection works step-by-step using convolution with Kernel X and Kernel Y operators.",
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [speak]);

  const startTutorSim = () => {
    setTutorStepSim(0);
    setIsTutorOpenSim(true);
    //  setIsSimPlaying(true);
  };

  const handleTutorNextSim = () => {
    if (tutorStepSim < tutorStepsSim.length - 1) {
     
      setPrevStepSim(tutorStepSim);
      setTutorStepSim(tutorStepSim + 1);
      console.log("isSimPlaying", isSimPlaying);
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
    "Welcome to the Gradient Convolution Visualization experiment. In this simulation, you will observe how edge detection works step-by-step using convolution with Kernel X and Kernel Y operators.";
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
    } else if (isPaused) {
      setIsSimPlaying(true);
    } else {
      // If neither speaking nor paused (e.g. finished or not started)
      // Reset the key ref to force a fresh speak() call in the useEffect
      lastSpokenKeyRef.current = "";
      setIsSimPlaying(true);
    }
  };

  useEffect(() => {
    if (previousSpeechKeyRef.current !== activeSpeechKey) {
      stop();
      previousSpeechKeyRef.current = activeSpeechKey;
      lastSpokenKeyRef.current = ""; // Reset when key changes
    }

    if (!activeSpeechText ||  !isSimPlaying || isPaused) {
      return;
    }

    if (lastSpokenKeyRef.current !== activeSpeechKey) {
      speak(activeSpeechText);
      lastSpokenKeyRef.current = activeSpeechKey;
    }

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
