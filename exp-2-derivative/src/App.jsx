import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { HomeContextProvider } from "./components/context/HomeContext";
import { SimContextProvider } from "./components/context/SimContext";

import DerivativePage from "./components/derivative/DerivativePage";

import ErrorPage from "./components/ErrorPage";

function App() {
  // const router = createBrowserRouter([

  //   {
  //     path: "/",
  //     element: <DerivativePage />,
  //       errorElement: <ErrorPage />,
      
  //   },
    
  //   {
  //     path: "/edge/derivative",
  //     element: <DerivativePage />,
  //     errorElement: <ErrorPage />,
      
  //   },
    
    
  // ]);

  return (
    <OpenCvProvider>
      <HomeContextProvider>
        <SimContextProvider>
        <DerivativePage />
        </SimContextProvider>
      </HomeContextProvider>
    </OpenCvProvider>
  );
}

export default App;
