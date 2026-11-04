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
  const lastSpokenKeyRef = useRef("");
  const previousPlayStateRef = useRef(true);

  const [isGaussOnTutor, setIsGaussOnTutor] = useState("");

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
      setIsPlaying(false);
      stop();
    }
  };

  const handleTutorBack = () => {
    if (tutorStep > 0) {
      setTutorStep(tutorStep - 1);
    }
  };

  const startTutor = () => {
    setTutorStep(0);
    setIsPlaying(true);
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
  // useEffect(() => {
  //   if (isGaussOnTutor === "Gauss On") {
  //     if (tutorStep === 8 && isImageProcessed) {
  //       handleTutorNext();
  //     }
  //   } else if (tutorStep === 9 && isImageProcessed) {
  //     handleTutorNext();
  //   }
  // }, [isGaussOnTutor, isImageProcessed]);

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
  const activeAudioSrc =
    isTutorOpen && !isInstructionOpen ? currentStep?.audioSrc : "";
  const activeAudioTimestamps = currentStep?.audioTimestamps;
  const activeSpeechKey = `${isInstructionOpen ? "instruction" : isTutorOpen ? "tutor" : "idle"}:${activeAudioSrc || "recording"}:${activeSpeechText}`;

  const handleSpeechToggle = () => {
    if (!activeSpeechText || !activeAudioSrc) {
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
    lastSpokenKeyRef.current = activeSpeechKey;
    void playAudio(activeAudioSrc, activeSpeechText, activeAudioTimestamps);
  };

  useEffect(() => {
    if (previousSpeechKeyRef.current !== activeSpeechKey) {
      stop();
      previousSpeechKeyRef.current = activeSpeechKey;
      lastSpokenKeyRef.current = "";
    }

    if (
      !activeSpeechText ||
      !activeAudioSrc ||
      !isPlaying ||
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
    isPlaying,
    playAudio,
    stop,
  ]);

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
        isPausedSpeaking: isPaused,
        showWelcome,
        setShowWelcome,
        tutorBtnRef,
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
        isGaussOnTutor,
        setIsGaussOnTutor,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};
