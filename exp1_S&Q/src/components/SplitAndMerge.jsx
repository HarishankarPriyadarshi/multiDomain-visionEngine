import '../region_animation.css'
import '../App.css'
import { use, useEffect, useRef, useState } from 'react';
import { OpenCvProvider } from 'opencv-react';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import divide from '../assets/images/divide_sign.png';
import multiply from '../assets/images/x_sign.png';
import minus from '../assets/images/minus_sign.png';
import plus from '../assets/images/plus_sign.png';

export default function SplitAndMerge(){
    const [image,setImage]=useState(0);
    const [original,setOriginal]=useState(null);
    const [quadrantList, setQuadrantList] = useState([]);
    
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

    function split() {
        if (!original) return;

        // Recursive function to split and check homogeneity
        const recursiveSplit = (matrix, x, y, size) => {
            const isHomogeneous = (matrix) => {
                const firstValue = matrix[0][0];
                return matrix.every(row => row.every(cell => cell === firstValue));
            };

            if (isHomogeneous(matrix)) {
                setQuadrantList(prev => [...prev, { x, y, size, value: matrix[0][0] }]);
            } else {
                const half = Math.ceil(size / 2);
                const topLeft = matrix.slice(0, half).map(row => row.slice(0, half));
                const topRight = matrix.slice(0, half).map(row => row.slice(half));
                const bottomLeft = matrix.slice(half).map(row => row.slice(0, half));
                const bottomRight = matrix.slice(half).map(row => row.slice(half));

                if (topLeft.length > 0 && topLeft[0].length > 0) recursiveSplit(topLeft, x, y, half); // Top-left
                if (topRight.length > 0 && topRight[0].length > 0) recursiveSplit(topRight, x, y + half, half); // Top-right
                if (bottomLeft.length > 0 && bottomLeft[0].length > 0) recursiveSplit(bottomLeft, x + half, y, half); // Bottom-left
                if (bottomRight.length > 0 && bottomRight[0].length > 0) recursiveSplit(bottomRight, x + half, y + half, half); // Bottom-right
            }
        };

        setQuadrantList([]); // Clear the quadrant list before starting
        recursiveSplit(original, 0, 0, original.length);
    }

    const instructions = [
        "1. Click to select an image and observe the resulting image.",
        "2. Click the 'Process' button to see the output."
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
                        <button onClick={prevSlide} style={{ marginRight: '10px' }}><span className="prev-icon" aria-hidden="true"></span></button>
                        <span>{instructions[currentIndex]}</span>
                        <button onClick={nextSlide}><span className="next-icon" aria-hidden="true"></span></button>
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
            The algorithm recursively breaks the image into 4 quadrants and checks for homogeneity (in this case all pixels under quadrant either being 1 or 0) if not its broken into quads again and once this is done they are stitched back up with average pixel value of each quad.
                    </p>
            </div>

            <div style={{display: 'flex',flexDirection: 'row', justifyContent: 'center', alignProperty: 'center', width: '100%'}} onClick={split}>
                <Button class='tool_btn'>Process</Button>
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

                <div id="split_arrow">&#129066;</div>

                <div id="left-content-box-region">
                <div id="head-image-temp"><h1>Splitting</h1></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0px', position: 'relative' }}>
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
                            {quadrantList.map((quadrant, index) => (
                                <div
                                    key={`quadrant-${index}`}
                                    style={{
                                        position: 'absolute',
                                        top: `${quadrant.x * (document.getElementById('original_matrix_region').offsetWidth +2 )}px`, // * 42 (previously)
                                        left: `${quadrant.y * (document.getElementById('original_matrix_region').offsetWidth +2 )}px`,
                                        width: `${quadrant.size * (document.getElementById('original_matrix_region').offsetWidth +2 )}px`,
                                        height: `${quadrant.size * (document.getElementById('original_matrix_region').offsetWidth +2 )}px`,
                                        border: '1px solid red',
                                        boxSizing: 'border-box',
                                        pointerEvents: 'none',
                                    }}
                                ></div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
        </OpenCvProvider>
    )
}
