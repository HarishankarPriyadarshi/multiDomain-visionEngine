import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import { HomeContextProvider } from "./components/context/HomeContext";
import {SimContextProvider} from "./components/context/SimContext"; 
import ErrorPage from "./components/ErrorPage";

import RunLengthPage from "./components/runlength/RunLengthPage";

function App() {
  // const router = createBrowserRouter([
  //   {
  //     path: "/",
  //     element: <RunLengthPage />,
  //       errorElement: <ErrorPage />,  
  //   },

  //   {
  //     path: "/compression/runlength",
  //     element: <RunLengthPage />,
  //   },

    
    
  // ]);

  return (
    <OpenCvProvider>
      <HomeContextProvider>
        <SimContextProvider>
          <RunLengthPage />
        </SimContextProvider>
      </HomeContextProvider>
    </OpenCvProvider>
  );
}

export default App;
