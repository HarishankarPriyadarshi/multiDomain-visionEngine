import { useRef, useState, useEffect, useCallback } from "react";


export const useSpeechController = () => {
  const audioRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sentences, setSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const stop = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      audioRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    setIsSpeaking(false);
    setIsPaused(false);
    setSentences([]);
    setCurrentSentenceIndex(0);
  }, []);

  const splitIntoSentences = (text) => {
    return text
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.trim().length > 0);
  };

  const estimateSentenceTimestamps = (sentences, duration) => {
    const wordCounts = sentences.map((sentence) => sentence.trim().split(/\s+/).length);
    const totalWords = wordCounts.reduce((total, count) => total + count, 0);
    let start = 0;

    return wordCounts.map((wordCount, index) => {
      const end =
        index === wordCounts.length - 1
          ? duration
          : start + (duration * wordCount) / totalWords;
      const timestamp = { start, end };
      start = end;
      return timestamp;
    });
  };

  const playAudio = useCallback(
    async (source, transcriptText, sentenceTimestamps = []) => {
      if (!source) return;

      stop();
      const normalizedText = typeof transcriptText === "string" ? transcriptText.trim() : "";
      const split = splitIntoSentences(normalizedText);
      const hasSentenceTimestamps = sentenceTimestamps.length === split.length;
      setSentences(split);
      setCurrentSentenceIndex(0);

      const audio = new Audio(source);
      audioRef.current = audio;

      const handleAudioFailure = (error) => {
        if (audioRef.current !== audio) return;
        console.error("Recorded tutor audio could not play:", error);
        audioRef.current = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        setIsSpeaking(false);
        setIsPaused(false);
        setSentences([]);
        setCurrentSentenceIndex(0);
      };

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      audio.onpause = () => {
        if (audioRef.current !== audio || audio.ended) return;
        setIsSpeaking(false);
        setIsPaused(true);
      };
      audio.ontimeupdate = () => {
        if (!split.length || !Number.isFinite(audio.duration)) return;
        const timestamps = hasSentenceTimestamps
          ? sentenceTimestamps
          : estimateSentenceTimestamps(split, audio.duration);
        const matchingIndex = timestamps.findIndex(
          ({ start, end }) => audio.currentTime >= start && audio.currentTime < end,
        );
        if (matchingIndex !== -1) {
          setCurrentSentenceIndex(matchingIndex);
        }
      };
      audio.onended = () => {
        if (audioRef.current !== audio) return;
        audioRef.current = null;
        setIsSpeaking(false);
        setIsPaused(false);
        setSentences([]);
        setCurrentSentenceIndex(0);
      };
      audio.onerror = () => handleAudioFailure(audio.error);

      try {
        await audio.play();
      } catch (error) {
        handleAudioFailure(error);
      }
    },
    [stop],
  );

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current?.paused) {
      audioRef.current.play().catch((error) => {
        console.error("Recorded tutor audio could not resume:", error);
      });
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stop();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stop();
    };
  }, [stop]);

  return {
    playAudio,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    sentences,
    currentSentenceIndex,
  };
}

