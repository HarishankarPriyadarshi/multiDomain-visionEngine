import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import Sampling from "./components/Sampling";
// import Region from "./components/Region";

import ErrorPage from "./components/ErrorPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Sampling />,
        errorElement: <ErrorPage />,  
    },
    // {
    //   path: "/sampling",
    //   element: <Sampling />,
    // },
    // {
    //   path: "/edge/derivative",
    //   element: <DerivativePage />,
      
    // },
    // {
    //   path: "/edge/canny",
    //   element: <CannyPage />,
    // },
    // {
    //   path: "/edge/morphological",
    //   element: <MorphologyPage />,
    // },
    // {
    //   path: "/region/growing",
    //   element: <GrowingPage />,
    // },
    // {
    //   path: "/region/splittingAndMerging",
    //   element: <SplittingAndMergingPage />,
    // },
    // {
    //   path: "/region/watershed",
    //   element: <WatershedPage />,
    // },
    // {
    //   path: "/compression/runlength",
    //   element: <RunLengthPage />,
    // },
    // {
    //   path: "/compression/huffman",
    //   element: <HuffmanPage />,
    // },
    // {
    //   path: "/compression/sinecosine",
    //   element: <SineCosinePage />,
    // },
    // {
    //   path: "/compression/jpeg",
    //   element: <JpegPage />,
    // },
    
    
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;
