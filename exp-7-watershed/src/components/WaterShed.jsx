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
  const [currentStep, setCurrentStep] = useState(0);
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
    setCurrentStep(0);
  }
  useEffect(() => {
    handleImage(0);
  }, []);

  //   instructions
  const instructions = [
    "1 Click to select an image and observe the resulting image.",
    "2 Click to select an image and observe the resulting image.",
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

        {/* <div>
          <p
            style={{
              marginTop: "20px",
              fontSize: "16px",
              lineHeight: "1.5",
              marginLeft: "10px",
              marginRight: "10px",
              textAlign: "justify",
            }}
          >
            The Watershed algorithm uses a heatmap representation where higher
            intensity values form hills and lower intensity values form valleys.
            It simulates filling these valleys with water, and as the water
            levels rise, the boundaries where different water sources meet are
            marked with red edges, representing the segmentation result.
          </p>
        </div> */}

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
              <button onClick={() => setCurrentStep(0)}>
                <FiRefreshCw />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                <FaChevronLeft />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentStep((prev) => Math.min(2, prev + 1))}
                disabled={currentStep === 2}
              >
                <span>Next</span>
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div id="water_arrow">&#129066;</div>

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
                {stepInfo[currentStep].title}
              </h2>
              <p style={{ textAlign: "justify" }}>
                {stepInfo[currentStep].content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </OpenCvProvider>
  );
}
