import "../ee.css";
import React from "react";
import { useEffect, useRef, useState, useContext } from "react";
import Box from "@mui/material/Box";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";
import { Select, Button, DialogTitle } from "@mui/material";

import { OpenCvProvider } from "opencv-react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { SimContext } from "./context/SimContext";

import voice from "../assets/images/voice-play.png";
import voice_pause from "../assets/images/voice-pause.png";
import TutorSim from "./features/tutor/TutorSim";

export default function EdgeExplanation({ handleClose2Modal }) {
  const [image, setImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [kernel, setKernel] = useState("sobel");
  const [original, setOriginal] = useState(null);
  const [kernelx, setKernelX] = useState(null);
  const [kernely, setKernelY] = useState(null);

  const equation1 =
    kernel === "laplacian"
      ? "\\Delta I = |\\nabla^2 I|"
      : "\\Delta G = \\sqrt{(\\Delta x)^2 + (\\Delta y)^2}";

  const equation2 = " \\frac{\\Delta G}{Max Value * 255}";

  const [label, setLabel] = useState("3 x 3");
  const [resultLabel, setResultLabel] = useState("5 x 5");
  const [isPausedSimulation, setIsPausedSimulation] = useState(false);
  const delayRef = useRef(300);
  const isPausedSimulationRef = useRef(false);
  const myPlayButton = useRef(null);
  const myPauseButton = useRef(null);
  const mySpeedUpButton = useRef(null);
  const mySpeedDownButton = useRef(null);

  const runIdRef = useRef(0);
  const [isDisabled, setIsDisabled] = React.useState(false);
  const [imagesDisabled, setImagesDisabled] = useState(false);
  // for style
  const [activeDX, setActiveDX] = useState({ row: -1, col: -1 });
  const [activeDY, setActiveDY] = useState({ row: -1, col: -1 });
  const [activeRes, setActiveRes] = useState({ row: -1, col: -1 });
  const [completedDX, setCompletedDX] = useState([]);
  const [completedDY, setCompletedDY] = useState([]);
  const [completedRes, setCompletedRes] = useState([]);
  const [imageAnimateKey, setImageAnimateKey] = useState(0);
  const [kernelAnimateKey, setKernelAnimateKey] = useState(0);

  // state tracking and animation for gaussian kernel
  const [convSteps, setConvSteps] = useState({ x: [], y: [], result: [] }); // for X,Y, and Result
  const [currentSum, setCurrentSum] = useState({ x: 0, y: 0, result: 0 }); // for X,Y, and Result
  const [step, setStep] = useState(0);
  const [firstKernelCalculated, setFirstKernelCalculated] = useState(false);
  const [isConceptAnimationPlaying, setIsConceptAnimationPlaying] =
    useState(false);
  // from SimContext
  const {
    isMobile,
    startTutorSim,
    handleSpeechToggleSim,
    tutorBtnRefSim,
    isSpeaking,
    isPaused,
    setTutorStepsSim,
    isSimPlaying,
    setIsSimPlaying,
    resetTutorSim,
    isTutorOpenSim,
    tutorStepSim,
    setTutorStepSim,
  } = useContext(SimContext);

  const getKernelDescription = () => {
    switch (kernel) {
      case "sobel":
        return "Sobel uses first-order derivative kernels in the X and Y directions to detect intensity changes while providing some smoothing.";

      case "prewitt":
        return "Prewitt uses first-order derivative kernels in the X and Y directions to detect horizontal and vertical intensity changes.";

      case "roberts":
        return "Roberts uses small 2×2 kernels to detect rapid intensity changes along diagonal directions.";

      case "scharr":
        return "Scharr uses optimized first-order derivative kernels in the X and Y directions for improved gradient estimation.";

      case "laplacian":
        return "Laplacian is a second-order derivative operator that uses a single kernel to detect regions of rapid intensity change.";

      default:
        return "The selected operator is applied to detect intensity changes in the image.";
    }
  };

  const imageName =
    image === 0
      ? "Plus"
      : image === 1
        ? "Minus"
        : image === 2
          ? "Multiply"
          : "Divide";

  const operatorImageContent = {
    sobel: `The resultant Sobel image for the ${imageName} input image is normalized and displayed as the final edge-detected image. The Sobel operator calculates intensity changes in the horizontal and vertical directions. Pixels with larger gradient values indicate significant intensity changes and are displayed brighter, representing detected edges.`,

    prewitt: `The resultant Prewitt image for the ${imageName} input image is normalized and displayed as the final edge-detected image. The Prewitt operator calculates intensity changes in the horizontal and vertical directions. Pixels with larger gradient values indicate significant intensity changes and are displayed brighter, representing detected edges.`,

    roberts: `The resultant Roberts image for the ${imageName} input image is normalized and displayed as the final edge-detected image. The Roberts operator detects rapid intensity changes along diagonal directions. Pixels with larger gradient values indicate significant intensity changes and are displayed brighter, representing detected edges.`,

    scharr: `The resultant Scharr image for the ${imageName} input image is normalized and displayed as the final edge-detected image. The Scharr operator calculates intensity changes in the horizontal and vertical directions. Pixels with larger gradient values indicate significant intensity changes and are displayed brighter, representing detected edges.`,

    laplacian: `The resultant Laplacian image for the ${imageName} input image is normalized and displayed as the final edge-detected image. The Laplacian operator calculates the second-order intensity change using a single kernel. Regions with larger Laplacian responses indicate rapid changes in image intensity and are displayed brighter, representing detected edges.`,

    default: `The resultant image for the ${imageName} input image is normalized and displayed as the final edge-detected image. Regions with significant intensity changes produce stronger derivative responses and are displayed brighter, indicating detected edges.`,
  };
  useEffect(() => {
    const baseSteps = [
      {
        title: "Welcome",
        content:
          "Welcome to the Gradient Convolution Visualization experiment. In this simulation, you will observe how edge detection works step-by-step using convolution with Kernel X and Kernel Y operators.",
        targetId: "guided-tutor-btn-sim",
        placement: "top",
      },
      {
        title: "Instruction Panel",
        content:
          "Use the navigation arrows here to read step-by-step instructions for performing the experiment correctly.",
        targetId: "inst_content_container",
        placement: "bottom",
      },
      {
        title: "Select Input Image",
        content:
          "Select a sample binary image (Plus, Minus, Multiply, or Divide). This 7×7 image will be used for convolution processing, by default the Plus image is selected.",
        targetId: "image-box",
        placement: "right",
      },
      {
        title: "Selected Image",
        content: `You can see the selected ${image === 0 ? "Plus" : image === 1 ? "Minus" : image === 2 ? "multiply" : "divide"} image in the image box.`,
        targetId: "ogimage",
        placement: "right",
      },
      {
        title: "Select Edge Detection Kernel",
        content: `You have selected ${kernel}. ${getKernelDescription()}`,
        targetId: "tool-box",
        placement: "right",
      },
      {
        title:
          kernel === "laplacian" ? "Laplacian Kernel" : "Kernel X and Kernel Y",

        content:
          kernel === "laplacian"
            ? `You have selected the Laplacian operator. ${getKernelDescription()} Observe the single Laplacian kernel used to calculate the second-order derivative response of the image.`
            : `You have selected ${kernel}. ${getKernelDescription()} Observe Kernel X and Kernel Y matrices for the selected ${kernel} kernel. Kernel X calculates the intensity gradient in the X-direction, while Kernel Y calculates the intensity gradient in the Y-direction.`,

        targetId: "kernels",
        placement: "top",
      },
      {
        title: "Speed Down",
        content:
          "You can click the Speed Down button to slow the convolution animation.",
        targetId: "speed-down-btn",
        placement: "bottom",
      },
      {
        title: "Speed Up",
        content:
          "You can click the Speed Up button to increase the convolution speed. ",
        targetId: "speed-up-btn",
        placement: "bottom",
      },
      {
        title: "Reset",
        content:
          "You can click the Reset button to stop the simulation and return everything to the initial state. ",
        targetId: "reset-btn",
        placement: "bottom",
      },
      {
        title: "Play / Pause",
        content:
          "Now, Click the Play button to start the convolution process.  You can pause the simulation at any time by clicking the Pause button.",
        targetId: "sim-play-pause-btn",
        placement: "bottom",
      },
    ];

    //  If simulation NOT started

    if (!isConceptAnimationPlaying) {
      baseSteps.push({
        title: "Action Required",
        content:
          "Please click the Play button to begin the convolution process.",
        targetId: "sim-play-pause-btn",
        placement: "bottom",
      });
      setTutorStepsSim(baseSteps);
      return;
    }

    if (kernel === "laplacian") {
      // ==============================
      // Laplacian Tutor Flow
      // ==============================
      baseSteps.push(
        {
          title: "Sliding Window Operation",
          content:
            "The highlighted red window shows the current region being multiplied with the Laplacian kernel. Each overlapping element is multiplied and summed step-by-step.",
          targetId: "kernel-sliding-box",
          placement: "top",
          offset: [-10, 12],
        },
        {
          title: "Observe Laplacian Convolution Steps",
          content:
            "Here you can see the detailed multiplication steps and running sum for the Laplacian kernel during convolution.",
          targetId: "convStepsX",
          placement: "right",
          offset: [1, 12],
        },
        {
          title: "Laplacian Response",
          content:
            "After each window operation, the Laplacian response  is generated and stored in the result matrix. It represents the second-order intensity change at each pixel.",
          targetId: "tutorDXGrid",
          placement: "top",
          offset: [-10, 32],
        },
        {
          title: "Laplacian Result Calculation",
          content:
            "The absolute value of the Laplacian response  is calculated to represent the strength of the intensity change detected by the Laplacian operator.",
          targetId: "tutorResCalculationGrid",
          placement: "top",
          offset: [-10, 32],
        },
        {
          title: "Laplacian Result",
          content:
            "After each window operation, the absolute Laplacian response  is calculated and stored in the resultant matrix. Larger values indicate stronger intensity changes.",
          targetId: "tutorResGrid",
          placement: "top",
          offset: [-10, 12],
        },
        {
          title: "Resultant Image",
          content: operatorImageContent[kernel] || operatorImageContent.default,
          targetId: "tutorResImageGrid",
          placement: "bottom",
          offset: [-10, 12],
        },
        {
          title: "Experiment Completed",
          content:
            "Congratulations! You have successfully visualized how Laplacian-based edge detection works using second-order derivative convolution.",
          targetId: "tutorResImageGrid",
          placement: "top",
        },
      );
    } else {
      // ==============================
      // First-Order Tutor Flow
      // ==============================
      baseSteps.push(
        {
          title: "Sliding Window Operation",
          content:
            "The highlighted red window shows the current region being multiplied with the kernel. Each overlapping element is multiplied and summed step-by-step.",
          targetId: "kernel-sliding-box",
          placement: "top",
          offset: [-10, 12],
        },
        {
          title: "Observe Kernel X Convolution Steps",
          content:
            "Here you can see the detailed multiplication steps and running sum for Kernel X during convolution.",
          targetId: "convStepsX",
          placement: "right",
          offset: [1, 12],
        },
        {
          title: "Gradient X",
          content:
            "After each window operation, ΔX values are generated and stored in their respective result matrices.",
          targetId: "tutorDXGrid",
          placement: "top",
          offset: [-10, 32],
        },
        {
          title: "Observe Kernel Y Convolution Steps",
          content:
            "Here you can see the detailed multiplication steps and running sum for Kernel Y during convolution.",
          targetId: "convStepsY",
          placement: "left",
          offset: [1, 12],
        },
        {
          title: "Gradient Y",
          content:
            "After each window operation, ΔY values are generated and stored in their respective result matrices.",
          targetId: "tutorDYGrid",
          placement: "bottom",
          offset: [-10, 32],
        },
        {
          title: "Resultant ΔG Calculation",
          content:
            "The gradient magnitude ΔG is calculated from ΔX and ΔY. It represents the overall strength of intensity change at each pixel.",
          targetId: "tutorResCalculationGrid",
          placement: "top",
          offset: [-10, 32],
        },
        {
          title: "Resultant Gradient",
          content:
            "After each window operation, the gradient magnitude ΔG is calculated and stored in the resultant gradient matrix. Larger values indicate stronger intensity changes.",
          targetId: "tutorResGrid",
          placement: "top",
          offset: [-10, 12],
        },
        {
          title: "Resultant Image",
          content: operatorImageContent[kernel] || operatorImageContent.default,
          targetId: "tutorResImageGrid",
          placement: "bottom",
          offset: [-10, 12],
        },
        {
          title: "Experiment Completed",
          content:
            "Congratulations! You have successfully visualized how gradient-based edge detection works using convolution and magnitude calculation.",
          targetId: "tutorResImageGrid",
          placement: "top",
        },
      );
    }

    setTutorStepsSim(baseSteps);
  }, [isConceptAnimationPlaying, kernel, image, tutorStepSim]);

  useEffect(() => {
    isPausedSimulationRef.current = isPausedSimulation;
  }, [isPausedSimulation]);

  useEffect(() => {
    changeKernel("sobel");
    handleImage(0);
  }, []);

  const [dx, setDx] = useState(null);
  const [dy, setDy] = useState(null);
  const [posx, setPosX] = useState(null);
  const [posy, setPosY] = useState(null);
  const [isDone, setIsDone] = useState(false);
  const [res, setRes] = useState([]);

  const [isRunning, setIsRunning] = useState(false); // Optional - for controlling visibility

  
  function handleImage(x) {
    setImage(x);
    setImageAnimateKey((prev) => prev + 1);
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
    setOriginal(signs[x]);
  }

  function pauseFun() {
    setIsPausedSimulation((prev) => !prev);
  }

  function changeKernel(x) {
    runIdRef.current++;
    setIsDone(false);
    setKernel(x);
    setKernelAnimateKey((prev) => prev + 1);
    let kernelX, kernelY;
    switch (x) {
      case "sobel":
        setLabel("3 x 3");
        setResultLabel("5x5");
        kernelX = [
          [-1, 0, 1],
          [-2, 0, 2],
          [-1, 0, 1],
        ];
        kernelY = [
          [-1, -2, -1],
          [0, 0, 0],
          [1, 2, 1],
        ];
        break;
      case "roberts":
        setLabel("2 x 2");
        setResultLabel("6x6");
        kernelX = [
          [1, 0],
          [0, -1],
        ];
        kernelY = [
          [0, 1],
          [-1, 0],
        ];
        break;
      case "prewitt":
        setLabel("3 x 3");
        setResultLabel("5x5");
        kernelX = [
          [-1, 0, 1],
          [-1, 0, 1],
          [-1, 0, 1],
        ];
        kernelY = [
          [-1, -1, -1],
          [0, 0, 0],
          [1, 1, 1],
        ];
        break;
      case "scharr":
        setLabel("3 x 3");
        setResultLabel("5x5");
        kernelX = [
          [-3, 0, 3],
          [-10, 0, 10],
          [-3, 0, 3],
        ];
        kernelY = [
          [-3, -10, -3],
          [0, 0, 0],
          [3, 10, 3],
        ];
        break;
      case "laplacian":
        setLabel("3 x 3");
        setResultLabel("5x5");
        kernelX = [
          [0, 1, 0],
          [1, -4, 1],
          [0, 1, 0],
        ];

        kernelY = null;
        break;
      default:
        kernelX = [];
        kernelY = [];
    }

    setKernelX(kernelX);
    setKernelY(kernelY);
  }

  function play() {
    if (myPauseButton.current) {
      myPlayButton.current.style.display = "none";
      myPauseButton.current.style.display = "block";
    }
    mySpeedUpButton.current.disabled = false;
    mySpeedDownButton.current.disabled = false;
    setImagesDisabled(true);
    calculateDerivatives();
    setIsSimPlaying(true);
    setIsConceptAnimationPlaying(true);
  }

  function handleReset() {
    runIdRef.current++; // cancel current loop
    setDx([]);
    setDy([]);
    setRes([]);
    setPosX(0);
    setPosY(0);
    setIsPausedSimulation(false);
    delayRef.current = 300; // reset delay to default
    setIsDone(false); // if you use this to track completion
    setIsVisible(false); // if your result is conditionally shown
    myPauseButton.current.style.display = "none";
    myPlayButton.current.style.display = "block";
    setKernel("sobel");
    changeKernel("sobel");
    handleImage(0);
    mySpeedUpButton.current.disabled = false;
    mySpeedDownButton.current.disabled = false;
    setIsDisabled(false); //enabled select box
    setImagesDisabled(false);
    setCurrentIndex(0);
    setActiveRes({ row: -1, col: -1 });
    setCompletedRes([]);
    setCompletedDX([]);
    setCompletedDY([]);
    setActiveRes({ row: -1, col: -1 });
    setActiveDX({ row: -1, col: -1 });
    setActiveDY({ row: -1, col: -1 });
    setFirstKernelCalculated(false);

    // Tutor logic: if tutor is open and was past the Action Required step, redirect back
    if (isTutorOpenSim && tutorStepSim >= 10) {
      setTutorStepSim(10);
    }

    setIsSimPlaying(false);
    setIsConceptAnimationPlaying(false);
  }
  //   useEffect(() => {
  //   console.log("active changed", activeDX, activeDY, activeRes);
  // }, [activeDX, activeDY, activeRes]);

  async function calculateDerivatives() {
    if (!original || !kernelx) return;

    const currentRunId = ++runIdRef.current;

    const rows = original.length + 1 - kernelx.length;
    const cols = original[0].length + 1 - kernelx.length;

    //array's created initially all filled with zero's
    const di_dx = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));
    const di_dy = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));
    const resultant = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));

    const kernelSizeX = kernelx.length;

    // For Laplacian, there is no kernelY,
    // but the single kernel is still 3 × 3.
    const kernelSizeY = kernelx.length;

    setIsDisabled(true); //disabled select box
    setIsRunning(true);
    setIsVisible(true);
    setIsDone(false);

    const kernelOffsetX = Math.floor(kernelSizeX / 2);
    const kernelOffsetY = kernely ? Math.floor(kernelSizeY / 2) : 0;

    setCompletedDX([]);
    setCompletedDY([]);
    setCompletedRes([]);
    setActiveDX({ row: -1, col: -1 });
    setActiveDY({ row: -1, col: -1 });
    setActiveRes({ row: -1, col: -1 });
    setStep(0);
    setConvSteps({ x: [], y: [], result: [] });
    setCurrentSum({ x: 0, y: 0, result: 0 });

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (currentRunId !== runIdRef.current) return; // ❗Exit early if reset or kernel changed

        while (isPausedSimulationRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (currentRunId !== runIdRef.current) return; // ❗Exit early if reset or kernel changed
        }

        setPosX(i); // <== These trigger a re-render
        setPosY(j);
        // reset convSteps and currentSum for each pixel
        setConvSteps((prev) => ({
          x: [],
          y: [],
          result: prev.result, // keep previous result visible
        }));
        setCurrentSum((prev) => ({
          x: 0,
          y: 0,
          result: prev.result, // keep previous gradient displayed
        }));
        setStep((prev) => prev + 1);

        let sumX = 0;
        let sumY = 0;

        for (let ki = 0; ki < kernelSizeX; ki++) {
          for (let kj = 0; kj < kernelSizeY; kj++) {
            const x = i + ki;
            const y = j + kj;

            if (
              x >= 0 &&
              x < original.length &&
              y >= 0 &&
              y < original[0].length
            ) {
              const mulX = original[x][y] * kernelx[ki][kj];
              sumX += mulX;

              let mulY = 0;

              if (kernely) {
                mulY = original[x][y] * kernely[ki][kj];
                sumY += mulY;
              }

              setConvSteps((prev) => ({
                x: [...prev.x, `${original[x][y]}×${kernelx[ki][kj]}`],

                y: kernely
                  ? [...prev.y, `${original[x][y]}×${kernely[ki][kj]}`]
                  : [],

                result: prev.result,
              }));

              setCurrentSum((prev) => ({
                x: sumX,
                y: sumY,
                result: prev.result,
              }));
              await new Promise((resolve) =>
                setTimeout(resolve, delayRef.current),
              );
            }
          }
        }

        di_dx[i][j] = sumX;

        if (kernely) {
          // First-order derivative operators
          di_dy[i][j] = sumY;

          const gradient = Math.sqrt(sumX * sumX + sumY * sumY);

          resultant[i][j] = Math.floor(gradient);

          setConvSteps((prev) => ({
            ...prev,
            result: [`√( ${sumX}² + ${sumY}² )`],
          }));

          setCurrentSum((prev) => ({
            ...prev,
            result: gradient.toFixed(2),
          }));
        } else {
          // Laplacian: single second-order derivative response
          di_dy[i][j] = 0;

          const laplacianResponse = Math.abs(sumX);

          resultant[i][j] = Math.floor(laplacianResponse);

          setConvSteps((prev) => ({
            ...prev,
            result: [`| ${sumX} |`],
          }));

          setCurrentSum((prev) => ({
            ...prev,
            result: laplacianResponse.toFixed(2),
          }));
        }
        setFirstKernelCalculated(true);

        setCompletedDX((prev) => [...prev, { row: i, col: j }]);
        setCompletedDY((prev) => [...prev, { row: i, col: j }]);
        setCompletedRes((prev) => [...prev, { row: i, col: j }]);

        setDx([...di_dx]);
        setDy([...di_dy]);
        setRes([...resultant]);

        setActiveDX({ row: i, col: j });
        setActiveDY({ row: i, col: j });
        setActiveRes({ row: i, col: j });

        await new Promise((resolve) => setTimeout(resolve, delayRef.current));
      }
    }

    if (currentRunId === runIdRef.current) {
      myPauseButton.current.style.display = "none";
      myPlayButton.current.style.display = "block";
      mySpeedUpButton.current.disabled = true;
      mySpeedDownButton.current.disabled = true;
      setIsDisabled(false);
      setIsDone(true);
      setIsRunning(false);
    }
  }

  const instructions = [
    "1. Choose an image.",
    "2. Choose a filter type.",
    "3. Click on 'Play' button at the bottom.",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % instructions.length);
    // console.log(instructions);
    // console.log(currentIndex);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + instructions.length) % instructions.length,
    );
  };

  return (
    <OpenCvProvider>
      <div id="main-box-edge">
        <div id="box-2">
          <DialogTitle id="instructions-dialog-title">
            <div
              style={{
                width: "50%",
                justifyContent: "flex-start",
                display: "flex",
              }}
            >
              Derivative Concept
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
                id="sound-btn"
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
                  handleClose2Modal();
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

          <div id="Choose_box_edge">
            <div className="coolinput">
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "45%",
                  }}
                >
                  <div id="image-box">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div onClick={() => !imagesDisabled && handleImage(0)}>
                        <img
                          src={plus}
                          className={image === 0 ? "image-selected" : ""}
                          id="image"
                          style={{
                            opacity: imagesDisabled ? 0.7 : 1,
                            cursor: imagesDisabled ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>
                      <div onClick={() => !imagesDisabled && handleImage(1)}>
                        <img
                          src={minus}
                          className={image === 1 ? "image-selected" : ""}
                          id="image"
                          style={{
                            opacity: imagesDisabled ? 0.7 : 1,
                            cursor: imagesDisabled ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div onClick={() => !imagesDisabled && handleImage(2)}>
                        <img
                          src={multiply}
                          className={image === 2 ? "image-selected" : ""}
                          id="image"
                          style={{
                            opacity: imagesDisabled ? 0.7 : 1,
                            cursor: imagesDisabled ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>
                      <div onClick={() => !imagesDisabled && handleImage(3)}>
                        <img
                          src={divide}
                          className={image === 3 ? "image-selected" : ""}
                          id="image"
                          style={{
                            opacity: imagesDisabled ? 0.7 : 1,
                            cursor: imagesDisabled ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="custom-divider-edge" />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div id="tool-box">
                    <Select
                      native
                      value={kernel}
                      onChange={(e) => changeKernel(e.target.value)}
                      disabled={isDisabled}
                      id="select-filter"
                      sx={{
                        color: "#1D2A6D",
                        "& .MuiNativeSelect-icon": {
                          // Caret (dropdown icon) color
                          color: "#1D2A6D",
                        },
                        "& .MuiNativeSelect-select": {
                          // Remove padding inside the Select (input box)
                          paddingTop: 1,
                          paddingBottom: 1,
                        },
                      }}
                    >
                      <option value={"sobel"}>Sobel 3x3</option>
                      <option value={"roberts"}>Roberts</option>
                      <option value={"prewitt"}>Prewitt</option>
                      <option value={"scharr"}>Scharr</option>
                      <option value={"laplacian"}>Laplacian</option>
                    </Select>
                  </div>
                </div>
              </Box>
            </div>
          </div>

          <div id="top-box">
            <div id="original">
              {isVisible && (
                <div
                  id="kernel-sliding-box"
                  style={{
                    position: "absolute",
                    top: `${posx * ((document.getElementById("originalGrid")?.offsetWidth || 0) - 0.5) + document.getElementById("ogimage")?.offsetTop || 0}px`,
                    left: `${posy * ((document.getElementById("originalGrid")?.offsetHeight || 0) - 0.5) + document.getElementById("ogimage")?.offsetLeft || 0}px`,
                    width: `${((document.getElementById("originalGrid")?.offsetWidth || 0) + 0.5) * (kernelx ? kernelx[0].length : 0)}px`,
                    height: `${((document.getElementById("originalGrid")?.offsetHeight || 0) + 0.5) * (kernelx ? kernelx.length : 0)}px`,
                    border: "3px solid #ff4d4d",
                    backgroundColor: "rgba(255, 77, 77, 0.12)",
                    boxShadow: "inset 0 0 10px rgba(255, 77, 77, 0.5)",
                    pointerEvents: "none",
                    transition: "top 0.25s ease, left 0.25s ease",
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${kernelx?.[0].length}, 1fr)`,
                      gridTemplateRows: `repeat(${kernelx?.length}, 1fr)`,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {Array(kernelx?.length * kernelx?.[0].length)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          style={{ border: "1px solid rgba(255,0,0,0.3)" }}
                        />
                      ))}
                  </div>
                </div>
              )}
              <h4 style={{ margin: "0px" }}>Image Chosen</h4>
              <div
                id="ogimage"
                className="matrix-over"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                }}
              >
                {original &&
                  original.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}-${imageAnimateKey}`}
                        id="originalGrid"
                        className="matrix-animate"
                        style={{
                          color: cell === 1 ? "red" : "black",
                          animationDelay: `${rowIndex * 0.15}s`,
                        }}
                      >
                        {original[rowIndex][colIndex]}
                      </div>
                    )),
                  )}
              </div>
              <p className="matrix_label">7 x 7</p>
            </div>

            <div id="kernel_arrow_1">
              <span>
                <svg
                  width="60"
                  height="40"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "rotate(-30deg)" }}
                >
                  <line
                    x1="10"
                    y1="20"
                    x2="50"
                    y2="20"
                    stroke="black"
                    stroke-width="2"
                  />
                  <text
                    x="30"
                    y="25"
                    font-size="22"
                    font-family="Arial"
                    text-anchor="middle"
                  >
                    *
                  </text>
                  <polygon points="50,15 60,20 50,25" fill="black" />
                </svg>
              </span>

              <span>
                <svg
                  width="60"
                  height="40"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "rotate(30deg)" }}
                >
                  <line
                    x1="10"
                    y1="20"
                    x2="50"
                    y2="20"
                    stroke="black"
                    stroke-width="2"
                  />
                  <text
                    x="30"
                    y="25"
                    font-size="22"
                    font-family="Arial"
                    text-anchor="middle"
                  >
                    *
                  </text>
                  <polygon points="50,15 60,20 50,25" fill="black" />
                </svg>
              </span>
            </div>

            <div id="kernel_arrow_2">
              <span>
                <svg
                  width="30"
                  height="45"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "rotate(51deg)" }}
                >
                  <line
                    x1="10"
                    y1="10"
                    x2="10"
                    y2="40"
                    stroke="black"
                    stroke-width="2"
                  ></line>
                  <text
                    x="15"
                    y="35"
                    font-size="20"
                    font-family="Arial"
                    text-anchor="middle"
                  >
                    *
                  </text>
                  <polygon points="5,40 15,40 10,45" fill="black"></polygon>
                </svg>
              </span>

              <span>
                <svg
                  width="30"
                  height="45"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "rotate(-41deg)" }}
                >
                  <line
                    x1="10"
                    y1="10"
                    x2="10"
                    y2="40"
                    stroke="black"
                    stroke-width="2"
                  ></line>
                  <text
                    x="5"
                    y="35"
                    font-size="20"
                    font-family="Arial"
                    text-anchor="middle"
                  >
                    *
                  </text>
                  <polygon points="5,40 15,40 10,45" fill="black"></polygon>
                </svg>
              </span>
            </div>

            <div id="kernels">
              <div id="kernelx">
                <h3
                  style={{
                    marginBottom: "10px",
                    color: "black",
                    fontSize: "22px",
                  }}
                >
                  {kernel}
                </h3>
                <h4 style={{ marginBottom: "1px", fontWeight: "bold" }}>
                  {kernel === "laplacian" ? "Laplacian Kernel" : "Kernel X"}
                </h4>
                <div
                  className="matrix-over"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${kernel === "roberts" ? 2 : 3}, 1fr)`,
                  }}
                >
                  {kernelx &&
                    kernelx.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}-${kernelAnimateKey}`}
                          id="kernelGrid"
                          className="matrix-animate kernalX"
                          style={{
                            animationDelay: `${rowIndex * 0.15}s`,
                          }}
                        >
                          {kernelx[rowIndex][colIndex]}
                        </div>
                      )),
                    )}
                </div>
                <p id="xLabel" class="matrix_label">
                  {!isVisible && label}
                </p>
                {isVisible && (
                  <div id="convStepsX" className="conv-steps-box">
                    {kernel === "laplacian" ? (
                      <h4>Laplacian Kernel Convolution Step</h4>
                    ) : (
                      <h4>Kernel X Convolution Step</h4>
                    )}

                    <div className="conv-steps">
                      <div className="conv-step">Step {step} :</div>
                      {convSteps.x.map((item, index) => (
                        <span key={index}>
                          ({item}){index !== convSteps.x.length - 1 && " + "}
                        </span>
                      ))}
                      <div className="conv-result">= {currentSum.x}</div>
                    </div>
                  </div>
                )}
              </div>

              {kernel !== "laplacian" && (
                <div id="kernely">
                  <h4 style={{ marginBottom: "1px", fontWeight: "bold" }}>
                    Kernel Y
                  </h4>
                  <div
                    className="matrix-over"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${kernel === "roberts" ? 2 : 3}, 1fr)`,
                    }}
                  >
                    {kernely &&
                      kernely.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}-${kernelAnimateKey}`}
                            id="kernelGrid"
                            className="matrix-animate kernalY"
                            style={{
                              animationDelay: `${rowIndex * 0.15}s`,
                            }}
                          >
                            {kernely[rowIndex][colIndex]}
                          </div>
                        )),
                      )}
                  </div>
                  <p id="yLabel" class="matrix_label">
                    {!isVisible && label}
                  </p>
                  {isVisible && (
                    <div id="convStepsY" className="conv-steps-box">
                      <h4>Kernel Y Convolution Step</h4>

                      <div className="conv-steps">
                        <div className="conv-step">Step {step} :</div>
                        {convSteps.y.map((item, index) => (
                          <span key={index}>
                            ({item}){index !== convSteps.y.length - 1 && " + "}
                          </span>
                        ))}
                        <div className="conv-result">= {currentSum.y}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isVisible && (
              <div id="operation">
                {kernel === "laplacian" ? null : (
                  <div id="equals-to" style={{ fontWeight: "bold" }}>
                    =
                  </div>
                )}
                <div id="equals-to" style={{ fontWeight: "bold" }}>
                  =
                </div>
              </div>
            )}

            {isVisible && (
              <div id="results">
                <div id="kernelx" style={{ position: "relative" }}>
                  <h4 style={{ marginBottom: "1px", fontWeight: "bold" }}>
                    {firstKernelCalculated && (
                      <span>
                        {kernel === "laplacian"
                          ? "Laplacian Response (∇²I)"
                          : "Gradient X (ΔX)"}
                      </span>
                    )}
                  </h4>
                  <div
                    id="tutorDXGrid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${dx && dx[0] ? dx[0].length : 0}, 1fr)`,
                      position: "relative",
                    }}
                  >
                    {dx &&
                      dx.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            id="kernelGrid"
                            className={
                              activeDX.row === rowIndex &&
                              activeDX.col === colIndex
                                ? "dx-active"
                                : completedDX.some(
                                      (item) =>
                                        item.row === rowIndex &&
                                        item.col === colIndex,
                                    )
                                  ? "dx-completed"
                                  : ""
                            }
                          >
                            {dx[rowIndex][colIndex]}
                          </div>
                        )),
                      )}
                  </div>
                  <p className="matrix_label">
                    {firstKernelCalculated && resultLabel}
                  </p>
                </div>

                {kernel !== "laplacian" && (
                  <div id="kernely">
                    <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                      {firstKernelCalculated && (
                        <span>Gradient Y (&Delta;Y)</span>
                      )}
                    </h4>
                    <div
                      id="tutorDYGrid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${dy && dy[0] ? dy[0].length : 0}, 1fr)`,
                      }}
                    >
                      {dy &&
                        dy.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              id="kernelGrid"
                              className={
                                activeDY.row === rowIndex &&
                                activeDY.col === colIndex
                                  ? "dy-active"
                                  : completedDY.some(
                                        (item) =>
                                          item.row === rowIndex &&
                                          item.col === colIndex,
                                      )
                                    ? "dy-completed"
                                    : ""
                              }
                            >
                              {dy[rowIndex][colIndex]}
                            </div>
                          )),
                        )}
                    </div>
                    <p className="matrix_label">
                      {firstKernelCalculated && resultLabel}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isVisible && (
              <div id="operation">
                <div id="equals-to">=</div>
                {/* <div id="equals-to">=</div> */}
              </div>
            )}

            {isVisible && firstKernelCalculated && (
              <div id="final_result">
                <div id="kernelx">
                  <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                    {kernel === "laplacian"
                      ? "Laplacian Result"
                      : "Resultant Gradient"}
                  </h4>
                  <BlockMath math={equation1} />
                  <div id="tutorResCalculationGrid" className="conv-final">
                    {kernel === "laplacian" ? "∇²I =" : "ΔG ="}
                    {convSteps.result.map((item, index) => (
                      <span key={index}>{item}</span>
                    ))}{" "}
                    = {currentSum.result}
                  </div>
                  <div
                    id="tutorResGrid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${res && res[0] ? res[0].length : 0}, 1fr)`,
                    }}
                  >
                    {res &&
                      res.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            id="kernelGrid"
                            className={
                              activeRes.row === rowIndex &&
                              activeRes.col === colIndex
                                ? "res-active"
                                : completedRes.some(
                                      (item) =>
                                        item.row === rowIndex &&
                                        item.col === colIndex,
                                    )
                                  ? "res-completed"
                                  : ""
                            }
                          >
                            {res[rowIndex][colIndex]}
                          </div>
                        )),
                      )}
                  </div>
                  <p className="matrix_label">{resultLabel}</p>
                </div>
                <span id="arrow2">&darr;</span>
                <div id="kernely">
                  <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                    Resultant Image
                  </h4>
                  <BlockMath math={equation2} />
                  <div
                    id="tutorResImageGrid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${res && res[0] ? res[0].length : 0}, 1fr)`,
                    }}
                  >
                    {res &&
                      res.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            id="result_grid"
                            className={
                              activeRes.row === rowIndex &&
                              activeRes.col === colIndex
                                ? "resImage-active"
                                : ""
                            }
                            style={{
                              backgroundColor: `rgb(${(cell / Math.max(...res.flat())) * 255}, ${(cell / Math.max(...res.flat())) * 255}, ${(cell / Math.max(...res.flat())) * 255})`,
                            }}
                          ></div>
                        )),
                      )}
                  </div>
                  <p className="matrix_label">{resultLabel}</p>
                </div>
              </div>
            )}
          </div>

          <div id="footer_buttons">
            <div
              className="flex overflow-hidden bg-white border divide-x rounded-lg rtl:flex-row-reverse dark:bg-gray-900 dark:border-gray-700 dark:divide-gray-700"
              style={{ height: "fit-content" }}
            >
              <button
                id="speed-down-btn"
                onClick={() => (delayRef.current += 100)}
                ref={mySpeedDownButton}
                title="speed down"
                className="px-4 py-2 font-medium text-gray-600 transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100"
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

              <div id="sim-play-pause-btn">
                <button
                  id="sim-play-btn"
                  ref={myPlayButton}
                  onClick={() => play()}
                  title="Play"
                  className={`px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100`}
                  style={{ display: "block" }}
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
                  id="sim-pause-btn"
                  ref={myPauseButton}
                  onClick={() => pauseFun()}
                  title={isPausedSimulation ? "Play" : "Pause"}
                  className={`px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100`}
                  style={{ display: "none" }}
                >
                  {isPausedSimulation ? (
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
                id="speed-up-btn"
                onClick={() =>
                  (delayRef.current = Math.max(50, delayRef.current - 100))
                }
                ref={mySpeedUpButton}
                title="speed up"
                className="px-4 py-2 font-medium text-gray-600 transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100"
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
                id="reset-btn"
                title="reset"
                onClick={() => handleReset()}
                className="px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100"
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
      </div>
    </OpenCvProvider>
  );
}
