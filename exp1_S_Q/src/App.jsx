import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import { OpenCvProvider } from 'opencv-react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import Edge from './components/Edge';
import Sampling from './components/Sampling';
import Region from './components/Region';
import Compression from './components/Compression';
import ErrorPage from './components/ErrorPage';

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