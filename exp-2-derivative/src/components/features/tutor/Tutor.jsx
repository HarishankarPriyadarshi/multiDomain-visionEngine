import React, { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";

import { HomeContext } from "../../context/HomeContext";
import "./tutor.css";

export const Tutor = () => {
  const {
    isMobile,
    isTutorOpen,
    setIsTutorOpen,
    showWelcome,
    setShowWelcome,
    tutorBtnRef,
    startTutor,
    handleTutorNext,
    handleTutorBack,
    tutorSteps,
    tutorStep,
    setTutorStep,
    prevStep,
    computedStep,
    sentences,
    currentSentenceIndex,
    isSpeaking,
    isPaused,
    isInstructionOpen,
    stop
  } = useContext(HomeContext);

  // Helper to render text with sentence highlighting
  const renderHighlightedText = (text, isCurrentContainerActive) => {
    if (!isCurrentContainerActive || !isSpeaking || sentences.length === 0) {
      return text;
    }

    return sentences.map((sentence, index) => (
      <span
        key={index}
        className={
          isSpeaking && !isPaused && index === currentSentenceIndex
            ? "highlight-sentence"
            : ""
        }
      >
        {sentence}{" "}
      </span>
    ));
  };

  // Highlight current step element
  useEffect(() => {
    if (!isTutorOpen || !tutorSteps[tutorStep]?.targetId) {
      return undefined;
    }

    const targetElement = document.getElementById(
      tutorSteps[tutorStep].targetId,
    );

    if (!targetElement) {
      return undefined;
    }

    targetElement.classList.add("tutor-highlight");
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return () => {
      targetElement.classList.remove("tutor-highlight");
    };
  }, [isTutorOpen, tutorStep, tutorSteps]);

  // if action required then no next bt
    const [isActionRequired, setIsActionRequired] = useState(false);
    useEffect(() => {
      if (tutorSteps[tutorStep]?.title === "Action Required") {
        setIsActionRequired(true);
      } else {
        setIsActionRequired(false);
      }
    }, [tutorStep, tutorSteps]);

  return (
    <div>
      {isTutorOpen && <div className="tutor-overlay" />}
      {/* Welcome Modal */}
      <Popper
        open={showWelcome && !isInstructionOpen}
        anchorEl={tutorBtnRef.current}
        placement="bottom"
        transition
        className="tutor-popper tutor-backdrop"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [-60, 12],
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={{ enter: 1500, exit: 100 }}>
            <Paper
              className="tutor-paper"
              role="dialog"
              aria-labelledby="tutor-welcome-title"
            >
              <div className="tutor-arrow" />
              <Typography id="tutor-welcome-title" className="tutor-title">
                Welcome to Simulation
              </Typography>
              <p className="tutor-content">
                Would you like assistance from the Guided Tutor Mode?
              </p>
              <div className="tutor-actions">
                <Button
                  size="small"
                  onClick={() => {
                    setShowWelcome(false);
                    stop();
                  }}
                  sx={{
                    color: "#000000ff",
                    backgroundColor: "#e5e9faff",
                    border: "1px solid #1D2A6D",
                  }}
                >
                  No, thanks
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setShowWelcome(false);
                    startTutor();
                  }}
                  sx={{ backgroundColor: "#1D2A6D" }}
                >
                  Yes, please!
                </Button>
              </div>
            </Paper>
          </Grow>
        )}
      </Popper>

      {/* Guided Tutor Popper (Non-blocking) */}
      <Popper
        open={isTutorOpen && !isInstructionOpen}
        anchorEl={
          isMobile
            ? document.body
            : document.getElementById(computedStep?.targetId)
        }
        placement={computedStep?.placement || "bottom"}
        transition
        className="tutor-popper"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: computedStep?.offset || [-60, 12],
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={350}>
            <Paper
              className={`tutor-paper ${
                tutorStep > prevStep ? "slide-right" : "slide-left"
              }`}
              role="dialog"
              aria-labelledby="tutor-step-title"
            >
              <div className="tutor-arrow" />
             <Typography id="tutor-step-title" className={isActionRequired ? "tutor-title-action" : "tutor-title"}>
                {tutorSteps[tutorStep].title}
              </Typography>

              <p className="tutor-content">
                {renderHighlightedText(
                  tutorSteps[tutorStep].content,
                  isTutorOpen && !isInstructionOpen,
                )}
              </p>
              <div className="tutor-actions">
                <Button
                  size="small"
                  onClick={() => {
                    setIsTutorOpen(false);
                    setTutorStep(0);
                    stop();
                  }}
                  sx={{
                    color: "#666",
                    backgroundColor: "#1px solid #1D2A6D",
                    border: "1px solid #1D2A6D",
                  }}
                >
                  Exit
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {tutorStep > 0 && (
                  <Button
                    size="small"
                    onClick={handleTutorBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                )}

                                {!isActionRequired && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleTutorNext}
                    sx={{ backgroundColor: "#1D2A6D" }}
                  >
                    {tutorStep === tutorSteps.length - 1
                      ? "Finish"
                      : "Next"}
                  </Button>
                )}
              </div>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

export default Tutor;
