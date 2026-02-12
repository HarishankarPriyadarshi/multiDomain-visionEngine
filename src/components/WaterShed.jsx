import '../region_animation.css'
import '../App.css'
import { use, useEffect, useRef, useState } from 'react';
import { OpenCvProvider } from 'opencv-react';
import divide from '../assets/images/divide_sign.png';
import multiply from '../assets/images/x_sign.png';
import minus from '../assets/images/minus_sign.png';
import plus from '../assets/images/plus_sign.png';
import VoxelScene from './WaterScene';
import Box from '@mui/material/Box';

export default function WaterShed(){
    const [image,setImage]=useState(0);
    const [original,setOriginal]=useState(null);
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
    useEffect(()=>{handleImage(0)},[])

    const instructions = [
        "Click to select an image and observe the resulting image.",
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
            The Watershed algorithm uses a heatmap representation where higher intensity values form hills and lower intensity values form valleys. 
                        It simulates filling these valleys with water, and as the water levels rise, the boundaries where different water sources meet are marked 
                        with red edges, representing the segmentation result.
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

                <div id="water_arrow">&#129066;</div>

                <div id="left-content-box-region"> 
                    <div id="head-image-temp"><h1>Watershed Algo</h1></div>
                    <div id="original-image-temp">
                        <VoxelScene binaryMap={original} maxY={1} />
                    </div>
                </div>
            </div>
        </div>
        </OpenCvProvider>
    )
}