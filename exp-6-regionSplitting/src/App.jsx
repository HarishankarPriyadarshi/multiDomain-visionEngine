import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import SplittingAndMergingPage from "./components/splittingAndMerging/splittingAndMergingPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <SplittingAndMergingPage />,
    },
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;
