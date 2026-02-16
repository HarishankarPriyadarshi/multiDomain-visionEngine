// HuffmanTreeViewer.js
import React, { useState, useEffect } from 'react';
import Tree from 'react-d3-tree';

const containerStyles = {
  width: '100%',
  height: '100%',
};

// Utility function to build Huffman tree from 1D array
function buildHuffmanTreeFromArray(dataArray) {
  const freqMap = new Map();

  for (let value of dataArray) {
    freqMap.set(value, (freqMap.get(value) || 0) + 1);
  }

  let nodes = [...freqMap.entries()].map(([val, freq]) => ({
    name: `${val} (${freq})`,
    value: freq,
    char: val,
  }));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.value - b.value);
    const left = nodes.shift();
    const right = nodes.shift();

    nodes.push({
      name: '',
      value: left.value + right.value,
      children: [left, right],
    });
  }

  function format(node) {
    const result = { name: node.name || `${node.value}` };
    if (node.children) {
      result.children = node.children.map(format);
    }
    return result;
  }

  return format(nodes[0]);
}

// React component
const HuffmanTreeViewer = ({ original }) => {
  const [treeData, setTreeData] = useState([]);

  useEffect(() => {
    if (original && original.length > 0) {
      const flat = original.flat(); // Flatten 2D binary image
      const tree = buildHuffmanTreeFromArray(flat);
      setTreeData([tree]);
    } else {
      setTreeData([]);
    }
  }, [original]);

  return (
    <div>
      <h4 style={{ textAlign: 'center' }}>Huffman Tree from Binary Image</h4>
      <div style={containerStyles} id="binary_tree">
        {treeData.length > 0 ? (
          <Tree
          data={treeData}
          orientation="vertical"
          translate={{ x: window.innerWidth / 10 , y: window.innerHeight / 14  }}
          scaleExtent={{ min: 0.1, max: 2 }}
          nodeSize={{ x: 100, y: 50 }}
        />
        ) : (
          <p style={{ textAlign: 'center', paddingTop: '2rem' }}>
            No binary data provided
          </p>
        )}
      </div>
    </div>
  );
};

export default HuffmanTreeViewer;
