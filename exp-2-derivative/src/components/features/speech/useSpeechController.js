import { useRef, useState, useEffect, useCallback } from "react";


export const useSpeechController = () => {
  const utteranceRef = useRef(null);
  const voicesRef = useRef([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Load voices
  useEffect(() => {
    if (!window?.speechSynthesis) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    if (!window?.speechSynthesis) return;

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const getIndianVoice = () => {
    const voices = voicesRef.current;

    // Priority order
    return (
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang === "hi-IN") ||
      voices.find((v) => v.name.toLowerCase().includes("india")) ||
      voices.find((v) => v.name.toLowerCase().includes("english")) ||
      voices.find((v) => v.default) ||
      voices[0]
    );
  };

  const speak = useCallback(
    (text) => {
      if (!window?.speechSynthesis) return;

      const normalizedText = typeof text === "string" ? text.trim() : "";
      stop();
      if (!normalizedText) return;

      const utterance = new SpeechSynthesisUtterance(normalizedText);

      // 🎤 Assign Indian voice
      const indianVoice = getIndianVoice();
      if (indianVoice) {
        utterance.voice = indianVoice;
        utterance.lang = indianVoice.lang;
      }

      utterance.rate = 0.8;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsSpeaking(false);
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        utteranceRef.current = null;
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        utteranceRef.current = null;
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [stop],
  );

  const pause = useCallback(() => {
    if (!window?.speechSynthesis?.speaking) return;

    window.speechSynthesis.pause();
    setIsSpeaking(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!window?.speechSynthesis?.paused) return;

    window.speechSynthesis.resume();
    setIsSpeaking(true);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (!window?.speechSynthesis) return;

    const handleBeforeUnload = () => {
      window.speechSynthesis.cancel();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
  };
}

