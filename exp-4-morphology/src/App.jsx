import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// import Edge from "./components/Edge";
import MorphologyPage from "./components/morphology/MorphologyPage";
import ErrorPage from "./components/ErrorPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <MorphologyPage />,
        errorElement: <ErrorPage />,  
    },
    
    {
      path: "/edge/morphological",
      element: <MorphologyPage />,
    },
    
    
    
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;
