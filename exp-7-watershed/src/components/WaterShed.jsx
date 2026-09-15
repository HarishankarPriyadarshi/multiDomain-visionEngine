import "../region_animation.css";
import "../App.css";
import { useEffect, useRef, useState, useContext } from "react";
import { OpenCvProvider } from "opencv-react";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";
import VoxelScene from "./WaterScene";
import Box from "@mui/material/Box";
import {
  Button,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Tooltip,
} from "@mui/material";
import { SimContext } from "./context/SimContext";

import voice from "../assets/images/voice-play.png";
import voice_pause from "../assets/images/voice-pause.png";
import { FiRefreshCw } from "react-icons/fi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import TutorSim from "./features/tutor/TutorSim";

export default function WaterShed({ handleClose4Modal }) {
  const [image, setImage] = useState(0);
  const [original, setOriginal] = useState(null);
  const [imageAnimateKey, setImageAnimateKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  function handleImage(x) {
    setImage(x);
    setImageAnimateKey((prev) => prev + 1);
    const signs = [
      // Plus (9x9)
      [
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
      ],
      // Minus (9x9)
      [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      // Multiply (9x9)
      [
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
      ],
      // Divide (9x9)
      [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    ];
    setOriginal(signs[x]);
    setCurrentStep(-1);
    setIsVisible(false);
  }
  useEffect(() => {
    handleImage(0);
  }, []);

  function handleNextStep() {
    setCurrentStep((prev) => Math.min(2, prev + 1));
    setIsVisible(true);
  }
  function handleRefresh() {
    setCurrentStep(-1);
    setIsVisible(false);
  }
  function handlePreviousStep() {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setIsVisible(true);
  }
  useEffect(() => {
    setCurrentStep(-1);
  }, []);

  //   instructions
  const instructions = [
    "Step 1: select a binary image from image box ",
    "Step 2: click the next button to start the simulation.",
    "Step 3: observe the terrain formation.",
    "Step 4: observe the water filling.",
    "Step 5: observe the watershed boundaries.",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % instructions.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + instructions.length) % instructions.length,
    );
  };
  const stepInfo = [
    {
      title: "Step 1: Terrain Formation",
      content:
        "The binary image is converted into a 3D terrain. White pixels become elevated hills while black pixels remain at ground level.",
    },
    {
      title: "Step 2: Water Filling",
      content:
        "Water starts rising from the lower regions of the terrain. The flooding process helps visualize how catchment basins are formed.",
    },
    {
      title: "Step 3: Watershed Boundaries",
      content:
        "Red boundaries are highlighted along the region edges. These watershed lines separate different regions and represent the final segmentation result.",
    },
  ];

  // tutor implementation
  const {
    isMobile,
    startTutorSim,
    handleSpeechToggleSim,
    tutorBtnRefSim,
    isSpeaking,
    isPaused,
    setTutorStepsSim,
    resetTutorSim,
  } = useContext(SimContext);

  useEffect(() => {
    const baseSteps = [
      {
        title: " Watershed Segmentation Simulation",
        content:
          "This guided walkthrough demonstrates the Watershed Segmentation algorithm. The algorithm treats an image as a topographic surface, floods low regions with water, and identifies watershed boundaries that separate different regions.",
        targetId: "guided-tutor-btn-sim",
        placement: "bottom",
      },

      {
        title: "Instruction Panel",
        content:
          "Use the navigation arrows here to read step-by-step instructions for performing the Watershed Segmentation experiment.",
        targetId: "inst_content_container",
        placement: "bottom",
      },

      {
        title: "Choose Input Image",
        content:
          "Select one of the predefined binary images. The selected image will be used as the input terrain for the Watershed Segmentation process.",
        targetId: "Choose_box_region",
        placement: "right",
        offset: [0, 10],
      },
        {  title: "Input Image and Terrain",
    content:
      "The selected image is displayed here. For the 3D visualization, its binary representation is converted into a simplified terrain, where foreground regions form elevated areas and background regions remain lower.",
    targetId: "original-image-temp",
    placement: "right",
    offset: [0, 10],
  },

      {
        title: "Reset Button",
        content:
          "You can click the Reset button to return to its initial state .",
        targetId: "reset-btn",
        placement: "bottom",
      },

      {
        title: "Simulation Start",
        content: "Click the Next button to start the simulation.",
        targetId: "next-btn",
        placement: "bottom",
      },
    ];

    if (currentStep === -1) {
      baseSteps.push({
        title: "Action Required",
        content: "Please click the Next button to continue the simulation.",
        targetId: "next-btn",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    /* STEP 0 */
    if (currentStep === 0) {
      baseSteps.push(
        {
          title: "Step 1: Topographic Surface Generation",
          content:
            "The binary image is converted into a 3D terrain representation. Foreground pixels become elevated regions, while background pixels remain at lower levels. Observe the resulting hills and plateaus, which correspond to objects that will later be separated by watershed boundaries during segmentation.",
          targetId: "water_shed",
          placement: "top",
          offset: [0, 10],
        },

        {
          title: "Action Required",
          content: "Click the Next button to begin the flooding process.",
          targetId: "next-btn",
          placement: "top",
          offset: [0, 10],
        },
      );

      setTutorStepsSim(baseSteps);
      return;
    }

    /* STEP 1 */
    if (currentStep === 1) {
      baseSteps.push(
        {
          title: "Step 2: Flooding Simulation",
          content:
            "Water gradually rises through the lower regions, forming catchment basins while elevated areas remain visible. This flooding process helps separate neighboring regions.",
          targetId: "water_shed",
          placement: "top",
          offset: [0, 10],
        },

        {
          title: "Action Required",
          content: "Click the Next button to identify watershed boundaries.",
          targetId: "next-btn",
          placement: "top",
          offset: [0, 10],
        },
      );

      setTutorStepsSim(baseSteps);
      return;
    }

    /* STEP 2 */
    if (currentStep === 2) {
      baseSteps.push({
        title: "Step 3: Watershed Boundary Detection",
        content:
          "After flooding When neighboring catchment basins meet, watershed boundaries are established between them. The red lines indicate these boundaries and define the separation between the segmented regions.",
        targetId: "water_shed",
        placement: "top",
        offset: [0, 10],
      });
    }
    baseSteps.push({
      title: "Watershed Algo Completed",
      content:
        "Congratulations! You have successfully visualized terrain generation, flooding simulation, and watershed boundary detection.",
      targetId: "water_shed",
      placement: "bottom",
      offset: [0, 10],
    });

    setTutorStepsSim(baseSteps);
  }, [currentStep, currentStep]);

  return (
    <OpenCvProvider>
      <div id="main-box-region">
        <DialogTitle id="instructions-dialog-title" className="rle-titlebar">
          <div
            style={{
              width: "50%",
              justifyContent: "flex-start",
              display: "flex",
            }}
          >
            {isMobile ? "Simulation" : "Waterhed Algorithm"}
          </div>
          <div
            style={{
              width: "50%",

              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Button
              id="guided-tutor-btn-sim"
              ref={tutorBtnRefSim}
              style={{
                color: "#1D2A6D",
                backgroundColor: "#FFD700",
                fontWeight: "bold",
                margin: "auto auto",
                marginRight: "10px",
                borderRadius: "20px",
                padding: "5px 15px",
                height: "40px",
              }}
              onClick={startTutorSim}
            >
              {isMobile ? "Tutor" : "Guided Tutor"}
            </Button>
            <Button
              id="sound-btn-sim"
              title={isSpeaking && !isPaused ? "Pause" : "Play"}
              onClick={handleSpeechToggleSim}
            >
              <img
                src={isSpeaking && !isPaused ? voice_pause : voice}
                alt="voice"
                style={{ width: "40px", height: "auto", marginRight: "10px" }}
              />
            </Button>
            <Button
              onClick={() => {
                resetTutorSim();
                handleClose4Modal();
              }}
              color="primary"
              style={{ backgroundColor: "beige", marginRight: "10px" }}
            >
              Close
            </Button>
          </div>
        </DialogTitle>
        <div id="inst_div_edge">
          <div
            id="inst_content_container"
            style={{
              padding: "2px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              minHeight: "30px",
              backgroundColor: "black",
              color: "white",
            }}
          >
            <div id="inst_content_edge">
              <button onClick={prevSlide} style={{ marginRight: "10px" }}>
                <span className="prev-icon" aria-hidden="true">
                  ⮜
                </span>
              </button>
              <span>{instructions[currentIndex]}</span>
              <button onClick={nextSlide} style={{ zIndex: 10001 }}>
                <span className="next-icon" aria-hidden="true">
                  ⮞
                </span>
              </button>
            </div>
          </div>
        </div>

        <div id="Choose_box_region">
          <div className="coolinput_region">
            <label htmlFor="input" className="text">
              Choose:
            </label>
            <Box
              sx={{
                width: "100%",
                height: "85%",
                display: "flex",
                flexDirection: "row",
                border: 1,
                borderRadius: 2,
                justifyContent: "space-around",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div id="choose-image-box-region">
                  <div onClick={() => handleImage(0)}>
                    <img
                      src={plus}
                      id="image"
                      className={image === 0 ? "image-selected" : ""}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div onClick={() => handleImage(1)}>
                    <img
                      src={minus}
                      id="image"
                      className={image === 1 ? "image-selected" : ""}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div onClick={() => handleImage(2)}>
                    <img
                      src={multiply}
                      id="image"
                      className={image === 2 ? "image-selected" : ""}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div onClick={() => handleImage(3)}>
                    <img
                      src={divide}
                      id="image"
                      className={image === 3 ? "image-selected" : ""}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>
            </Box>
          </div>
        </div>

        <div id="image-box-region">
          <div id="left-image-box-region">
            <div id="head-image-temp">
              <h1>Original Image</h1>
            </div>
            <div id="original-image-temp">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(9, 1fr)",
                  gap: "2px",
                }}
              >
                {original &&
                  original.map((row, rowIndex) =>
                    row.map((cell, cellIndex) => (
                      <div
                        key={`${rowIndex}-${cellIndex}-${imageAnimateKey}`}
                        id="original_matrix_region"
                        className="matrix-animate"
                        style={{
                          backgroundColor: cell === 0 ? "black" : "white",
                          animationDelay: `${rowIndex * 0.15}s`,
                        }}
                      ></div>
                    )),
                  )}
              </div>
            </div>
            {/* control buttons */}

            <div className="control-buttons">
              <button id="reset-btn" onClick={handleRefresh}>
                <FiRefreshCw />
                <span>Reset</span>
              </button>

              <button onClick={handlePreviousStep} disabled={currentStep <= 0}>
                <FaChevronLeft />
                <span>Previous</span>
              </button>

              <button
                id="next-btn"
                onClick={handleNextStep}
                disabled={currentStep === 2}
              >
                <span>Next</span>
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div id="water_arrow">&#129066;</div>

          {isVisible && (
            <div id="right-image-box-region">
              <div id="head-image-temp">
                <h1>Output Image</h1>
              </div>
              <div id="original-image-temp-water">
                <VoxelScene
                  binaryMap={original}
                  maxY={1}
                  currentStep={currentStep}
                />
              </div>
              <div id="explanation-box">
                <h2 style={{ textAlign: "center" }}>
                  {stepInfo[currentStep]?.title}
                </h2>
                <p style={{ textAlign: "justify" }}>
                  {stepInfo[currentStep]?.content}
                </p>
              </div>
            </div>
          )}
          {!isVisible && <div id="right-image-box-region"></div>}
        </div>
        {/* tutor modal */}
        <TutorSim />
      </div>
    </OpenCvProvider>
  );
}
