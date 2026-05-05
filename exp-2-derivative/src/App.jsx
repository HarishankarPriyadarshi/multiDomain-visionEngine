import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { CommonContextProvider } from "./components/context/CommonContext";

import DerivativePage from "./components/derivative/DerivativePage";

import ErrorPage from "./components/ErrorPage";

function App() {
  const router = createBrowserRouter([

    {
      path: "/",
      element: <DerivativePage />,
        errorElement: <ErrorPage />,
      
    },
    
    {
      path: "/edge/derivative",
      element: <DerivativePage />,
      errorElement: <ErrorPage />,
      
    },
    
    
  ]);

  return (
    <OpenCvProvider>
      <CommonContextProvider>
        <RouterProvider router={router} />
      </CommonContextProvider>
    </OpenCvProvider>
  );
}

export default App;
