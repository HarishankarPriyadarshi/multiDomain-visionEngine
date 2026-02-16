import '../template.css'
 
import { use, useEffect, useRef, useState } from 'react';
import { OpenCvProvider } from 'opencv-react';
import divide from '../assets/images/divide_sign.png';
import multiply from '../assets/images/x_sign.png';
import minus from '../assets/images/minus_sign.png';
import plus from '../assets/images/plus_sign.png';
import Tree from 'react-d3-tree';
import HuffmanTree from './hufftree';
import HuffmanTreeViewer from './htimage';
import Box from '@mui/material/Box';

export default function HuffmanAnimation(){
    const [image,setImage]=useState(0);
    const [original,setOriginal]=useState(null);
    const [tdata,setTdata]=useState('');
    
    
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

    const [scale, setScale] = useState(1);
  const [error, setError] = useState('');

  // Function to calculate the number of nodes in the tree from the tdata
  const calculateNodeCount = (data) => {
    try {
      const tree = JSON.parse(data); // Attempt to parse JSON
      const countNodes = (node) => {
        if (!node) return 0;
        return 1 + countNodes(node.left) + countNodes(node.right);
      };
      return countNodes(tree);
    } catch (err) {
      setError('Invalid JSON format. Please provide valid JSON data.');
      return 0;
    }
  };

  useEffect(() => {
    if (tdata) {
      setError(''); // Clear any previous error
      const nodeCount = calculateNodeCount(tdata);
      // Adjust scale based on the node count
      const newScale = Math.max(1, Math.min(2, nodeCount / 50));
      setScale(newScale);
    }
  }, [tdata]);



    
    return(
        <OpenCvProvider>
        <div id="main-box-temp">
            <div id="grid-box-temp">
             <div id="row1-temp">
                <div  id="Choose_box_comp">
                        <div className="coolinput_comp">
                        <label htmlFor="input" className="text">Choose:</label>
                            <Box  sx={{ width: '100%', height: '85%', display: 'flex', flexDirection: 'row', border: 1, borderRadius: 2,justifyContent:'space-around' }}>
                            
                        
                            <div  style={{display:'flex',flexDirection:'column',}}>
                                <div id="image-box-comp">
                                        <div onClick={() => handleImage(0)}><img src={plus} id="image" /></div>
                                        <div onClick={() => handleImage(1)}><img src={minus} id="image"  /></div>
                                        <div onClick={() => handleImage(2)}><img src={multiply} id="image" /></div>
                                        <div onClick={() => handleImage(3)}><img src={divide} id="image"  /></div>
                                </div>
                            </div>
                            </Box>
                        </div>
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.5', marginLeft: '10px', marginRight: '10px' }}>
                        This is a Huffman Tree and this is lossless but generally in image processing lossy Huffman is used which just trims the branches of the nodes with very low frequency to cut out on less noticeable data
                    </p>
                </div>

                <div id="row2-temp">
                    <div className='box'>
                        <textarea class="text_box" placeholder='Enter data here' value={tdata} onChange={(e)=>{setTdata(e.target.value)}}></textarea>
                    </div>
                    <div className='box'>
                    <h4>Use your mouse to pan and scroll over the tree</h4>
                            <HuffmanTree tdata={tdata}/>
                    </div>
                </div>

                <div id="row3-temp">
                    <div className='box'>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                    {original && original.map((row, rowIndex) =>
                                        row.map((cell, cellIndex) => (
                                            <div
                                                key={`${rowIndex}-${cellIndex}`}
                                                id="huff_matrix"
                                                style={{
                                                    backgroundColor: cell === 0 ? 'black' : 'white',
                                                }}
                                            ></div>
                                        ))
                                    )}
                        </div>
                    </div>
                    <div className='box'>
                        <HuffmanTreeViewer original={original}/>
                    </div>
                </div>
            </div>
        </div>
        </OpenCvProvider>
    )
}