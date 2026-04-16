import "../ee.css";
import React from "react";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";
import { Select, Button } from "@mui/material";

import { OpenCvProvider } from "opencv-react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function EdgeExplanation() {
  const [image, setImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [kernel, setKernel] = useState("sobel");
  const [original, setOriginal] = useState(null);
  const [kernelx, setKernelX] = useState(null);
  const [kernely, setKernelY] = useState(null);

  const equation1 = "\\Delta G = \\sqrt{(\\Delta x)^2 + (\\Delta y)^2}";
  const equation2 = " \\frac{\\Delta G}{Max Value * 255}";

  const [label, setLabel] = useState("3 x 3");
  const [resultLabel, setResultLabel] = useState("5 x 5");
  const [isPaused, setIsPaused] = useState(false);
  const delayRef = useRef(300);
  const isPausedRef = useRef(false);
  const myPlayButton = useRef(null);
  const myPauseButton = useRef(null);
  const mySpeedUpButton = useRef(null);
  const mySpeedDownButton = useRef(null);

  const isCancelledRef = useRef(false);
  const [isDisabled, setIsDisabled] = React.useState(false);
  const [imagesDisabled, setImagesDisabled] = useState(false);
  // for style
  const [activeDX, setActiveDX] = useState({ row: -1, col: -1 });
  const [activeDY, setActiveDY] = useState({ row: -1, col: -1 });
  const [completedDX, setCompletedDX] = useState([]);
  const [completedDY, setCompletedDY] = useState([]);
  const [completedRes, setCompletedRes] = useState([]);
  const [activeRes, setActiveRes] = useState({ row: -1, col: -1 });

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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
    setIsPaused((prev) => !prev);
  }

  function changeKernel(x) {
    isCancelledRef.current = false;
    setIsDone(false);
    setKernel(x);
    let kernelX, kernelY;
    switch (x) {
      case "sobel":
        setLabel("3 x 3");
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
        kernelX = [
          [0, 1, 0],
          [1, -4, 1],
          [0, 1, 0],
        ];
        kernelY = [
          [0, 1, 0],
          [1, -4, 1],
          [0, 1, 0],
        ];
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
  }

  function handleReset() {
    isCancelledRef.current = true; // cancel current loop
    setDx([]);
    setDy([]);
    setRes([]);
    setPosX(0);
    setPosY(0);
    setIsPaused(false);
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
  }

  async function calculateDerivatives() {
    if (!original || !kernelx || !kernely) return;

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
    const kernelSizeY = kernely.length;

    setIsDisabled(true); //disabled select box

    setIsRunning(true);

    (async function calculateWithDelay() {
      const kernelOffsetX = Math.floor(kernelSizeX / 2);
      const kernelOffsetY = Math.floor(kernelSizeY / 2);

      let countX = 0; // for play button
      setCompletedDX([]);
      setCompletedDY([]);
      setCompletedRes([]);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (isCancelledRef.current) return; // ❗Exit early if reset

          while (isPausedRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (isCancelledRef.current) return; // ❗Exit early if reset
          }

          setPosX(i); // <== These trigger a re-render
          setPosY(j);

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
                sumX += original[x][y] * kernelx[ki][kj];
                sumY += original[x][y] * kernely[ki][kj];
              }
            }
          }

          di_dx[i][j] = sumX;
          di_dy[i][j] = sumY;
          setCompletedDX((prev) => [...prev, { row: i, col: j }]);
          setCompletedDY((prev) => [...prev, { row: i, col: j }]);
          resultant[i][j] = Math.floor(Math.sqrt(sumX * sumX + sumY * sumY));
          // style update
          setDx([...di_dx]);
          setDy([...di_dy]);
          setRes([...resultant]);
          setCompletedRes((prev) => [...prev, { row: i, col: j }]);
          setActiveDX({ row: i, col: j });
          setActiveDY({ row: i, col: j });
          setActiveRes({ row: i, col: j });

          // Add a delay for each calculation
          // await new Promise(resolve => setTimeout(resolve, 300));
          await new Promise((resolve) => setTimeout(resolve, delayRef.current));
        }
        countX++;
      }

      if (countX == rows) {
        myPauseButton.current.style.display = "none";
        myPlayButton.current.style.display = "block";
        mySpeedUpButton.current.disabled = true;
        mySpeedDownButton.current.disabled = true;
        // setImagesDisabled(false);
        setIsDisabled(false); //enabled select box
      }
    })();
    // setDx(di_dx);
    // setDy(di_dy);
    // setRes(resultant);
    setRes([...resultant]);
    console.log("di/dx:", di_dx);
    console.log("di/dy:", di_dy);
    setIsVisible(true);
    setIsDone(true);
    setIsRunning(false);
  }

  const instructions = [
    "1. Choose an image.",
    "2. Choose a filter type.",
    "3. Click on 'Play' button at the bottom.",
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

  return (
    <OpenCvProvider>
      <div id="main-box-edge">
        <div id="box-2">
          <div id="inst_div_edge">
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
              <div id="inst_content_edge">
                <button onClick={prevSlide} style={{ marginRight: "10px" }}>
                  <span className="prev-icon" aria-hidden="true"></span>
                </button>
                <span>{instructions[currentIndex]}</span>
                <button onClick={nextSlide}>
                  <span className="next-icon" aria-hidden="true"></span>
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
                  style={{
                    position: "absolute",
                    top: `${posx * ((document.getElementById("originalGrid")?.offsetWidth || 0) - 0.5) + document.getElementById("ogimage")?.offsetTop || 0}px`,
                    left: `${posy * ((document.getElementById("originalGrid")?.offsetHeight || 0) - 0.5) + document.getElementById("ogimage")?.offsetLeft || 0}px`,
                    width: `${((document.getElementById("originalGrid")?.offsetWidth || 0) + 0.5) * (kernelx ? kernelx[0].length : 0)}px`,
                    height: `${((document.getElementById("originalGrid")?.offsetHeight || 0) + 0.5) * (kernelx ? kernelx.length : 0)}px`,
                    border: "2px solid red",
                    pointerEvents: "none",
                  }}
                ></div>
              )}
              <h4 style={{ margin: "0px" }}>Image Chosen</h4>
              <div
                id="ogimage"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                }}
              >
                {original &&
                  original.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
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
              <p class="matrix_label">7 x 7</p>
            </div>

            <div id="kernel_arrow_1">
              <span>
                <svg
                  width="120"
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
                  width="120"
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
                <h4 style={{ margin: "0px", fontWeight: "bold" }}>Kernel X</h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${kernel === "roberts" ? 2 : 3}, 1fr)`,
                  }}
                >
                  {kernelx &&
                    kernelx.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          id="kernelGrid"
                          className="matrix-animate"
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
                  {label}
                </p>
              </div>

              <div id="kernely">
                <h4 style={{ margin: "0px", fontWeight: "bold" }}>Kernel Y</h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${kernel === "roberts" ? 2 : 3}, 1fr)`,
                  }}
                >
                  {kernely &&
                    kernely.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          id="kernelGrid"
                          className="matrix-animate"
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
                  {label}
                </p>
              </div>
            </div>

            {isVisible && (
              <div id="operation">
                <div id="equals-to" style={{ fontWeight: "bold" }}>
                  =
                </div>
                <div id="equals-to" style={{ fontWeight: "bold" }}>
                  =
                </div>
              </div>
            )}

            {isVisible && (
              <div id="results">
                <div id="kernelx" style={{ position: "relative" }}>
                  <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                    Gradient X (&Delta;X)
                  </h4>
                  <div
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
                  <p class="matrix_label">{resultLabel}</p>
                </div>

                <div id="kernely">
                  <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                    Gradient Y (&Delta;Y)
                  </h4>
                  <div
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
                  <p class="matrix_label">{resultLabel}</p>
                </div>
              </div>
            )}

            {isVisible && (
              <div id="operation">
                <div id="equals-to">=</div>
                <div id="equals-to">=</div>
              </div>
            )}

            {isVisible && (
              <div id="final_result">
                <div id="kernelx">
                  <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                    Resultant Gradient
                  </h4>
                  <BlockMath math={equation1} />
                  <div
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
                  <p class="matrix_label">{resultLabel}</p>
                </div>
                <span id="arrow2">&darr;</span>
                <div id="kernely">
                  <h4 style={{ margin: "0px", fontWeight: "bold" }}>
                    Resultant Image
                  </h4>
                  <BlockMath math={equation2} />
                  <div
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
                            style={{
                              backgroundColor: `rgb(${(cell / Math.max(...res.flat())) * 255}, ${(cell / Math.max(...res.flat())) * 255}, ${(cell / Math.max(...res.flat())) * 255})`,
                            }}
                          ></div>
                        )),
                      )}
                  </div>
                  <p class="matrix_label">{resultLabel}</p>
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

              <button
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
                ref={myPauseButton}
                onClick={() => pauseFun()}
                title={isPaused ? "Play" : "Pause"}
                className={`px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100`}
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

              <button
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
        </div>
      </div>
    </OpenCvProvider>
  );
}
