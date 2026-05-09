import { createContext, useState, useRef, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useSpeechController } from "../features/speech/useSpeechController";
export const HomeContext = createContext(null);

export const HomeContextProvider = ({ children }) => {
  // Guided Tutor State
  const isMobile = useMediaQuery("(max-width:600px)");
  const [tutorSteps, setTutorSteps] = useState([]); //Tutor steps list
  const [instructionsList, setInstructionsList] = useState({}); //Instructions list
  const [isImageProcessed, setIsImageProcessed] = useState(false);
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [tutorStep, setTutorStep] = useState(0);
  const [prevStep, setPrevStep] = useState(0);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const tutorBtnRef = useRef(null);
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

  // Show welcome modal on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleTutorNext = () => {
    if (tutorStep < tutorSteps.length - 1) {
      setPrevStep(tutorStep);
      setTutorStep(tutorStep + 1);
    } else {
      setIsTutorOpen(false);
      setTutorStep(0);
      stop(); // Clear speech when tutor finished
    }
  };

  const handleTutorBack = () => {
    if (tutorStep > 0) {
      setTutorStep(tutorStep - 1);
    }
  };

  const startTutor = () => {
    setTutorStep(0);
    setIsTutorOpen(true);
  };

  const closeInstructions = () => {
    setIsInstructionOpen(false);
    stop();
  };
  const currentStep = tutorSteps[tutorStep];

  const computedStep = isMobile
    ? {
        ...currentStep,
        placement: "bottom",
        offset: [80, -832],
      }
    : currentStep;

  // Auto-advance tutor for processing
useEffect(() => {
  if (!isTutorOpen) return;

  if (isImageProcessed[0] && tutorStep === 7) {
    handleTutorNext();
  }

  if (isImageProcessed[1] && tutorStep === 6) {
    handleTutorNext();
  }

}, [isImageProcessed]);  // ❗ remove tutorStep from dependency

  // Read instructions aloud once when reaching the instruction button step
  const hasReadInstructionsRef = useRef(false);
  useEffect(() => {
    if (isTutorOpen && tutorStep === 1 && !hasReadInstructionsRef.current) {
      const text = tutorSteps[1]?.content || "";
      if (text) {
        speak(text);
        hasReadInstructionsRef.current = true;
      }
    }
    if (!isTutorOpen) {
      hasReadInstructionsRef.current = false;
    }
  }, [isTutorOpen, tutorStep, tutorSteps, speak]);

  const getInstructionsText = () => {
    const steps = instructionsList[0];
    return steps ? steps.join("\n") : "No instructions available.";
  };

  const currentTutorText = tutorSteps[tutorStep]?.content || "";
  const instructionText = getInstructionsText();
  const activeSpeechText = isInstructionOpen
    ? instructionText
    : isTutorOpen
      ? currentTutorText
      : "";
  const activeSpeechKey = `${isInstructionOpen ? "instruction" : isTutorOpen ? "tutor" : "idle"}:${activeSpeechText}`;

  const handleSpeechToggle = () => {
    if (!activeSpeechText) {
      return;
    }

    if (isSpeaking && !isPaused) {
      setIsPlaying(false);
      return;
    }

    if (isPaused) {
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    speak(activeSpeechText);
  };

  useEffect(() => {
    if (previousSpeechKeyRef.current !== activeSpeechKey) {
      stop();
      previousSpeechKeyRef.current = activeSpeechKey;
    }

    if (!activeSpeechText || !isPlaying || isPaused) {
      return;
    }

    speak(activeSpeechText);
  }, [activeSpeechKey, activeSpeechText, isPaused, isPlaying, speak, stop]);

  useEffect(() => {
    const wasPlaying = previousPlayStateRef.current;

    if (wasPlaying && !isPlaying) {
      pause();
    }

    if (!wasPlaying && isPlaying && isPaused) {
      resume();
    }

    previousPlayStateRef.current = isPlaying;
  }, [isPaused, isPlaying, pause, resume]);

  return (
    <HomeContext.Provider
      value={{
        isMobile,
        isImageProcessed,
        setIsImageProcessed,
        isInstructionOpen,
        setIsInstructionOpen,
        instructionsList,
        setInstructionsList,
        tutorSteps,
        setTutorSteps,
        tutorStep,
        setTutorStep,
        startTutor,
        prevStep,
        setPrevStep,
        isTutorOpen,
        setIsTutorOpen,
        computedStep,
        currentStep,
        isPlaying,
        setIsPlaying,
        isSpeaking,
        isPaused,
        showWelcome,
        setShowWelcome,
        tutorBtnRef,
        speak,
        pause,
        resume,
        stop,
        sentences,
        currentSentenceIndex,
        handleSpeechToggle,
        handleTutorNext,
        handleTutorBack,
        closeInstructions,
        previousSpeechKeyRef,
        previousPlayStateRef,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};
