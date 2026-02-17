import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import { OpenCvProvider } from 'opencv-react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import Edge from './components/Edge';
import Sampling from './components/Sampling';
import Region from './components/Region';
import Compression from './components/Compression';
import ErrorPage from './components/ErrorPage';
import CannyExplanation from './components/CannyExplanation';
import Morphological from './components/Morphological';
import RegionGrowth from './components/RegionGrowth';
import SplitAndMerge from './components/SplitAndMerge';
import WaterShed from './components/WaterShed';
import RLEanimation from './components/RLEanimation';
import HuffmanAnimation from './components/HuffmanAnimation';

function App() {

  const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/sampling" replace /> },

    // Sampling / Quantization
    { path: '/sampling', element: <Sampling /> },

    // Edge detection (group + individual experiment routes)
    { path: '/edge', element: <Edge /> },
    { path: '/edge/first-order', element: <Edge initialTab={0} initialDerivativeMethod={'First Order'} /> },
    { path: '/edge/second-order', element: <Edge initialTab={0} initialDerivativeMethod={'Second Order'} /> },
    { path: '/edge/canny', element: <CannyExplanation /> },
    { path: '/edge/morphological', element: <Morphological /> },

    // Region analysis
    { path: '/region', element: <Region /> },
    { path: '/region/growth', element: <RegionGrowth /> },
    { path: '/region/split-merge', element: <SplitAndMerge /> },
    { path: '/region/watershed', element: <WaterShed /> },

    // Compression
    { path: '/compression', element: <Compression /> },
    { path: '/compression/rle', element: <RLEanimation /> },
    { path: '/compression/huffman', element: <HuffmanAnimation /> },
    { path: '/compression/transform', element: <Compression initialTab={2} /> },
    { path: '/compression/jpeg', element: <Compression initialTab={3} /> },

    // 404 / fallback
    { path: '*', element: <ErrorPage /> },
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;