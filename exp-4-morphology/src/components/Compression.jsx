import '../App.css';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Slider, MenuItem, Drawer, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, } from '@mui/material';
import Tab from '@mui/material/Tab';

import Button from './styledbutton';
import Select from './styledselect';

import { useState, useRef ,useEffect} from 'react';

import voice from '../assets/images/voice-play.png';
import voice_pause from '../assets/images/voice-pause.png';
import sample1 from '../assets/images/sample1.jpg';
import sample2 from '../assets/images/sample2.jpg';
import sample3 from '../assets/images/sample3.jpg';
import sample4 from '../assets/images/sample4.jpg';
import jpeg from 'jpeg-js';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import RLEanimation from './RLEanimation'
import HuffmanAnimation from './HuffmanAnimation';

import { OpenCvProvider } from 'opencv-react';

//returns a tab panel
function TabPanel(props) {
  const { children, tabValue, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={tabValue !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {tabValue === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}


export default function Compression() {

  const myProcess1Button = useRef(null);
  const myProcess2Button = useRef(null);
  const myProcess3Button = useRef(null);
  const myProcess4Button = useRef(null);

   const notifyE = (msg) => {
      toast.error(msg, {
        theme: 'dark',
        position: "bottom-left", // Set toast position
        autoClose: 5000, // Toast auto-closes after 5 seconds
        hideProgressBar: false, // Show progress bar
        closeOnClick: true, // Close toast when clicked
        pauseOnHover: true, // Pause when hovered
        draggable: true, // Enable dragging
      });
    };
  
    const notifyS = (msg) => {
      toast.success(msg, {
        theme: 'dark',
        position: "bottom-left", // Set toast position
        autoClose: 3000, // Toast auto-closes after 3 seconds
        hideProgressBar: false, // Show progress bar
        closeOnClick: true, // Close toast when clicked
        pauseOnHover: true, // Pause when hovered
        draggable: true, // Enable dragging
      });
    };

    const handlePrint = () => {
      window.print(); // Triggers the print dialog
    };

    const [mrl,setMrl]=useState('');
    //const [mrl,setMrl]=useState(1);
    const [qfactor,setQfactor]=useState('');
    const [quality,setQuality]=useState('');
    const [hresult,setHresult]=useState(null);
    const [jpegResult,setJpegResult]=useState(null);
    const myCanvas = useRef(null);
    
    const jpegCompression = async (quality) => {
      let imgElement = document.getElementById("inputImage");
      let qFactor = parseInt(qfactor); // JPEG quality (1-100)
      console.log(qFactor);
      
      try {
        let startTime = performance.now(); // Start time

        // Read Image using OpenCV
        let src = cv.imread(imgElement);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Convert to RGBA for ImageData
        let rgbaMat = new cv.Mat();
        cv.cvtColor(gray, rgbaMat, cv.COLOR_GRAY2RGBA);

        // Create a hidden canvas
        let canvas = document.createElement("canvas");
        canvas.width = rgbaMat.cols;
        canvas.height = rgbaMat.rows;
        let ctx = canvas.getContext("2d");

        // Convert OpenCV Mat to ImageData
        let imgData = new ImageData(new Uint8ClampedArray(rgbaMat.data), rgbaMat.cols, rgbaMat.rows);
        ctx.putImageData(imgData, 0, 0);

        // Compress using toBlob (JPEG)
        let blob = await new Promise((resolve) => 
          canvas.toBlob(resolve, "image/jpeg", qFactor/100 )
        );

        // Convert Blob to Image for OpenCV
        let img = new Image();
        img.src = URL.createObjectURL(blob);
        
        await new Promise((resolve) => (img.onload = resolve));

        // Read compressed image using OpenCV
        let tempCanvas = document.createElement("canvas");
        let tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        let compressedMat = cv.imread(tempCanvas); // Read from canvas

        let oldEntropy = calculateEntropyMap(gray);
        let newEntropy = calculateEntropyMap(compressedMat);

        // Ensure entropy maps are valid and of type CV_32F (default for entropy calculations)
        if (oldEntropy.empty()) {
          console.error("Old Entropy map is empty!");
        }
        if (newEntropy.empty()) {
          console.error("New Entropy map is empty!");
        }

        // Resize entropy maps to match the size of the compressed image
        cv.resize(oldEntropy, oldEntropy, new cv.Size(compressedMat.cols, compressedMat.rows));
        cv.resize(newEntropy, newEntropy, new cv.Size(compressedMat.cols, compressedMat.rows));

        // Convert entropy maps to CV_8U for compatibility with imshow and JPEG compression
        oldEntropy.convertTo(oldEntropy, cv.CV_8U);
        newEntropy.convertTo(newEntropy, cv.CV_8U);
        // Convert compressedMat to grayscale
        let compressedGray = new cv.Mat();
        cv.cvtColor(compressedMat, compressedGray, cv.COLOR_RGBA2GRAY);

        setJpegText('Old Entropy | New Entropy | Compressed Image')

        // Stack the matrices horizontally
        let vector = new cv.MatVector();
        vector.push_back(oldEntropy);
        vector.push_back(newEntropy);
        vector.push_back(compressedGray);

        let stacked = new cv.Mat();
        cv.hconcat(vector, stacked);

        cv.imshow("outputCanvas",stacked);

        // Cleanup
        oldEntropy.delete();
        newEntropy.delete();
        // Compute Metrics
        let compressionRatio = (src.total() * src.elemSize()) / blob.size;
        let timeTaken = (performance.now() - startTime).toFixed(4);
        setJpegResult({
          compressionRatio: (1/compressionRatio).toFixed(4),
        });

        notifyS("Process Completed !!")
        // myProcess4Button.current.disabled=true 

        // Cleanup
        src.delete();
        gray.delete();
        rgbaMat.delete();
        compressedMat.delete();
        canvas.remove();
      } catch (error) {
        console.error("JPEG Compression Error:", error);
      }

    };


    function calculateEntropyMap(srcGray) {
      const kernelSize = 9;
      const half = Math.floor(kernelSize / 2);
      const width = srcGray.cols;
      const height = srcGray.rows;
    
      let entropyMap = new cv.Mat.zeros(height, width, cv.CV_8UC1);
    
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let freq = new Array(256).fill(0);
          let total = 0;
    
          for (let ky = -half; ky <= half; ky++) {
            for (let kx = -half; kx <= half; kx++) {
              const ny = y + ky;
              const nx = x + kx;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const val = srcGray.ucharPtr(ny, nx)[0];
                freq[val]++;
                total++;
              }
            }
          }
    
          let entropy = 0;
          for (let i = 0; i < 256; i++) {
            if (freq[i] > 0) {
              const p = freq[i] / total;
              entropy -= p * Math.log2(p);
            }
          }
    
          const normalized = Math.min(255, Math.round((entropy / 8) * 255));
          entropyMap.ucharPtr(y, x)[0] = normalized;
        }
      }
    
      return entropyMap;
    }
    
    function lossyHuffmanEncode() {
      const imgElement = document.getElementById("inputImage");
    
      if (!imgElement || isNaN(qfactor) || qfactor < 1) {
        notifyE("Please enter the value for Quantization Factor.")
        console.log("Image or qfactor problem");
        return;
      }
    
      let src = cv.imread(imgElement);
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    
      setHuffText('Old Entropy | New Entropy | Compressed Image')

      // Step 1: Calculate entropy map of original image
      let originalEntropy = calculateEntropyMap(src);
    
      // Step 2: Quantize image
      let quantized = new cv.Mat();
      src.convertTo(quantized, -1, 1 / qfactor, 0);
      quantized.convertTo(quantized, -1, qfactor, 0);
      const compressionRatio = Math.max((8 - Math.log2(qfactor))/8,0);
      setHresult({ compressionRatio: compressionRatio.toFixed(4) });
      // Step 3: Calculate entropy map after quantization
      let compressedEntropy = calculateEntropyMap(quantized);
    
      // Step 4: Combine all three images: originalEntropy | compressedEntropy | quantized
      let merged = new cv.Mat();
      let images = new cv.MatVector();
      images.push_back(originalEntropy);
      images.push_back(compressedEntropy);
      images.push_back(quantized);
      cv.hconcat(images, merged);
      cv.imshow("outputCanvas", merged);
      
      // Cleanup
      src.delete();
      quantized.delete();
      originalEntropy.delete();
      compressedEntropy.delete();
      images.delete();
      merged.delete();
      setHresult({ compressionRatio: compressionRatio.toFixed(4) });
      console.log(hresult);
      notifyS("Process Completed !!")
      // myProcess2Button.current.disabled=true
    }
    
    
    const [rleresult,setRleresult]=useState(null);

    async function runLengthEncode(image, minRunLength = 1) {
      

      let startTime = performance.now();
    
      let data = image.data;
      let encoded = [];
      let prev = data[0];
      let count = 1;
    console.log(image.cols)
      for (let i = 1; i < data.length; i++) {
        if (data[i] === prev) {
          count++;
        } else {
          if (count >= minRunLength) {
            encoded.push([prev, count]);
          } else {
            for (let j = 0; j < count; j++) {
              encoded.push([prev, 1]);
            }
          }
          prev = data[i];
          count = 1;
        }
      }
    
      // Push last run
      if (count >= minRunLength) {
        encoded.push([prev, count]);
      } else {
        for (let j = 0; j < count; j++) {
          encoded.push([prev, 1]);
        }
      }
    
      let compressedData = new Uint8ClampedArray(image.cols * image.rows);
      let index = 0;
      encoded.forEach(([value, count]) => {
        for (let i = 0; i < count; i++) {
          compressedData[index++] = value;
        }
      });
    
      // Use OpenCV to calculate local entropy
      function calculateEntropyMap(grayData, rows, cols) {
        let src = cv.matFromArray(rows, cols, cv.CV_8UC1, grayData);
        let kernelSize = 9;
        let entropyMap = new cv.Mat();
    
        let histSize = 256;
        let mask = new cv.Mat();
        let entropyValues = [];
    
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            let x1 = Math.max(0, x - kernelSize);
            let y1 = Math.max(0, y - kernelSize);
            let x2 = Math.min(cols, x + kernelSize);
            let y2 = Math.min(rows, y + kernelSize);
    
            let roi = src.roi(new cv.Rect(x1, y1, x2 - x1, y2 - y1));
            let hist = new cv.Mat();
            let channels = [0];
            let ranges = [0, 256];
    
            let matVec = new cv.MatVector();
            matVec.push_back(roi);
            cv.calcHist(matVec, channels, mask, hist, [histSize], ranges);
            matVec.delete();

            let entropy = 0;
            for (let i = 0; i < histSize; i++) {
              let p = hist.data32F[i] / roi.data.length;
              if (p > 0) {
                entropy -= p * Math.log2(p);
              }
            }
            entropyValues.push(entropy * 40); // Scale for visibility
            hist.delete();
            roi.delete();
          }
        }
    
        entropyMap = new Uint8ClampedArray(rows * cols * 4);
        for (let i = 0; i < entropyValues.length; i++) {
          let val = Math.min(255, Math.floor(entropyValues[i]));
          entropyMap[i * 4] = val;
          entropyMap[i * 4 + 1] = val;
          entropyMap[i * 4 + 2] = val;
          entropyMap[i * 4 + 3] = 255;
        }
    
        src.delete();
        return entropyMap;
      }
    
      let originalEntropyMap = calculateEntropyMap(data, image.rows, image.cols);
      let compressedEntropyMap = calculateEntropyMap(compressedData, image.rows, image.cols);
      
      let canvas = document.getElementById("outputCanvas");
      let ctx = canvas.getContext("2d");
    
      canvas.width = image.cols * 3;
      canvas.height = image.rows;
    
      // Convert grayscale to RGBA
      function toRGBA(data) {
        let rgba = new Uint8ClampedArray(data.length * 4);
        for (let i = 0; i < data.length; i++) {
          rgba[i * 4] = data[i];
          rgba[i * 4 + 1] = data[i];
          rgba[i * 4 + 2] = data[i];
          rgba[i * 4 + 3] = 255;
        }
        return rgba;
      }
    
      let rgbaOriginal = toRGBA(data);
      let rgbaCompressed = toRGBA(compressedData);
    
      // Draw original entropy
      let entropyBeforeImageData = new ImageData(originalEntropyMap, image.cols, image.rows);
      ctx.putImageData(entropyBeforeImageData, 0, 0);
    
      // Draw compressed entropy
      let entropyAfterImageData = new ImageData(compressedEntropyMap, image.cols, image.rows);
      ctx.putImageData(entropyAfterImageData, image.cols, 0);
    
      // Draw compressed image
      let compressedImageData = new ImageData(rgbaCompressed, image.cols, image.rows);
      ctx.putImageData(compressedImageData, image.cols * 2, 0);
    
      let endTime = performance.now();
    
      return {compressionRatio: (encoded.length / data.length).toFixed(4),};
    }
    
    const [text, setText] = useState('Output Image');
    const [huffText, setHuffText] = useState('Output Image');
    const [sineText, setSineText] = useState('Output Image');
    const [jpegText, setJpegText] = useState('Output Image');
    const [loading, setLoading] = useState(false);
    // const [progress, setProgress] = useState(0);

    
 
    async function processImage(minRunLength = 1) {
      setLoading(true);
      // setProgress(10); // Initial
    
      await new Promise(resolve => setTimeout(resolve, 300)); // allow re-render
    
      try {
        minRunLength = parseInt(mrl);
        const imgElement = document.getElementById("inputImage");
    
        if (!imgElement) {
          console.error("Image element not found!");
          setLoading(false);
          return;
        }
    
        // setProgress(30);
        // await new Promise(resolve => setTimeout(resolve, 300));

        let src = cv.imread(imgElement);
    
        // setProgress(50);
        // await new Promise(resolve => setTimeout(resolve, 300));
    
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    
        // setProgress(70);
        // await new Promise(resolve => setTimeout(resolve, 200));
    
        let result = await runLengthEncode(src, minRunLength);
    
        // setProgress(90);
        // await new Promise(resolve => setTimeout(resolve, 200));
    
        setRleresult(result);
        src.delete();
    
        // setProgress(100);
        setText('Old Entropy | New Entropy | Compressed Image');
        setLoading(false);
        myCanvas.current.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Error during processing:", error);
      } finally {
        setTimeout(() => {
          
          setLoading(false);
          notifyS("Process Completed !!")
          // myProcess1Button.current.disabled=true
          // setProgress(0);
        }, 500); // Reset after showing 100%
      }
    }
    
    const [scResult, setScResult] = useState(null);
    const [sineBased, setSineBased] = useState(true);


    const createTransformMatrix = (size, sine) => {
      let quantizationFactor=parseFloat(qfactor);
      let mat=new cv.Mat(size, size, cv.CV_32F, new cv.Scalar(quantizationFactor, quantizationFactor, quantizationFactor, quantizationFactor))
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          mat.floatPtr(i, j)[0] = sine
            ? Math.sin((Math.PI * (i + 0.5) * j) / size) // DST
            : Math.cos((Math.PI * (i + 0.5) * j) / size); // DCT
        }
      }
      return mat;
  };

  const sinecosine = () => {
    let quantizationFactor = parseFloat(qfactor);
    let sineBased = true; // Set this flag to toggle between Sine/Cosine transforms

    setSineText('Old Entropy | New Entropy | Compressed Image')

    function getMatByteSize(mat) {
        let canvas = document.createElement('canvas');
        cv.imshow(canvas, mat);
        let dataURL = canvas.toDataURL('image/jpeg', 1.0);
        let base64 = dataURL.split(',')[1];
        return Math.ceil((base64.length * 3) / 4);
    }

    function computeCompressionRatio(originalMat, compressedMat) {
        let originalSize = getMatByteSize(originalMat);
        let compressedSize = getMatByteSize(compressedMat);
        return (compressedSize / originalSize).toFixed(2);
    }

    function createTransformMatrix(n, mode = 'cosine') {
        let mat = new cv.Mat(n, n, cv.CV_32F);
        const scaleFactor = mode === 'sine' 
            ? Math.sqrt(2/(n+1)) 
            : Math.sqrt(2/n);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let value;
                if (mode === 'sine') {
                    // Standard DST-II formulation
                    value = Math.sin(((i + 1) * (j + 1) * Math.PI) / (n + 1));
                } else {
                    // Standard DCT-II formulation
                    value = Math.cos(((2 * i + 1) * j * Math.PI) / (2 * n));
                }
                mat.floatPtr(i)[j] = scaleFactor * value;
            }
        }
        return mat;
    }

    try {
        let imgElement = document.getElementById("inputImage");
        let src = cv.imread(imgElement);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        let floatGray = new cv.Mat();
        gray.convertTo(floatGray, cv.CV_32F);

        let oldEntropyMap = calculateEntropyMap(gray);

        const size = floatGray.rows;
        const T = createTransformMatrix(size, sineBased ? 'sine' : 'cosine');
        const Tt = new cv.Mat();
        cv.transpose(T, Tt);

        // Forward Transform
        let transformed = new cv.Mat();
        cv.gemm(T, floatGray, 1, new cv.Mat(), 0, transformed);
        cv.gemm(transformed, Tt, 1, new cv.Mat(), 0, transformed);

        // Quantization
        let quantMat = new cv.Mat(transformed.rows, transformed.cols, cv.CV_32F, 
                                new cv.Scalar(2**quantizationFactor));
        let quantized = new cv.Mat();
        cv.divide(transformed, quantMat, quantized);

        // Reconstruction
        let reconstructed = new cv.Mat();
        cv.gemm(Tt, quantized, 1, new cv.Mat(), 0, reconstructed);
        cv.gemm(reconstructed, T, 1, new cv.Mat(), 0, reconstructed);

        // Post-processing
        let compressed = new cv.Mat();
        cv.normalize(reconstructed, compressed, 0, 255, cv.NORM_MINMAX);
        compressed.convertTo(compressed, cv.CV_8U);

        // Compute metrics
        let newEntropyMap = calculateEntropyMap(compressed);
        let ratio = computeCompressionRatio(floatGray, quantized);
        console.log(`Compression Ratio: ${ratio}`);
        setScResult({ compressionRatio: ratio });

        // Display results
        let vector = new cv.MatVector();
        vector.push_back(oldEntropyMap);
        vector.push_back(newEntropyMap);
        vector.push_back(compressed);

        let stacked = new cv.Mat();
        cv.hconcat(vector, stacked);
        cv.imshow("outputCanvas", stacked);

        // Cleanup
        [
            src, gray, floatGray, T, Tt, transformed,
            quantMat, quantized, reconstructed, compressed,
            oldEntropyMap, newEntropyMap, vector, stacked
        ].forEach(m => m.delete());

        notifyS("Process Completed !!")
        // myProcess3Button.current.disabled=true
        
    } catch (err) {
        console.error('Processing error:', err);
    }
  };
  

    //sets variable which defines which tab is active
    const [tabValue, setTabValue] = useState(0);

    const [openInstructionsModal, setOpenInstructionsModal] = useState(false);
    const [openRunLengthModal, setOpenRunLengthModal] = useState(false);
    const [openHuffmanModal, setOpenHuffmanModal] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false); // State for opening/closing the drawer
 
   var indexTabValue=tabValue
   const handleTabChange = (event, newValue) => {    
     indexTabValue=newValue;
     setTabValue(newValue);
   };
 
   const instr =() => {
     setOpenInstructionsModal(true);
   };

   const exp =() => {
    setOpenRunLengthModal(true);
  };

  const exp2 =() => {
    setOpenHuffmanModal(true);
  };


 
   const toggleDrawer = () => {
     setDrawerOpen(!drawerOpen); // Toggle drawer state (open or close)
   };

    const initialImages = [sample1, sample2, sample3, sample4];
    
    // State to hold the images
    const [images, setImages] = useState(initialImages);
  
    const [selectedImage, setSelectedImage] = useState(0);
    const [imageName,setImageName]=useState("");
    
    const handleImageChange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        // Create a URL for the image file
        const imageUrl = URL.createObjectURL(file);
  
        // Add the new image to the state
        setImages(prevImages => {
          const updatedImages = [...prevImages, imageUrl];
          return updatedImages;
        });
  
        // Find the index of the new image in the updated images array
        const foundIndex = images.length;  // Since it's being added at the end of the array
        setSelectedImage(foundIndex);
      }
    };
    
  
  
  const handleImageClick = (index) => {
    setText('Output Image');
    setHuffText('Output Image')
    setSineText('Output Image')
    setJpegText('Output Image')
    setHresult()
    setRleresult()
    setScResult()
    setJpegResult()
    setSelectedImage(index);
    setMrl('')
    setQfactor('')
    setQuality('')
    setImageName(`Sample ${index + 1}`);
  };

  const handleCloseModal = () => {
    setOpenInstructionsModal(false); // Close the modal
  };

  
  const handleClose2Modal = () => {
    setOpenRunLengthModal(false); // Close the modal
  };

  const handleClose3Modal = () => {
    setOpenHuffmanModal(false); // Close the modal
  };


  const voicePause = useRef(null);
      const voicePlay = useRef(null);
  
        const [isSpeaking, setIsSpeaking] = useState(false);
        const utteranceRef = useRef(null);
      
        useEffect(() => {
          speechSynthesis.cancel(); // Cancel any speech on reload
        }, []);
      
      
        const instructionsList = {
          0: [
            "Select an image from the available options or upload one using the Upload File button.",
            "Enter the value for minimum run length.",
            "Click the Process button to continue.",
            "Click the Print button to print the result.",
            "Note: Click the Concept button to get a detailed explanation."
          ],
          1: [
            "Select an image from the available options or upload one using the Upload File button.",
            "Enter the value for Quantization Factor.",
            "Click the Process button to continue.",
            "Click the Print button to print the result.",
            "Note: Click the Concept button to get a detailed explanation."
          ],
          2: [
            "Select an image from the available options or upload one using the Upload File button.",
            "Set the function you want to use: sine/cosine.",
            "Set the Quantization Factor.",
            "Click the Process button to continue.",
            "Click the Print button to print the result.",
          ],
          3: [
            "Select an image from the available options or upload one using the Upload File button.",
            "Set the Quality Factor between 0-100.",
            "Click the Process button to continue.",
            "Click the Print button to print the result.",
          ]
        };
      
        const getInstructionsText = () => {
          const steps = instructionsList[indexTabValue];
          return steps ? steps.join('\n') : "No instructions available.";
        };
        
      
        const getInstructions = () => {
        const steps = instructionsList[indexTabValue];
        if (!steps) return <p>No instructions available.</p>;

        const normalSteps = [];
        const notes = [];

        steps.forEach((step) => {
          if (step.trim().startsWith("Note:")) {
            const noteHtml = step.replace(/(Concept)/g, '<b>$1</b>')
                        .replace(/^Note:/, '<b style="color:blue">Note:</b>'
            );
            notes.push(noteHtml);
          } else {
            const stepHtml = step.replace(
              /(Upload File|Process|Print)/g,
              '<b>$1</b>'
            );
            normalSteps.push(stepHtml);
          }
        });

        return (
          <div>
            <ol>
              {normalSteps.map((html, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </ol>
            {notes.map((note, idx) => (
              <p key={`note-${idx}`} dangerouslySetInnerHTML={{ __html: note }} />
            ))}
          </div>
        );
      };

      
        
        const speak = () => {
          
          if (speechSynthesis.paused) {
            speechSynthesis.resume();
            if (voicePlay.current.style.display=='block') {
              voicePlay.current.style.display = 'none';
              voicePause.current.style.display = 'block';
            }
            setIsSpeaking(true);
            return;
          }
        
          if (speechSynthesis.speaking) {
            speechSynthesis.pause();
            setIsSpeaking(false);
          if (voicePlay.current.style.display=='none') {
              voicePlay.current.style.display = 'block';
              voicePause.current.style.display = 'none';
            }
            return;
          }
        
          // Clean up any lingering speech
          speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(getInstructionsText());
          const voices = speechSynthesis.getVoices();
          utterance.voice = voices.find(voice => voice.name === 'Microsoft Ravi - English (India)');
          utterance.rate = 0.8;
          utterance.pitch = 1;
        
          utterance.onend = () => {
            setIsSpeaking(false);
            if (voicePlay.current.style.display=='none') {
              voicePlay.current.style.display = 'block';
              voicePause.current.style.display = 'none';
            }
            utteranceRef.current = null;
          };
        
          utteranceRef.current = utterance;
          speechSynthesis.speak(utterance);
          setIsSpeaking(true);
          if (voicePause.current.style.display=='none') {
              voicePlay.current.style.display = 'none';
              voicePause.current.style.display = 'block';
            }
        };

    

  return (
    <OpenCvProvider>
      <div id="main-box">

      <div id="bottom-footer"> &copy; 2025 Virtual Labs, IIT Roorkee</div>

      <div id="top-header">
            {/* Hamburger Icon for Mobile */}
        <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        sx={{ display: { xs: 'block', md: 'none' },color:'#D1D3D8' }} // Only show on small screens
        onClick={toggleDrawer} // Toggle drawer open/close
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer for Mobile View */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: 200, // Width of the drawer
            backgroundColor: '#282528',
            color: 'white',
          },
        }}
      >
        {/* Drawer Content (Mobile Navigation) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
          <Tab
            label="Run Length"
            onClick={() => {
              handleImageClick(0)
              setTabValue(0);
              toggleDrawer(); // Close drawer when an option is clicked
            }}
          />
          <Tab
            label="Lossy Huffman"
            onClick={() => {
              handleImageClick(0)
              setTabValue(1);
              toggleDrawer();
            }}
          />
          <Tab
            label="Sine and Cosine Based"
            onClick={() => {
              handleImageClick(0)
              setTabValue(2);
              toggleDrawer();
            }}
          />
          <Tab
            label="JPEG Compression"
            onClick={() => {
              handleImageClick(0)
              setTabValue(3);
              toggleDrawer();
            }}
          />
         
        </Box>
      </Drawer>

      {/* Tabs for Desktop */}
      <Box id="tab-box">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Tabs"
          sx={{ display: { xs: 'none', md: 'flex' } }} // Hide on small screens
        >
          <Tab sx={{color:'#D1D3D8','&.Mui-selected': {color: ' white'},}} onClick={() => handleImageClick(0)} label="Run Length" />
          <Tab sx={{color:'#D1D3D8','&.Mui-selected': {color: ' white'},}} onClick={() => handleImageClick(0)} label="Huffman" />
          <Tab sx={{color:'#D1D3D8','&.Mui-selected': {color: ' white'},}} onClick={() => handleImageClick(0)} label="Sine Cosine" />
          <Tab sx={{color:'#D1D3D8','&.Mui-selected': {color: ' white'},}} onClick={() => handleImageClick(0)} label="JPEG Compression" />
         </Tabs>
      </Box>

      <div id="header_button">
            <Button title='Play' ref={voicePlay}>
              <img src={voice} alt="voice" style={{ width: '40px', height: 'auto'}} onClick={speak}/>
            </Button>
      
            <Button
              ref={voicePause}
              title='Pause' 
              style={{display:'none'}}
            >
              <img src={voice_pause} alt="voice" style={{ width: '40px', height: 'auto'}} onClick={speak}/>
            </Button>
      
            <Button style={{color: '#D1D3D8'}}  onClick={instr}>Instructions</Button>
      </div>

   

      {/* Instructions Modal */}
      <Dialog
        open={openInstructionsModal}
        onClose={handleCloseModal}
        aria-labelledby="instructions-dialog-title"
        aria-describedby="instructions-dialog-description"
        style={{height:'80%'}}
      >
        <DialogTitle id="instructions-dialog-title">Instructions</DialogTitle>
        <DialogContent style={{paddingTop:'10px'}}>
        <p style={{color:'#1D2A6D', fontWeight:'bold'}}>{tabValue === 0 ? 'Run Length Encoding' : tabValue === 1 ? 'Lossy Huffman' : tabValue === 2 ?'Sine and Cosine':'JPEG Compression'}:</p>
          {getInstructions()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </div>
       
      
      <div id="mainbox" >
       
        <TabPanel tabValue={tabValue} index={0}>
        <div class="flex-container">
        <div class="flex-item-left">
          <div id="left_bar">
            <Box sx={{ width: '100%', height: '85%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
              <Box sx={{ p: 0, position: 'sticky', alignItems: 'center', borderBottom: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', height: '50px', display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <h4 style={{margin:'5px 0px'}}>Run Length Encoding Tools</h4>
              </Box>
              <Box sx={{ p: 2 ,display: 'flex', flexDirection: 'column', gap: 2, alignContent: 'center', justifyContent: 'center', textAlign: 'center',overflowY:'scroll','&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#555', borderRadius: 2 }}}>
              
              <div class="contentog">

              <h4 style={{margin:'5px 0px',textAlign:'left',color:'#444444' }}>Choose an Image:</h4>
                 
                    <div className="image-grid" sx={{width: '100%',position: 'relative', alignContent: 'center', justifyContent: 'center', textAlign: 'center'}}>
                    <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,gap:'5px',marginBottom:'5px' }}>
                        <div className="gridImage" onClick={() => handleImageClick(0)}><img src={sample1} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(1)}><img src={sample2} alt="Sample 4" style={{ width: '100%', height: 'auto' }}/></div>
                      </div>
                      <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,gap:'5px' }}>
                        <div className="gridImage" onClick={() => handleImageClick(2)}><img src={sample3} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(3)}><img src={sample4} alt="Sample 4" style={{width: '100%', height: 'auto' }}/></div>
                      </div>
                    </div>
                    <div style={{marginTop:'10px'}}>
                    <div className="relative inline-block">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-block text-sm font-semibold py-2 px-4 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Upload file
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
  
                    </div>
                </div>

                <div>
                    <h4 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Minimum Run Length:</h4>
                    <input
                        type="text"
                        value={mrl}
                        onChange={(e) => setMrl(e.target.value)}
                        placeholder="e.g., 20,20,20,0"
                        style={{ padding: '5px', border: '1px solid #1D2A6D', borderRadius: '4px' }}
                    />
                </div>
              </Box>
            </Box>
            </div>
          </div>
          <div class="flex-item-right">
          <div class="content">
          <h2 style={{margin:'5px 0px'}}>Run Length Encoding</h2>
          <h4 style={{margin:'15px 0px',color:'#444444'}}>In this experiment we are going to check how different min run length alters statistics of compression and how is entropy, compression ratio affected due to different image patterns.</h4>
            </div>
            <div class="input_output" >
            <div id="sampling_area">
              <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2, marginRight: '5%'}}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                <h4 style={{margin:'5px 0px'}}>Input Image</h4>
                </Box>
                <Box sx={{ p: 2, height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img id="inputImage" src={images[selectedImage]} alt="Input Image"/>
                </Box>
              </Box>
              <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2}}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                <h4  style={{margin:'5px 0px'}}>{text}</h4>
                </Box>
                <Box sx={{ p: 2,  height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {loading && 
                <div style={{height:'100%',display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  <div className="spinner-border" role="status" style={{ color: '#1D2A6D' }}>
                  {/* <div className="spinner-border text-primary" role="status" > */}
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  </div>
                  }
                

                  {/* {loading && (
                  <div className="custom-progress-bar" >
                    <ProgressBar now={progress} label={`${progress}%`} />
                  </div>
                )} */}

                  <canvas ref={myCanvas} id="outputCanvas" style={{display:'none'}}>
                  </canvas>
                {rleresult&&<><h3 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Compression ratio: {rleresult['compressionRatio']}</h3></>}
                </Box>
              </Box>
              
            </div>
          </div>
          </div>
          
          </div>
          <div style={{display:'flex',flexDirection:'row',justifyContent:'space-evenly',flexWrap: 'wrap',alignContent: 'center'}}>
                <Button ref={myProcess1Button} class="tool_btn" onClick={processImage} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Process
                  <svg class="icon" viewBox="0 0 30 30" fill="currentColor">
                    <path d="M 19.664062 0 C 19.423063 0 19.217828 0.17120313 19.173828 0.40820312 L 18.953125 1.5839844 C 18.896125 1.8889844 18.654609 2.1166875 18.349609 2.1796875 C 18.065609 2.2386875 17.785672 2.3123906 17.513672 2.4003906 C 17.218672 2.4963906 16.897313 2.4205469 16.695312 2.1855469 L 15.919922 1.2792969 C 15.762922 1.0962969 15.498062 1.0528281 15.289062 1.1738281 L 14.710938 1.5078125 C 14.502937 1.6278125 14.408281 1.8804219 14.488281 2.1074219 L 14.884766 3.234375 C 14.987766 3.526375 14.893109 3.8437813 14.662109 4.0507812 C 14.447109 4.2437812 14.243781 4.4471094 14.050781 4.6621094 C 13.843781 4.8931094 13.526375 4.9897187 13.234375 4.8867188 L 12.105469 4.4882812 C 11.878469 4.4082812 11.627813 4.5019375 11.507812 4.7109375 L 11.171875 5.2910156 C 11.051875 5.4990156 11.097297 5.764875 11.279297 5.921875 L 11.376953 6.0058594 C 12.559953 6.0258594 13.572016 6.8720625 13.791016 8.0390625 L 13.851562 8.3574219 L 14.060547 8.1113281 C 14.519547 7.5773281 15.162172 7.2869531 15.826172 7.2519531 C 16.722172 5.8969531 18.255 5 20 5 C 22.761 5 25 7.239 25 10 C 25 11.745 24.103047 13.277875 22.748047 14.171875 C 22.713047 14.835875 22.422672 15.4795 21.888672 15.9375 L 21.642578 16.146484 L 21.960938 16.207031 C 23.127938 16.426031 23.974141 17.438094 23.994141 18.621094 L 24.078125 18.71875 C 24.235125 18.90175 24.499984 18.947172 24.708984 18.826172 L 25.289062 18.490234 C 25.497062 18.370234 25.591719 18.119578 25.511719 17.892578 L 25.113281 16.763672 C 25.010281 16.471672 25.106891 16.154266 25.337891 15.947266 C 25.552891 15.754266 25.756219 15.550938 25.949219 15.335938 C 26.156219 15.104938 26.473625 15.010281 26.765625 15.113281 L 27.892578 15.509766 C 28.119578 15.589766 28.372187 15.496109 28.492188 15.287109 L 28.826172 14.707031 C 28.946172 14.499031 28.902703 14.235125 28.720703 14.078125 L 27.814453 13.300781 C 27.579453 13.098781 27.503609 12.777422 27.599609 12.482422 C 27.687609 12.210422 27.761312 11.932438 27.820312 11.648438 C 27.883312 11.344437 28.111016 11.102922 28.416016 11.044922 L 29.591797 10.822266 C 29.828797 10.781266 30 10.576938 30 10.335938 L 30 9.6640625 C 30 9.4230625 29.828797 9.2178281 29.591797 9.1738281 L 28.416016 8.953125 C 28.111016 8.896125 27.883312 8.6546094 27.820312 8.3496094 C 27.761312 8.0656094 27.687609 7.7856719 27.599609 7.5136719 C 27.503609 7.2186719 27.579453 6.8973125 27.814453 6.6953125 L 28.720703 5.9199219 C 28.903703 5.7629219 28.947172 5.4980625 28.826172 5.2890625 L 28.492188 4.7109375 C 28.372187 4.5029375 28.119578 4.4082812 27.892578 4.4882812 L 26.765625 4.8847656 C 26.473625 4.9877656 26.156219 4.8931094 25.949219 4.6621094 C 25.756219 4.4471094 25.552891 4.2437813 25.337891 4.0507812 C 25.106891 3.8437813 25.010281 3.526375 25.113281 3.234375 L 25.511719 2.1054688 C 25.591719 1.8784687 25.498063 1.6278125 25.289062 1.5078125 L 24.708984 1.171875 C 24.500984 1.051875 24.235125 1.0972969 24.078125 1.2792969 L 23.302734 2.1855469 C 23.100734 2.4205469 22.779375 2.4963906 22.484375 2.4003906 C 22.212375 2.3123906 21.932438 2.2386875 21.648438 2.1796875 C 21.344438 2.1166875 21.102922 1.8870312 21.044922 1.5820312 L 20.824219 0.40625 C 20.782219 0.17025 20.576937 0 20.335938 0 L 19.664062 0 z M 10.664062 8 C 10.423063 8 10.217828 8.17025 10.173828 8.40625 L 9.9882812 9.3945312 C 9.9112813 9.8055313 9.5838281 10.108406 9.1738281 10.191406 C 8.8328281 10.260406 8.497875 10.348078 8.171875 10.455078 C 7.775875 10.585078 7.3413125 10.487875 7.0703125 10.171875 L 6.4199219 9.4121094 C 6.2629219 9.2301094 5.9970625 9.1866406 5.7890625 9.3066406 L 5.2109375 9.640625 C 5.0019375 9.760625 4.9082812 10.013234 4.9882812 10.240234 L 5.3242188 11.191406 C 5.4622188 11.585406 5.3305312 12.009109 5.0195312 12.287109 C 4.7625312 12.517109 4.5180625 12.760578 4.2890625 13.017578 C 4.0110625 13.328578 3.5873594 13.460266 3.1933594 13.322266 L 2.2402344 12.988281 C 2.0132344 12.908281 1.7625781 13.002937 1.6425781 13.210938 L 1.3066406 13.789062 C 1.1856406 13.998062 1.2310625 14.262922 1.4140625 14.419922 L 2.1738281 15.070312 C 2.4898281 15.341313 2.5870312 15.775875 2.4570312 16.171875 C 2.3500312 16.497875 2.2623594 16.832828 2.1933594 17.173828 C 2.1103594 17.583828 1.8074844 17.911281 1.3964844 17.988281 L 0.40820312 18.173828 C 0.17120313 18.217828 0 18.423063 0 18.664062 L 0 19.335938 C 0 19.576937 0.17025 19.782172 0.40625 19.826172 L 1.3945312 20.011719 C 1.8055312 20.088719 2.1084062 20.416172 2.1914062 20.826172 C 2.2604063 21.168172 2.3480781 21.502125 2.4550781 21.828125 C 2.5850781 22.224125 2.487875 22.658687 2.171875 22.929688 L 1.4121094 23.580078 C 1.2301094 23.737078 1.1866406 24.002938 1.3066406 24.210938 L 1.640625 24.789062 C 1.760625 24.998062 2.0132344 25.091719 2.2402344 25.011719 L 3.1914062 24.675781 C 3.5854063 24.537781 4.0091094 24.669469 4.2871094 24.980469 C 4.5171094 25.237469 4.7605781 25.481938 5.0175781 25.710938 C 5.3285781 25.988937 5.4602656 26.412641 5.3222656 26.806641 L 4.9882812 27.759766 C 4.9082812 27.986766 5.0029375 28.237422 5.2109375 28.357422 L 5.7890625 28.693359 C 5.9980625 28.814359 6.2629219 28.768937 6.4199219 28.585938 L 7.0703125 27.826172 C 7.3413125 27.510172 7.775875 27.412969 8.171875 27.542969 C 8.497875 27.649969 8.8328281 27.737641 9.1738281 27.806641 C 9.5838281 27.889641 9.9112813 28.192516 9.9882812 28.603516 L 10.173828 29.591797 C 10.217828 29.828797 10.423063 30 10.664062 30 L 11.335938 30 C 11.576938 30 11.782219 29.82875 11.824219 29.59375 L 12.009766 28.605469 C 12.086766 28.194469 12.414219 27.891594 12.824219 27.808594 C 13.166219 27.739594 13.500172 27.651922 13.826172 27.544922 C 14.222172 27.414922 14.656734 27.512125 14.927734 27.828125 L 15.578125 28.587891 C 15.735125 28.769891 15.999031 28.815313 16.207031 28.695312 L 16.787109 28.359375 C 16.996109 28.239375 17.089766 27.988719 17.009766 27.761719 L 16.675781 26.808594 C 16.537781 26.414594 16.669469 25.990891 16.980469 25.712891 C 17.237469 25.482891 17.481938 25.239422 17.710938 24.982422 C 17.988937 24.671422 18.413641 24.539734 18.806641 24.677734 L 19.759766 25.011719 C 19.986766 25.091719 20.237422 24.997062 20.357422 24.789062 L 20.693359 24.210938 C 20.814359 24.001937 20.768937 23.737078 20.585938 23.580078 L 19.826172 22.929688 C 19.510172 22.658688 19.412969 22.224125 19.542969 21.828125 C 19.649969 21.502125 19.737641 21.167172 19.806641 20.826172 C 19.889641 20.416172 20.192516 20.088719 20.603516 20.011719 L 21.591797 19.826172 C 21.828797 19.782172 22 19.576937 22 19.335938 L 22 18.664062 C 22 18.423063 21.82875 18.218781 21.59375 18.175781 L 20.605469 17.990234 C 20.194469 17.913234 19.891594 17.583828 19.808594 17.173828 C 19.739594 16.832828 19.651922 16.497875 19.544922 16.171875 C 19.414922 15.775875 19.512125 15.343266 19.828125 15.072266 L 20.587891 14.421875 C 20.769891 14.264875 20.815313 13.999016 20.695312 13.791016 L 20.359375 13.210938 C 20.239375 13.001937 19.988719 12.908281 19.761719 12.988281 L 18.808594 13.324219 C 18.414594 13.462219 17.990891 13.330531 17.712891 13.019531 C 17.482891 12.762531 17.239422 12.518062 16.982422 12.289062 C 16.671422 12.011063 16.539734 11.587359 16.677734 11.193359 L 17.011719 10.240234 C 17.091719 10.013234 16.997062 9.7625781 16.789062 9.6425781 L 16.210938 9.3066406 C 16.001938 9.1856406 15.737078 9.2310625 15.580078 9.4140625 L 14.929688 10.173828 C 14.658687 10.489828 14.224125 10.587031 13.828125 10.457031 C 13.502125 10.350031 13.167172 10.262359 12.826172 10.193359 C 12.416172 10.110359 12.088719 9.8074844 12.011719 9.3964844 L 11.826172 8.4082031 C 11.782172 8.1712031 11.576937 8 11.335938 8 L 10.664062 8 z M 20 9 A 1 1 0 0 0 19 10 A 1 1 0 0 0 20 11 A 1 1 0 0 0 21 10 A 1 1 0 0 0 20 9 z M 11 13 C 14.314 13 17 15.686 17 19 C 17 22.314 14.314 25 11 25 C 7.686 25 5 22.314 5 19 C 5 15.686 7.686 13 11 13 z M 11 17 C 9.895 17 9 17.895 9 19 C 9 20.105 9.895 21 11 21 C 12.105 21 13 20.105 13 19 C 13 17.895 12.105 17 11 17 z"></path>
                </svg>
                  </Button>
                 

                <Button class="tool_btn" onClick={exp} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Concept
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" width="24px" height="24px" viewBox="0 0 24 24">
                    <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.002 14H4z"/>
                    <path d="M6 7h12v2H6zm0 4h12v2H6zm0 4h6v2H6z"/>
                  </svg>
                  
                  </Button>

                  
                <Button class="tool_btn" onClick={handlePrint} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Print
                  <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h2zm2-3h8V5H8v3zM4 10v8h16V10H4zm8 10h-2v2h2v-2z"/>
                  </svg>

                  </Button>
             
          </div>

              {/* ToastContainer must be placed somewhere in the component tree */}
              <ToastContainer />
              <Dialog
                
                open={openRunLengthModal}
                onClose={handleClose2Modal}
                aria-labelledby="explanation-dialog-title"
                aria-describedby="explanation-dialog-description"
                PaperProps={{
                  id:"explanation-dialog",
                }}
              >
                <DialogTitle id="instructions-dialog-title" >
                  <div style={{width:'50%'}}>Run Length Encode Concept</div>
                  <div style={{width:'50%',justifyContent:'flex-end',display:'flex'}}>
                  <Button onClick={handleClose2Modal} color="primary" style={{backgroundColor:'beige',width: 'fit-content',height: 'fit-content'}}>
                    Close
                  </Button>
                  </div>
                </DialogTitle>

                <DialogContent sx={{ padding: '0px',height:'1200px',overflow:'clip' }}>
                  {openRunLengthModal && <RLEanimation />}
                  {/* {RLEanimation()} */}
                </DialogContent>

              </Dialog>
        </TabPanel>

        <TabPanel tabValue={tabValue} index={1}>
        <div class="flex-container">
        <div class="flex-item-left">
          <div id="left_bar">
            <Box sx={{ width: '100%', height: '80%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
              <Box sx={{ p: 0, position: 'sticky', alignItems: 'center', borderBottom: 1, borderTopRightRadius: 8, borderTopLeftRadius: 8, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', height: '50px', display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <h4 style={{margin:'5px 0px'}}>Lossy Huffman Tools</h4>
              </Box>
              <Box  sx={{ p: 2 ,display: 'flex', flexDirection: 'column', gap: 2, alignContent: 'center', justifyContent: 'center', textAlign: 'center', overflowY: 'scroll', '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#555', borderRadius: 2 }}}>
              <div class="contentog">
                <h4 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Choose an Image:</h4>
                    <div className="image-grid" sx={{width: '100%',position: 'relative', alignContent: 'center', justifyContent: 'center', textAlign: 'center'}}>
                    <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' , gap:'5px',marginBottom:'5px'}}>
                        <div className="gridImage" onClick={() => handleImageClick(0)}><img src={sample1} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(1)}><img src={sample2} alt="Sample 4" style={{ width: '100%', height: 'auto' }}/></div>
                      </div>
                      <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap:'5px' }}>
                        <div className="gridImage" onClick={() => handleImageClick(2)}><img src={sample3} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(3)}><img src={sample4} alt="Sample 4" style={{  width: '100%', height: 'auto' }}/></div>
                      </div>
                    </div>

                    <div style={{marginTop:'10px'}}>
                    <div className="relative inline-block">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-block text-sm font-semibold py-2 px-4 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Upload file
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    </div>

                </div>
                <div>
                <h4 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Quantization Factor:</h4>
                    <input
                        type="text"
                        value={qfactor}
                        onChange={(e) => setQfactor(Number(e.target.value))}
                        placeholder="Enter std threshold"
                        style={{ marginBottom: '10px', padding: '5px', border: '1px solid #1D2A6D', borderRadius: '4px' }}
                    />
                </div>
               
               
              </Box>
            </Box>
            </div>
          </div>

          <div class="flex-item-right">
          <div class="content">
            <h2 style={{margin:'5px 0px'}}>Lossy Huffman Encoding</h2>
            <h4 style={{margin:'15px 0px',color:'#444444'}}>In this experiment we are going to check how Lossy Huffman Encoding works and how Quantization Factor affects it.</h4>
            </div>
            <div class="input_output" style={{height:'70%'}}>
            <div id="sampling_area">
              <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2, marginRight: '5%' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                  <h4 style={{margin:'5px 0px'}}>Input Image</h4>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img id="inputImage" src={images[selectedImage]} alt="Input Image"/>
                </Box>
              </Box>
              <Box sx={{ width: 'auto', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                  <h4 style={{margin:'5px 0px'}}>{huffText}</h4>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <canvas id="outputCanvas"></canvas>
                {hresult && <><h3 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Compression ratio: {hresult['compressionRatio']}</h3></>}
                </Box>
              </Box>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'row',justifyContent:'space-evenly',flexWrap: 'wrap',alignContent: 'center'}}>
               <Button ref={myProcess2Button} class="tool_btn" onClick={lossyHuffmanEncode} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                                 Process
                      <svg class="icon" viewBox="0 0 30 30" fill="currentColor">
                        <path d="M 19.664062 0 C 19.423063 0 19.217828 0.17120313 19.173828 0.40820312 L 18.953125 1.5839844 C 18.896125 1.8889844 18.654609 2.1166875 18.349609 2.1796875 C 18.065609 2.2386875 17.785672 2.3123906 17.513672 2.4003906 C 17.218672 2.4963906 16.897313 2.4205469 16.695312 2.1855469 L 15.919922 1.2792969 C 15.762922 1.0962969 15.498062 1.0528281 15.289062 1.1738281 L 14.710938 1.5078125 C 14.502937 1.6278125 14.408281 1.8804219 14.488281 2.1074219 L 14.884766 3.234375 C 14.987766 3.526375 14.893109 3.8437813 14.662109 4.0507812 C 14.447109 4.2437812 14.243781 4.4471094 14.050781 4.6621094 C 13.843781 4.8931094 13.526375 4.9897187 13.234375 4.8867188 L 12.105469 4.4882812 C 11.878469 4.4082812 11.627813 4.5019375 11.507812 4.7109375 L 11.171875 5.2910156 C 11.051875 5.4990156 11.097297 5.764875 11.279297 5.921875 L 11.376953 6.0058594 C 12.559953 6.0258594 13.572016 6.8720625 13.791016 8.0390625 L 13.851562 8.3574219 L 14.060547 8.1113281 C 14.519547 7.5773281 15.162172 7.2869531 15.826172 7.2519531 C 16.722172 5.8969531 18.255 5 20 5 C 22.761 5 25 7.239 25 10 C 25 11.745 24.103047 13.277875 22.748047 14.171875 C 22.713047 14.835875 22.422672 15.4795 21.888672 15.9375 L 21.642578 16.146484 L 21.960938 16.207031 C 23.127938 16.426031 23.974141 17.438094 23.994141 18.621094 L 24.078125 18.71875 C 24.235125 18.90175 24.499984 18.947172 24.708984 18.826172 L 25.289062 18.490234 C 25.497062 18.370234 25.591719 18.119578 25.511719 17.892578 L 25.113281 16.763672 C 25.010281 16.471672 25.106891 16.154266 25.337891 15.947266 C 25.552891 15.754266 25.756219 15.550938 25.949219 15.335938 C 26.156219 15.104938 26.473625 15.010281 26.765625 15.113281 L 27.892578 15.509766 C 28.119578 15.589766 28.372187 15.496109 28.492188 15.287109 L 28.826172 14.707031 C 28.946172 14.499031 28.902703 14.235125 28.720703 14.078125 L 27.814453 13.300781 C 27.579453 13.098781 27.503609 12.777422 27.599609 12.482422 C 27.687609 12.210422 27.761312 11.932438 27.820312 11.648438 C 27.883312 11.344437 28.111016 11.102922 28.416016 11.044922 L 29.591797 10.822266 C 29.828797 10.781266 30 10.576938 30 10.335938 L 30 9.6640625 C 30 9.4230625 29.828797 9.2178281 29.591797 9.1738281 L 28.416016 8.953125 C 28.111016 8.896125 27.883312 8.6546094 27.820312 8.3496094 C 27.761312 8.0656094 27.687609 7.7856719 27.599609 7.5136719 C 27.503609 7.2186719 27.579453 6.8973125 27.814453 6.6953125 L 28.720703 5.9199219 C 28.903703 5.7629219 28.947172 5.4980625 28.826172 5.2890625 L 28.492188 4.7109375 C 28.372187 4.5029375 28.119578 4.4082812 27.892578 4.4882812 L 26.765625 4.8847656 C 26.473625 4.9877656 26.156219 4.8931094 25.949219 4.6621094 C 25.756219 4.4471094 25.552891 4.2437813 25.337891 4.0507812 C 25.106891 3.8437813 25.010281 3.526375 25.113281 3.234375 L 25.511719 2.1054688 C 25.591719 1.8784687 25.498063 1.6278125 25.289062 1.5078125 L 24.708984 1.171875 C 24.500984 1.051875 24.235125 1.0972969 24.078125 1.2792969 L 23.302734 2.1855469 C 23.100734 2.4205469 22.779375 2.4963906 22.484375 2.4003906 C 22.212375 2.3123906 21.932438 2.2386875 21.648438 2.1796875 C 21.344438 2.1166875 21.102922 1.8870312 21.044922 1.5820312 L 20.824219 0.40625 C 20.782219 0.17025 20.576937 0 20.335938 0 L 19.664062 0 z M 10.664062 8 C 10.423063 8 10.217828 8.17025 10.173828 8.40625 L 9.9882812 9.3945312 C 9.9112813 9.8055313 9.5838281 10.108406 9.1738281 10.191406 C 8.8328281 10.260406 8.497875 10.348078 8.171875 10.455078 C 7.775875 10.585078 7.3413125 10.487875 7.0703125 10.171875 L 6.4199219 9.4121094 C 6.2629219 9.2301094 5.9970625 9.1866406 5.7890625 9.3066406 L 5.2109375 9.640625 C 5.0019375 9.760625 4.9082812 10.013234 4.9882812 10.240234 L 5.3242188 11.191406 C 5.4622188 11.585406 5.3305312 12.009109 5.0195312 12.287109 C 4.7625312 12.517109 4.5180625 12.760578 4.2890625 13.017578 C 4.0110625 13.328578 3.5873594 13.460266 3.1933594 13.322266 L 2.2402344 12.988281 C 2.0132344 12.908281 1.7625781 13.002937 1.6425781 13.210938 L 1.3066406 13.789062 C 1.1856406 13.998062 1.2310625 14.262922 1.4140625 14.419922 L 2.1738281 15.070312 C 2.4898281 15.341313 2.5870312 15.775875 2.4570312 16.171875 C 2.3500312 16.497875 2.2623594 16.832828 2.1933594 17.173828 C 2.1103594 17.583828 1.8074844 17.911281 1.3964844 17.988281 L 0.40820312 18.173828 C 0.17120313 18.217828 0 18.423063 0 18.664062 L 0 19.335938 C 0 19.576937 0.17025 19.782172 0.40625 19.826172 L 1.3945312 20.011719 C 1.8055312 20.088719 2.1084062 20.416172 2.1914062 20.826172 C 2.2604063 21.168172 2.3480781 21.502125 2.4550781 21.828125 C 2.5850781 22.224125 2.487875 22.658687 2.171875 22.929688 L 1.4121094 23.580078 C 1.2301094 23.737078 1.1866406 24.002938 1.3066406 24.210938 L 1.640625 24.789062 C 1.760625 24.998062 2.0132344 25.091719 2.2402344 25.011719 L 3.1914062 24.675781 C 3.5854063 24.537781 4.0091094 24.669469 4.2871094 24.980469 C 4.5171094 25.237469 4.7605781 25.481938 5.0175781 25.710938 C 5.3285781 25.988937 5.4602656 26.412641 5.3222656 26.806641 L 4.9882812 27.759766 C 4.9082812 27.986766 5.0029375 28.237422 5.2109375 28.357422 L 5.7890625 28.693359 C 5.9980625 28.814359 6.2629219 28.768937 6.4199219 28.585938 L 7.0703125 27.826172 C 7.3413125 27.510172 7.775875 27.412969 8.171875 27.542969 C 8.497875 27.649969 8.8328281 27.737641 9.1738281 27.806641 C 9.5838281 27.889641 9.9112813 28.192516 9.9882812 28.603516 L 10.173828 29.591797 C 10.217828 29.828797 10.423063 30 10.664062 30 L 11.335938 30 C 11.576938 30 11.782219 29.82875 11.824219 29.59375 L 12.009766 28.605469 C 12.086766 28.194469 12.414219 27.891594 12.824219 27.808594 C 13.166219 27.739594 13.500172 27.651922 13.826172 27.544922 C 14.222172 27.414922 14.656734 27.512125 14.927734 27.828125 L 15.578125 28.587891 C 15.735125 28.769891 15.999031 28.815313 16.207031 28.695312 L 16.787109 28.359375 C 16.996109 28.239375 17.089766 27.988719 17.009766 27.761719 L 16.675781 26.808594 C 16.537781 26.414594 16.669469 25.990891 16.980469 25.712891 C 17.237469 25.482891 17.481938 25.239422 17.710938 24.982422 C 17.988937 24.671422 18.413641 24.539734 18.806641 24.677734 L 19.759766 25.011719 C 19.986766 25.091719 20.237422 24.997062 20.357422 24.789062 L 20.693359 24.210938 C 20.814359 24.001937 20.768937 23.737078 20.585938 23.580078 L 19.826172 22.929688 C 19.510172 22.658688 19.412969 22.224125 19.542969 21.828125 C 19.649969 21.502125 19.737641 21.167172 19.806641 20.826172 C 19.889641 20.416172 20.192516 20.088719 20.603516 20.011719 L 21.591797 19.826172 C 21.828797 19.782172 22 19.576937 22 19.335938 L 22 18.664062 C 22 18.423063 21.82875 18.218781 21.59375 18.175781 L 20.605469 17.990234 C 20.194469 17.913234 19.891594 17.583828 19.808594 17.173828 C 19.739594 16.832828 19.651922 16.497875 19.544922 16.171875 C 19.414922 15.775875 19.512125 15.343266 19.828125 15.072266 L 20.587891 14.421875 C 20.769891 14.264875 20.815313 13.999016 20.695312 13.791016 L 20.359375 13.210938 C 20.239375 13.001937 19.988719 12.908281 19.761719 12.988281 L 18.808594 13.324219 C 18.414594 13.462219 17.990891 13.330531 17.712891 13.019531 C 17.482891 12.762531 17.239422 12.518062 16.982422 12.289062 C 16.671422 12.011063 16.539734 11.587359 16.677734 11.193359 L 17.011719 10.240234 C 17.091719 10.013234 16.997062 9.7625781 16.789062 9.6425781 L 16.210938 9.3066406 C 16.001938 9.1856406 15.737078 9.2310625 15.580078 9.4140625 L 14.929688 10.173828 C 14.658687 10.489828 14.224125 10.587031 13.828125 10.457031 C 13.502125 10.350031 13.167172 10.262359 12.826172 10.193359 C 12.416172 10.110359 12.088719 9.8074844 12.011719 9.3964844 L 11.826172 8.4082031 C 11.782172 8.1712031 11.576937 8 11.335938 8 L 10.664062 8 z M 20 9 A 1 1 0 0 0 19 10 A 1 1 0 0 0 20 11 A 1 1 0 0 0 21 10 A 1 1 0 0 0 20 9 z M 11 13 C 14.314 13 17 15.686 17 19 C 17 22.314 14.314 25 11 25 C 7.686 25 5 22.314 5 19 C 5 15.686 7.686 13 11 13 z M 11 17 C 9.895 17 9 17.895 9 19 C 9 20.105 9.895 21 11 21 C 12.105 21 13 20.105 13 19 C 13 17.895 12.105 17 11 17 z"></path>
                    </svg>
                </Button>
                 
                <Button class="tool_btn" onClick={exp2} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Concept
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" width="24px" height="24px" viewBox="0 0 24 24">
                    <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.002 14H4z"/>
                    <path d="M6 7h12v2H6zm0 4h12v2H6zm0 4h6v2H6z"/>
                  </svg>
                  
                  </Button>

                <Button class="tool_btn" onClick={handlePrint} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Print
                  <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h2zm2-3h8V5H8v3zM4 10v8h16V10H4zm8 10h-2v2h2v-2z"/>
                  </svg>

                  </Button>
          </div>
            {/* ToastContainer must be placed somewhere in the component tree */}
            <ToastContainer />
              {/* Explanation Modal */}
              <Dialog
                
                open={openHuffmanModal}
                onClose={handleClose3Modal}
                aria-labelledby="explanation-dialog-title"
                aria-describedby="explanation-dialog-description"
                PaperProps={{
                  id:"explanation-dialog",
                }}
              >
                <DialogTitle id="instructions-dialog-title" >
                  <div style={{width:'50%'}}>Huffman Concept</div>
                  <div style={{width:'50%',justifyContent:'flex-end',display:'flex'}}>
                  <Button onClick={handleClose3Modal} color="primary" style={{backgroundColor:'beige',width: 'fit-content',height: 'fit-content'}}>
                    Close
                  </Button>
                  </div>
                </DialogTitle>

                <DialogContent sx={{ padding: '0px',height:'1200px',overflow:'clip' }}>
                {openHuffmanModal && <HuffmanAnimation />}
                  {/* {HuffmanAnimation()} */}
                </DialogContent>

              </Dialog>

          </div>
          </div>
        </TabPanel>

        <TabPanel tabValue={tabValue} index={2}>
        <div class="flex-container">
        <div class="flex-item-left">
        <div id="left_bar">
            <Box sx={{ width: '100%', height: '80%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
              <Box className="headleftbar" sx={{alignItems: 'center', borderBottom: 1, borderTopRightRadius:8,borderTopLeftRadius:8,borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', height: '50px', display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <h4 style={{margin:'5px 0px'}}>Sine/Cosine Compression Tools</h4>
              </Box>
              <Box  sx={{ p: 2 ,display: 'flex', flexDirection: 'column', gap: 2, alignContent: 'center', justifyContent: 'center', textAlign: 'center',overflowY:'scroll','&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#555', borderRadius: 2 }}}>
              
              <div class="contentog">
                <h4 style={{margin:'5px 0px',textAlign:'left',color:'#444444' }}>Choose an Image:</h4>
                    
                    <div className="image-grid" sx={{width: '100%',position: 'relative', alignContent: 'center', justifyContent: 'center', textAlign: 'center'}}>
                    <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,gap:'5px' ,marginBottom:'5px'}}>
                        <div className="gridImage" onClick={() => handleImageClick(0)}><img src={sample1} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(1)}><img src={sample2} alt="Sample 4" style={{ width: '100%', height: 'auto' }}/></div>
                      </div>
                      <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,gap:'5px' }}>
                        <div className="gridImage" onClick={() => handleImageClick(2)}><img src={sample3} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(3)}><img src={sample4} alt="Sample 4" style={{  width: '100%', height: 'auto' }}/></div>
                      </div>
                    </div>
                    <div style={{marginTop:'10px'}}>

                      <div className="relative inline-block">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-block text-sm font-semibold py-2 px-4 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Upload file
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    </div>
                </div>
                <div>
              
                <div>
                <h4 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Function Selected: <span style={{ color:'#FF2929'}}>{sineBased?"Sine":"Cosine"}</span></h4>
                  
                    <Select
                        value={sineBased}
                        onChange={(e) => setSineBased(e.target.value)}
                        sx={{ marginBottom: '10px', border: '1px solid #1D2A6D', borderRadius: '4px',
                          '& .MuiSelect-icon': { // Caret (dropdown icon) color
                    color: '#1D2A6D',
                    },
                    '& .MuiSelect-select': { // Remove padding inside the Select (input box)
                    paddingTop: 1,paddingBottom:1,color:'#1D2A6D'
                  },

                         }}
                    >
                        <MenuItem key={"Sine"} value={true}>Sine</MenuItem>
                        <MenuItem key={"Cosine"} value={false}>Cosine</MenuItem>
                    </Select>
                    <h4 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Quantization Factor:</h4>
                    <input
                        type="text"
                        value={qfactor}
                        onChange={(e) => setQfactor(e.target.value)}
                        placeholder="e.g., 20,20,20,0"
                        style={{ padding: '5px', border: '1px solid #1D2A6D', borderRadius: '4px' }}
                    />
                </div>
                </div>
              </Box>
            </Box>
          </div>
          </div>
          

          <div class="flex-item-right">
          <div class="content">
            <h2 style={{margin:'5px 0px'}}>Sine and Cosine Based Compression</h2>
            <h4 style={{margin:'15px 0px',color:'#444444'}}>In this experiment we are going to check how Sine and Cosine Based Compression works.</h4>
          </div>

          <div class="input_output">
            <div id="sampling_area">
              <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2, marginRight: '5%' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                <h4 style={{margin:'5px 0px'}}>Input Image</h4>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img id="inputImage" src={images[selectedImage]} alt="Input Image"/>
                </Box>
              </Box>
              <Box sx={{ width: 'auto', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                  <h4 style={{margin:'5px 0px'}}>{sineText}</h4>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <canvas id="outputCanvas"></canvas>
                {scResult&&<><h3 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Compression ratio: {scResult['compressionRatio']}</h3></>}
                </Box>
              </Box>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'row',justifyContent:'space-evenly',flexWrap: 'wrap',alignContent: 'center'}}>
                <Button ref={myProcess3Button} class="tool_btn" onClick={sinecosine} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Process
                  <svg class="icon" viewBox="0 0 30 30" fill="currentColor">
                    <path d="M 19.664062 0 C 19.423063 0 19.217828 0.17120313 19.173828 0.40820312 L 18.953125 1.5839844 C 18.896125 1.8889844 18.654609 2.1166875 18.349609 2.1796875 C 18.065609 2.2386875 17.785672 2.3123906 17.513672 2.4003906 C 17.218672 2.4963906 16.897313 2.4205469 16.695312 2.1855469 L 15.919922 1.2792969 C 15.762922 1.0962969 15.498062 1.0528281 15.289062 1.1738281 L 14.710938 1.5078125 C 14.502937 1.6278125 14.408281 1.8804219 14.488281 2.1074219 L 14.884766 3.234375 C 14.987766 3.526375 14.893109 3.8437813 14.662109 4.0507812 C 14.447109 4.2437812 14.243781 4.4471094 14.050781 4.6621094 C 13.843781 4.8931094 13.526375 4.9897187 13.234375 4.8867188 L 12.105469 4.4882812 C 11.878469 4.4082812 11.627813 4.5019375 11.507812 4.7109375 L 11.171875 5.2910156 C 11.051875 5.4990156 11.097297 5.764875 11.279297 5.921875 L 11.376953 6.0058594 C 12.559953 6.0258594 13.572016 6.8720625 13.791016 8.0390625 L 13.851562 8.3574219 L 14.060547 8.1113281 C 14.519547 7.5773281 15.162172 7.2869531 15.826172 7.2519531 C 16.722172 5.8969531 18.255 5 20 5 C 22.761 5 25 7.239 25 10 C 25 11.745 24.103047 13.277875 22.748047 14.171875 C 22.713047 14.835875 22.422672 15.4795 21.888672 15.9375 L 21.642578 16.146484 L 21.960938 16.207031 C 23.127938 16.426031 23.974141 17.438094 23.994141 18.621094 L 24.078125 18.71875 C 24.235125 18.90175 24.499984 18.947172 24.708984 18.826172 L 25.289062 18.490234 C 25.497062 18.370234 25.591719 18.119578 25.511719 17.892578 L 25.113281 16.763672 C 25.010281 16.471672 25.106891 16.154266 25.337891 15.947266 C 25.552891 15.754266 25.756219 15.550938 25.949219 15.335938 C 26.156219 15.104938 26.473625 15.010281 26.765625 15.113281 L 27.892578 15.509766 C 28.119578 15.589766 28.372187 15.496109 28.492188 15.287109 L 28.826172 14.707031 C 28.946172 14.499031 28.902703 14.235125 28.720703 14.078125 L 27.814453 13.300781 C 27.579453 13.098781 27.503609 12.777422 27.599609 12.482422 C 27.687609 12.210422 27.761312 11.932438 27.820312 11.648438 C 27.883312 11.344437 28.111016 11.102922 28.416016 11.044922 L 29.591797 10.822266 C 29.828797 10.781266 30 10.576938 30 10.335938 L 30 9.6640625 C 30 9.4230625 29.828797 9.2178281 29.591797 9.1738281 L 28.416016 8.953125 C 28.111016 8.896125 27.883312 8.6546094 27.820312 8.3496094 C 27.761312 8.0656094 27.687609 7.7856719 27.599609 7.5136719 C 27.503609 7.2186719 27.579453 6.8973125 27.814453 6.6953125 L 28.720703 5.9199219 C 28.903703 5.7629219 28.947172 5.4980625 28.826172 5.2890625 L 28.492188 4.7109375 C 28.372187 4.5029375 28.119578 4.4082812 27.892578 4.4882812 L 26.765625 4.8847656 C 26.473625 4.9877656 26.156219 4.8931094 25.949219 4.6621094 C 25.756219 4.4471094 25.552891 4.2437813 25.337891 4.0507812 C 25.106891 3.8437813 25.010281 3.526375 25.113281 3.234375 L 25.511719 2.1054688 C 25.591719 1.8784687 25.498063 1.6278125 25.289062 1.5078125 L 24.708984 1.171875 C 24.500984 1.051875 24.235125 1.0972969 24.078125 1.2792969 L 23.302734 2.1855469 C 23.100734 2.4205469 22.779375 2.4963906 22.484375 2.4003906 C 22.212375 2.3123906 21.932438 2.2386875 21.648438 2.1796875 C 21.344438 2.1166875 21.102922 1.8870312 21.044922 1.5820312 L 20.824219 0.40625 C 20.782219 0.17025 20.576937 0 20.335938 0 L 19.664062 0 z M 10.664062 8 C 10.423063 8 10.217828 8.17025 10.173828 8.40625 L 9.9882812 9.3945312 C 9.9112813 9.8055313 9.5838281 10.108406 9.1738281 10.191406 C 8.8328281 10.260406 8.497875 10.348078 8.171875 10.455078 C 7.775875 10.585078 7.3413125 10.487875 7.0703125 10.171875 L 6.4199219 9.4121094 C 6.2629219 9.2301094 5.9970625 9.1866406 5.7890625 9.3066406 L 5.2109375 9.640625 C 5.0019375 9.760625 4.9082812 10.013234 4.9882812 10.240234 L 5.3242188 11.191406 C 5.4622188 11.585406 5.3305312 12.009109 5.0195312 12.287109 C 4.7625312 12.517109 4.5180625 12.760578 4.2890625 13.017578 C 4.0110625 13.328578 3.5873594 13.460266 3.1933594 13.322266 L 2.2402344 12.988281 C 2.0132344 12.908281 1.7625781 13.002937 1.6425781 13.210938 L 1.3066406 13.789062 C 1.1856406 13.998062 1.2310625 14.262922 1.4140625 14.419922 L 2.1738281 15.070312 C 2.4898281 15.341313 2.5870312 15.775875 2.4570312 16.171875 C 2.3500312 16.497875 2.2623594 16.832828 2.1933594 17.173828 C 2.1103594 17.583828 1.8074844 17.911281 1.3964844 17.988281 L 0.40820312 18.173828 C 0.17120313 18.217828 0 18.423063 0 18.664062 L 0 19.335938 C 0 19.576937 0.17025 19.782172 0.40625 19.826172 L 1.3945312 20.011719 C 1.8055312 20.088719 2.1084062 20.416172 2.1914062 20.826172 C 2.2604063 21.168172 2.3480781 21.502125 2.4550781 21.828125 C 2.5850781 22.224125 2.487875 22.658687 2.171875 22.929688 L 1.4121094 23.580078 C 1.2301094 23.737078 1.1866406 24.002938 1.3066406 24.210938 L 1.640625 24.789062 C 1.760625 24.998062 2.0132344 25.091719 2.2402344 25.011719 L 3.1914062 24.675781 C 3.5854063 24.537781 4.0091094 24.669469 4.2871094 24.980469 C 4.5171094 25.237469 4.7605781 25.481938 5.0175781 25.710938 C 5.3285781 25.988937 5.4602656 26.412641 5.3222656 26.806641 L 4.9882812 27.759766 C 4.9082812 27.986766 5.0029375 28.237422 5.2109375 28.357422 L 5.7890625 28.693359 C 5.9980625 28.814359 6.2629219 28.768937 6.4199219 28.585938 L 7.0703125 27.826172 C 7.3413125 27.510172 7.775875 27.412969 8.171875 27.542969 C 8.497875 27.649969 8.8328281 27.737641 9.1738281 27.806641 C 9.5838281 27.889641 9.9112813 28.192516 9.9882812 28.603516 L 10.173828 29.591797 C 10.217828 29.828797 10.423063 30 10.664062 30 L 11.335938 30 C 11.576938 30 11.782219 29.82875 11.824219 29.59375 L 12.009766 28.605469 C 12.086766 28.194469 12.414219 27.891594 12.824219 27.808594 C 13.166219 27.739594 13.500172 27.651922 13.826172 27.544922 C 14.222172 27.414922 14.656734 27.512125 14.927734 27.828125 L 15.578125 28.587891 C 15.735125 28.769891 15.999031 28.815313 16.207031 28.695312 L 16.787109 28.359375 C 16.996109 28.239375 17.089766 27.988719 17.009766 27.761719 L 16.675781 26.808594 C 16.537781 26.414594 16.669469 25.990891 16.980469 25.712891 C 17.237469 25.482891 17.481938 25.239422 17.710938 24.982422 C 17.988937 24.671422 18.413641 24.539734 18.806641 24.677734 L 19.759766 25.011719 C 19.986766 25.091719 20.237422 24.997062 20.357422 24.789062 L 20.693359 24.210938 C 20.814359 24.001937 20.768937 23.737078 20.585938 23.580078 L 19.826172 22.929688 C 19.510172 22.658688 19.412969 22.224125 19.542969 21.828125 C 19.649969 21.502125 19.737641 21.167172 19.806641 20.826172 C 19.889641 20.416172 20.192516 20.088719 20.603516 20.011719 L 21.591797 19.826172 C 21.828797 19.782172 22 19.576937 22 19.335938 L 22 18.664062 C 22 18.423063 21.82875 18.218781 21.59375 18.175781 L 20.605469 17.990234 C 20.194469 17.913234 19.891594 17.583828 19.808594 17.173828 C 19.739594 16.832828 19.651922 16.497875 19.544922 16.171875 C 19.414922 15.775875 19.512125 15.343266 19.828125 15.072266 L 20.587891 14.421875 C 20.769891 14.264875 20.815313 13.999016 20.695312 13.791016 L 20.359375 13.210938 C 20.239375 13.001937 19.988719 12.908281 19.761719 12.988281 L 18.808594 13.324219 C 18.414594 13.462219 17.990891 13.330531 17.712891 13.019531 C 17.482891 12.762531 17.239422 12.518062 16.982422 12.289062 C 16.671422 12.011063 16.539734 11.587359 16.677734 11.193359 L 17.011719 10.240234 C 17.091719 10.013234 16.997062 9.7625781 16.789062 9.6425781 L 16.210938 9.3066406 C 16.001938 9.1856406 15.737078 9.2310625 15.580078 9.4140625 L 14.929688 10.173828 C 14.658687 10.489828 14.224125 10.587031 13.828125 10.457031 C 13.502125 10.350031 13.167172 10.262359 12.826172 10.193359 C 12.416172 10.110359 12.088719 9.8074844 12.011719 9.3964844 L 11.826172 8.4082031 C 11.782172 8.1712031 11.576937 8 11.335938 8 L 10.664062 8 z M 20 9 A 1 1 0 0 0 19 10 A 1 1 0 0 0 20 11 A 1 1 0 0 0 21 10 A 1 1 0 0 0 20 9 z M 11 13 C 14.314 13 17 15.686 17 19 C 17 22.314 14.314 25 11 25 C 7.686 25 5 22.314 5 19 C 5 15.686 7.686 13 11 13 z M 11 17 C 9.895 17 9 17.895 9 19 C 9 20.105 9.895 21 11 21 C 12.105 21 13 20.105 13 19 C 13 17.895 12.105 17 11 17 z"></path>
                </svg>
                  </Button>
                 

                <Button class="tool_btn" onClick={handlePrint} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Print
                  <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h2zm2-3h8V5H8v3zM4 10v8h16V10H4zm8 10h-2v2h2v-2z"/>
                  </svg>
                </Button>
             
              </div>



          </div>
          </div>
        </TabPanel>

        <TabPanel tabValue={tabValue} index={3}>
        <div class="flex-container">
        <div class="flex-item-left">
        <div id="left_bar">
            <Box sx={{ width: '100%', height: '80%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
              <Box className="headleftbar" sx={{alignItems: 'center', borderBottom: 1, borderTopRightRadius:8,borderTopLeftRadius:8,borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', height: '50px', display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <h4 style={{margin:'5px 0px'}}>JPEG Compression Tools</h4>
              </Box>
              <Box  sx={{ p: 2 ,display: 'flex', flexDirection: 'column', gap: 2, alignContent: 'center', justifyContent: 'center', textAlign: 'center',overflowY:'scroll','&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#555', borderRadius: 2 }}}>
              <div class="contentog">

                <h4 style={{margin:'5px 0px',textAlign:'left',color:'#444444' }}>Choose an Image:</h4>
                    
                    <div className="image-grid" sx={{width: '100%',position: 'relative', alignContent: 'center', justifyContent: 'center', textAlign: 'center'}}>
                    <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,gap:'5px',marginBottom:'5px' }}>
                        <div className="gridImage" onClick={() => handleImageClick(0)}><img src={sample1} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(1)}><img src={sample2} alt="Sample 4" style={{ width: '100%', height: 'auto' }}/></div>
                      </div>
                      <div id="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' ,gap:'5px' }}>
                        <div className="gridImage" onClick={() => handleImageClick(2)}><img src={sample3} alt="Sample 3" style={{ width: '100%', height: 'auto' }}/></div>
                        <div className="gridImage" onClick={() => handleImageClick(3)}><img src={sample4} alt="Sample 4" style={{  width: '100%', height: 'auto' }}/></div>
                      </div>
                    </div>
                    <div style={{marginTop:'10px'}}>
    

                      <div className="relative inline-block">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-block text-sm font-semibold py-2 px-4 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Upload file
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    </div>
                </div>
                <div>
              
                <div>
                    <h4 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Quality Factor:</h4>
                    <input
                        type="text"
                        value={qfactor}
                        onChange={(e) => setQfactor(e.target.value)}
                        placeholder="e.g: 0-100"
                        style={{ padding: '5px', border: '1px solid #1D2A6D', borderRadius: '4px' }}
                    />
                </div>
                
                </div>
              </Box>
            </Box>
          </div>
          </div>
          

          <div class="flex-item-right">
          <div class="content">
            <h2 style={{margin:'5px 0px'}}>JPEG Compression</h2>
            <h4 style={{margin:'15px 0px',color:'#444444'}}>In this experiment we are going to check how JPEG Compression works.</h4>
          </div>

          <div class="input_output">
            <div id="sampling_area">
              <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2, marginRight: '5%' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                <h4 style={{margin:'5px 0px'}}>Input Image</h4>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img id="inputImage" src={images[selectedImage]} alt="Input Image"/>
                </Box>
              </Box>
              <Box sx={{ width: 'auto', height: '100%', display: 'flex', flexDirection: 'column', border: 1, borderRadius: 2 }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: '#1D2A6D', color: '#fff5ee', display: 'flex', height: '10px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius:8,borderTopRightRadius:8 }}>
                  <h4 style={{margin:'5px 0px'}}>{jpegText}</h4>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <canvas id="outputCanvas"></canvas>
                {jpegResult&&<><h3 style={{margin:'5px 0px',textAlign: 'left',color:'#444444'}}>Compression ratio: {jpegResult['compressionRatio']}</h3></>}
                </Box>
              </Box>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'row',justifyContent:'space-evenly',flexWrap: 'wrap',alignContent: 'center'}}>
                <Button ref={myProcess4Button} class="tool_btn" onClick={jpegCompression} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Process
                  <svg class="icon" viewBox="0 0 30 30" fill="currentColor">
                    <path d="M 19.664062 0 C 19.423063 0 19.217828 0.17120313 19.173828 0.40820312 L 18.953125 1.5839844 C 18.896125 1.8889844 18.654609 2.1166875 18.349609 2.1796875 C 18.065609 2.2386875 17.785672 2.3123906 17.513672 2.4003906 C 17.218672 2.4963906 16.897313 2.4205469 16.695312 2.1855469 L 15.919922 1.2792969 C 15.762922 1.0962969 15.498062 1.0528281 15.289062 1.1738281 L 14.710938 1.5078125 C 14.502937 1.6278125 14.408281 1.8804219 14.488281 2.1074219 L 14.884766 3.234375 C 14.987766 3.526375 14.893109 3.8437813 14.662109 4.0507812 C 14.447109 4.2437812 14.243781 4.4471094 14.050781 4.6621094 C 13.843781 4.8931094 13.526375 4.9897187 13.234375 4.8867188 L 12.105469 4.4882812 C 11.878469 4.4082812 11.627813 4.5019375 11.507812 4.7109375 L 11.171875 5.2910156 C 11.051875 5.4990156 11.097297 5.764875 11.279297 5.921875 L 11.376953 6.0058594 C 12.559953 6.0258594 13.572016 6.8720625 13.791016 8.0390625 L 13.851562 8.3574219 L 14.060547 8.1113281 C 14.519547 7.5773281 15.162172 7.2869531 15.826172 7.2519531 C 16.722172 5.8969531 18.255 5 20 5 C 22.761 5 25 7.239 25 10 C 25 11.745 24.103047 13.277875 22.748047 14.171875 C 22.713047 14.835875 22.422672 15.4795 21.888672 15.9375 L 21.642578 16.146484 L 21.960938 16.207031 C 23.127938 16.426031 23.974141 17.438094 23.994141 18.621094 L 24.078125 18.71875 C 24.235125 18.90175 24.499984 18.947172 24.708984 18.826172 L 25.289062 18.490234 C 25.497062 18.370234 25.591719 18.119578 25.511719 17.892578 L 25.113281 16.763672 C 25.010281 16.471672 25.106891 16.154266 25.337891 15.947266 C 25.552891 15.754266 25.756219 15.550938 25.949219 15.335938 C 26.156219 15.104938 26.473625 15.010281 26.765625 15.113281 L 27.892578 15.509766 C 28.119578 15.589766 28.372187 15.496109 28.492188 15.287109 L 28.826172 14.707031 C 28.946172 14.499031 28.902703 14.235125 28.720703 14.078125 L 27.814453 13.300781 C 27.579453 13.098781 27.503609 12.777422 27.599609 12.482422 C 27.687609 12.210422 27.761312 11.932438 27.820312 11.648438 C 27.883312 11.344437 28.111016 11.102922 28.416016 11.044922 L 29.591797 10.822266 C 29.828797 10.781266 30 10.576938 30 10.335938 L 30 9.6640625 C 30 9.4230625 29.828797 9.2178281 29.591797 9.1738281 L 28.416016 8.953125 C 28.111016 8.896125 27.883312 8.6546094 27.820312 8.3496094 C 27.761312 8.0656094 27.687609 7.7856719 27.599609 7.5136719 C 27.503609 7.2186719 27.579453 6.8973125 27.814453 6.6953125 L 28.720703 5.9199219 C 28.903703 5.7629219 28.947172 5.4980625 28.826172 5.2890625 L 28.492188 4.7109375 C 28.372187 4.5029375 28.119578 4.4082812 27.892578 4.4882812 L 26.765625 4.8847656 C 26.473625 4.9877656 26.156219 4.8931094 25.949219 4.6621094 C 25.756219 4.4471094 25.552891 4.2437813 25.337891 4.0507812 C 25.106891 3.8437813 25.010281 3.526375 25.113281 3.234375 L 25.511719 2.1054688 C 25.591719 1.8784687 25.498063 1.6278125 25.289062 1.5078125 L 24.708984 1.171875 C 24.500984 1.051875 24.235125 1.0972969 24.078125 1.2792969 L 23.302734 2.1855469 C 23.100734 2.4205469 22.779375 2.4963906 22.484375 2.4003906 C 22.212375 2.3123906 21.932438 2.2386875 21.648438 2.1796875 C 21.344438 2.1166875 21.102922 1.8870312 21.044922 1.5820312 L 20.824219 0.40625 C 20.782219 0.17025 20.576937 0 20.335938 0 L 19.664062 0 z M 10.664062 8 C 10.423063 8 10.217828 8.17025 10.173828 8.40625 L 9.9882812 9.3945312 C 9.9112813 9.8055313 9.5838281 10.108406 9.1738281 10.191406 C 8.8328281 10.260406 8.497875 10.348078 8.171875 10.455078 C 7.775875 10.585078 7.3413125 10.487875 7.0703125 10.171875 L 6.4199219 9.4121094 C 6.2629219 9.2301094 5.9970625 9.1866406 5.7890625 9.3066406 L 5.2109375 9.640625 C 5.0019375 9.760625 4.9082812 10.013234 4.9882812 10.240234 L 5.3242188 11.191406 C 5.4622188 11.585406 5.3305312 12.009109 5.0195312 12.287109 C 4.7625312 12.517109 4.5180625 12.760578 4.2890625 13.017578 C 4.0110625 13.328578 3.5873594 13.460266 3.1933594 13.322266 L 2.2402344 12.988281 C 2.0132344 12.908281 1.7625781 13.002937 1.6425781 13.210938 L 1.3066406 13.789062 C 1.1856406 13.998062 1.2310625 14.262922 1.4140625 14.419922 L 2.1738281 15.070312 C 2.4898281 15.341313 2.5870312 15.775875 2.4570312 16.171875 C 2.3500312 16.497875 2.2623594 16.832828 2.1933594 17.173828 C 2.1103594 17.583828 1.8074844 17.911281 1.3964844 17.988281 L 0.40820312 18.173828 C 0.17120313 18.217828 0 18.423063 0 18.664062 L 0 19.335938 C 0 19.576937 0.17025 19.782172 0.40625 19.826172 L 1.3945312 20.011719 C 1.8055312 20.088719 2.1084062 20.416172 2.1914062 20.826172 C 2.2604063 21.168172 2.3480781 21.502125 2.4550781 21.828125 C 2.5850781 22.224125 2.487875 22.658687 2.171875 22.929688 L 1.4121094 23.580078 C 1.2301094 23.737078 1.1866406 24.002938 1.3066406 24.210938 L 1.640625 24.789062 C 1.760625 24.998062 2.0132344 25.091719 2.2402344 25.011719 L 3.1914062 24.675781 C 3.5854063 24.537781 4.0091094 24.669469 4.2871094 24.980469 C 4.5171094 25.237469 4.7605781 25.481938 5.0175781 25.710938 C 5.3285781 25.988937 5.4602656 26.412641 5.3222656 26.806641 L 4.9882812 27.759766 C 4.9082812 27.986766 5.0029375 28.237422 5.2109375 28.357422 L 5.7890625 28.693359 C 5.9980625 28.814359 6.2629219 28.768937 6.4199219 28.585938 L 7.0703125 27.826172 C 7.3413125 27.510172 7.775875 27.412969 8.171875 27.542969 C 8.497875 27.649969 8.8328281 27.737641 9.1738281 27.806641 C 9.5838281 27.889641 9.9112813 28.192516 9.9882812 28.603516 L 10.173828 29.591797 C 10.217828 29.828797 10.423063 30 10.664062 30 L 11.335938 30 C 11.576938 30 11.782219 29.82875 11.824219 29.59375 L 12.009766 28.605469 C 12.086766 28.194469 12.414219 27.891594 12.824219 27.808594 C 13.166219 27.739594 13.500172 27.651922 13.826172 27.544922 C 14.222172 27.414922 14.656734 27.512125 14.927734 27.828125 L 15.578125 28.587891 C 15.735125 28.769891 15.999031 28.815313 16.207031 28.695312 L 16.787109 28.359375 C 16.996109 28.239375 17.089766 27.988719 17.009766 27.761719 L 16.675781 26.808594 C 16.537781 26.414594 16.669469 25.990891 16.980469 25.712891 C 17.237469 25.482891 17.481938 25.239422 17.710938 24.982422 C 17.988937 24.671422 18.413641 24.539734 18.806641 24.677734 L 19.759766 25.011719 C 19.986766 25.091719 20.237422 24.997062 20.357422 24.789062 L 20.693359 24.210938 C 20.814359 24.001937 20.768937 23.737078 20.585938 23.580078 L 19.826172 22.929688 C 19.510172 22.658688 19.412969 22.224125 19.542969 21.828125 C 19.649969 21.502125 19.737641 21.167172 19.806641 20.826172 C 19.889641 20.416172 20.192516 20.088719 20.603516 20.011719 L 21.591797 19.826172 C 21.828797 19.782172 22 19.576937 22 19.335938 L 22 18.664062 C 22 18.423063 21.82875 18.218781 21.59375 18.175781 L 20.605469 17.990234 C 20.194469 17.913234 19.891594 17.583828 19.808594 17.173828 C 19.739594 16.832828 19.651922 16.497875 19.544922 16.171875 C 19.414922 15.775875 19.512125 15.343266 19.828125 15.072266 L 20.587891 14.421875 C 20.769891 14.264875 20.815313 13.999016 20.695312 13.791016 L 20.359375 13.210938 C 20.239375 13.001937 19.988719 12.908281 19.761719 12.988281 L 18.808594 13.324219 C 18.414594 13.462219 17.990891 13.330531 17.712891 13.019531 C 17.482891 12.762531 17.239422 12.518062 16.982422 12.289062 C 16.671422 12.011063 16.539734 11.587359 16.677734 11.193359 L 17.011719 10.240234 C 17.091719 10.013234 16.997062 9.7625781 16.789062 9.6425781 L 16.210938 9.3066406 C 16.001938 9.1856406 15.737078 9.2310625 15.580078 9.4140625 L 14.929688 10.173828 C 14.658687 10.489828 14.224125 10.587031 13.828125 10.457031 C 13.502125 10.350031 13.167172 10.262359 12.826172 10.193359 C 12.416172 10.110359 12.088719 9.8074844 12.011719 9.3964844 L 11.826172 8.4082031 C 11.782172 8.1712031 11.576937 8 11.335938 8 L 10.664062 8 z M 20 9 A 1 1 0 0 0 19 10 A 1 1 0 0 0 20 11 A 1 1 0 0 0 21 10 A 1 1 0 0 0 20 9 z M 11 13 C 14.314 13 17 15.686 17 19 C 17 22.314 14.314 25 11 25 C 7.686 25 5 22.314 5 19 C 5 15.686 7.686 13 11 13 z M 11 17 C 9.895 17 9 17.895 9 19 C 9 20.105 9.895 21 11 21 C 12.105 21 13 20.105 13 19 C 13 17.895 12.105 17 11 17 z"></path>
                </svg>
                  </Button>
                
                
                <Button class="tool_btn" onClick={handlePrint} variant='outlined' sx={{borderColor: '#1D2A6D',color: '#1D2A6D'}}>
                  Print
                  <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h2zm2-3h8V5H8v3zM4 10v8h16V10H4zm8 10h-2v2h2v-2z"/>
                  </svg>

                </Button>
             
              </div>
 

          </div>
          </div>
        </TabPanel>

      </div>
      </div>
    </OpenCvProvider>
  )
}

