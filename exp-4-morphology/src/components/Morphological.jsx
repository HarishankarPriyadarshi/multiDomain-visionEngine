import { OpenCvProvider } from "opencv-react";
import { useEffect, useRef, useState, useContext } from "react";
import "../morph.css";

import { DialogTitle } from "@mui/material";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";
import { Select, Button, MenuItem } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import voice from "../assets/images/voice-play.png";
import voice_pause from "../assets/images/voice-pause.png";
import { SimContext } from "../components/context/SimContext";
import { TutorSim } from "../components/features/tutor/TutorSim";

export default function Morphological({ handleClose4Modal }) {
  const [image, setImage] = useState(0);
  const [original, setOriginal] = useState(null);
  const [process, setProcess] = useState("dilation");
  const [kernel, setKernel] = useState([
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ]);
  const [isDisabled, setIsDisabled] = React.useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const delayRef = useRef(300);
  const isPausedRef = useRef(false);
  const myPlayButton = useRef(null);
  const myPauseButton = useRef(null);
  const mySpeedUpButton = useRef(null);
  const mySpeedDownButton = useRef(null);
  const isCancelledRef = useRef(false);
  const originalGridRef = useRef(null);
  const [activePixel, setActivePixel] = useState(null);
  const [operationStage, setOperationStage] = useState("");
  const [explanation, setExplanation] = useState("");
  const [step, setStep] = useState(0);
  const [gridMetrics, setGridMetrics] = useState({ cellSize: 20, gap: 2 });
  const totalSteps = 49;

  useEffect(() => {
    handleImage(0);
  }, []);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const grid = originalGridRef.current;
    if (!grid) return undefined;

    // Major modification: measure the rendered grid so the overlay tracks 3x3, 5x5, or 7x7 kernels exactly.
    const updateGridMetrics = () => {
      const styles = window.getComputedStyle(grid);
      const gap = Number.parseFloat(styles.columnGap) || 0;
      const firstCell = grid.querySelector(".morph_matrix");
      const cellSize = firstCell?.getBoundingClientRect().width || 20;
      setGridMetrics({ cellSize, gap });
    };

    updateGridMetrics();

    if (!window.ResizeObserver) {
      window.addEventListener("resize", updateGridMetrics);
      return () => window.removeEventListener("resize", updateGridMetrics);
    }

    const resizeObserver = new ResizeObserver(updateGridMetrics);
    resizeObserver.observe(grid);
    return () => resizeObserver.disconnect();
  }, [original]);

  const [imagesDisabled, setImagesDisabled] = useState(false);

  function handleImage(x) {
    setImage(x);
    const signs = [
      [
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
      ], // Plus
      [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ], // Minus
      [
        [1, 0, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 0, 1, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1],
      ], // Multiply
      [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ], // Divide
    ];
    // Major modification: store each predefined image as the explicit 9x9 padded image.
    setOriginal(padImage(signs[x]));
  }

  const [processed, setProcessed] = useState(null);

  function padImage(image7x7) {
    return [
      Array(9).fill(0),
      ...image7x7.map((row) => [0, ...row, 0]),
      Array(9).fill(0),
    ];
  }

  function makeBlankImage() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  // Clears all transient scan highlights before each new run and reset.
  function clearAnimationState() {
    setStep(0);
    setExplanation("");
    setOperationStage("");
    setActivePixel(null);
  }

  function finishAnimation() {
    setImagesDisabled(false);
    setIsDisabled(false);
    setActivePixel(null);

    if (myPauseButton.current && myPlayButton.current) {
      myPauseButton.current.style.display = "none";
      myPlayButton.current.style.display = "block";
    }

    if (mySpeedUpButton.current && mySpeedDownButton.current) {
      mySpeedUpButton.current.disabled = true;
      mySpeedDownButton.current.disabled = true;
    }
  }

  // Major modification: scan only real image centers (1,1) through (7,7) on the padded 9x9 image.
  async function animateSingleOperation(
    sourceImage,
    mode,
    stageLabel,
    introText,
  ) {
    const nextImage = makeBlankImage();
    const modeName = mode === "dilation" ? "Dilation" : "Erosion";
    const centerOffset = Math.floor(kernel.length / 2);

    setOperationStage(stageLabel);
    setProcessed(nextImage.map((row) => [...row]));

    for (let i = 1; i <= 7; i++) {
      for (let j = 1; j <= 7; j++) {
        if (isCancelledRef.current) return null;

        while (isPausedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (isCancelledRef.current) return null;
        }

        let overlaps = false;
        let fits = true;

        for (let ki = 0; ki < kernel.length; ki++) {
          for (let kj = 0; kj < kernel[0].length; kj++) {
            const ni = i + ki - centerOffset;
            const nj = j + kj - centerOffset;
            if (
              kernel[ki][kj] === 1 &&
              mode === "dilation" &&
              sourceImage[ni][nj] === 1
            ) {
              overlaps = true;
            }

            if (
              kernel[ki][kj] === 1 &&
              mode === "erosion" &&
              sourceImage[ni][nj] === 0
            ) {
              fits = false;
            }
          }
        }

        const outputValue =
          mode === "dilation" ? (overlaps ? 1 : 0) : fits ? 1 : 0;
        nextImage[i][j] = outputValue;

        setActivePixel({ i, j });
        setProcessed(nextImage.map((row) => [...row]));
        setStep((i - 1) * 7 + j);

        const resultText =
          mode === "dilation"
            ? overlaps
              ? ` Current pixel (${i},${j}):\nKernel overlaps at least one foreground pixel.(Hit)\nOutput = 1.`
              : ` Current pixel (${i},${j}):\nNo overlap found. (Miss)\nOutput = 0.`
            : fits
              ? ` Current pixel (${i},${j}):\nAll required foreground positions match.(Hit)\nOutput = 1.`
              : ` Current pixel (${i},${j}):\nA required foreground position contains 0.(Miss)\nOutput = 0.`;

        setExplanation(`${introText || modeName}.\n${resultText}`);

        await new Promise((resolve) => setTimeout(resolve, delayRef.current));
      }
    }

    return nextImage;
  }

  function pauseFun() {
    setIsPaused((prev) => !prev);
  }

  function play() {
    if (myPauseButton.current) {
      myPlayButton.current.style.display = "none";
      myPauseButton.current.style.display = "block";
    }
    mySpeedUpButton.current.disabled = false;
    mySpeedDownButton.current.disabled = false;

    setImagesDisabled(true); // images: plus, minus..

    isCancelledRef.current = false;
    clearAnimationState();
    setProcessed(makeBlankImage());

    setIsDisabled(true); // disabled select box
    setImagesDisabled(true); // images: plus, minus..

    runSelectedOperation();
  }

  function handleReset() {
    isCancelledRef.current = true; // cancel current loop

    setIsPaused(false);
    delayRef.current = 300; // reset delay to default

    myPauseButton.current.style.display = "none";
    myPlayButton.current.style.display = "block";
    myPlayButton.current.disabled = false;

    mySpeedUpButton.current.disabled = false;
    mySpeedDownButton.current.disabled = false;

    setIsDisabled(false); //enabled select box
    setImagesDisabled(false);
    setProcessed(null); // Clear the processed-grid completely
    setProcess("dilation");
    handleImage(0);
    setCurrentIndex(0);
    clearAnimationState();
  }

  async function runSelectedOperation() {
    if (process === "dilation") await dilate();
    else if (process === "erosion") await erode();
    else if (process === "opening") await opening();
    else if (process === "closing") await closing();

    if (!isCancelledRef.current) finishAnimation();
  }

  async function erode() {
    if (!original || !kernel) return;
    await animateSingleOperation(original, "erosion", "", "Erosion");
  }

  async function dilate() {
    if (!original || !kernel) return;
    await animateSingleOperation(original, "dilation", "", "Dilation");
  }

  async function opening() {
    if (!original || !kernel) return;

    const eroded = await animateSingleOperation(
      original,
      "erosion",
      "Stage 1/2: Erosion",
      "Opening = Erosion followed by Dilation.\nCurrent stage: Erosion",
    );
    if (!eroded || isCancelledRef.current) return;

    await animateSingleOperation(
      eroded,
      "dilation",
      "Stage 2/2: Dilation",
      "Opening = Erosion followed by Dilation.\nCurrent stage: Dilation",
    );
  }

  async function closing() {
    if (!original || !kernel) return;

    const dilated = await animateSingleOperation(
      original,
      "dilation",
      "Stage 1/2: Dilation",
      "Closing = Dilation followed by Erosion.\nCurrent stage: Dilation",
    );
    if (!dilated || isCancelledRef.current) return;

    await animateSingleOperation(
      dilated,
      "erosion",
      "Stage 2/2: Erosion",
      "Closing = Dilation followed by Erosion.\nCurrent stage: Erosion",
    );
  }

  const instructions = [
    "1. Click to choose an image.",
    "2. Select a Process.",
    "3. Click on the 'Play' button at the bottom.",
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

  // tutor implementation
  const {
    isMobile,
    startTutorSim,
    handleSpeechToggleSim,
    tutorBtnRefSim,
    isSpeaking,
    isPausedSpeaking,
    setTutorStepsSim,
    resetTutorSim,
  } = useContext(SimContext);

  //   // Dynamic Tutor Steps for Run Length Encoding Simulation

  useEffect(() => {
    const baseSteps = [
      {
        title: "Welcome ",
        content:
          "This simulation demonstrates Dilation, Erosion, Opening, and Closing using a structuring element (kernel). Observe how the kernel scans the image and generates the output image step-by-step.",
        targetId: "guided-tutor-btn-sim",
        placement: "bottom",
      },

      {
        title: "Instruction Panel",
        content:
          "Use the navigation arrows here to read step-by-step instructions for performing the experiment correctly.",
        targetId: "inst_content-zone",
        placement: "bottom",
      },

      {
        title: "Choose Input Image",
        content:
          "Select one of the available binary images. This image will be used as the input image A for the morphological operation, by default the Plus image is selected.",
        targetId: "input-image-zone",
        placement: "right",
        offset: [-12, 10],
      },
      {
        title: "Original Image",
        content:
          "This is the padded binary image A. A border of zeros is added around the image so that kernel behavior at boundaries can be visualized clearly.",
        targetId: "original-image-zone",
        placement: "bottom",
        offset: [0, 10],
      },
      {
        title: "Choose Morphological Operation",
        content:
          "Select the desired operation. Dilation expands foreground regions, Erosion shrinks them, Opening removes small foreground noise, and Closing fills small gaps and holes.",
        targetId: "operation-selection-zone",
        placement: "right",
        offset: [0, 12],
      },
    ];

    baseSteps.push(
      {
        title: "Kernel",
        content:
          "This is the structuring element B. The kernel slides over the image and determines how output pixels are calculated.",
        targetId: "kernel-zone",
        placement: "bottom",
      },

      {
        title: "Reset Simulation",
        content:
          "Click Reset to clear all progress and return the simulation to its initial state.",
        targetId: "resetBtn-zone",
        placement: "right",
        offset: [0, 10],
      },

      {
        title: "Animation Speed Up",
        content: "Use these controls to increase the speed of kernel movement.",
        targetId: "speedUpBtn-zone",
        placement: "right",
        offset: [0, 10],
      },
      {
        title: "Animation Speed Down",
        content: "Use these controls to decrease the speed of kernel movement.",
        targetId: "speedDownBtn-zone",
        placement: "left",
        offset: [0, 10],
      },

      {
        title: "Start Processing",
        content: "Click Play to begin the selected morphological operation.",
        targetId: "playPauseBtn-container",
        placement: "bottom",
      },
    );

    if (!processed || step === 0) {
      console.log("step", step);
      baseSteps.push({
        title: "Action Required",
        content: "Please click Play to begin the morphological operation.",
        targetId: "play-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    baseSteps.push(
      {
        title: "Moving Kernel Overlay",
        content:
          "The transparent red overlay represents the active kernel window. It moves across the image and evaluates neighboring pixels around the kernel center.",
        targetId: "original-image-zone",
        placement: "top",
        offset: [0, 10],
      },

      {
        title: "Kernel Center",
        content:
          "The blue highlighted cell inside the overlay is the kernel center. The output pixel currently being calculated corresponds to this position.",
        targetId: "original-image-zone",
        placement: "top",
        offset: [0, 10],
      },

      {
        title: "Current Processing Explanation",
        content:
          "This panel explains exactly why the current output pixel becomes 0 or 1. It also indicates when the kernel touches padded regions.",
        targetId: "explanation-zone",
        placement: "bottom",
      },


    );
    if(operationStage){
      baseSteps.push(
        {
        title: "Operation Stage",
        content:
          process === "opening"
            ? "Opening consists of two stages: Erosion followed by Dilation."
            : process === "closing"
              ? "Closing consists of two stages: Dilation followed by Erosion."
              : "Single-stage morphological operations show only one processing stage.",
        targetId: "operation-stage-zone",
        placement: "top",
        offset: [0, 10],
      },
      )
    }
    baseSteps.push(


      {
        title: "Output Image",
        content:
          "The processed image is generated progressively as the kernel scans the image. Compare it with the original image to understand the effect of the selected operation.",
        targetId: "processed-img-zone",
        placement: "bottom",
        offset: [0, 10],
      },
    )

    if (step < totalSteps) {
      baseSteps.push({
        title: "Processing In Progress",
        content:
          "The kernel is still scanning the image. Wait until all pixels have been processed.",
        targetId: "step-counter-zone",
        placement: "bottom",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    baseSteps.push({
      title: "Simulation Completed",
      content:
        process === "dilation"
          ? "Dilation completed successfully. Observe how foreground regions expanded."
          : process === "erosion"
            ? "Erosion completed successfully. Observe how foreground regions shrank."
            : process === "opening"
              ? "Opening completed successfully. Small foreground noise has been removed."
              : "Closing completed successfully. Small gaps and holes have been filled.",
      targetId: "processed-img-zone",
      placement: "bottom",

    });

    setTutorStepsSim(baseSteps);
  }, [original, process, processed, step, operationStage, activePixel]);
  return (
    <OpenCvProvider>
      <div id="main-box-morph">
        <DialogTitle id="instructions-dialog-title" className="rle-titlebar">
          <div
            style={{
              width: "50%",
              justifyContent: "flex-start",
              display: "flex",
            }}
          >
            {isMobile ? "Simulation" : "Morphological Operations Visualizer"}
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
              title={isSpeaking && !isPausedSpeaking ? "Pause" : "Play"}
              onClick={handleSpeechToggleSim}
            >
              <img
                src={isSpeaking && !isPausedSpeaking ? voice_pause : voice}
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
        <div
          id="inst_div"
          style={{
            width: "80%",
            margin: "auto",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div
            id="inst_content-zone"
            style={{
              padding: "2px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              minHeight: "30px",
              backgroundColor: "black",
              color: "white",
            }}
          >
            <div id="inst_content">
              <button
                className="prev-btn"
                onClick={prevSlide}
                style={{ marginRight: "10px" }}
              >
                <span className="prev-icon" aria-hidden="true"></span>
              </button>
              <span>{instructions[currentIndex]}</span>
              <button className="next-btn" onClick={nextSlide}>
                <span className="next-icon" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>

        <div id="Choose_box_morph">
          <div className="coolinput_morph">
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
              <div
                id="input-image-zone"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div id="image-box-morph">
                  <div onClick={() => !imagesDisabled && handleImage(0)}>
                    <img
                      src={plus}
                      id="image-morph"
                      className={image === 0 ? "image-selected" : ""}
                      style={{
                        opacity: imagesDisabled ? 0.7 : 1,
                        cursor: imagesDisabled ? "not-allowed" : "pointer",
                      }}
                    />
                  </div>
                  <div onClick={() => !imagesDisabled && handleImage(1)}>
                    <img
                      src={minus}
                      id="image-morph"
                      className={image === 1 ? "image-selected" : ""}
                      style={{
                        opacity: imagesDisabled ? 0.7 : 1,
                        cursor: imagesDisabled ? "not-allowed" : "pointer",
                      }}
                    />
                  </div>
                  <div onClick={() => !imagesDisabled && handleImage(2)}>
                    <img
                      src={multiply}
                      id="image-morph"
                      className={image === 2 ? "image-selected" : ""}
                      style={{
                        opacity: imagesDisabled ? 0.7 : 1,
                        cursor: imagesDisabled ? "not-allowed" : "pointer",
                      }}
                    />
                  </div>
                  <div onClick={() => !imagesDisabled && handleImage(3)}>
                    <img
                      src={divide}
                      id="image-morph"
                      className={image === 3 ? "image-selected" : ""}
                      style={{
                        opacity: imagesDisabled ? 0.7 : 1,
                        cursor: imagesDisabled ? "not-allowed" : "pointer",
                      }}
                    />
                  </div>
                </div>
              </div>

              <hr className="custom-divider" />

              <div
                id="operation-selection-zone"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div id="tool-box">
                  <h4 style={{ color: "#1D2A6D", margin: "0px" }}>
                    Process :{" "}
                  </h4>
                  <Select
                    onChange={(e) => setProcess(e.target.value)}
                    value={process}
                    disabled={isDisabled}
                    sx={{
                      color: "#1D2A6D",
                      "& .MuiSelect-icon": {
                        color: "#1D2A6D", // Replace with your desired color
                      },
                      "& .MuiSelect-select": {
                        // Remove padding inside the Select (input box)
                        paddingTop: 1,
                        paddingBottom: 1,
                      },
                    }}
                  >
                    <MenuItem value={"dilation"}>Dilation</MenuItem>
                    <MenuItem value={"erosion"}>Erosion</MenuItem>
                    <MenuItem value={"opening"}>Opening</MenuItem>
                    <MenuItem value={"closing"}>Closing</MenuItem>
                  </Select>
                </div>
              </div>
            </Box>
          </div>
        </div>

        <div id="process-box-morph">
          <div id="original-kernel-morph">
            {/* Major modification: original image is now the real 9x9 padded image with a transparent overlay kernel. */}
            <div id="orig-morph">
              <h2>Original Image(A) with Explicit Padding</h2>
              <div id="original-image-zone" className="morph-grid-wrap">
                {activePixel && (
                  <div
                    id="kernel-overlay-zone"
                    className="morph-kernel-overlay"
                    style={{
                      top: `${
                        (activePixel.i - Math.floor(kernel.length / 2)) *
                        (gridMetrics.cellSize + gridMetrics.gap)
                      }px`,
                      left: `${
                        (activePixel.j - Math.floor(kernel[0].length / 2)) *
                        (gridMetrics.cellSize + gridMetrics.gap)
                      }px`,
                      width: `${
                        kernel[0].length * gridMetrics.cellSize +
                        (kernel[0].length - 1) * gridMetrics.gap
                      }px`,
                      height: `${
                        kernel.length * gridMetrics.cellSize +
                        (kernel.length - 1) * gridMetrics.gap
                      }px`,
                    }}
                  >
                    <div
                      className="morph-kernel-overlay-grid"
                      style={{
                        gridTemplateColumns: `repeat(${kernel[0].length}, 1fr)`,
                        gridTemplateRows: `repeat(${kernel.length}, 1fr)`,
                      }}
                    >
                      {kernel.flat().map((_, cellIndex) => {
                        const rowIndex = Math.floor(
                          cellIndex / kernel[0].length,
                        );
                        const colIndex = cellIndex % kernel[0].length;
                        const isCenter =
                          rowIndex === Math.floor(kernel.length / 2) &&
                          colIndex === Math.floor(kernel[0].length / 2);

                        return (
                          <div
                            key={`overlay-${rowIndex}-${colIndex}`}
                            className={isCenter ? "morph-kernel-center" : ""}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="morph-grid morph-grid-9" ref={originalGridRef}>
                  {original &&
                    original.map((row, rowIndex) =>
                      row.map((cell, cellIndex) => {
                        const isPadding =
                          rowIndex === 0 ||
                          rowIndex === 8 ||
                          cellIndex === 0 ||
                          cellIndex === 8;

                        return (
                          <div
                            key={`${rowIndex}-${cellIndex}`}
                            className={`morph_matrix matrix-animate ${
                              isPadding ? "morph-padding-cell" : ""
                            }`}
                            style={{
                              animationDelay: `${rowIndex * 0.15}s`,
                              backgroundColor: isPadding
                                ? "#333333"
                                : cell === 0
                                  ? "black"
                                  : "white",
                            }}
                          ></div>
                        );
                      }),
                    )}
                </div>
              </div>
              <p className="matrix_label">9 x 9</p>
            </div>

            <div className="morph_op">
              {process === "dilation"
                ? "⊕"
                : process === "erosion"
                  ? "⊖"
                  : process === "opening"
                    ? "○"
                    : "●"}
            </div>
            {/* kernel */}
            <div id="kernel-morph">
              <h2>Kernel(B)</h2>
              <div
                id="kernel-zone"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2px",
                }}
              >
                {kernel.map((row, rowIndex) =>
                  row.map((cell, cellIndex) => {
                    const isCenter =
                      rowIndex === Math.floor(kernel.length / 2) &&
                      cellIndex === Math.floor(kernel[0].length / 2);

                    return (
                      <div
                        key={`${rowIndex}-${cellIndex}`}
                        className="morph_matrix matrix-animate"
                        style={{
                          animationDelay: `${rowIndex * 0.15}s`,
                          backgroundColor: cell === 0 ? "black" : "white",
                          border: isCenter
                            ? "2px solid #6089B7"
                            : "1px solid gray",
                        }}
                      ></div>
                    );
                  }),
                )}
              </div>
            </div>
            {/* operation stage symbol */}
            <div className="morph_op morph_op_container">
              <div className="morph_op_text">
                {" "}
                {process === "dilation"
                  ? "A ⊕ B"
                  : process === "erosion"
                    ? "A ⊖ B"
                    : process === "opening"
                      ? "A ○ B"
                      : "A ● B"}
              </div>
              <div className="morph_op_arrow">───➤ </div>
            </div>
            {/* processed image */}
            <div id="animation-morph">
              {operationStage && (
                <div
                id="operation-stage-zone"
                  style={{
                    color: "#1D2A6D",
                    fontWeight: "700",
                    marginBottom: "6px",
                  }}
                >
                  {operationStage}
                </div>
              )}
              {processed && (
                <h2>
                  Processed Image
                  {step !== 0 && (
                    <div style={{ fontSize: "14px", color: "#38383aff" }}>
                      {process && `Step ${step} / ${totalSteps}`}
                    </div>
                  )}
                </h2>
              )}

              <div id="processed-img-zone" className="morph-grid morph-grid-9">
                {processed &&
                  processed.map((row, rowIndex) =>
                    row.map((cell, cellIndex) => (
                      <div
                        key={`${rowIndex}-${cellIndex}`}
                        className="morph_matrix"
                        id="processed-img-morph"
                        style={{
                          backgroundColor: cell === 0 ? "black" : "white",
                        }}
                      ></div>
                    )),
                  )}
              </div>
              {processed && <p className="matrix_label">9 x 9</p>}
            </div>
          </div>
          {/* Current pixel panel reports the padded-grid center followed by the moving overlay. */}
          {/* explanation */}
          {processed && (
            <div className="explanation-container">
              <div id="explanation-zone" className="explanation-content">
                <h4>
                  <strong>Stepwise Explanation:</strong>
                </h4>
                <div style={{ whiteSpace: "pre-line" }}>{explanation}</div>
              </div>
            </div>
          )}
        </div>

        {/* footer buttons */}
        <div id="footer_buttons" className="morph_btn footer-animate">
          <div className="button-container " style={{ height: "fit-content" }}>
            <button
              id="speedDownBtn-zone"
              onClick={() => (delayRef.current += 100)}
              ref={mySpeedDownButton}
              title="speed down"
              className="commmon-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <g transform="scale(-1,1) translate(-24,0)">
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M12 13.333l-9.223 6.149A.5.5 0 0 1 2 19.066V4.934a.5.5 0 0 1 .777-.416L12 10.667V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832l-10.599 7.066a.5.5 0 0 1-.777-.416v-5.733zM10.394 12L4 7.737v8.526L10.394 12zM14 7.737v8.526L20.394 12 14 7.737z" />
                </g>
              </svg>
            </button>
            <div id="playPauseBtn-container">
              <button
                id="playBtn-zone"
                ref={myPlayButton}
                onClick={() => play()}
                title="Play"
                className="commmon-btn"
                style={{ dispslay: "block" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
              </button>

              <button
                id="pauseBtn-zone"
                ref={myPauseButton}
                onClick={() => pauseFun()}
                title={isPaused ? "Play" : "Pause"}
                className="commmon-btn"
                style={{ display: "none" }}
              >
                {isPaused ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                )}
              </button>
            </div>

            <button
              id="speedUpBtn-zone"
              onClick={() =>
                (delayRef.current = Math.max(50, delayRef.current - 100))
              }
              ref={mySpeedUpButton}
              title="speed up"
              className="commmon-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <g>
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M12 13.333l-9.223 6.149A.5.5 0 0 1 2 19.066V4.934a.5.5 0 0 1 .777-.416L12 10.667V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832l-10.599 7.066a.5.5 0 0 1-.777-.416v-5.733zM10.394 12L4 7.737v8.526L10.394 12zM14 7.737v8.526L20.394 12 14 7.737z" />
                </g>
              </svg>
            </button>

            <button
              id="resetBtn-zone"
              title="reset"
              onClick={() => handleReset()}
              className="commmon-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="none"
              >
                <g clip-path="url(#clip0_1276_7761)">
                  <path
                    d="M19.7285 10.9288C20.4413 13.5978 19.7507 16.5635 17.6569 18.6573C15.1798 21.1344 11.4826 21.6475 8.5 20.1966M18.364 8.05071L17.6569 7.3436C14.5327 4.21941 9.46736 4.21941 6.34316 7.3436C3.42964 10.2571 3.23318 14.8588 5.75376 18M18.364 8.05071H14.1213M18.364 8.05071V3.80807"
                    stroke="#1C274C"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1276_7761">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
        </div>
        {/* tutor modal */}
        <TutorSim />
      </div>
    </OpenCvProvider>
  );
}
