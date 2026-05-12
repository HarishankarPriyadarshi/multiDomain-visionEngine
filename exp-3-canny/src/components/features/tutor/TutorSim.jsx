import React, { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";

import { SimContext } from "../../context/SimContext";
import "./tutorSim.css";

export const TutorSim = () => {
  const {
    isMobile,
    isTutorOpenSim,
    setIsTutorOpenSim,
    showWelcomeSim,
    setShowWelcomeSim,
    tutorBtnRefSim,
    startTutorSim,
    handleTutorNextSim,
    handleTutorBackSim,
    tutorStepsSim,
    tutorStepSim,
    setTutorStepSim,
    prevStepSim,
    computedStepSim,
    sentences,
    currentSentenceIndex,
    isSpeaking,
    isPaused,
  } = useContext(SimContext);

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
  // tutorStepSim
  useEffect(() => {}, [tutorStepSim, handleTutorNextSim]);

  // Highlight current step element
  useEffect(() => {
    if (!isTutorOpenSim || !tutorStepsSim[tutorStepSim]?.targetId) {
      return undefined;
    }

    const targetElement = document.getElementById(
      tutorStepsSim[tutorStepSim].targetId,
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
  }, [isTutorOpenSim, tutorStepSim, tutorStepsSim]);

  // if action required then no next bt
  const [isActionRequired, setIsActionRequired] = useState(false);
  useEffect(() => {
    if (tutorStepsSim[tutorStepSim]?.title === "Action Required") {
      setIsActionRequired(true);
    } else {
      setIsActionRequired(false);
    }
  }, [tutorStepSim, tutorStepsSim]);



  return (
    <div>
      {/* Welcome Modal */}
      <Popper
        open={showWelcomeSim}
        anchorEl={tutorBtnRefSim.current}
        placement="bottom"
        transition
        className="tutor-popper-sim tutor-backdrop"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: computedStepSim?.offset || [-60, 12],
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
                {renderHighlightedText(
                  "Would you like assistance from the Guided Tutor Mode In Simulation?",
                  showWelcomeSim,
                )}
              </p>
              <div className="tutor-actions">
                <Button
                  size="small"
                  onClick={() => {
                    setShowWelcomeSim(false);
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
                    setShowWelcomeSim(false);
                    startTutorSim();
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
        open={isTutorOpenSim}
        anchorEl={
          isMobile
            ? document.body
            : document.getElementById(computedStepSim?.targetId)
        }
        placement={computedStepSim?.placement || "bottom"}
        transition
        className="tutor-popper-sim"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: computedStepSim?.offset || [-60, 12],
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={350}>
            <Paper
              className={`tutor-paper ${
                tutorStepSim > prevStepSim ? "slide-right" : "slide-left"
              }`}
              role="dialog"
              aria-labelledby="tutor-step-title"
            >
              <div className="tutor-arrow" />
              <Typography id="tutor-step-title" className={isActionRequired ? "tutor-title-action" : "tutor-title"}>
                
                {tutorStepsSim[tutorStepSim]?.title}
              </Typography>

              <p className="tutor-content">
                {renderHighlightedText(
                  tutorStepsSim[tutorStepSim]?.content,
                  isTutorOpenSim,
                )}
              </p>
              <div className="tutor-actions">
                <Button
                  size="small"
                  onClick={() => {
                    setIsTutorOpenSim(false);
                    setTutorStepSim(0);
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
                {tutorStepSim > 0 && (
                  <Button
                    size="small"
                    onClick={handleTutorBackSim}
                    variant="outlined"
                  >
                    Back
                  </Button>
                )}
                {!isActionRequired && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleTutorNextSim}
                    sx={{ backgroundColor: "#1D2A6D" }}
                  >
                    {tutorStepSim === tutorStepsSim.length - 1
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

export default TutorSim;
