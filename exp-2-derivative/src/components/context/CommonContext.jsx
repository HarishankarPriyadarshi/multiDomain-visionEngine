import { createContext, useState, useRef, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useSpeechController } from "../features/speech/useSpeechController";
export const CommonContext = createContext(null);

export const CommonContextProvider = ({ children }) => {
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
  const { speak, pause, resume, stop, isSpeaking, isPaused } =
    useSpeechController();

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
    if (isTutorOpen && tutorStep === 7 && isImageProcessed) {
      handleTutorNext();
    }
  }, [handleTutorNext, isImageProcessed, isTutorOpen, tutorStep]);

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
    <CommonContext.Provider
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
        handleSpeechToggle,
        handleTutorNext,
        handleTutorBack,
        previousSpeechKeyRef,
        previousPlayStateRef,
      }}
    >
      {children}
    </CommonContext.Provider>
  );
};
