import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import { OpenCvProvider } from 'opencv-react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Sampling from './components/Sampling';

function App() {

  const router = createBrowserRouter([
    
    {
      path: '/',
      element: <Sampling />,
    },
    
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;