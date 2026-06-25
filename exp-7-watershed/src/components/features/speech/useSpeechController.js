import { useRef, useState, useEffect, useCallback } from "react";


export const useSpeechController = () => {
  const utteranceRef = useRef(null);
  const voicesRef = useRef([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  //highlight sentences
  const [sentences, setSentences] = useState([]);
const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

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
    setSentences([]);
    setCurrentSentenceIndex(0);
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

  const splitIntoSentences = (text) => {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
};

const speak = useCallback(
  (text) => {
    if (!window?.speechSynthesis) return;

    const normalizedText = typeof text === "string" ? text.trim() : "";
    stop();
    if (!normalizedText) return;

    const split = splitIntoSentences(normalizedText);
    setSentences(split);
    setCurrentSentenceIndex(0);

    const speakSentence = (index) => {
      if (!split[index]) return;

      const utterance = new SpeechSynthesisUtterance(split[index]);

      const indianVoice = getIndianVoice();
      if (indianVoice) {
        utterance.voice = indianVoice;
        utterance.lang = indianVoice.lang;
        console.log(indianVoice);
      }

      utterance.rate = 0.9;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentSentenceIndex(index);
      };

      utterance.onend = () => {
        if (index < split.length - 1) {
          speakSentence(index + 1);
        } else {
          setIsSpeaking(false);
          setIsPaused(false);
          setSentences([]);
          setCurrentSentenceIndex(0);
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setSentences([]);
        setCurrentSentenceIndex(0);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakSentence(0);
  },
  [stop]
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
    sentences,
    currentSentenceIndex,
  };
}

