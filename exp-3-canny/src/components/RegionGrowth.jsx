import '../region_animation.css'
import '../App.css'

import Box from '@mui/material/Box';
import { use, useEffect, useRef, useState } from 'react';
import { OpenCvProvider } from 'opencv-react';
import divide from '../assets/images/divide_sign.png';
import multiply from '../assets/images/x_sign.png';
import minus from '../assets/images/minus_sign.png';
import plus from '../assets/images/plus_sign.png';

export default function RegionGrowth(){
    const [image,setImage]=useState(0);
    const [original,setOriginal]=useState(null);
    const [result,setResult]=useState(null);
    const [seed,setSeed] = useState([-1,-1]);
    
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
        setSeed([-1,-1]);
        setOriginal(signs[x]);
        setResult(Array(7).fill(0).map(() => Array(7).fill(0)));
    }

    useEffect(()=>{handleImage(0)},[])
    const [imagesDisabled, setImagesDisabled] = useState(false);

    function set_seed(row,col){
        setSeed(row,col);
        setResult(Array(7).fill(0).map(() => Array(7).fill(0)));
        console.log(seed);
        growth(seed);
    }

    async function growth(s) {
        const [row, col] = s;

        // Base conditions to stop recursion
        if (
            row < 0 || col < 0 || row >= 7 || col >= 7 || // Out of bounds
            result[row][col] === 1 || // Already processed
            original[row][col] !== original[seed[0]][seed[1]] // Not the same color as seed
        ) {
            return;
        }

        // Mark the current cell in the result
        const updatedResult = [...result];
        updatedResult[row][col] = 1;
        setResult(updatedResult);
        // Sleep for 100ms
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(250);
        // Recursively check all 8 neighbors
        growth([row - 1, col]); // Top
        growth([row + 1, col]); // Bottom
        growth([row, col - 1]); // Left
        growth([row, col + 1]); // Right
        growth([row - 1, col - 1]); // Top-left
        growth([row - 1, col + 1]); // Top-right
        growth([row + 1, col - 1]); // Bottom-left
        growth([row + 1, col + 1]); // Bottom-right
    }

    const instructions = [
            "Click to select an image and then click on cell to observe the resulting image.",
            ];
        
          
    return(
        <OpenCvProvider>
        <div id="main-box-region">
        <div id="inst_div_region">
                <div style={{
                    padding: '2px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    minHeight: '30px',
                    backgroundColor: 'black',
                    color:'white'
                }}>
            
                    <div id="inst_content_region">
                        
                        <span>{instructions[0]}</span>
                       
                    </div>
                </div>
            </div>

        <div  id="Choose_box_region">
                <div className="coolinput_region">
                <label htmlFor="input" className="text">Choose:</label>
                    <Box  sx={{ width: '100%', height: '85%', display: 'flex', flexDirection: 'row', border: 1, borderRadius: 2,justifyContent:'space-around' }}>
                    
                
                    <div  style={{display:'flex',flexDirection:'column',}}>
                        <div id="image-box-region">
                                <div onClick={() => handleImage(0)}><img src={plus} id="image"/></div>
                                <div onClick={() => handleImage(1)}><img src={minus} id="image" /></div>
                                <div onClick={() => handleImage(2)}><img src={multiply} id="image"  /></div>
                                <div onClick={() => handleImage(3)}><img src={divide} id="image" /></div>
                        </div>
                    </div>
                    </Box>
                </div>
            </div>

            <div>
            <p style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.5', marginLeft: '10px', marginRight: '10px',textAlign:'justify' }}>
                        The algorithm starts with a seed and feeds the seed's neighbors  in a recursive function to check for similar neighbors  and the region keeps on growing this way
                    </p>
            </div>


            <div id="content-box-region">
                <div id="left-content-box-region"> 
                    <div id="head-image-temp"><h1>Original Image</h1></div>
                    <div id="original-image-temp">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {original && original.map((row, rowIndex) =>
                                    row.map((cell, cellIndex) => (
                                        <div
                                            key={`${rowIndex}-${cellIndex}`}
                                            onClick={() => set_seed([rowIndex, cellIndex])}
                                            id="original_matrix_region"
                                            style={{
                                                backgroundColor: cell === 0 ? 'black' : 'white',
                                            }}
                                        ></div>
                                    ))
                                )}
                        </div>
                        {(seed[0]+seed[1])!=-2&&<div id="seed">
                            <p>Selected Seed:</p>
                            <div
                            id="original_matrix_region"
                                style={{
                                    backgroundColor: original[seed[0]][seed[1]] === 0 ? 'black' : 'white',
                                }}
                            ></div>
                            <p>Row: {seed[0]} Col: {seed[1]}</p>
                        </div>}
                    </div>
                </div>
                <div id="region_arrow">&#129066;</div>
                <div id="left-content-box-region"> 
                    <div id="head-image-temp"><h1>Result Image</h1></div>
                    <div id="original-image-temp">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {result && result.map((row, rowIndex) =>
                                    row.map((cell, cellIndex) => (
                                        <div
                                            key={`${rowIndex}-${cellIndex}`}
                                            onClick={() => set_seed([rowIndex, cellIndex])}
                                            id="original_matrix_region"
                                            style={{
                                                backgroundColor: cell === 0 ? 'black' : 'white',
                                            }}
                                        ></div>
                                    ))
                                )}
                        </div>
                </div>
                </div>
            </div>
        </div>
        </OpenCvProvider>
    )
}