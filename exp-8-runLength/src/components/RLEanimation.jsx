import "../template.css";

import { use, useEffect, useRef, useState } from "react";
import { OpenCvProvider } from "opencv-react";
import divide from "../assets/images/divide_sign.png";
import multiply from "../assets/images/x_sign.png";
import minus from "../assets/images/minus_sign.png";
import plus from "../assets/images/plus_sign.png";
import { Button, DialogTitle } from "@mui/material";
import Box from "@mui/material/Box";

export default function RLEanimation({ handleClose2Modal }) {
  const [image, setImage] = useState(0);
  const [original, setOriginal] = useState(null);
  const [tdata, setTdata] = useState("");
  const [runLength, setRunLength] = useState(1);
  const [textEncoded, setTextEncoded] = useState("");
  const [imageEncoded, setImageEncoded] = useState([]);
  const encodeRunLength = (data, minRunLength) => {
    const encoded = [];
    let count = 1;

    for (let i = 1; i <= data.length; i++) {
      if (data[i] === data[i - 1]) {
        count++;
      } else {
        if (count >= minRunLength) {
          encoded.push(`${data[i - 1]}:${count}`);
        } else {
          encoded.push(...Array(count).fill(data[i - 1]));
        }
        count = 1;
      }
    }

    return encoded.join(" ");
  };

  function rowl() {
    // Run-length encoding for text data
    const textEncoded = encodeRunLength(tdata, runLength);
    console.log("Encoded Text Data:", textEncoded);
    setTextEncoded(textEncoded);

    // Run-length encoding for binary image data
    const imageEncoded = original.map((row) => encodeRunLength(row, runLength));
    console.log("Encoded Image Data:", imageEncoded);
    setImageEncoded(imageEncoded);

    // You can set the encoded data to state or handle it as needed
  }
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
  useEffect(() => {
    handleImage(0);
  }, []);

  // instructions

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
      <div id="main-box-temp">
        <div className="top-container">
          <DialogTitle id="instructions-dialog-title">
            <div
              style={{
                width: "50%",
                justifyContent: "flex-start",
                display: "flex",
              }}
            >
              Run-Length Encoding Concept
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
               // ref={tutorBtnRefSim}
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
             //   onClick={startTutorSim}
             >
             Guided Tutor
              </Button>
              <Button
                id="sound-btn"
               //title={isSpeaking && !isPaused ? "Pause" : "Play"}
               //onClick={handleSpeechToggleSim}
              >
                <img
                 // src={isSpeaking && !isPaused ? voice_pause : voice}
                  alt="voice"
                  style={{ width: "40px", height: "auto", marginRight: "10px" }}
                />
              </Button>
              <Button
                onClick={() => {
                  // resetTutorSim();
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
        </div>

        <div id="grid-box-temp">
          <div id="row1-temp">
            <div id="Choose_box_comp">
              <div className="coolinput_comp">
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
                    <div id="image-box-comp">
                      <div onClick={() => handleImage(0)}>
                        <img src={plus} id="image" />
                      </div>
                      <div onClick={() => handleImage(1)}>
                        <img src={minus} id="image" />
                      </div>
                      <div onClick={() => handleImage(2)}>
                        <img src={multiply} id="image" />
                      </div>
                      <div onClick={() => handleImage(3)}>
                        <img src={divide} id="image" />
                      </div>
                    </div>
                  </div>
                </Box>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <h4 style={{ margin: "0px" }}>Enter minimum run length: </h4>
              <input
                class="input"
                placeholder="Enter min run length"
                value={runLength}
                onChange={(e) => {
                  setRunLength(e.target.value);
                }}
                style={{ width: "100px" }}
              ></input>
              <Button
                class="tool_btn"
                onClick={rowl}
                style={{ width: "100px" }}
              >
                Process
              </Button>
            </div>
          </div>
          <div id="row2-temp">
            <div className="box">
              <textarea
                class="text_box"
                placeholder="Enter data here"
                value={tdata}
                onChange={(e) => {
                  setTdata(e.target.value);
                }}
              ></textarea>
            </div>
            <div className="box">
              <h4 style={{ textAlign: "center" }}>Encoded Text Data</h4>
              <textarea
                class="text_box"
                value={textEncoded}
                readOnly
              ></textarea>
            </div>
          </div>
          <div id="row3-temp">
            <div className="box">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "2px",
                }}
              >
                {original &&
                  original.map((row, rowIndex) =>
                    row.map((cell, cellIndex) => (
                      <div
                        key={`${rowIndex}-${cellIndex}`}
                        id="rle_matrix"
                        style={{
                          backgroundColor: cell === 0 ? "black" : "white",
                        }}
                      ></div>
                    )),
                  )}
              </div>
            </div>
            <div className="box">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "10px",
                }}
              >
                {imageEncoded &&
                  imageEncoded.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      style={{
                        padding: "5px",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {row}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpenCvProvider>
  );
}
