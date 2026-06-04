import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import ErrorPage from "./components/ErrorPage";
import WatershedPage from "./components/watershed/WatershedPage";

import { HomeContextProvider } from "./components/context/HomeContext";
import {SimContextProvider} from "./components/context/SimContext"; 

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <WatershedPage />,
        errorElement: <ErrorPage />,  
    },

    {
      path: "/region/watershed",
      element: <WatershedPage />,
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
