import { OpenCvProvider } from "opencv-react";
import { useEffect,useRef, useState } from "react";
import '../morph.css'
import divide from '../assets/images/divide_sign.png';
import multiply from '../assets/images/x_sign.png';
import minus from '../assets/images/minus_sign.png';
import plus from '../assets/images/plus_sign.png';
import {Select,Button,MenuItem} from '@mui/material';
import Box from '@mui/material/Box';
import React from 'react';


export default function Morphological(){
    const [image, setImage] = useState(0);
    const [original,setOriginal]=useState(null);
    const [process,setProcess]=useState('dilation');
    const [kernel,setKernel]=useState([[0,1,0],[1,1,1],[0,1,0]]);
    const [isDisabled, setIsDisabled] = React.useState(false);

    const [isPaused, setIsPaused] = useState(false);
    const delayRef = useRef(300);
    const isPausedRef = useRef(false);
    const myPlayButton = useRef(null);
    const myPauseButton = useRef(null);
    const mySpeedUpButton = useRef(null);
    const mySpeedDownButton = useRef(null);

    const isCancelledRef = useRef(false);

    
    useEffect(()=>{handleImage(0)},[])
    useEffect(() => {
            isPausedRef.current = isPaused;
          }, [isPaused]);

    const [imagesDisabled, setImagesDisabled] = useState(false);
    
    function handleImage(x){
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
    
    const [processed, setProcessed] = useState(null);

    function pauseFun()
    {
        setIsPaused(prev => !prev)
    }

    function play()
    {
        if (myPauseButton.current) {
            myPlayButton.current.style.display = 'none';
            myPauseButton.current.style.display = 'block';
        }
        mySpeedUpButton.current.disabled=false
        mySpeedDownButton.current.disabled=false;
        
        setImagesDisabled(true); // images: plus, minus..
        document.getElementById("moving-kernel").style.display='grid';

        isCancelledRef.current = false;

        setIsDisabled(true) // disabled select box
        setImagesDisabled(true); // images: plus, minus..
        
        if (process === 'dilation') dilate();
        else if (process === 'erosion') erode();
        else if (process === 'opening') 
            {
                opening();
                myPlayButton.current.style.display = 'block';
                myPauseButton.current.style.display = 'none';
                myPlayButton.current.disabled=true;
                mySpeedUpButton.current.disabled=true;
                mySpeedDownButton.current.disabled=true;
            }
        else if (process === 'closing') 
            {
                closing();
                myPlayButton.current.style.display = 'block';
                myPauseButton.current.style.display = 'none';
                myPlayButton.current.disabled=true;
                mySpeedUpButton.current.disabled=true;
                mySpeedDownButton.current.disabled=true;
            }
    }

    function handleReset() {
        
        isCancelledRef.current = true; // cancel current loop

        setIsPaused(false);
        delayRef.current = 300; // reset delay to default

        myPauseButton.current.style.display = 'none';
        myPlayButton.current.style.display = 'block';
        myPlayButton.current.disabled=false;
       
        mySpeedUpButton.current.disabled=false
        mySpeedDownButton.current.disabled=false

        setIsDisabled(false) //enabled select box
        setImagesDisabled(false);
        document.getElementById("moving-kernel").style.display='none';
        setProcessed(null); // Clear the processed-grid completely
        setProcess('dilation');
        handleImage(0);
        setCurrentIndex(0)
      }

    async function erode() {

        if (!original || !kernel) return;

        const processed = original.map(row => [...row]); // Deep copy of original
        let countX=0; // for play button

        for (let i = 0; i < original.length; i++) {
            for (let j = 0; j < original[0].length; j++) {

                if (isCancelledRef.current) return; // ❗Exit early if reset

                while (isPausedRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (isCancelledRef.current) return; // ❗Exit early if reset
                  }

                let fits = true;
                for (let ki = 0; ki < kernel.length; ki++) {
                    for (let kj = 0; kj < kernel[0].length; kj++) {
                        const ni = i + ki - Math.floor(kernel.length / 2);
                        const nj = j + kj - Math.floor(kernel[0].length / 2);
                        if (
                            ni >= 0 &&
                            ni < original.length &&
                            nj >= 0 &&
                            nj < original[0].length
                        ) {
                            if (kernel[ki][kj] === 1 && original[ni][nj] === 0) {
                                fits = false;
                            }
                        } else if (kernel[ki][kj] === 1) {
                            fits = false;
                        }
                    }
                }
                processed[i][j] = fits ? 1 : 0;
                setProcessed(processed.map(row => [...row])); // Update processed state

                // Update position of moving-kernel
                const movingKernel = document.getElementById("moving-kernel");
                const img=document.getElementById("processed-img-morph")
                if (movingKernel && img && i<6 && j<6) {
                    const imgRect = img.getBoundingClientRect();
                    const imgTop = Number(imgRect.top.toFixed(0))+(i)*(img.offsetWidth+2);
                    const imgLeft = Number(imgRect.left.toFixed(0))+(j)*(img.offsetHeight+2);
                    // console.log(imgTop,imgLeft)
                    movingKernel.style.top = `${imgTop}px`;
                    movingKernel.style.left = `${imgLeft}px`;
                }

                // await new Promise((resolve) => setTimeout(resolve, 300)); 
                await new Promise(resolve => setTimeout(resolve, delayRef.current));
            }
            countX++
        }
        setImagesDisabled(false);
        if(countX==original.length)
            {
                myPauseButton.current.style.display = 'none';
                myPlayButton.current.style.display = 'block';
                mySpeedUpButton.current.disabled=true
                mySpeedDownButton.current.disabled=true
                document.getElementById("moving-kernel").style.display='none'
               // setImagesDisabled(false);
                setIsDisabled(false) //enabled select box
            }
    }

    async function dilate() {

        if (!original || !kernel) return;

        const processed = original.map(row => [...row]); // Deep copy of original
        let countX=0; // for play button

        for (let i = 0; i < original.length; i++) {
            for (let j = 0; j < original[0].length; j++) {

                if (isCancelledRef.current) return; // ❗Exit early if reset

                while (isPausedRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (isCancelledRef.current) return; // ❗Exit early if reset
                  }

                let overlaps = false;
                for (let ki = 0; ki < kernel.length; ki++) {
                    for (let kj = 0; kj < kernel[0].length; kj++) {
                        const ni = i + ki - Math.floor(kernel.length / 2);
                        const nj = j + kj - Math.floor(kernel[0].length / 2);
                        if (
                            ni >= 0 &&
                            ni < original.length &&
                            nj >= 0 &&
                            nj < original[0].length
                        ) {
                            if (kernel[ki][kj] === 1 && original[ni][nj] === 1) {
                                overlaps = true;
                            }
                        }
                    }
                }
                processed[i][j] = overlaps ? 1 : 0;
                setProcessed(processed.map(row => [...row])); // Update processed state

                // Update position of moving-kernel
                const movingKernel = document.getElementById("moving-kernel");
                const img=document.getElementById("processed-img-morph")
                if (movingKernel && img && i<6 && j<6) {
                    const imgRect = img.getBoundingClientRect();
                    const imgTop = Number(imgRect.top.toFixed(0))+(i)*(img.offsetWidth+2);
                    const imgLeft = Number(imgRect.left.toFixed(0))+(j)*(img.offsetHeight+2);
                    // console.log(imgTop,imgLeft)
                    movingKernel.style.top = `${imgTop}px`;
                    movingKernel.style.left = `${imgLeft}px`;
                }

                // await new Promise((resolve) => setTimeout(resolve, 300)); // 300ms delay
                await new Promise(resolve => setTimeout(resolve, delayRef.current));
            }
            countX++
        }
        setImagesDisabled(false);
        if(countX==original.length)
            {
                myPauseButton.current.style.display = 'none';
                myPlayButton.current.style.display = 'block';
                mySpeedUpButton.current.disabled=true
                mySpeedDownButton.current.disabled=true
                document.getElementById("moving-kernel").style.display='none'
               // setImagesDisabled(false);
                setIsDisabled(false) //enabled select box
            }
    }
    
    async function opening() {
        if (!original || !kernel) return;

        const eroded = original.map(row => [...row]); // Deep copy of original
        let countX=0; // for play button

        for (let i = 0; i < original.length; i++) {
            for (let j = 0; j < original[0].length; j++) {
                let fits = true;
                for (let ki = 0; ki < kernel.length; ki++) {
                    for (let kj = 0; kj < kernel[0].length; kj++) {
                        const ni = i + ki - Math.floor(kernel.length / 2);
                        const nj = j + kj - Math.floor(kernel[0].length / 2);
                        if (
                            ni >= 0 &&
                            ni < original.length &&
                            nj >= 0 &&
                            nj < original[0].length
                        ) {
                            if (kernel[ki][kj] === 1 && original[ni][nj] === 0) {
                                fits = false;
                            }
                        } else if (kernel[ki][kj] === 1) {
                            fits = false;
                        }
                    }
                }
                eroded[i][j] = fits ? 1 : 0;
            }
        }

        const dilated = eroded.map(row => [...row]); // Deep copy of eroded
        for (let i = 0; i < eroded.length; i++) {
            for (let j = 0; j < eroded[0].length; j++) {
                let overlaps = false;
                for (let ki = 0; ki < kernel.length; ki++) {
                    for (let kj = 0; kj < kernel[0].length; kj++) {
                        const ni = i + ki - Math.floor(kernel.length / 2);
                        const nj = j + kj - Math.floor(kernel[0].length / 2);
                        if (
                            ni >= 0 &&
                            ni < eroded.length &&
                            nj >= 0 &&
                            nj < eroded[0].length
                        ) {
                            if (kernel[ki][kj] === 1 && eroded[ni][nj] === 1) {
                                overlaps = true;
                            }
                        }
                    }
                }
                dilated[i][j] = overlaps ? 1 : 0;
            }
            countX++
        }

        setProcessed(dilated);
        setImagesDisabled(false);
        
    }

    async function closing() {
        if (!original || !kernel) return;

        const dilated = original.map(row => [...row]); // Deep copy of original
        let countX=0; // for play button
        
        for (let i = 0; i < original.length; i++) {
            for (let j = 0; j < original[0].length; j++) {
                let overlaps = false;
                for (let ki = 0; ki < kernel.length; ki++) {
                    for (let kj = 0; kj < kernel[0].length; kj++) {
                        const ni = i + ki - Math.floor(kernel.length / 2);
                        const nj = j + kj - Math.floor(kernel[0].length / 2);
                        if (
                            ni >= 0 &&
                            ni < original.length &&
                            nj >= 0 &&
                            nj < original[0].length
                        ) {
                            if (kernel[ki][kj] === 1 && original[ni][nj] === 1) {
                                overlaps = true;
                            }
                        }
                    }
                }
                dilated[i][j] = overlaps ? 1 : 0;
            }
        }

        const eroded = dilated.map(row => [...row]); // Deep copy of dilated
        for (let i = 0; i < dilated.length; i++) {
            for (let j = 0; j < dilated[0].length; j++) {
                let fits = true;
                for (let ki = 0; ki < kernel.length; ki++) {
                    for (let kj = 0; kj < kernel[0].length; kj++) {
                        const ni = i + ki - Math.floor(kernel.length / 2);
                        const nj = j + kj - Math.floor(kernel[0].length / 2);
                        if (
                            ni >= 0 &&
                            ni < dilated.length &&
                            nj >= 0 &&
                            nj < dilated[0].length
                        ) {
                            if (kernel[ki][kj] === 1 && dilated[ni][nj] === 0) {
                                fits = false;
                            }
                        } else if (kernel[ki][kj] === 1) {
                            fits = false;
                        }
                    }
                }
                eroded[i][j] = fits ? 1 : 0;
            }
            countX++
        }

        setProcessed(eroded);
        setImagesDisabled(false);
        if(countX==original.length)
            {
                myPauseButton.current.style.display = 'none';
                myPlayButton.current.style.display = 'block';
                mySpeedUpButton.current.disabled=true
                mySpeedDownButton.current.disabled=true
                document.getElementById("moving-kernel").style.display='none'
               // setImagesDisabled(false);
                setIsDisabled(false) //enabled select box
            }
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
    setCurrentIndex((prevIndex) => (prevIndex - 1 + instructions.length) % instructions.length);
    };


    return(
        <OpenCvProvider>
            <div id="main-box-morph">

            <div id="inst_div" style={{ width: '80%', margin: 'auto', textAlign: 'center', padding: '20px' }}>
                <div style={{
                    padding: '2px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    minHeight: '30px',
                    backgroundColor: 'black',
                    color:'white'
                }}>
            
                    <div id="inst_content">
                        <button onClick={prevSlide} style={{ marginRight: '10px' }}><span className="prev-icon" aria-hidden="true"></span></button>
                        <span>{instructions[currentIndex]}</span>
                        <button onClick={nextSlide}><span className="next-icon" aria-hidden="true"></span></button>
                    </div>
                </div>
            </div>


            <div  id="Choose_box_morph">
                <div className="coolinput_morph">
                <label htmlFor="input" className="text">Choose:</label>
                    <Box  sx={{ width: '100%', height: '85%', display: 'flex', flexDirection: 'row', border: 1, borderRadius: 2,justifyContent:'space-around' }}>
                    
                
                    <div  style={{display:'flex',flexDirection:'column',}}>
                        <div id="image-box-morph">
                                <div onClick={() => !imagesDisabled && handleImage(0)}><img src={plus} id="image-morph" style={{
                                opacity: imagesDisabled ? 0.7 : 1,
                                cursor: imagesDisabled ? 'not-allowed' : 'pointer',
                                }} /></div>
                                <div onClick={() => !imagesDisabled && handleImage(1)}><img src={minus} id="image-morph" style={{
                                opacity: imagesDisabled ? 0.7 : 1,
                                cursor: imagesDisabled ? 'not-allowed' : 'pointer',
                                }} /></div>
                                <div onClick={() => !imagesDisabled && handleImage(2)}><img src={multiply} id="image-morph" style={{
                                opacity: imagesDisabled ? 0.7 : 1,
                                cursor: imagesDisabled ? 'not-allowed' : 'pointer',
                                }} /></div>
                                <div onClick={() => !imagesDisabled && handleImage(3)}><img src={divide} id="image-morph" style={{
                                opacity: imagesDisabled ? 0.7 : 1,
                                cursor: imagesDisabled ? 'not-allowed' : 'pointer',
                                }} /></div>
                        </div>
                    </div>

                    <hr className="custom-divider" />
                    
                    <div  style={{display:'flex',flexDirection:'column',justifyContent: 'center'}}>
                        <div id="tool-box">
                        <h4 style={{color: '#1D2A6D',margin:'0px'}}>Process : </h4>
                        <Select 
                            onChange={(e) => setProcess(e.target.value)} 
                            value={process} 
                            disabled={isDisabled}
                            sx={{ color: '#1D2A6D',
                                '& .MuiSelect-icon': {
                                color: '#1D2A6D', // Replace with your desired color
                                },
                                '& .MuiSelect-select': { // Remove padding inside the Select (input box)
                            paddingTop: 1,paddingBottom:1
                        },
                            }}
                            >
                            <MenuItem value={'dilation'}>Dilation</MenuItem>
                            <MenuItem value={'erosion'}>Erosion</MenuItem>
                            <MenuItem value={'opening'}>Opening</MenuItem>
                            <MenuItem value={'closing'}>Closing</MenuItem>
                            </Select>


                    </div>

                    </div>
                    </Box>
                </div>
            </div>

            <div id="process-box-morph">
                <div id="original-kernel-morph">

                    <div id='orig-morph'>
                        <h2>Original Image</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {original && original.map((row, rowIndex) =>
                                    row.map((cell, cellIndex) => (
                                        <div
                                            key={`${rowIndex}-${cellIndex}`}
                                            class="morph_matrix"
                                            style={{
                                                backgroundColor: cell === 0 ? 'black' : 'white',
                                            }}
                                        ></div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="morph_op">*</div>

                        <div id='kernel-morph'>
                            <h2>Kernel</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                                {kernel.map((row, rowIndex) =>
                                    row.map((cell, cellIndex) => (
                                        <div
                                            key={`${rowIndex}-${cellIndex}`}
                                            class="morph_matrix"
                                            style={{
                                                backgroundColor: cell === 0 ? 'black' : 'white',
                                            }}
                                        ></div>
                                    ))
                                )}
                            </div>
                        </div>

                        

                        <div className="morph_op">=</div>

                    </div>

                    <div id="animation-morph">
                    

                        <h2>Processed Image</h2>
                        <div style={{ position: 'fixed',display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', zIndex: 10}} id="moving-kernel">
                                {document.getElementById("processed-img-morph") && kernel.map((row, rowIndex) =>
                                    row.map((cell, cellIndex) => (
                                        <div
                                            key={`${rowIndex}-${cellIndex}`}
                                            class="morph_matrix"
                                            style={{
                                                backgroundColor: cell === 0 ? 'black' : 'white',
                                                border: '1px solid #ff0000',
                                            }}
                                        ></div>
                                    ))
                                )}
                            </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', zIndex: '0' }}>
                            {processed && processed.map((row, rowIndex) =>
                                row.map((cell, cellIndex) => (
                                    <div
                                        key={`${rowIndex}-${cellIndex}`}
                                        class="morph_matrix"
                                        id='processed-img-morph'
                                        style={{
                                            backgroundColor: cell === 0 ? 'black' : 'white',
                                        }}
                                    ></div>
                                ))
                            )}
                        </div>
                    </div>

                    
                </div>

                <div id="footer_buttons" className="morph_btn">
                <div className="button-container " style={{height:'fit-content'}}>
                    
                    <button
                    ref={myPlayButton}
                    onClick={()=>play()}
                    id="commmon-btn"
                    title='Play' 
className={`px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100`}
                    style={{dispslay:'block'}}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>

                    <button
                    ref={myPauseButton}
                    id="commmon-btn"
                    onClick={() => pauseFun()}
                    title={isPaused ? "Play":"Pause"}
                    className={`px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100`}
                    style={{display:'none'}}
                    >
                        {isPaused ? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg> : 
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                         }
                    </button>


                    <button 
                    id="commmon-btn"    
                    onClick={() => delayRef.current += 100}
                    ref={mySpeedDownButton}
                    title="speed down" 
                    className="px-4 py-2 font-medium text-gray-600 transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <g transform="scale(-1,1) translate(-24,0)">
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path d="M12 13.333l-9.223 6.149A.5.5 0 0 1 2 19.066V4.934a.5.5 0 0 1 .777-.416L12 10.667V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832l-10.599 7.066a.5.5 0 0 1-.777-.416v-5.733zM10.394 12L4 7.737v8.526L10.394 12zM14 7.737v8.526L20.394 12 14 7.737z" />
                    </g>
                    </svg>
                    </button>

                    <button 
                    id="commmon-btn"    
                    onClick={() => delayRef.current = Math.max(50, delayRef.current - 100)}
                    ref={mySpeedUpButton}
                    title="speed up" 
                    className="px-4 py-2 font-medium text-gray-600 transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <g>
                            <path fill="none" d="M0 0h24v24H0z"/>
                            <path d="M12 13.333l-9.223 6.149A.5.5 0 0 1 2 19.066V4.934a.5.5 0 0 1 .777-.416L12 10.667V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832l-10.599 7.066a.5.5 0 0 1-.777-.416v-5.733zM10.394 12L4 7.737v8.526L10.394 12zM14 7.737v8.526L20.394 12 14 7.737z"/>
                        </g>
                    </svg>
                    </button>


                    <button 
                    id="commmon-btn"    
                    title="reset" 
                    onClick={()=>handleReset()} 
                    className="px-4 py-2 font-medium text-black transition-colors duration-200 sm:px-6 dark:hover:bg-gray-800 hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none">
                        <g clip-path="url(#clip0_1276_7761)">
                        <path d="M19.7285 10.9288C20.4413 13.5978 19.7507 16.5635 17.6569 18.6573C15.1798 21.1344 11.4826 21.6475 8.5 20.1966M18.364 8.05071L17.6569 7.3436C14.5327 4.21941 9.46736 4.21941 6.34316 7.3436C3.42964 10.2571 3.23318 14.8588 5.75376 18M18.364 8.05071H14.1213M18.364 8.05071V3.80807" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_1276_7761">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                        </defs>
                    </svg>
                    </button>
                    
                </div>
            </div>
            
            </div>
        </OpenCvProvider>
    ) 
}