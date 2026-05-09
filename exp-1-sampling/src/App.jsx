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
import { HomeContextProvider } from "./components/context/HomeContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Sampling />,
        errorElement: <ErrorPage />,  
    },

    
  ]);

  return (
    <OpenCvProvider>
      <HomeContextProvider>
        <RouterProvider router={router} />
      </HomeContextProvider>
    </OpenCvProvider>
  );
}

export default App;
