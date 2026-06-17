import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import SplittingAndMergingPage from "./components/splittingAndMerging/splittingAndMergingPage";
import ErrorPage from "./components/ErrorPage";
import { HomeContextProvider } from "./components/context/HomeContext";
import { SimContextProvider } from "./components/context/SimContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <SplittingAndMergingPage />,
      errorElement: <ErrorPage />,
    },
  ]);

  return (
    <OpenCvProvider>
      <HomeContextProvider>
        <SimContextProvider>
          <RouterProvider router={router} />
        </SimContextProvider>
      </HomeContextProvider>
    </OpenCvProvider>
  );
}

export default App;
