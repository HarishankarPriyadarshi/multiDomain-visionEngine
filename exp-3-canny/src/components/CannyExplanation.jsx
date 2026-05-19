import "../canny.css";
import { use, useEffect, useRef, useState, useContext } from "react";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";

import { OpenCvProvider } from "opencv-react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { Slider, Select } from "@mui/material";
import { DialogTitle, Button as TutorBtn } from "@mui/material";
import { Modal, Form, Alert, Button } from "react-bootstrap";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Box from "@mui/material/Box";
import Carousel from "react-bootstrap/Carousel";
// import ExampleCarouselImage from 'components/ExampleCarouselImage';
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { SimContext } from "./context/SimContext";

import voice from "../assets/images/voice-play.png";
import voice_pause from "../assets/images/voice-pause.png";
import TutorSim from "./features/tutor/TutorSim";

const notifyS = (msg) => {
  toast.success(msg, {
    theme: "dark",
    position: "bottom-right", // Set toast position
    autoClose: 3000, // Toast auto-closes after 3 seconds
    hideProgressBar: false, // Show progress bar
    closeOnClick: true, // Close toast when clicked
    pauseOnHover: true, // Pause when hovered
    draggable: true, // Enable dragging
  });
};

export default function CannyExplanation({ handleClose3Modal }) {
  const [image, setImage] = useState(0);
  const [original, setOriginal] = useState(null);
  const [sigma, setSigma] = useState(0);
  const [tlow, setTlow] = useState(0.1);
  const [thigh, setThigh] = useState(0.1);
  const [gKernel, setGKernel] = useState(null);

  const [imagesDisabled, setImagesDisabled] = useState(false);
  const myBlurButton = useRef(null);
  const myPadButton = useRef(null);
  const myPadBlurButton = useRef(null);
  const mySobelButton = useRef(null);
  const myQuantButton = useRef(null);
  const myNonMaxButton = useRef(null);
  const myThresButton = useRef(null);
  const myHytresisButton = useRef(null);
  const myNextButton = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showButtons, setShowButtons] = useState(false); //carousel buttons

  const [isSliderDisabled, setSliderIsDisabled] = useState(false);
  const [isTLowSliderDisabled, setTLowSliderIsDisabled] = useState(false);
  const [isTHighSliderDisabled, setTHighSliderIsDisabled] = useState(false);

  const [padded, setPadded] = useState(null);

  const [blurred, setBlurred] = useState(null);
  const [startBlur, setStartBlur] = useState(false);
  const [blurX, setBlurX] = useState(0);
  const [blurY, setBlurY] = useState(0);
  const [isBlurring, setIsBlurring] = useState(false);

  const [sobelx, setSobelx] = useState(null);
  const [sobely, setSobely] = useState(null);
  const [convolutedx, setConvolutedx] = useState(null);
  const [convolutedy, setConvolutedy] = useState(null);
  const [gradient, setGradient] = useState(null); //angle of gradient
  const [gradientMag, setGradientMag] = useState(null); //total gradient magnitude
  const [quantize, setQuantize] = useState(null);

  const [index, setIndex] = useState(0); // for carousel

  const [supressed, setSupressed] = useState(null);
  const [finalGrid, setFinalGrid] = useState(null);
  // state tracking and animation for gaussian kernel
  const [gussianConvSteps, setGussianConvSteps] = useState([]);
  const [gussianCurrentSum, setGussianCurrentSum] = useState(0);
  const [plusFlag, setPlusFlag] = useState(true);
  const [gussianStep, setGussianStep] = useState(0);
  const [activeRes, setActiveRes] = useState({ row: -1, col: -1 });
  const [completedRes, setCompletedRes] = useState([]);
  // state trecking for sobel kernel animation
  const [sobelPosX, setSobelPosX] = useState(-1);
  const [sobelPosY, setSobelPosY] = useState(-1);
  const [imageAnimateKey, setImageAnimateKey] = useState(0);
  const [activeSobelDX, setActiveSobelDX] = useState({ row: -1, col: -1 });
  const [activeSobelDY, setActiveSobelDY] = useState({ row: -1, col: -1 });
  const [activeSobelRes, setActiveSobelRes] = useState({ row: -1, col: -1 });
  const [completedSobelDXSteps, setCompletedSobelDXSteps] = useState([]);
  const [completedSobelDYSteps, setCompletedSobelDYSteps] = useState([]);
  const [completedSobelResSteps, setCompletedSobelResSteps] = useState([]);
  // state tracking for sobel kernel as details
  const [convSteps, setConvSteps] = useState({
    x: [],
    y: [],
    result: [],
    direction: [],
  }); // for X,Y, and Result
  const [currentSum, setCurrentSum] = useState({
    x: 0,
    y: 0,
    result: 0,
    direction: 0,
  }); // for X,Y, and Result
  const [step, setStep] = useState(0);
  const [firstKernelCalculated, setFirstKernelCalculated] = useState(false);

  // state tracking for quantization steps
  const [quantSteps, setQuantSteps] = useState([]);
  const [quantStepNumber, setQuantStepNumber] = useState(0);
  const [activeQuantPixel, setActiveQuantPixel] = useState(null);

  // state tracking for the Non maximum suppression
  const [animatedSuppressed, setAnimatedSuppressed] = useState(null);
  const [activePixel, setActivePixel] = useState(null);
  const [activeNeighbors, setActiveNeighbors] = useState([]);
  const [nmsExplanation, setNmsExplanation] = useState([]);
  const equation1 = "\\theta = \\tan^{-1}\\left(\\frac{G_y}{G_x}\\right)";
  const equation2 = "G = \\sqrt{G_x^2 + G_y^2}";

  //thresholded
  const [thresholdGrid, setThresholdGrid] = useState(null);
  const [activeThreshPixel, setActiveThreshPixel] = useState(null);
  const [thresholdExplanation, setThresholdExplanation] = useState([]);
  const [tLowHighExplanation, setTLowHighExplanation] = useState([]);
  const [maxGradientVal, setMaxGradientVal] = useState(0);
  // hysteresis,
  const [activeHystPixel, setActiveHystPixel] = useState(null);
  const [activeHystNeighbors, setActiveHystNeighbors] = useState([]);
  const [hystExplanation, setHystExplanation] = useState([]);
  const [isThresholdRunning, setIsThresholdRunning] = useState(false);
  const [isBoxRunning, setIsBoxRunning] = useState(false);
  const [isHysteresisRunning, setIsHysteresisRunning] = useState(false);
  const [isThresholdCompleted, setIsThresholdCompleted] = useState(false);

  useEffect(() => {
    const sobelXKernel = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelYKernel = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    setSobelx(sobelXKernel);
    setSobely(sobelYKernel);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % instructions.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + instructions.length) % instructions.length,
    );
  };

  const instructions = [
    "Step 1. Choose an image, set the sigma value, and observe the Gaussian Kernel.",
    "Step 2. Click the 'Pad' button to apply padding to the original image.",
    "Step 3. Apply Gaussian blur by clicking the 'Blur' button.",
    "Step 4. Pad the gaussian blurred image by clicking the 'Pad' button.",
    "Step 5. Click on 'Apply Sobel' button to calculate Sobel and Gradient.",
    "Step 6. Click on 'Quantise' button to Quantise the gradient.",
    "Step 7. Click on 'Process' button to Non-Maximum Suppression.",
    "Step 8. Set the values for T_low and T_high and click on 'Process' button to get edge detected image.",

    "Note: round off values is used during matrix representation",
  ];

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
    setOriginal(signs[x]);
    console.log(original);
    // handleShow();
    setImagesDisabled(true);
  }

  function process(sigma) {
    let rows = [];
    console.log(sigma);
    for (let i = -1; i < 2; i++) {
      let col = [];
      for (let j = -1; j < 2; j++) {
        let value =
          Math.exp(-(i * i + j * j) / (2 * sigma * sigma)) /
          (2 * Math.PI * sigma * sigma);
        col.push(value.toFixed(2));
      }
      rows.push(col);
    }
    setGKernel(rows);
    console.log(rows);
    setShowButtons(true);
  }

  function padding() {
    setIsSimPlaying(true);
    const totalRows = original.length + 2;
    const totalCols = original[0].length + 2;

    let baseMatrix = [];
    let borderPositions = [];

    for (let i = 0; i < totalRows; i++) {
      let row = [];
      for (let j = 0; j < totalCols; j++) {
        if (i === 0 || i === totalRows - 1 || j === 0 || j === totalCols - 1) {
          row.push(null); // will animate
          borderPositions.push([i, j]);
        } else {
          row.push(original[i - 1][j - 1]); // show instantly
        }
      }
      baseMatrix.push(row);
    }

    setPadded(baseMatrix);

    // Animate only borders
    borderPositions.forEach(([i, j], index) => {
      setTimeout(() => {
        setPadded((prev) => {
          const updated = prev.map((r) => [...r]);
          updated[i][j] = 0;
          return updated;
        });
      }, index * 60);
    });

    myPadButton.current.disabled = true;
    enabledNext();
  }
  async function blur() {
    if (isBlurring) return; // Prevent re-entry if already running
    setIsSimPlaying(true);
    setIsBlurring(true); // Set the flag to true to lock execution
    setStartBlur(true);
    setGussianStep(0);
    setActiveRes({ row: -1, col: -1 });
    setCompletedRes([]);
    let rows = Array(7)
      .fill(0)
      .map(() => Array(7).fill("")); // Initialize a 7x7 grid with zeros
    for (let i = 1; i < padded.length - 1; i++) {
      for (let j = 1; j < padded[0].length - 1; j++) {
        setBlurX(i);
        setBlurY(j);
        let sum = 0;
        setGussianConvSteps([]);
        setGussianStep((prev) => prev + 1);
        setGussianCurrentSum(0);
        setPlusFlag(true);

        for (let k = -1; k <= 1; k++) {
          for (let l = -1; l <= 1; l++) {
            // sum += padded[i + k][j + l] * gKernel[k + 1][l + 1];
            const pixel = padded[i + k][j + l] ?? 0; // if null → use 0
            const kernelVal = gKernel[k + 1][l + 1];

            sum += pixel * kernelVal;

            setGussianConvSteps((prev) => [...prev, `${pixel} * ${kernelVal}`]);

            setGussianCurrentSum(sum.toFixed(2));
          }
        }
        setPlusFlag(false);
        setActiveRes({ row: i - 1, col: j - 1 });
        setCompletedRes((prev) => [...prev, { row: i - 1, col: j - 1 }]);
        rows[i - 1][j - 1] = sum.toFixed(2); // Update each value individually
        //console.log("sum at each step:", sum.toFixed(2));
        setBlurred([...rows]); // Update the state after each value is calculated
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    // console.log(rows);

    setIsBlurring(false); // Unlock after completion
    myBlurButton.current.disabled = true;
    enabledNext();
  }

  const [padBlur, setPadBlur] = useState(null);

  function padblurred() {
    setIsSimPlaying(true);
    myPadBlurButton.current.disabled = true;

    const totalRows = blurred.length + 2;
    const totalCols = blurred[0].length + 2;

    let baseMatrix = [];
    let borderPositions = [];

    for (let i = 0; i < totalRows; i++) {
      let row = [];
      for (let j = 0; j < totalCols; j++) {
        if (i === 0 || i === totalRows - 1 || j === 0 || j === totalCols - 1) {
          row.push(null); // 👈 SAME AS STEP 1
          borderPositions.push([i, j]);
        } else {
          row.push(blurred[i - 1][j - 1]);
        }
      }
      baseMatrix.push(row);
    }

    setPadBlur(baseMatrix);

    // Animate borders one-by-one
    borderPositions.forEach(([i, j], index) => {
      setTimeout(() => {
        setPadBlur((prev) => {
          const updated = prev.map((r) => [...r]);
          updated[i][j] = 0;
          return updated;
        });
      }, index * 60);
    });

    enabledNext();
  }

  async function applySobelConvolution() {
    if (!padBlur || !sobelx || !sobely) return;
    setIsSimPlaying(true);
    mySobelButton.current.disabled = true;
    //animation track
    setActiveSobelDX({ row: -1, col: -1 });
    setActiveSobelDY({ row: -1, col: -1 });
    setActiveSobelRes({ row: -1, col: -1 });
    setCompletedSobelDXSteps([]);
    setCompletedSobelDYSteps([]);
    setCompletedSobelResSteps([]);

    // state tracking for sobel kernel as details
    setStep(0);
    setConvSteps({ x: [], y: [], result: [], direction: [] });
    setCurrentSum({ x: 0, y: 0, result: 0, direction: 0 });

    let convolutedX = Array(7)
      .fill(0)
      .map(() => Array(7).fill(0));
    let convolutedY = Array(7)
      .fill(0)
      .map(() => Array(7).fill(0));
    let grad = Array(7)
      .fill(0)
      .map(() => Array(7).fill(0));
    let totalGrad = Array(7)
      .fill(0)
      .map(() => Array(7).fill(0));

    for (let i = 1; i < padBlur.length - 1; i++) {
      for (let j = 1; j < padBlur[0].length - 1; j++) {
        let sumX = 0;
        let sumY = 0;
        setSobelPosX(i);
        setSobelPosY(j);
        setImageAnimateKey((prev) => prev + 1);

        // reset convSteps and currentSum for each pixel
        setConvSteps((prev) => ({
          x: [],
          y: [],
          result: prev.result, // keep previous result visible
          direction: prev.direction, // keep previous direction visible
        }));
        setCurrentSum((prev) => ({
          x: 0,
          y: 0,
          result: prev.result, // keep previous gradient displayed
          direction: prev.direction, // keep previous direction displayed
        }));
        setStep((prev) => prev + 1);

        for (let k = -1; k <= 1; k++) {
          for (let l = -1; l <= 1; l++) {
            sumX += padBlur[i + k][j + l] * sobelx[k + 1][l + 1];
            sumY += padBlur[i + k][j + l] * sobely[k + 1][l + 1];
            // update convSteps and currentSum
            setConvSteps((prev) => ({
              x: [
                ...prev.x,
                `${padBlur[i + k][j + l]}×${sobelx[k + 1][l + 1]}`,
              ],
              y: [
                ...prev.y,
                `${padBlur[i + k][j + l]}×${sobely[k + 1][l + 1]}`,
              ],
              result: prev.result,
              direction: prev.direction,
            }));

            setCurrentSum((prev) => ({
              x: sumX,
              y: sumY,
              result: prev.result, // keep previous gradient displayed
              direction: prev.direction, // keep previous direction displayed
            }));
          }
        }
        //animation tracking
        setActiveSobelDX({ row: i - 1, col: j - 1 });
        setActiveSobelDY({ row: i - 1, col: j - 1 });
        setActiveSobelRes({ row: i - 1, col: j - 1 });
        setCompletedSobelDXSteps((prev) => [
          ...prev,
          { row: i - 1, col: j - 1 },
        ]);
        setCompletedSobelDYSteps((prev) => [
          ...prev,
          { row: i - 1, col: j - 1 },
        ]);
        setCompletedSobelResSteps((prev) => [
          ...prev,
          { row: i - 1, col: j - 1 },
        ]);

        convolutedX[i - 1][j - 1] = sumX.toFixed(2);
        convolutedY[i - 1][j - 1] = sumY.toFixed(2);
        grad[i - 1][j - 1] = (Math.atan2(sumY, sumX) * (180 / Math.PI)).toFixed(
          0,
        );
        totalGrad[i - 1][j - 1] = Math.sqrt(sumX * sumX + sumY * sumY).toFixed(
          2,
        );

        const gradientMag = Math.sqrt(sumX * sumX + sumY * sumY);
        const angle = Math.atan2(sumY, sumX) * (180 / Math.PI);

        setConvSteps((prev) => ({
          ...prev,
          result: [`√( ${sumX.toFixed(2)}² + ${sumY.toFixed(2)}² )`],
          direction: [`tan⁻¹( ${sumY.toFixed(2)} / ${sumX.toFixed(2)} )`],
        }));

        setCurrentSum((prev) => ({
          ...prev,
          result: gradientMag.toFixed(2),
          direction: angle.toFixed(0),
        }));
        setFirstKernelCalculated(true);

        setConvolutedx([...convolutedX]);
        setConvolutedy([...convolutedY]);
        setGradient(grad);
        setGradientMag(totalGrad);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    enabledNext();
  }

  async function quantiseGrad() {
    if (!gradient) return;
    setIsSimPlaying(true);
    myQuantButton.current.disabled = true;

    const rows = gradient.length;
    const cols = gradient[0].length;

    // Step 1: initialize with null (for animation)
    let initialMatrix = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    setQuantize(initialMatrix);
    setQuantSteps([]);

    setQuantStepNumber(0);

    let index = 0;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        setActiveQuantPixel([i, j]);
        let angle = Number(gradient[i][j]) || 0;
        // console.log("quantiseGradBefore:", "angle:", angle, i, j);
        angle = (angle + 180) % 180; // Normalize to 0–180
        //console.log("quantiseGradAfter:", "angle:", angle, i, j);

        let value;
        let rangeInfo = "";

        if (angle < 22.5 || angle >= 157.5) {
          value = 0;
          rangeInfo = "Angle < 22.5° or ≥ 157.5°";
        } else if (angle >= 22.5 && angle < 67.5) {
          value = 45;
          rangeInfo = "Angle between 22.5° and 67.5°";
        } else if (angle >= 67.5 && angle < 112.5) {
          value = 90;
          rangeInfo = "Angle between 67.5° and 112.5°";
        } else {
          value = 135;
          rangeInfo = "Angle between 112.5° and 157.5°";
        }

        setQuantStepNumber((prev) => prev + 1);

        setQuantSteps([
          {
            OriginalAngle: gradient[i][j] + "°",
            Normalized: angle.toFixed(2) + "°",
            RangeMatched: rangeInfo,
            QuantizedTo: value + "°",
          },
        ]);

        setQuantize((prev) => {
          const updated = prev.map((r) => [...r]);
          updated[i][j] = value;
          return updated;
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    setActiveQuantPixel(null); // remove highlight

    enabledNext();
  }
  async function dnonmax() {
    setIsSimPlaying(true);
    if (!gradientMag || !gradient) return;
    myNonMaxButton.current.disabled = true;
    const rows = gradientMag.length;
    const cols = gradientMag[0].length;

    let suppressed = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));
    console.log("suppressedIntial:", suppressed);
    //initialize animated suppressed matrix
    setAnimatedSuppressed(
      Array(rows)
        .fill(0)
        .map(() => Array(cols).fill(0)),
    );

    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        let angle = quantize[i][j];
        console.log("nonmax:", "angle:", angle, i, j);
        let current = parseFloat(gradientMag[i][j]);
        let neighbor1 = 0;
        let neighbor2 = 0;
        let neighbors = [];

        if (angle === 0) {
          neighbor1 = gradientMag[i][j - 1];
          neighbor2 = gradientMag[i][j + 1];
          neighbors = [
            [i, j - 1],
            [i, j + 1],
          ];
        } else if (angle === 45) {
          neighbor1 = gradientMag[i - 1][j + 1];
          neighbor2 = gradientMag[i + 1][j - 1];
          neighbors = [
            [i - 1, j + 1],
            [i + 1, j - 1],
          ];
        } else if (angle === 90) {
          neighbor1 = gradientMag[i - 1][j];
          neighbor2 = gradientMag[i + 1][j];
          neighbors = [
            [i - 1, j],
            [i + 1, j],
          ];
        } else if (angle === 135) {
          neighbor1 = gradientMag[i - 1][j - 1];
          neighbor2 = gradientMag[i + 1][j + 1];
          neighbors = [
            [i - 1, j - 1],
            [i + 1, j + 1],
          ];
        }

        setActivePixel([i, j]);
        setActiveNeighbors(neighbors);
        setNmsExplanation([]);
        // force React to render highlight first
        await new Promise((r) => setTimeout(r, 500));

        setNmsExplanation([
          {
            direction: angle + "°",
            currentMagnitude: current,
            neighbor1: neighbor1,
            neighbor2: neighbor2,
            decision: null,
          },
        ]);

        await new Promise((r) => setTimeout(r, 1200));

        if (current >= neighbor1 && current >= neighbor2) {
          suppressed[i][j] = current;
          setNmsExplanation((prev) => [
            {
              ...prev[0],
              decision: "KEPT (Local Maximum)",
            },
          ]);
        } else {
          suppressed[i][j] = 0;
          setNmsExplanation((prev) => [
            {
              ...prev[0],
              decision: "SUPPRESSED (Not Maximum)",
            },
          ]);
        }

        setAnimatedSuppressed((prev) => {
          const copy = prev.map((r) => [...r]);
          copy[i][j] = suppressed[i][j];
          return copy;
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setSupressed(suppressed);
    setActivePixel(null);
    setActiveNeighbors([]);
    setNmsExplanation(["Non-Maximum Suppression Complete "]);

    enabledNext();
  }

  async function animateDoubleThreshold() {
    setIsSimPlaying(true);
    setIsBoxRunning(true);
    setIsThresholdRunning(true);
    setIsThresholdCompleted(false);
    // myThresButton.current.disabled = true;
    setTLowSliderIsDisabled(true);
    setTHighSliderIsDisabled(true);
    if (!supressed) return;

    const rows = supressed.length;
    const cols = supressed[0].length;

    let clean = supressed.map((row) => row.map((val) => parseFloat(val) || 0));

    let maxVal = Math.max(...clean.flat());
    setMaxGradientVal(maxVal);

    let tLowVal = tlow * maxVal;
    let tHighVal = thigh * maxVal;

    setTLowHighExplanation([
      { text1: `Max Gradient Value = ${maxVal.toFixed(2)}` },
      { text2: `Selected T_low ratio = ${tlow}` },
      { text3: `Selected T_high ratio = ${thigh}` },
      {
        text4: `Final T_low = ${tlow} × ${maxVal.toFixed(2)} = ${tLowVal.toFixed(2)}`,
      },
      {
        text5: `Final T_high = ${thigh} × ${maxVal.toFixed(2)} = ${tHighVal.toFixed(2)}`,
      },
    ]);

    let strong = 255;
    let weak = 75;

    let tempGrid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    setThresholdGrid(tempGrid);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let current = clean[i][j];

        setActiveThreshPixel([i, j]);
        setThresholdExplanation([]);

        //  Highlight pixel
    await new Promise((r) => setTimeout(r, 300));

        setThresholdExplanation([
          { text: `Current Magnitude: ${current}` },
          { text: `T_low = ${tLowVal.toFixed(2)}` },
          { text: `T_high = ${tHighVal.toFixed(2)}` },
        ]);

        await new Promise((r) => setTimeout(r, 900));

        if (current >= tHighVal) {
          tempGrid[i][j] = strong;
          setThresholdExplanation((prev) => [
            ...prev,
            { text: "Classified as STRONG (255)" },
          ]);
        } else if (current >= tLowVal) {
          tempGrid[i][j] = weak;
          setThresholdExplanation((prev) => [
            ...prev,
            { text: "Classified as WEAK (75)" },
          ]);
        } else {
          tempGrid[i][j] = 0;
          setThresholdExplanation((prev) => [
            ...prev,
            { text: "Below T_low → Suppressed (0)" },
          ]);
        }

        await new Promise((r) => setTimeout(r, 400));

    // 4️⃣ Update grid visually
    setThresholdGrid(tempGrid.map((r) => [...r]));

    await new Promise((r) => setTimeout(r, 250));

      }
    }
    //setIsThresholdRunning(false);
    setIsThresholdCompleted(true);
  }
  async function animateHysteresis() {
    setIsSimPlaying(true);
    setIsHysteresisRunning(true);
    setHystExplanation([]);

    if (!thresholdGrid) return;

    let strong = 255;
    let weak = 75;

    let temp = thresholdGrid.map((r) => [...r]);

    const rows = temp.length;
    const cols = temp[0].length;

    //  Step 1: Final grid initially transparent
    let progressiveFinal = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    setFinalGrid(progressiveFinal);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        setActiveHystPixel([i, j]);
        setActiveHystNeighbors([]);

        await new Promise((r) => setTimeout(r, 500));

        // 🔹 CASE 1: Strong pixel
        if (temp[i][j] === strong) {
          setHystExplanation([
            { text: "Strong pixel (255)" },
            { text: "Already strong → kept as edge" },
          ]);

          progressiveFinal[i][j] = strong;

          setFinalGrid(progressiveFinal.map((r) => [...r]));
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }

        // 🔹 CASE 2: Weak pixel
        if (temp[i][j] === weak) {
          setHystExplanation([{ text: "Weak pixel (75) found" }]);

          let neighbors = [];

          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue;

              let newX = i + dx;
              let newY = j + dy;

              if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
                neighbors.push([newX, newY]);
              }
            }
          }

          setActiveHystNeighbors(neighbors);

          await new Promise((r) => setTimeout(r, 1000));

          let connected = neighbors.some(([x, y]) => temp[x][y] === strong);

          if (connected) {
            temp[i][j] = strong;
            setHystExplanation((prev) => [
              ...prev,
              { text: "Connected to STRONG neighbor → PROMOTED to STRONG" },
            ]);
          } else {
            temp[i][j] = 0;
            setHystExplanation((prev) => [
              ...prev,
              { text: "No STRONG neighbor found" },
              { text: "Pixel is SUPPRESSED (0)" },
            ]);
          }

          await new Promise((r) => setTimeout(r, 1000));

          progressiveFinal[i][j] = temp[i][j];
          setFinalGrid(progressiveFinal.map((r) => [...r]));

          continue;
        }

        // 🔹 CASE 3: Already zero
        if (temp[i][j] === 0) {
          setHystExplanation([
            { text: "Pixel value is 0" },
            { text: "Already suppressed → remains 0" },
          ]);

          progressiveFinal[i][j] = 0;

          setFinalGrid(progressiveFinal.map((r) => [...r]));
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    setActiveHystPixel(null);
    setActiveHystNeighbors([]);

    setHystExplanation([{ text: "Hysteresis Completed Successfully ✅" }]);

    //setIsHysteresisRunning(false);
    notifyS("Hysteresis Completed Successfully ✅");
  }

  function Previous() {
    prevSlide();
    setIndex(index - 1);
    myNextButton.current.disabled = false;
  }

  function NEXT() {
    nextSlide();
    setIndex(index + 1);

    setSliderIsDisabled(true); //first step slider

    if (index == 0 && myPadButton.current.disabled == true) {
      myNextButton.current.disabled = false;
    } else if (index == 1 && myBlurButton.current.disabled == true) {
      myNextButton.current.disabled = false;
    } else if (index == 2 && myPadBlurButton.current.disabled == true) {
      myNextButton.current.disabled = false;
    } else if (index == 3 && mySobelButton.current.disabled == true) {
      myNextButton.current.disabled = false;
    } else if (index == 4 && myQuantButton.current.disabled == true) {
      myNextButton.current.disabled = false;
    } else if (index == 5 && myNonMaxButton.current.disabled == true) {
      myNextButton.current.disabled = false;
    } else if (index == 6) {
      myNextButton.current.disabled = true;
      // handleClose2();
    } else {
      myNextButton.current.disabled = true;
      myNextButton.current.style.animation = "";
      myNextButton.current.style.boxShadow = "";
    }
  }

  function enabledNext() {
    myNextButton.current.disabled = false;
    myNextButton.current.style.animation = "pulse 1.5s infinite";
  }

  // tutor implementation
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
  } = useContext(SimContext);

  // Update tutor steps when individual states change
  useEffect(() => {
    const baseSteps = [
      {
        title: "Welcome to Canny Edge Detection Simulation",
        content:
          "This guided walkthrough demonstrates every mathematical stage of the Canny Edge Detection algorithm on a 7×7 matrix image. Follow the highlighted steps carefully.",
        targetId: "guided-tutor-btn-sim",
        placement: "bottom",
      },
      {
        title: "Instruction Panel",
        content:
          "This panel updates automatically after every completed stage. Follow it sequentially.",
        targetId: "inst_div_canny",
        placement: "bottom",
      },
      {
        title: "Step 1: Select an Image",
        content:
          "Choose one of the 7×7 binary sample images. This will act as the input signal for edge detection.",
        targetId: "main-image-box-canny",
        placement: "bottom",
        offset: [0, 10],
      },
    ];
    // step 1: Select an Image
    if (original === null || original === undefined) {
      baseSteps.push({
        title: "Action Required",
        content: "Please select any image to initialize the simulation.",
        targetId: "main-image-box-canny",
        placement: "bottom",
        offset: [0, 10],
      });
      setTutorStepsSim(baseSteps);
      return;
    }
    baseSteps.push(
      {
        title: "Original Image Matrix",
        content:
          "This is the selected 7×7 image displayed in both graphical (black and white) and numerical (0 and 1) form. Edge detection begins from this input.",
        targetId: "graphical-numerical",
        placement: "right",
        offset: [0, 20],
      },

      {
        title: "Gaussian Kernel Equation",
        content:
          "The Gaussian function smooths the image to reduce noise before computing gradients. The kernel values are derived from this equation.",
        targetId: "gaussian_equation",
        placement: "right",
        offset: [0, 10],
      },
      {
        title: "Adjust Sigma",
        content:
          "Use the Sigma slider to generate the Gaussian kernel matrix. Sigma controls the amount of smoothing. Higher σ value results in stronger blur and less noise but softer edges. Lower σ value results in sharper but more noise-sensitive.",
        targetId: "sigma_slider",
        placement: "right",
        offset: [0, 10],
      },
    );

    if (!gKernel) {
      baseSteps.push({
        title: "Action Required",
        content:
          "Please adjust the Sigma slider to generate the Gaussian kernel matrix.",
        targetId: "sigma_slider",
        placement: "right",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }
    baseSteps.push(
      {
        title: "Generated Gaussian Kernel (3×3)",
        content:
          "This 3×3 kernel is computed using the selected sigma (σ) value. It will be used for convolution in the next step.",
        targetId: "gaussian_kernel_matrix",
        placement: "right",
        offset: [10, 10],
      },
      {
        title: "Next Step",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      },
    );
    if (index === 0) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    //      STEP 2 — PADDING ORIGINAL IMAGE
    baseSteps.push(
      {
        title: "Padding Before Convolution",
        content:
          "Before applying a 3×3 kernel, we pad the 7×7 image to 9×9 so that spatial dimensions are preserved.",
        targetId: "padding-canny-zone",
        placement: "left",
        offset: [10, 10],
      },
      {
        title: "Apply Padding",
        content: "Click the 'Pad' button to perform zero-padding.",
        targetId: "pad-btn-zone",
        placement: "bottom",
      },
    );
    if (!padded) {
      baseSteps.push({
        title: "Action Required",
        content: "Please click the 'Pad' button to perform padding.",
        targetId: "pad-btn-zone",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }
    baseSteps.push(
      {
        title: "Padded Matrix",
        content: "This is the padded 9×9 image after zero-padding.",
        targetId: "padded-matrix-canny-zone",
        placement: "right",
        offset: [10, 10],
      },
      {
        title: "Next Step",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      },
    );

    if (index === 1) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    //  STEP 3 — GAUSSIAN BLUR
    baseSteps.push(
      {
        title: " Padded Image",
        content:
          "This is the padded 9×9 image. Padding ensures that convolution can be applied at border pixels without losing information.",
        targetId: "gaussian-blur-matrix-zone",
        placement: "left",
        offset: [0, 10],
      },
      {
        title: "Gaussian Kernel",
        content:
          "This 3×3 Gaussian kernel assigns higher weight to the center pixel and smaller weights to surrounding pixels. It smooths the image by weighted averaging.",
        targetId: "gaussian-kernel-zone",
        placement: "right",
        offset: [0, 10],
      },
      {
        title: "Start Blurring",
        content: "Click 'Blur' to begin animated convolution.",
        targetId: "gussian-blur-btn-zone",
        placement: "bottom",
      },
    );
    if (!startBlur) {
      baseSteps.push({
        title: "Action Required",
        content: "Please click the 'Pad' button to perform padding.",
        targetId: "gussian-blur-btn-zone",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }
    baseSteps.push(
      {
        title: "Current Gaussian Convolution Step ",
        content:
          "For the current 3×3 region, each pixel value is multiplied by its corresponding Gaussian kernel weight. The 9 resulting products are then summed together to compute a single output pixel value. This process performs a weighted averaging operation, where the center pixel has greater influence than its neighbors, resulting in a smoother image.",
        targetId: "gaussian-blur-conv-steps-zone",
        placement: "bottom",
        offset: [0, 10],
      },
      {
        title: "Gaussian Blurred Matrix (Numerical Output)",
        content:
          "The matrix represents the mathematical result of convolution, where each output pixel is computed independently using weighted averaging.",
        targetId: "gaussian-blurred-matrix-zone",
        placement: "top",
      },
      {
        title: "Gaussian Blurred Image (Visual Representation)",
        content:
          "This visualization converts numerical intensities into grayscale values, allowing us to observe the smoothing effect spatially.",
        targetId: "gaussian-blurred-image-zone",
        placement: "top",
        offset: [0, 10],
      },
    );

    if (index === 2) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }
    //     STEP 4 — PADDING BLURRED IMAGE
    // STEP 4 — PADDING AFTER GAUSSIAN BLUR

    baseSteps.push(
      {
        title: "Gaussian Blurred Image (7×7)",
        content:
          "This is the 7×7 Gaussian blurred image obtained after smoothing. Before applying edge detection filters, we need to prepare this image for another convolution operation.",
        targetId: "step-four-blurred-image-zone",
        placement: "bottom",
        offset: [0, 10],
      },
      {
        title: "Why Padding Is Required Again?",
        content:
          "Since Sobel operators use a 3×3 kernel, padding is required to ensure that convolution can be applied at the border pixels. Without padding, edge pixels would be ignored.",
        targetId: "step-four-pad-blurred-button",
        placement: "bottom",
      },
      {
        title: "Start Padding",
        content:
          "Click 'Pad' to add a one-pixel border around the blurred image.",
        targetId: "step-four-pad-blurred-button",
        placement: "bottom",
      },
    );

    // Action gating
    if (!padBlur) {
      baseSteps.push({
        title: "Action Required",
        content:
          "Please click the 'Pad' button to generate the padded blurred image.",
        targetId: "step-four-pad-blurred-button",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    baseSteps.push(
      {
        title: "Padded Blurred Image (9×9)",
        content:
          "The animated border highlights the newly added zero-intensity pixels..This is the padded blurred image. A border of zeros has been added around the 7×7 image, increasing its size to 9×9. This ensures that edge detection filters can process every pixel properly.",
        targetId: "step-four-padded-blurred-image-zone",
        placement: "left",
        offset: [0, 10],
      },
      {
        title: "Next Step",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      },
    );

    if (index === 3) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }
    // STEP 5 — SOBEL CONVOLUTION
    baseSteps.push(
  {
    title: "Step 5: Gradient Computation using Sobel Operator",
    content:
      "In this stage, we compute the intensity gradient of the Gaussian-smoothed image using Sobel operators. The gradient identifies regions of rapid intensity change, which correspond to potential edges.",
    targetId: "padded-blurred-image-matrix-zone",
    placement: "bottom",
    offset: [0, 10],
  },
  {
    title: "Sobel Kernels ",
    content:
      "The Sobel X and Sobel Y kernels approximate first-order partial derivatives along horizontal (Gx) and vertical (Gy) directions. These kernels emphasize intensity changes while incorporating slight smoothing.",
    targetId: "sobel-kernel-div",
    placement: "left",
    offset: [0, 10],
  },
  
  {
    title: "Apply Sobel Convolution",
    content:
      "Click the 'Apply Sobel' button to begin animated convolution. Each 3×3 neighborhood is multiplied element-wise with the Sobel kernels, and the products are summed to compute Gx and Gy at that pixel location.",
    targetId: "apply-sobel-button-zone",
    placement: "bottom",
  }
);

// Action gating
      if (!convolutedx || !convolutedy) {
  baseSteps.push({
    title: "Action Required",
    content:
      "Please click the 'Apply Sobel' button to compute the horizontal and vertical gradient components.",
    targetId: "apply-sobel-button-zone",
    placement: "bottom",
  });

  setTutorStepsSim(baseSteps);
  return;
      }
      
        baseSteps.push(
            {
          title: "Sliding Window Operation",
          content:
            "The highlighted orange window shows the current region being multiplied with the kernel. Each overlapping element is multiplied and summed step-by-step.",
          targetId: "kernel-sliding-box",
          placement: "top",
          offset: [-10, 12],
        },
  {
    title: "Horizontal Gradient (Gx)",
    content:
      "This matrix represents the horizontal gradient component computed using the Sobel X kernel. Large magnitude values indicate strong vertical edges in the image.",
    targetId: "sobel-x-canny",
    placement: "top",
  },
  {
    title: "Vertical Gradient (Gy)",
    content:
      "This matrix represents the vertical gradient component computed using the Sobel Y kernel. Large magnitude values indicate strong horizontal edges.",
    targetId: "sobel-y-canny",
    placement: "top",
  },
  {
  title: "Live Gradient Direction Computation",
  content:
    "The edge orientation is calculated using above formula. The substituted expression shown here corresponds to the exact horizontal and vertical gradient components computed for this pixel. The resulting angle indicates the direction of maximum intensity variation and will later be quantized during Non-Maximum Suppression.",
  targetId: "gradient-direction-canny-zone",
  placement: "right",
  offset: [0, 10],
},
  {
  title: "Gradient Direction (Edge Orientation)",
  content:
    "The gradient direction θ, derived from Gy and Gx, indicates the orientation of maximum intensity change and defines the edge direction.",
  targetId: "gradient-direction-matrix-zone",
  placement: "bottom",
  offset: [0, 10],
},
{
  title: "Live Gradient Magnitude Computation",
  content:
    "For the currently highlighted pixel, the gradient magnitude is computed using above formula. The displayed expression shows the actual substituted values of Gx and Gy obtained from convolution. This represents the Euclidean norm of the gradient vector and quantifies the edge strength at that pixel location.",
  targetId: "gradient-magnitude-canny-zone",
  placement: "right",
  offset: [0, 10],
},
{
  title: "Gradient Magnitude (Edge Strength)",
  content:
    "The gradient magnitude G quantifies how rapidly the image intensity changes at a pixel. It is computed as the Euclidean norm of the gradient vector formed by (Gx, Gy). Larger magnitude values correspond to sharper transitions in intensity, indicating stronger potential edges.",
  targetId: "gradient-magnitude-matrix-zone",
  placement: "bottom",
  offset: [0, 10],
},
  {
    title: "Next Step",
    content:
      "Click the 'Next' button to continue to the next step.",
    targetId: "next-btn-zone",
    placement: "left",
    offset: [0, 10],
  }
      );
      if (index === 4) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
      }

    // STEP 6 — GRADIENT QUANTISATION

    baseSteps.push(
      {
        title: "Gradient Direction Matrix",
        content:
          "This matrix contains the computed gradient directions for each pixel. The angle represents the direction of maximum intensity change at that pixel.",
        targetId: "step-six-gradient-matrix",
        placement: "left",
        offset: [0, 10],
      },
      {
        title: "Why Quantisation Is Needed?",
        content:
          "For Non-Maximum Suppression, we only need four principal directions: 0°, 45°, 90°, and 135°. Therefore, each gradient angle is approximated to the nearest of these four directions.",
        targetId: "step-six-quantise-button",
        placement: "bottom",
        
      },
      {
        title: "Start Quantisation",
        content:
          "Click 'Quantise' to map each gradient angle to its nearest principal direction (0°, 45°, 90°, or 135°).",
        targetId: "step-six-quantise-button",
        placement: "bottom",
      },
    );

    if (!quantize) {
      baseSteps.push({
        title: "Action Required",
        content:
          "Please click the 'Quantise' button to perform gradient direction quantisation.",
        targetId: "step-six-quantise-button",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    baseSteps.push(
      {
  title: "Live Gradient Direction Quantization",
  content:
    "For the currently highlighted pixel, the computed gradient angle is first normalized to the range [0°, 180°). It is then compared against predefined angular intervals to determine the closest principal direction (0°, 45°, 90°, or 135°). This quantized direction defines the axis along which neighboring pixels will be examined in the next stage.",
  targetId: "convStepsQuant",
  placement: "right",
  offset: [0, 10],
},
      {
        title: "Quantised Direction Matrix",
        content:
          "Each gradient angle has now been replaced with its nearest principal direction. This simplifies edge direction analysis and prepares the image for Non-Maximum Suppression.",
        targetId: "step-six-quantise-matrix",
        placement: "right",
        offset: [0, 10],
      },
      {
        title: "Directional Meaning",
        content:
          "0° means Horizontal edge comparison\n90° means Vertical edge comparison\n45° and 135° means Diagonal edge comparison\n\nThese directions determine which neighboring pixels will be compared in the next step.",
        targetId: "quantised-canny-div",
        placement: "top",
        offset: [0, 10],
      },
      {
        title: "Next Step",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      },
    );
    if (index === 5) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    //  STEP 7 — NON-MAX SUPPRESSION
    baseSteps.push(
{
    title: "Resultant Gradient Magnitude",
    content:
      "This matrix represents the gradient magnitude computed using Sobel derivatives. Each value indicates the edge strength at that pixel. Higher magnitudes correspond to stronger intensity transitions and potential edge locations.",
    targetId: "step-seven-gradient-mag-matrix",
    placement: "right",
    offset: [0, 10],
  },

  {
    title: "Quantised Gradient Direction",
    content:
      "Each pixel's gradient direction has been quantized to one of four principal orientations: 0°, 45°, 90°, or 135°. This discretization determines the axis along which neighboring pixels will be compared during non-maximum suppression.",
    targetId: "step-seven-quantise-matrix",
    placement: "left",
    offset: [0, 10],
  },
  {
    title:"Click Process Button",
    content:"Click 'Process' to thin edges by removing non-maximal gradient pixels.",
    targetId: "step-seven-process-btn",
    placement: "bottom",
    
  }   
    );
    // if (!supressed) {
    //   console.log("supressed", supressed);
    //   console.log(baseSteps.length);
    //   baseSteps.push({
    //     title: "Action Required",
    //     content:
    //       "Click 'Process' to apply Non-Maximum Suppression.",
    //     targetId: "step-seven-process-btn",
    //     placement: "bottom",
    //   });

    //   setTutorStepsSim(baseSteps);
    //   return;
    // }
    baseSteps.push(
 {
    title: "Non-Maximum Suppression Explanation",
    content:
      "For the highlighted pixel, the algorithm selects two neighboring pixels along the quantized gradient direction. If the current magnitude is greater than or equal to both neighbors, it is preserved as a local maximum. Otherwise, it is suppressed to zero. Highlighted cells indicate the active pixel and its comparison neighbors.",
    targetId: "step-seven-nms-explanation-container",
    placement: "left",
    offset: [0, 10],
  },

  {
    title: "Suppressed Gradient",
    content:
      "After processing all pixels, only local maxima remain. Non-maximal pixels are suppressed to zero, resulting in thin, well-localized edges. This refined edge map is the output of the Non-Maximum Suppression stage.",
    targetId: "step-seven-suppressed-gradient-matrix",
    placement: "top",
    offset: [0, 10],
  },
      {
        title: "Next Step",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      },
    );
    if (index === 6) {
      baseSteps.push({
        title: "Action Required",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      });

      setTutorStepsSim(baseSteps);
      return;
    }


    // STEP 8 — DOUBLE THRESHOLD
    baseSteps.push(
        {
    title: "Suppressed Gradient",
    content:
      "This matrix is the output of Non-Maximum Suppression. It contains thin edge responses where only local maxima were retained. These values will now be classified using double thresholding.",
    targetId: "step-eight-suppressed-gradient",
    placement: "top",
    offset: [0, 10],
  },

  {
    title: "Set Threshold Ratios (T_low and T_high)",
    content:
      "Adjust the T low and T high sliders. These ratios are multiplied with the maximum gradient magnitude to compute the actual threshold values. T high identifies strong edges, while T low determines potential weak edges.",
    targetId: "step-eight-thresholding-container",
    placement: "bottom",
    offset: [0, 10],
  },

  {
    title: "Click Double Threshold Button",
    content:
      "Click 'Run Double Threshold' to classify pixels. ",
    targetId: "step-eight-run-double-threshold",
    placement: "bottom",
    offset: [0, 10],
  },
    )

    if (!isThresholdRunning) {
      baseSteps.push({
        title: "Action Required",
        content:
          " Click 'Run Double Threshold' to classify pixels. ",
        targetId: myThresButton?.current?.id || "final-grid-canny",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }
    baseSteps.push({
   title:"Calculated T_low and T_high Values",
   content:"The algorithm computes the actual T low and T high values by multiplying the ratios with the maximum gradient magnitude. T_high identifies strong edges, while T_low determines potential weak edges.",
   targetId: "step-eight-dlLow-live-explanation",
   placement: "right",
    offset: [0, 10],
 },
  {
    title: "Double Threshold Live Explanation",
    content:
      "For the highlighted pixel, the algorithm displays its magnitude, computed T_low and T_high values, and its classification result. The matrix updates progressively to show strong (white), weak (gray), and suppressed (black) pixels.",
    targetId: "step-eight-dl-live-explanation",
    placement: "left",
    offset: [0, 10],
  },
  {
    title: "Double Threshold Matrix",
    content:
      "This matrix displays the result of double thresholding. Strong edges are white, weak edges are gray, and suppressed edges are black.",
    targetId: "step-eight-threshold-matrix",
    placement: "right",
    offset: [0, 10],
  },

  {
    title: "Run Hysteresis",
    content:
      "Now, Click 'Run Hysteresis' to refine edges.",
    targetId: "step-eight-run-hysteresis",
    placement: "bottom",
    offset: [0, 10],
  },
);
 if(!isHysteresisRunning){
  baseSteps.push({
    title: "Action Required",
    content:
      " Click 'Run Hysteresis' to refine edges.",
    targetId: "step-eight-run-hysteresis",
    placement: "bottom",
    offset: [0, 10],
  });
 }
baseSteps.push(
  
  {
    title: "Hysteresis Live Explanation",
    content:
      "If a weak pixel is connected to at least one strong neighbor, it is promoted to STRONG (255). Otherwise, it is suppressed to zero. Highlighted neighbors indicate the connectivity check.",
    targetId: "step-eight-hytresis-live-explanation",
    placement: "left",
    offset: [0, 10],
  },

  {
    title: "Final Edge Map",
    content:
      "After hysteresis, only strong and connected edge pixels remain. This final binary edge map represents the complete output of the Canny Edge Detection algorithm.",
    targetId: "step-eight-final-grid-matrix",
    placement: "top",
    offset: [0, 10],
  },

  {
    title: "Simulation Completed",
    content:
      "Congratulations! All stages of the Canny Edge Detection algorithm have now been executed: Gradient Computation, Quantization, Non-Maximum Suppression, Double Thresholding, and Hysteresis.",
    targetId: "step-eight-final-grid-matrix",
    placement: "bottom",
    offset: [0, 10],
  }
)

    setTutorStepsSim(baseSteps);
  }, [
    original,
   
    image,
    gKernel,
    padded,
   startBlur,
    padBlur,
    convolutedx,
    gradient,
    quantize,
    supressed,
    finalGrid,
    setTutorStepsSim,
    index,
    isHysteresisRunning,
    isBoxRunning,

  ]);

  const maxGrad =
    gradientMag && Math.max(...gradientMag.flat().map(Number)) > 0
      ? Math.max(...gradientMag.flat().map(Number))
      : 1;
  return (
    <MathJaxContext>
      <OpenCvProvider>
        <div id="main-box-canny">
          <DialogTitle id="instructions-dialog-title">
            <div
              style={{
                width: "50%",
                justifyContent: "flex-start",
                display: "flex",
              }}
            >
              Canny Edge Detection Concept
            </div>
            <div
              style={{
                width: "50%",

                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <TutorBtn
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
              </TutorBtn>
              <TutorBtn
                id="sound-btn"
                title={isSpeaking && !isPaused ? "Pause" : "Play"}
                onClick={handleSpeechToggleSim}
              >
                <img
                  src={isSpeaking && !isPaused ? voice_pause : voice}
                  alt="voice"
                  style={{ width: "40px", height: "auto", marginRight: "10px" }}
                />
              </TutorBtn>
              <TutorBtn
                onClick={() => {
                  resetTutorSim();
                  handleClose3Modal();
                }}
                color="primary"
                style={{ backgroundColor: "beige", marginRight: "10px" }}
              >
                Close
              </TutorBtn>
            </div>
          </DialogTitle>
          <div id="inst_div_canny">
            <div
              style={{
                padding: "2px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                minHeight: "30px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              <div id="inst_content_canny">
                <span>{instructions[currentIndex]}</span>
              </div>
            </div>
          </div>

          <Carousel
            activeIndex={index}
            slide={false}
            interval={null}
            indicators={false}
            onSelect={(selectedIndex) => setIndex(selectedIndex)}
          >
            {/* step1: choose image & sigma value*/}
            <Carousel.Item>
              <div id="Choose_box_canny">
                <div className="coolinput_canny">
                  <label htmlFor="input" className="text">
                    Choose:
                  </label>
                  <Box
                    id="main-image-box-canny"
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
                      <div id="image-box-canny">
                        <div onClick={() => !imagesDisabled && handleImage(0)}>
                          <img
                            src={plus}
                            id="image"
                            className={image === 0 ? "image-selected" : ""}
                            style={{
                              opacity: imagesDisabled ? 0.7 : 1,
                              cursor: imagesDisabled
                                ? "not-allowed"
                                : "pointer",
                            }}
                          />
                        </div>
                        <div onClick={() => !imagesDisabled && handleImage(1)}>
                          <img
                            src={minus}
                            id="image"
                            className={image === 1 ? "image-selected" : ""}
                            style={{
                              opacity: imagesDisabled ? 0.7 : 1,
                              cursor: imagesDisabled
                                ? "not-allowed"
                                : "pointer",
                            }}
                          />
                        </div>
                        <div onClick={() => !imagesDisabled && handleImage(2)}>
                          <img
                            src={multiply}
                            id="image"
                            className={image === 2 ? "image-selected" : ""}
                            style={{
                              opacity: imagesDisabled ? 0.7 : 1,
                              cursor: imagesDisabled
                                ? "not-allowed"
                                : "pointer",
                            }}
                          />
                        </div>
                        <div onClick={() => !imagesDisabled && handleImage(3)}>
                          <img
                            src={divide}
                            id="image"
                            className={image === 3 ? "image-selected" : ""}
                            style={{
                              opacity: imagesDisabled ? 0.7 : 1,
                              cursor: imagesDisabled
                                ? "not-allowed"
                                : "pointer",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Box>
                </div>
              </div>

              <div id="original-image-canny">
                <h2>Original Image:</h2>
                <div id="graphical-numerical">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "1px",
                    }}
                    className="original-matrix-box"
                  >
                    {original &&
                      original.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            id="original_matrix"
                            className="matrix-animate"
                            style={{
                              backgroundColor: cell === 0 ? "black" : "white",
                              animationDelay: `${rowIndex * 0.15}s`,
                            }}
                          ></div>
                        )),
                      )}
                  </div>
                  <div
                    className="canny-matrix-over"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "1px",
                    }}
                  >
                    {original &&
                      original.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            id="original_matrix"
                            className="canny-matrix-animate"
                            style={{
                              backgroundColor: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: cell === 1 ? "red" : "black",
                              animationDelay: `${rowIndex * 0.15}s`,
                            }}
                          >
                            {cell}
                          </div>
                        )),
                      )}
                  </div>
                </div>

                <div id="gaussian-kernel-canny">
                  {original && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <h2>Gaussian Kernel: </h2>
                        <MathJax id="gaussian_equation">{`\\[G(x,y)=\\frac{1}{2\\pi\\sigma^2}e^{(-\\frac{x^2+y^2}{2\\sigma^2})}\\]`}</MathJax>
                      </div>

                      {original && (
                        <>
                          <div id="sigma_slider">
                            <h4
                              style={{
                                margin: "5px 0px",
                                textAlign: "left",
                                color: "#444444",
                              }}
                            >
                              Set Sigma (σ):{" "}
                              <span style={{ color: "#FF2929" }}>{sigma}</span>
                            </h4>
                            <Slider
                              sx={{ color: "#1D2A6D" }}
                              value={sigma}
                              min={0.1}
                              max={2.9}
                              step={0.1}
                              marks
                              valueLabelDisplay="auto"
                              onChange={(e) => {
                                setSigma(e.target.value);
                                process(e.target.value);
                              }}
                              disabled={isSliderDisabled}
                            />
                            {/* <Button
  variant="contained"
  onClick={process}
  disabled={!sigma}
>
  Generate Kernel
</Button> */}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div
                    id="gaussian_kernel_matrix"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: "1px",
                    }}
                  >
                    {gKernel &&
                      gKernel.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            id="gaussian_matrix"
                            className="kernel-canny-matrix-animate"
                            style={{ animationDelay: `${rowIndex * 0.15}s` }}
                          >
                            {cell}
                          </div>
                        )),
                      )}
                  </div>
                </div>
              </div>
            </Carousel.Item>

            {/* step2:padding */}
            <Carousel.Item>
              <div id="padding-canny">
                {gKernel && (
                  <>
                    <h2>Padding</h2>
                    <p>
                      Padding is essential because, after convolution, the grid
                      size decreases from 7×7 to 5×5; hence, we pad it to{" "}
                      <b>9×9</b>.
                    </p>
                  </>
                )}
                <div id="nonpadded-padded">
                  <div id="nonpadded-padded-matrix">
                    <div style={{ textAlign: "center" }}>
                      {gKernel && <h4>Non-Padded</h4>}
                      <div
                        id="padding-canny-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "1px",
                        }}
                      >
                        {gKernel &&
                          original &&
                          original.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                id="nonpadded_matrix"
                                style={{
                                  backgroundColor:
                                    cell === 0 ? "black" : "white",
                                }}
                              ></div>
                            )),
                          )}
                      </div>
                      <span>7×7</span>
                    </div>
                    {padded && <div id="pad_arrow">&#129066;</div>}
                    <div style={{ textAlign: "center" }}>
                      {padded && <h4>Padded</h4>}
                      <div
                        id="padded-matrix-canny-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(9, 1fr)",
                          gap: "1px",
                        }}
                      >
                        {padded &&
                          padded.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                              const isBorder =
                                rowIndex === 0 ||
                                rowIndex === padded.length - 1 ||
                                colIndex === 0 ||
                                colIndex === row.length - 1;

                              return (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  id="padded_matrix"
                                  className={`padded-cell ${
                                    cell === 0 && isBorder
                                      ? "animate-border"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor:
                                      cell === null
                                        ? "transparent"
                                        : cell === 0
                                          ? "black"
                                          : "white",
                                  }}
                                ></div>
                              );
                            }),
                          )}
                      </div>
                      {padded && <span>9×9</span>}
                    </div>
                  </div>
                  {gKernel && (
                    <Button
                      id="pad-btn-zone"
                      ref={myPadButton}
                      className="btn"
                      onClick={padding}
                    >
                      Pad
                    </Button>
                  )}
                </div>
              </div>
            </Carousel.Item>

            {/* step3: Gaussian Blur */}
            <Carousel.Item>
              <div id="gaussian-blur-canny">
                {padded && <h2>Gaussian Blur</h2>}
                <div id="conv-mult-canny">
                  <div className="common-flex">
                    <h4>Padded Image</h4>
                    <div
                      id="gaussian-blur-matrix-zone"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(9, 1fr)",
                        gap: "1px",
                      }}
                    >
                      {padded &&
                        padded.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              id="padded-canny"
                              style={{
                                backgroundColor: cell === 0 ? "black" : "white",
                              }}
                            ></div>
                          )),
                        )}

                      {startBlur && (
                        <div
                          style={{
                            position: "absolute",
                            top: `${(blurX - 1) * (document.getElementById("padded-canny").offsetWidth + 0.5) + document.getElementById("padded-canny").offsetTop}px`,
                            left: `${(blurY - 1) * (document.getElementById("padded-canny").offsetHeight + 0.5) + document.getElementById("padded-canny").offsetLeft}px`,
                            width: `${document.getElementById("padded-canny").offsetWidth * 3 + 6}px`,
                            height: `${document.getElementById("padded-canny").offsetHeight * 3 + 6}px`,
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "1px",
                            border: "2px solid red",

                            backgroundColor: "rgba(255, 77, 77, 0.37)",
                            boxShadow: "inset 0 0 10px rgba(255, 77, 77, 1)",
                            pointerEvents: "none",
                            transition: "top 0.25s ease, left 0.25s ease",
                            zIndex: 1000,
                          }}
                          className=""
                        ></div>
                      )}
                    </div>
                    {padded && <span className="matrix-size">9×9</span>}
                  </div>

                  <div class="blur_oper">*</div>
                  <div className="common-flex">
                    <h4>Gaussian Kernel</h4>
                    <div
                      id="gaussian-kernel-zone"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "1px",
                      }}
                    >
                      {padded &&
                        gKernel &&
                        gKernel.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              id="gaussian_matrix"
                              key={`${rowIndex}-${colIndex}`}
                              className="kernel-canny-matrix-non-animate"
                            >
                              {cell}
                            </div>
                          )),
                        )}
                    </div>

                    {gKernel && <span className="matrix-size">3×3</span>}
                  </div>

                  <div class="blur_oper">=</div>
                  <div className="common-flex">
                    {startBlur && <h4>Gaussian Blurred Matrix</h4>}
                    <div
                      id="gaussian-blurred-matrix-zone"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "1px",
                      }}
                    >
                      {startBlur &&
                        blurred.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              id="gaussian_blur_matrix"
                              key={`${rowIndex}-${colIndex}`}
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
                              {cell}
                            </div>
                          )),
                        )}
                    </div>
                    {startBlur && <span className="matrix-size">7×7</span>}
                  </div>

                  {startBlur && <div class="blur_oper">☰</div>}
                  <div id="blurred-out-canny">
                    <div className="common-flex">
                      {startBlur && <h4>Gaussian Blurred Image</h4>}
                      <div
                        id="gaussian-blurred-image-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "1px",
                        }}
                      >
                        {startBlur &&
                          blurred.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                id="result_gaussian_blur_matrix"
                                className={
                                  activeRes.row === rowIndex &&
                                  activeRes.col === colIndex
                                    ? "resImage-active"
                                    : ""
                                }
                                style={{
                                  backgroundColor: `rgb(${(cell / Math.max(...blurred.flat())) * 255},${(cell / Math.max(...blurred.flat())) * 255},${(cell / Math.max(...blurred.flat())) * 255})`,
                                }}
                              ></div>
                            )),
                          )}
                      </div>
                      {startBlur && <span className="matrix-size">7x7</span>}
                    </div>
                  </div>
                </div>
                {startBlur && (
                  <div className="conv-steps-box">
                    <h4>Current Gaussian Convolution Step</h4>

                    <div
                      id="gaussian-blur-conv-steps-zone"
                      className="conv-steps"
                    >
                      <div className="gussian-step">Step {gussianStep} :</div>
                      {gussianConvSteps.map((step, index) => (
                        <div key={index}>
                          ({step})
                          {index !== gussianConvSteps.length - 1 && " +"}
                        </div>
                      ))}
                      <div className="conv-result">= {gussianCurrentSum}</div>
                    </div>
                  </div>
                )}

                {padded && (
                  <Button
                    id="gussian-blur-btn-zone"
                    ref={myBlurButton}
                    className="btn"
                    style={{ zIndex: "1000" }}
                    onClick={blur}
                  >
                    Blur
                  </Button>
                )}
              </div>
            </Carousel.Item>

            {/* step4: blurred padding */}
            <Carousel.Item>
              <div id="pad-after-canny">
                {blurred && (
                  <>
                    <h2>Padding</h2>
                    <p>We have to pad the blurred image again as its 7x7</p>
                  </>
                )}

                <div id="pad-after-canny-div">
                  <div id="blurred-out-canny">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <h4>Gaussian Blurred Image (7x7) </h4>
                      <div
                        id="step-four-blurred-image-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "1px",
                        }}
                      >
                        {startBlur &&
                          blurred.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                id="blurred-out-canny-matrix"
                                style={{
                                  backgroundColor: `rgb(${(cell / Math.max(...blurred.flat())) * 255},${(cell / Math.max(...blurred.flat())) * 255},${(cell / Math.max(...blurred.flat())) * 255})`,
                                }}
                              ></div>
                            )),
                          )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {padBlur && <div id="pad-after-canny-arrow">&#129066;</div>}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    {padBlur && <h4>Padded Blurred Image (9x9)</h4>}
                    <div
                      id="step-four-padded-blurred-image-zone"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(9, 1fr)",
                        gap: "1px",
                      }}
                    >
                      {padBlur &&
                        padBlur.map((row, rowIndex) =>
                          row.map((cell, colIndex) => {
                            const isBorder =
                              rowIndex === 0 ||
                              rowIndex === padBlur.length - 1 ||
                              colIndex === 0 ||
                              colIndex === row.length - 1;

                            return (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                id="padded-blurred-out-canny-matrix"
                                className={`padded-cell ${
                                  cell === 0 && isBorder ? "animate-border" : ""
                                }`}
                                style={{
                                  backgroundColor:
                                    cell === null
                                      ? "transparent"
                                      : `rgb(${
                                          (cell / Math.max(...blurred.flat())) *
                                          255
                                        },${
                                          (cell / Math.max(...blurred.flat())) *
                                          255
                                        },${
                                          (cell / Math.max(...blurred.flat())) *
                                          255
                                        })`,
                                }}
                              ></div>
                            );
                          }),
                        )}
                    </div>
                  </div>
                </div>

                {blurred && (
                  <Button
                    id="step-four-pad-blurred-button"
                    ref={myPadBlurButton}
                    className="btn"
                    onClick={padblurred}
                  >
                    Pad
                  </Button>
                )}
              </div>
            </Carousel.Item>

            {/* step5: sobel application */}
            <Carousel.Item>
              {padBlur && (
                <div id="sobel-application-canny">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    <div></div>
                    {/* {padBlur && (
                      <div id="convStepsX" className="conv-steps-box">
                        <h4>Kernel X Convolution Step</h4>

                        <div className="conv-steps">
                          <div className="conv-step">Step {step} :</div>
                          {convSteps.x.map((item, index) => (
                            <span key={index}>
                              ({item})
                              {index !== convSteps.x.length - 1 && " + "}
                            </span>
                          ))}
                          <div className="conv-result">= {currentSum.x}</div>
                        </div>
                      </div>
                    )} */}
                    {padBlur && (
                      <div className="padded-blurred-image">
                        Padded Blurred Image (9x9)
                      </div>
                    )}

                    {padBlur && (
                      <div
                      id="padded-blurred-image-matrix-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(9, 1fr)",
                          gap: "0px",
                        }}
                        className="matrix-card"
                      >
                        {(() => {
                          return padBlur.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className="padded-sobel-matrix"
                                id="sobel-cell"
                              >
                                {cell}
                              </div>
                            )),
                          );
                        })()}
                      </div>
                    )}
                    {sobelPosX !== -1 && sobelPosY !== -1 && (
                      <div
                      id="kernel-sliding-box"
                        style={{
                          position: "absolute",
                          top: `${sobelPosX * ((document.getElementById("sobel-cell")?.offsetWidth || 0) - 0) + ((document.getElementById("sobel-cell")?.offsetTop || 0) - 37)}px`,
                          left: `${sobelPosY * ((document.getElementById("sobel-cell")?.offsetHeight || 0) - 0.5) + ((document.getElementById("sobel-cell")?.offsetLeft || 0) - 37)}px`,
                          width: `${(document.getElementById("sobel-cell")?.offsetWidth || 0) * 3 + 2.5}px`,
                          height: `${(document.getElementById("sobel-cell")?.offsetHeight || 0) * 3 + 2.5}px`,
                          border: "3px solid #ff4d4d",
                          backgroundColor: "rgba(255, 77, 77, 0.12)",
                          boxShadow: "inset 0 0 10px rgba(255, 77, 77, 0.5)",
                          pointerEvents: "none",
                          transition: "top 0.25s ease, left 0.25s ease",
                          zIndex: 1000,
                        }}
                      ></div>
                    )}
                    {/* sobel x convolution step */}
                    {/* <div>
                                                            {padBlur && (
                      <div id="convStepsX" className="conv-steps-box">
                        <h4>Kernel X Convolution Step</h4>

                        <div className="conv-steps">
                          <div className="conv-step">Step {step} :</div>
                          {convSteps.x.map((item, index) => (
                            <span key={index}>
                              ({item})
                              {index !== convSteps.x.length - 1 && " + "}
                            </span>
                          ))}
                          <div className="conv-result">= {currentSum.x}</div>
                        </div>
                      </div>
                    )}
                    </div> */}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h2>Sobel Application</h2>
                    <div id="sobel-kernel-div">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <h4 style={{ color: "#1f2937" }}> Sobel X Kernel</h4>
                        <div
                          style={{
                            textAlign: "center",
                            justifyItems: "center",
                            width: "fit-content",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: "0px",
                            }}
                          >
                            {sobelx &&
                              sobelx.map((row, rowIndex) =>
                                row.map((cell, colIndex) => (
                                  <div
                                    key={`${rowIndex}-${colIndex}-${imageAnimateKey}`}
                                    className="padded-sobel-matrix sobelX"
                                  >
                                    {cell}
                                  </div>
                                )),
                              )}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <h4 style={{ color: "#1f2937" }}> Sobel Y Kernel</h4>
                        <div
                          style={{
                            textAlign: "center",
                            justifyItems: "center",
                            width: "fit-content",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: "0px",
                            }}
                          >
                            {sobely &&
                              sobely.map((row, rowIndex) =>
                                row.map((cell, colIndex) => (
                                  <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="padded-sobel-matrix sobelY"
                                  >
                                    {cell}
                                  </div>
                                )),
                              )}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: "center",
                          justifyItems: "center",
                          alignItems: "center",
                        }}
                      >
                        <Button
                        id="apply-sobel-button-zone"
                          className="btn"
                          ref={mySobelButton}
                          onClick={applySobelConvolution}
                        >
                          Apply Sobel
                        </Button>
                      </div>
                    </div>
                  </div>

                  {convolutedx && (
                    <div id="sobel-arrow-div">
                      <div id="sobel-arrow-1">&#8599;</div>
                      <div id="sobel-arrow-2">&#8599;</div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {convolutedx && <h2>Applying Convolution</h2>}
                    <div id="convolution-sobel-canny">
                      <div id="sobel-x-canny">
                        {convolutedx && (
                          <h4 style={{ color: "#1f2937" }}> Sobel X</h4>
                        )}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: "0px",
                          }}
                        >
                          {convolutedx &&
                            convolutedx.map((row, rowIndex) =>
                              row.map((cell, colIndex) => (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  id="sobel-matrix-x"
                                  className={
                                    activeSobelDX.row === rowIndex &&
                                    activeSobelDX.col === colIndex
                                      ? "dx-active"
                                      : completedSobelDXSteps.some(
                                            (item) =>
                                              item.row === rowIndex &&
                                              item.col === colIndex,
                                          )
                                        ? "dx-completed"
                                        : ""
                                  }
                                >
                                  {cell}
                                </div>
                              )),
                            )}
                        </div>
                      </div>
                      <div id="sobel-y-canny">
                        {convolutedy && (
                          <h4 style={{ color: "#1f2937" }}> Sobel Y</h4>
                        )}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: "0px",
                          }}
                        >
                          {convolutedy &&
                            convolutedy.map((row, rowIndex) =>
                              row.map((cell, colIndex) => (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  id="sobel-matrix-y"
                                  style={{}}
                                  className={
                                    activeSobelDY.row === rowIndex &&
                                    activeSobelDY.col === colIndex
                                      ? "dy-active"
                                      : completedSobelDYSteps.some(
                                            (item) =>
                                              item.row === rowIndex &&
                                              item.col === colIndex,
                                          )
                                        ? "dy-completed"
                                        : ""
                                  }
                                >
                                  {cell}
                                </div>
                              )),
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {gradient && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div id="sobel-arrow-1">=</div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div id="gradient-canny">
                      {gradient && <h4>Resultant Gradient Direction</h4>}
                      {gradient && <BlockMath math={equation1} />}
                      {gradient && (
                        <div id="gradient-direction-canny-zone" className="sobel-gradient-conv">
                          {convSteps.direction.map((item, index) => (
                            <span key={index}>{item}</span>
                          ))}{" "}
                          = {currentSum.direction}
                        </div>
                      )}
                      <div
                        id="gradient-direction-matrix-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "0px",
                        }}
                      >
                        {gradient &&
                          gradient.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                id="sobel-gradient-matrix"
                                className={
                                  activeSobelRes.row === rowIndex &&
                                  activeSobelRes.col === colIndex
                                    ? "res-active"
                                    : completedSobelResSteps.some(
                                          (item) =>
                                            item.row === rowIndex &&
                                            item.col === colIndex,
                                        )
                                      ? "res-completed"
                                      : ""
                                }
                              >
                                {cell}
                              </div>
                            )),
                          )}
                      </div>
                    </div>
                    <div id="gradient-canny">
                      {gradient && (
                        <h4 style={{ paddingTop: "10px" }}>
                          Resultant Gradient Magnitude
                        </h4>
                      )}
                      {gradient && <BlockMath math={equation2} />}
                      {gradient && (
                        <div id="gradient-magnitude-canny-zone" className="sobel-gradient-conv">
                          {convSteps.result.map((item, index) => (
                            <span key={index}>{item}</span>
                          ))}{" "}
                          = {currentSum.result}
                        </div>
                      )}

                      <div
                        id="gradient-magnitude-matrix-zone"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "0px",
                        }}
                      >
                        {gradientMag &&
                          gradientMag.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                id="sobel-gradient-matrix"
                                className={
                                  activeSobelRes.row === rowIndex &&
                                  activeSobelRes.col === colIndex
                                    ? "res-active"
                                    : completedSobelResSteps.some(
                                          (item) =>
                                            item.row === rowIndex &&
                                            item.col === colIndex,
                                        )
                                      ? "res-completed"
                                      : ""
                                }
                              >
                                {cell}
                              </div>
                            )),
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Carousel.Item>

            {/* step6: quantise */}
            <Carousel.Item>
              <div id="quantised-canny">
                <h2>Quantisation of gradient</h2>
                <p>
                  Quantises gradient angles to whatever is the nearest 0, 45,
                  90, 135
                </p>

                <div id="quantised-canny-div">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "center",
                    }}
                  >
                    {gradient && <h4>Gradient</h4>}
                    <div
                      id="step-six-gradient-matrix"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "1px",
                      }}
                    >
                      {gradient &&
                        gradient.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`padded-sobel-matrix ${
                                activeQuantPixel &&
                                activeQuantPixel[0] === rowIndex &&
                                activeQuantPixel[1] === colIndex
                                  ? "active-quant-pixel"
                                  : ""
                              }`}
                            >
                              {cell}
                            </div>
                          )),
                        )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div id="quantised-canny-arrow">&#129066;</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "center",
                    }}
                  >
                    {quantize && <h4>Quantise</h4>}
                    <div
                      id="step-six-quantise-matrix"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "1px",
                      }}
                    >
                      {quantize &&
                        quantize.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`quantised-canny-matrix dirQ-${cell}`}
                            >
                              {cell === null
                                ? ""
                                : cell === 0
                                  ? "0"
                                  : cell === 45
                                    ? "45"
                                    : cell === 90
                                      ? "90"
                                      : "135"}
                            </div>
                          )),
                        )}
                    </div>
                  </div>
                </div>

                {quantStepNumber !== 0 && (
                  <div
                    id="convStepsQuant"
                    className="conv-steps-quantise-container"
                  >
                    <h4>Gradient Direction Quantization Step</h4>

                    <div className="conv-steps-quantise-box">
                      <div className="conv-step-quantise-step">
                        Step {quantStepNumber} :
                      </div>

                      {quantSteps.map((item, index) => (
                        <div
                          className="conv-step-quantise-item-box"
                          key={index}
                        >
                          <div>Original Angle: {item.OriginalAngle}</div>
                          <div>Normalized: {item.Normalized}</div>
                          <div>{item.RangeMatched}</div>
                          <div>Quantized To: {item.QuantizedTo}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  id="step-six-quantise-button"
                  className="btn"
                  ref={myQuantButton}
                  onClick={quantiseGrad}
                >
                  Quantise
                </Button>
              </div>
            </Carousel.Item>

            {/* step7:non-maximum suppression */}
            <Carousel.Item>
              {gradient && (
                <div id="non-max-supression-canny">
                  <h2>Non-Maximum Suppression</h2>
                  <p>
                    Non-Maximum Suppression is used to thin the edges by
                    suppressing non-maximal pixels in the gradient direction.
                  </p>
                  <div className="nms-explanation-box">
                    <div id="gradient-canny">
                      {gradient && (
                        <h4 style={{ marginBottom: "10px" }}>
                          Resultant Gradient Magnitude
                        </h4>
                      )}

                      <div
                      id="step-seven-gradient-mag-matrix"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "0px",
                        }}
                      >
                        {gradientMag &&
                          gradientMag.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`nms-gradient-mag-matrix 
  ${
    activePixel && activePixel[0] === rowIndex && activePixel[1] === colIndex
      ? "active-pixel"
      : ""
  }
  ${
    activeNeighbors &&
    activeNeighbors.some(([r, c]) => r === rowIndex && c === colIndex)
      ? "neighbor-pixel"
      : ""
  }`}
                              >
                                {cell}
                              </div>
                            )),
                          )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "center",
                      }}
                    >
                      {quantize && (
                        <h4 style={{ marginBottom: "10px" }}>
                          Quantise Gradient Direction
                        </h4>
                      )}
                      <div
                        id="step-seven-quantise-matrix"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                        }}
                      >
                        {quantize &&
                          quantize.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`nms-gradient-mag-matrix dirQ-${cell} 
  ${
    activePixel && activePixel[0] === rowIndex && activePixel[1] === colIndex
      ? "active-pixel"
      : ""
  }
  `}
                              >
                                {cell === null
                                  ? ""
                                  : cell === 0
                                    ? "0"
                                    : cell === 45
                                      ? "45"
                                      : cell === 90
                                        ? "90"
                                        : "135"}
                              </div>
                            )),
                          )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div id="quantised-canny-arrow">&#129066;</div>
                    </div>
                    <div>
                      {animatedSuppressed && (
                        <h4
                          style={{ marginBottom: "10px", textAlign: "center" }}
                        >
                          Suppressed Gradient
                        </h4>
                      )}
                      <div
                      id="step-seven-suppressed-gradient-matrix"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "1px",
                        }}
                      >
                        {animatedSuppressed &&
                          animatedSuppressed.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                              const intensity = (cell / maxGrad) * 255;

                              return (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    backgroundColor: `rgb(${intensity}, ${intensity}, ${intensity})`,
                                    border: "1px solid #ccc",
                                    transition: "all 0.3s ease",
                                  }}
                                  className={` ${
                                    activePixel &&
                                    activePixel[0] === rowIndex &&
                                    activePixel[1] === colIndex
                                      ? "active-pixel"
                                      : ""
                                  }`}
                                >
                                  {cell > 0 ? Number(cell).toFixed(2) : ""}
                                </div>
                              );
                            }),
                          )}
                      </div>
                    </div>
                  </div>
                  {animatedSuppressed && (
                    <div 
                    id="step-seven-nms-explanation-container"
                    className="nms-live-explanation-container">
                      <h3 style={{ textAlign: "center", fontSize: "14px" }}>
                        Non-Maximum Suppression Explanation
                      </h3>
                      <div className="nms-live-explanation">
                        <h4>
                          {activePixel &&
                            `Checking Pixel (${activePixel?.[0]}, ${activePixel?.[1]})`}
                        </h4>

                        {nmsExplanation.map((item, index) => (
                          <div key={index} className="nms-step-box">
                            {item.direction && (
                              <div>
                                <strong>Direction:</strong> {item.direction}
                              </div>
                            )}

                            {item.currentMagnitude && (
                              <div>
                                <strong>Current Magnitude:</strong>{" "}
                                {item.currentMagnitude}
                              </div>
                            )}

                            {item.neighbor1 && (
                              <div>
                                <strong>Neighbor 1:</strong> {item.neighbor1}
                              </div>
                            )}

                            {item.neighbor2 && (
                              <div>
                                <strong>Neighbor 2:</strong> {item.neighbor2}
                              </div>
                            )}

                            {item.decision && (
                              <div>
                                {item.currentMagnitude >= item.neighbor1 &&
                                item.currentMagnitude >= item.neighbor2
                                  ? "Current pixel is LOCAL MAXIMUM (greater than both neighbors)"
                                  : "Current pixel is NOT maximum (less than at least one neighbor)"}
                              </div>
                            )}

                            {item.decision && (
                              <div
                                style={{
                                  color: item.decision.includes("KEPT")
                                    ? "green"
                                    : "red",
                                }}
                              >
                                <strong>Result:</strong> {item.decision}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                  id="step-seven-process-btn"
                    className="btn"
                    ref={myNonMaxButton}
                    onClick={dnonmax}
                  >
                    Process
                  </Button>
                </div>
              )}
            </Carousel.Item>

            {/* step8: thresholding */}
            <Carousel.Item>
              {supressed && (
                <div
                  id="final-grid-canny"
                  className="final-grid-canny-container"
                >
                  <div className="final-grid-header">
                    <h2>Double Threshold and Hysteresis</h2>
                    <p>
                      Final edge-detected image after applying double
                      thresholding and hysteresis.
                    </p>
                  </div>
                  {/* slider */}
                  <div
                  id="step-eight-thresholding-container"
                   className="final-grid-slider">
                    <div 
                     id="tLow_slider">
                      <h4
                        style={{
                          margin: "5px 0px",
                          textAlign: "left",
                          color: "#444444",
                        }}
                      >
                        Set T_low :{" "}
                        <span style={{ color: "#FF2929" }}>{tlow}</span>
                      </h4>
                      <Slider
                        sx={{ color: "#1D2A6D" }}
                        value={tlow}
                        min={0.1}
                        max={0.3}
                        step={0.01}
                        marks
                        valueLabelDisplay="auto"
                        onChange={(e) => {
                          setTlow(e.target.value);
                        }}
                        disabled={isTLowSliderDisabled}
                      />
                    </div>

                    <div id="tHigh_slider">
                      <h4
                        style={{
                          margin: "5px 0px",
                          textAlign: "left",
                          color: "#444444",
                        }}
                      >
                        Set T_High :{" "}
                        <span style={{ color: "#FF2929" }}>{thigh}</span>
                      </h4>
                      <Slider
                        sx={{ color: "#1D2A6D" }}
                        value={thigh}
                        min={0.1}
                        max={0.3}
                        step={0.01}
                        marks
                        valueLabelDisplay="auto"
                        onChange={(e) => {
                          setThigh(e.target.value);
                        }}
                        disabled={isTHighSliderDisabled}
                      />
                    </div>
                  </div>
                  {isBoxRunning && (
                    <div
                    id="step-eight-dlLow-live-explanation"
                     className="dlLow-live-explanation-container">
                      {tLowHighExplanation?.map((item) => (
                        <div key={item.text1}>{item.text1}</div>
                      ))}

                      {tLowHighExplanation?.map((item) => (
                        <div key={item.text4}>{item.text4}</div>
                      ))}
                      {tLowHighExplanation?.map((item) => (
                        <div key={item.text5}>{item.text5}</div>
                      ))}
                    </div>
                  )}
                  {/* all matrix */}
                  <div className="final-grid-matrix-container">
                    {/* 🔹 SUPPRESSED GRID */}
                    {supressed && (
                      <div className="final-grid-matrix">
                        <h3>Suppressed Gradient</h3>

                        {(() => {
                          const maxVal = Math.max(
                            0,
                            ...supressed
                              .flat()
                              .filter(
                                (v) => typeof v === "number" && !isNaN(v),
                              ),
                          );

                          return (
                            <div
                              id="step-eight-suppressed-gradient"
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: "1px",
                                marginBottom: "15px",
                              }}
                            >
                              {supressed.map((row, rowIndex) =>
                                row.map((cell, colIndex) => {
                                  const isActive =
                                    activeThreshPixel &&
                                    activeThreshPixel[0] === rowIndex &&
                                    activeThreshPixel[1] === colIndex;
                                  const intensity =
                                    maxVal === 0
                                      ? 0
                                      : (Math.abs(cell) / maxVal) * 255;

                                  return (
                                    <div
                                      key={`${rowIndex}-${colIndex}`}
                                      className={`threshold-cell ${
                                        isActive ? "active-current" : ""
                                      }`}
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        backgroundColor: `rgb(${intensity}, ${intensity}, ${intensity})`,
                                        border: "1px solid #ccc",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {cell}
                                    </div>
                                  );
                                }),
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {isBoxRunning && (
                      <div id="quantised-canny-arrow">&#129066;</div>
                    )}
                    {/* 🔹 THRESHOLD GRID */}
                    {thresholdGrid && (
                      <div className="final-grid-matrix">
                        <h3>After Double Threshold</h3>

                        <div
                          id="step-eight-threshold-matrix"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: "1px",
                            marginBottom: "15px",
                          }}
                        >
                          {thresholdGrid.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                              const isCurrent =
                                activeHystPixel &&
                                activeHystPixel[0] === rowIndex &&
                                activeHystPixel[1] === colIndex;

                              const isNeighbor = activeHystNeighbors?.some(
                                ([x, y]) => x === rowIndex && y === colIndex,
                              );
                              console.log(
                                "isCurrent",
                                isCurrent,
                                "isNeighbor",
                                isNeighbor,
                              );

                              return (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  className={`threshold-cell 
                ${isCurrent ? "active-current" : ""}
                  ${isNeighbor ? "active-neighbour" : ""}`}
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: isCurrent
                                      ? "#3cf7d2ff" // 🔥 cyan for current pixel
                                      : isNeighbor
                                        ? "#ffcc00" // 🔥 yellow for neighbors
                                        : cell === 255
                                          ? "white"
                                          : cell === 75
                                            ? "rgb(150,150,150)"
                                            : cell === 0
                                              ? "black"
                                              : "transparent",

                                    border: "1px solid #ccc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                  }}
                                >
                                  {cell === 1 ? "" : cell}
                                </div>
                              );
                            }),
                          )}
                        </div>
                      </div>
                    )}
                    {isBoxRunning && (
                      <div id="quantised-canny-arrow">&#129066;</div>
                    )}
                    {/* 🔹 FINAL GRID */}
                    {finalGrid && (
                      <div className="final-grid-matrix">
                        <h3>Final Edge Map (After Hysteresis)</h3>

                        {(() => {
                          return (
                            <div
                              id="step-eight-final-grid-matrix"
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: "1px",
                                marginBottom: "15px",
                              }}
                            >
                              {finalGrid.map((row, rowIndex) =>
                                row.map((cell, colIndex) => {
                                  // const isCurrent =
                                  //   activeHystPixel &&
                                  //   activeHystPixel[0] === rowIndex &&
                                  //   activeHystPixel[1] === colIndex;

                                  // const isNeighbor =
                                  //   activeHystNeighbors?.some(
                                  //     ([x, y]) => x === rowIndex && y === colIndex
                                  //   );

                                  return (
                                    <div
                                      
                                      key={`${rowIndex}-${colIndex}`}
                                      className={`threshold-cell

                  `}
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        backgroundColor:
                                          cell === null
                                            ? "transparent"
                                            : cell === 255
                                              ? "white"
                                              : cell === 75
                                                ? "gray"
                                                : "black",

                                        border: "1px solid #ccc",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                      }}
                                    ></div>
                                  );
                                }),
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 🔹 Buttons */}
                  <div className="final-grid-btn-container">
                    <Button
                      id="step-eight-run-double-threshold"
                      className="btn"
                      onClick={animateDoubleThreshold}
                      disabled={isThresholdRunning || isThresholdCompleted}
                    >
                      Run Double Threshold
                    </Button>

                    <Button
                      id="step-eight-run-hysteresis"
                      className="btn"
                      onClick={animateHysteresis}
                      disabled={!isThresholdCompleted || isHysteresisRunning}
                    >
                      Run Hysteresis
                    </Button>
                  </div>

                  {/* 🔹 Explanation Panel */}

                  {isBoxRunning && (
                    <div
                    id="step-eight-dl-live-explanation"
                     className="dl-live-explanation-container">
                      <h4>
                        {activeThreshPixel &&
                          `Checking Pixel (${activeThreshPixel[0]}, ${activeThreshPixel[1]})`}
                      </h4>

                      {thresholdExplanation.map((item, index) => (
                        <div key={index}>{item.text}</div>
                      ))}
                    </div>
                  )}
                  {isBoxRunning && isHysteresisRunning && (
                    <div
                    id="step-eight-hytresis-live-explanation"
                     className="dl-live-explanation-container">
                      <h4>
                        {activeHystPixel &&
                          `Checking Pixel (${activeHystPixel[0]}, ${activeHystPixel[1]})`}
                      </h4>

                      {hystExplanation.map((item, index) => (
                        <div key={`h-${index}`}>{item.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Carousel.Item>
          </Carousel>

          {showButtons && (
            <div className="carousel__btns">
              <div className="button-container">
                <button
                  className="button-3d"
                  onClick={Previous}
                  disabled={index === 0}
                >
                  <div className="button-top">
                    <span className="material-icons">❮</span>
                  </div>
                  <div className="button-bottom" />
                  <div className="button-base" />
                </button>
                <button
                  id="next-btn-zone"
                  className="button-3d"
                  ref={myNextButton}
                  onClick={() => NEXT()}
                >
                  <div className="button-top">
                    <span className="material-icons">❯</span>
                  </div>
                  <div className="button-bottom" />
                  <div className="button-base" />
                </button>
              </div>
            </div>
          )}
          {/* tutor modal */}
          <TutorSim />
        </div>
      </OpenCvProvider>
    </MathJaxContext>
  );
}
