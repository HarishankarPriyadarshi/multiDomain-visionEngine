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

  // state tracking for the Non maximum suppression
  const [animatedSuppressed, setAnimatedSuppressed] = useState(null);
  const [activePixel, setActivePixel] = useState(null);
  const [activeNeighbors, setActiveNeighbors] = useState([]);
  const [nmsExplanation, setNmsExplanation] = useState([]);
  const equation1 = "\\theta = \\tan^{-1}\\left(\\frac{G_y}{G_x}\\right)";
  const equation2 = "G = \\sqrt{G_x^2 + G_y^2}";

  //console.log("index value:", index);

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
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    // console.log(rows);

    setIsBlurring(false); // Unlock after completion
    myBlurButton.current.disabled = true;
    enabledNext();
  }

  const [padBlur, setPadBlur] = useState(null);

  function padblurred() {
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

  function quantiseGrad() {
    if (!gradient) return;
    myQuantButton.current.disabled = true;

    const rows = gradient.length;
    const cols = gradient[0].length;

    // Step 1: initialize with null (for animation)
    let initialMatrix = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    setQuantize(initialMatrix);

    let index = 0;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let angle = Number(gradient[i][j]) || 0;
        // console.log("quantiseGradBefore:", "angle:", angle, i, j);
        angle = (angle + 180) % 180; // Normalize to 0–180
        //console.log("quantiseGradAfter:", "angle:", angle, i, j);

        let value;

        if (angle < 22.5 || angle >= 157.5) {
          value = 0;
        } else if (angle >= 22.5 && angle < 67.5) {
          value = 45;
        } else if (angle >= 67.5 && angle < 112.5) {
          value = 90;
        } else {
          value = 135;
        }

        setTimeout(() => {
          setQuantize((prev) => {
            const updated = prev.map((r) => [...r]);
            updated[i][j] = value;
            return updated;
          });
        }, index * 70);

        index++;
      }
    }

    enabledNext();
  }
  async function dnonmax() {
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
        await new Promise((r) => setTimeout(r, 200));

        setNmsExplanation([
          `Direction: ${angle}°`,
          `Current Magnitude: ${current}`,
          `Comparing with ${neighbor1} and ${neighbor2}`,
        ]);

        await new Promise((r) => setTimeout(r, 800));

        if (current >= neighbor1 && current >= neighbor2) {
          suppressed[i][j] = current;
          setNmsExplanation((prev) => [
            ...prev,
            "Pixel is local maximum → KEPT",
          ]);
        } else {
          suppressed[i][j] = 0;
          setNmsExplanation((prev) => [
            ...prev,
            "Pixel is NOT maximum → SUPPRESSED",
          ]);
        }

        setAnimatedSuppressed((prev) => {
          const copy = prev.map((r) => [...r]);
          copy[i][j] = suppressed[i][j];
          return copy;
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    setSupressed(suppressed);
    setActivePixel(null);
    setActiveNeighbors([]);
    setNmsExplanation(["Non-Maximum Suppression Complete "]);

    enabledNext();
  }
  // async function nonmax() {
  //   if (!gradientMag || !quantize) return;

  //   myNonMaxButton.current.disabled = true;

  //   const rows = gradientMag.length;
  //   const cols = gradientMag[0].length;

  //   let suppressed = Array(rows)
  //     .fill(0)
  //     .map(() => Array(cols).fill(0));

  //   // initialize animation matrix
  //   setAnimatedSuppressed(
  //     Array(rows)
  //       .fill(0)
  //       .map(() => Array(cols).fill(0)),
  //   );

  //   for (let i = 1; i < rows - 1; i++) {
  //     for (let j = 1; j < cols - 1; j++) {
  //       const angle = quantize[i][j];
  //       const current = parseFloat(gradientMag[i][j]);

  //       let neighbor1 = 0;
  //       let neighbor2 = 0;
  //       let neighbors = [];

  //       // choose neighbors based on quantized direction
  //       if (angle === 0) {
  //         neighbor1 = gradientMag[i][j - 1];
  //         neighbor2 = gradientMag[i][j + 1];
  //         neighbors = [
  //           [i, j - 1],
  //           [i, j + 1],
  //         ];
  //       } else if (angle === 45) {
  //         neighbor1 = gradientMag[i - 1][j + 1];
  //         neighbor2 = gradientMag[i + 1][j - 1];
  //         neighbors = [
  //           [i - 1, j + 1],
  //           [i + 1, j - 1],
  //         ];
  //       } else if (angle === 90) {
  //         neighbor1 = gradientMag[i - 1][j];
  //         neighbor2 = gradientMag[i + 1][j];
  //         neighbors = [
  //           [i - 1, j],
  //           [i + 1, j],
  //         ];
  //       } else if (angle === 135) {
  //         neighbor1 = gradientMag[i - 1][j - 1];
  //         neighbor2 = gradientMag[i + 1][j + 1];
  //         neighbors = [
  //           [i - 1, j - 1],
  //           [i + 1, j + 1],
  //         ];
  //       }

  //       neighbor1 = parseFloat(neighbor1);
  //       neighbor2 = parseFloat(neighbor2);

  //       // animation highlight
  //       setActivePixel([i, j]);
  //       setActiveNeighbors(neighbors);

  //       setNmsExplanation(
  //         `Direction: ${angle}°. Comparing ${current.toFixed(
  //           2,
  //         )} with neighbors ${neighbor1.toFixed(2)} and ${neighbor2.toFixed(2)}.`,
  //       );

  //       await new Promise((resolve) => setTimeout(resolve, 600));

  //       if (current >= neighbor1 && current >= neighbor2) {
  //         suppressed[i][j] = current;
  //         setNmsExplanation("Pixel kept (local maximum).");
  //       } else {
  //         suppressed[i][j] = 0;
  //         setNmsExplanation("Pixel suppressed (not maximum).");
  //       }

  //       setAnimatedSuppressed((prev) => {
  //         const copy = prev.map((r) => [...r]);
  //         copy[i][j] = suppressed[i][j];
  //         return copy;
  //       });

  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //     }
  //   }

  //   setActivePixel(null);
  //   setActiveNeighbors([]);
  //   setSupressed(suppressed);
  //   enabledNext();
  // }
  function doubleThresholdAndHysteresis() {
    myThresButton.current.disabled = true;
    setTLowSliderIsDisabled(true);
    setTHighSliderIsDisabled(true);

    if (!supressed) return;
    // Convert all elements to float before setting supressed
    for (let i = 0; i < supressed.length; i++) {
      for (let j = 0; j < supressed[0].length; j++) {
        supressed[i][j] = parseFloat(supressed[i][j]);
      }
    }
    setSupressed(supressed);
    let maxVal = Math.max(
      0,
      ...supressed
        .flat()
        .filter((val) => typeof val === "number" && !isNaN(val)),
    );
    console.log(maxVal);
    let tLowVal = tlow * maxVal; // Set T_low to 10% of max gradient
    let tHighVal = thigh * maxVal; // Set T_high to 20% of max gradient

    let strong = 255;
    let weak = 75;

    let thresholded = Array(7)
      .fill(0)
      .map(() => Array(7).fill(0));

    // Apply double thresholding
    for (let i = 0; i < supressed.length; i++) {
      for (let j = 0; j < supressed[0].length; j++) {
        if (
          supressed[i][j] !== null &&
          typeof supressed[i][j] === "number" &&
          supressed[i][j] >= tHighVal
        ) {
          thresholded[i][j] = strong;
        } else if (supressed[i][j] >= tLowVal) {
          thresholded[i][j] = weak;
        } else {
          thresholded[i][j] = 0;
        }
      }
    }

    // Apply hysteresis
    for (let i = 1; i < thresholded.length - 1; i++) {
      for (let j = 1; j < thresholded[0].length - 1; j++) {
        if (thresholded[i][j] === weak) {
          if (
            thresholded[i - 1][j - 1] === strong ||
            thresholded[i - 1][j] === strong ||
            thresholded[i - 1][j + 1] === strong ||
            thresholded[i][j - 1] === strong ||
            thresholded[i][j + 1] === strong ||
            thresholded[i + 1][j - 1] === strong ||
            thresholded[i + 1][j] === strong ||
            thresholded[i + 1][j + 1] === strong
          ) {
            thresholded[i][j] = strong;
          } else {
            thresholded[i][j] = 0;
          }
        }
      }
    }

    setFinalGrid(thresholded);
    console.log(thresholded);
    notifyS("Process Completed !!");
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
    } else if (index == 6 && myThresButton.current.disabled == true) {
      myNextButton.current.disabled = true;
      handleClose2();
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
  // Update isSimPlaying when any variable changes
  useEffect(() => {
    const variableMap = {
      original,
      gKernel,
      myBlurButton,
      myPadButton,
      myPadBlurButton,
      mySobelButton,
      myQuantButton,
      myNonMaxButton,
      myThresButton,
      myNextButton,
      padded,
      blurred,
      sobelx,
      sobely,
      convolutedx,
      convolutedy,
      gradient,
      quantize,
      supressed,
      finalGrid,
    };

    setIsSimPlaying((prev) => {
      const updatedState = { ...prev };

      Object.keys(variableMap).forEach((key) => {
        if (variableMap[key]) {
          updatedState[key] = true;
        }
      });

      return updatedState;
    });
  }, [
    original,
    gKernel,
    myBlurButton,
    myPadButton,
    myPadBlurButton,
    mySobelButton,
    myQuantButton,
    myNonMaxButton,
    myThresButton,
    myNextButton,
    padded,
    blurred,
    sobelx,
    sobely,
    convolutedx,
    convolutedy,
    gradient,
    quantize,
    supressed,
    finalGrid,
    setIsSimPlaying,
  ]);
  // Update tutor steps when isSimPlaying changes
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
          "This is the selected 7×7 image displayed in both graphical (black/white) and numerical (0/1) form. Edge detection begins from this input.",
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
          "Use the Sigma slider to generate the Gaussian kernel matrix. Sigma controls the amount of smoothing. Higher σ → stronger blur → less noise but softer edges. Lower σ → sharper but more noise-sensitive.",
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
        placement: "top",
        offset: [0, 10],
      },
      {
        title: "Gaussian Kernel",
        content:
          "This 3×3 Gaussian kernel assigns higher weight to the center pixel and smaller weights to surrounding pixels. It smooths the image by weighted averaging.",
        targetId: "gaussian-kernel-zone",
        placement: "top",
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
    baseSteps.push({
      title: "Sobel Edge Detection",
      content:
        "Sobel X and Sobel Y detect horizontal and vertical intensity changes.",
      targetId: "sobel-application-canny",
      placement: "left",
    });

    if (!convolutedx) {
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
        title: "Apply Sobel",
        content: "Click 'Apply Sobel' to compute gradient components.",
        targetId: mySobelButton?.current?.id || "sobel-application-canny",
        placement: "bottom",
      },
      {
        title: "Next Step",
        content: "Click the 'Next' button to continue to the next step.",
        targetId: "next-btn-zone",
        placement: "left",
        offset: [0, 10],
      },
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
        placement: "right",
        offset: [0, 10],
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
        title: "Quantised Direction Matrix",
        content:
          "Each gradient angle has now been replaced with its nearest principal direction. This simplifies edge direction analysis and prepares the image for Non-Maximum Suppression.",
        targetId: "step-six-quantise-matrix",
        placement: "bottom",
        offset: [0, 10],
      },
      {
        title: "Directional Meaning",
        content:
          "• 0° means Horizontal edge comparison\n• 90° means Vertical edge comparison\n•  45° and 135° means Diagonal edge comparison\n\nThese directions determine which neighboring pixels will be compared in the next step.",
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

    if (!supressed) {
      baseSteps.push({
        title: "Non-Maximum Suppression",
        content:
          "Click 'Process' to thin edges by removing non-maximal gradient pixels.",
        targetId: myNonMaxButton?.current?.id || "non-max-supression-canny",
        placement: "bottom",
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    // STEP 8 — DOUBLE THRESHOLD

    if (!finalGrid) {
      baseSteps.push({
        title: "Double Threshold & Hysteresis",
        content:
          "Set T_low and T_high, then click 'Process' to finalize edge detection.",
        targetId: myThresButton?.current?.id || "final-grid-canny",
        placement: "bottom",
      });

      // FINAL STEP

      baseSteps.push({
        title: "Edge Detection Complete",
        content:
          "You have successfully completed all stages of the Canny Edge Detection algorithm.",
        targetId: "final-grid-canny",
        placement: "top",
      });

      setTutorStepsSim(baseSteps);
      return;
    }

    setTutorStepsSim(baseSteps);
  }, [
    original,
    isSimPlaying,
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
                  <div>

                  </div>
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
                        <div className="sobel-gradient-conv">
                          {convSteps.direction.map((item, index) => (
                            <span key={index}>{item}</span>
                          ))}{" "}
                          = {currentSum.direction}
                        </div>
                      )}
                      <div
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
                        <div className="sobel-gradient-conv">
                          {convSteps.result.map((item, index) => (
                            <span key={index}>{item}</span>
                          ))}{" "}
                          = {currentSum.result}
                        </div>
                      )}

                      <div
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
                              className="padded-sobel-matrix"
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
                              className={`quantised-canny-matrix dir-${cell}`}
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
                                className={`nms-gradient-mag-matrix 
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
                  <div className="nms-live-explanation-btn-box">
                    {
                      <div className="nms-live-explanation">
                        <h3 style={{ textAlign: "center", fontSize: "14px" }}>
                          Explanation
                        </h3>
                        <h4>
                          {activePixel &&
                            `Checking Pixel (${activePixel?.[0]}, ${activePixel?.[1]})`}
                        </h4>
                        <p>
                          {nmsExplanation.map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </p>
                      </div>
                    }

                    <Button
                      className="btn"
                      ref={myNonMaxButton}
                      onClick={dnonmax}
                    >
                      Process
                    </Button>
                    {/* <Button
                      className="btn"
                     ref={myNonMaxButton}
                      onClick={dnonmax}
                    >
                      Process
                    </Button> */}
                  </div>
                </div>
              )}
            </Carousel.Item>

            {/* step8: thresholding */}
            <Carousel.Item>
              {supressed && (
                <div id="final-grid-canny">
                  <h2>Double Threshold and Hysteresis</h2>
                  <p>
                    Final edge-detected image after applying double thresholding
                    and hysteresis.
                  </p>
                  <div id="tLow_slider">
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

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "1px",
                    }}
                  >
                    {finalGrid &&
                      finalGrid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            style={{
                              width: "30px",
                              height: "30px",
                              backgroundColor: `rgb(${(Math.abs(cell) / Math.max(...finalGrid.flat())) * 255},${(Math.abs(cell) / Math.max(...finalGrid.flat())) * 255},${(Math.abs(cell) / Math.max(...finalGrid.flat())) * 255})`,
                              border: "1px solid #ccc",
                            }}
                          ></div>
                        )),
                      )}
                  </div>
                  <Button
                    className="btn"
                    ref={myThresButton}
                    style={{ zIndex: "1000" }}
                    onClick={doubleThresholdAndHysteresis}
                  >
                    Process
                  </Button>
                </div>
              )}
            </Carousel.Item>
          </Carousel>

          {showButtons && (
            // <div className='carousel__btns'>
            //     <div id="carousel_pre_btn">
            //     <Button onClick={Previous} disabled={index === 0}
            //             style={{
            //                 backgroundColor: '#1D2A6D',
            //                 border: '1px solid #ffffff4d',
            //                 borderRadius: '50%',
            //                 width: '40px',
            //                 height: '40px',
            //                 display: 'flex',
            //                 alignItems: 'center',
            //                 justifyContent: 'center',
            //                 padding: '0'
            //             }}
            //             >
            //             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            //                 <path fillRule="evenodd" d="M11.854 1.646a.5.5 0 0 1 0 .708L7.207 7l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"/>
            //                 <path fillRule="evenodd" d="M7.854 1.646a.5.5 0 0 1 0 .708L3.207 7l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"/>
            //             </svg>
            //             </Button>

            //     </div>
            //     <div id="carousel_next_btn">
            //     <Button ref={myNextButton} onClick={() => NEXT()}  style={{
            //                 backgroundColor: '#1D2A6D',
            //                 border: '1px solid #ffffff4d',
            //                 borderRadius: '50%',
            //                 width: '40px',
            //                 height: '40px',
            //                 display: 'flex',
            //                 alignItems: 'center',
            //                 justifyContent: 'center',
            //                 padding: '0'
            //             }}>
            //             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            //                 <path fillRule="evenodd" d="M4.146 1.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 1 1-.708-.708L8.793 7 4.146 2.354a.5.5 0 0 1 0-.708z"/>
            //                 <path fillRule="evenodd" d="M8.146 1.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 1 1-.708-.708L12.793 7 8.146 2.354a.5.5 0 0 1 0-.708z"/>
            //             </svg>
            //             </Button>
            //     </div>

            // </div>

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
