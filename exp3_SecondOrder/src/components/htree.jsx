// huffman.js

export function buildHuffmanTree(tdata) {
    const freqMap = new Map();
  
    // Step 1: Frequency Map
    for (let char of tdata) {
      freqMap.set(char, (freqMap.get(char) || 0) + 1);
    }
  
    // Step 2: Priority Queue
    let nodes = [...freqMap.entries()].map(([char, freq]) => ({
      name: `${char} (${freq})`,
      value: freq,
      char,
    }));
  
    // Step 3: Build Tree
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
  
    // Step 4: Format for react-d3-tree
    function format(node) {
      const result = { name: node.name || `${node.value}` };
      if (node.children) {
        result.children = node.children.map(format);
      }
      return result;
    }
  
    return format(nodes[0]);
  }
  