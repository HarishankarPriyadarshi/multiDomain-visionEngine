// HuffmanTree.js
import React, { useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import { buildHuffmanTree } from './htree';

const containerStyles = {
  width: '100%',
  height: '100%',
};

const HuffmanTree = ({ tdata }) => {
  const [treeData, setTreeData] = useState([]);

  useEffect(() => {
    if (tdata && tdata.trim().length > 0) {
      const builtTree = buildHuffmanTree(tdata);
      setTreeData([builtTree]); // react-d3-tree expects an array
    } else {
      setTreeData([]);
    }
  }, [tdata]);

  return (
    <div style={{ ...containerStyles, display: 'flex', justifyContent: 'center', alignItems: 'center',border:'1px solid black', backgroundColor:'white' }}>
      {treeData.length > 0 ? (
        <Tree
          data={treeData}
          orientation="vertical"
          translate={{ x: window.innerWidth / 5 , y: window.innerHeight / 14  }}
          zoomable
          scaleExtent={{ min: 0.1, max: 2 }}
          nodeSize={{ x: 100, y: 50 }}
        />
      ) : (
        <p style={{ textAlign: 'center', paddingTop: '2rem' }}>Enter text to build Huffman Tree</p>
      )}
    </div>
  );
};

export default HuffmanTree;
