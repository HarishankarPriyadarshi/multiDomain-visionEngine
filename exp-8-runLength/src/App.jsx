import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";


import ErrorPage from "./components/ErrorPage";

import RunLengthPage from "./components/runlength/RunLengthPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RunLengthPage />,
        errorElement: <ErrorPage />,  
    },

    {
      path: "/compression/runlength",
      element: <RunLengthPage />,
    },

    
    
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;
