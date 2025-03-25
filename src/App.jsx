import './App.css'
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import { Button, Slider, Select, MenuItem} from '@mui/material';
import Tab from '@mui/material/Tab';
import { useState, useEffect } from 'react';
import sample1 from './assets/images/sample1.jpg';
import sample2 from './assets/images/sample2.jpg';
import sample3 from './assets/images/sample3.jpg';
import sample4 from './assets/images/sample4.jpg';
import { OpenCvConsumer, OpenCvProvider } from 'opencv-react';
import Edge from './components/Edge';
// import { createBrowserRouter,RouterProvider } from 'react-router-dom';
import Sampling from './components/Sampling';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function App() {

  // const router=createBrowserRouter([
  //   {path: '/edge',element: <Edge/>},
  //   {path: '/sampling',element: <Sampling/>},
  // ])

  // return(
  //   <RouterProvider router={router}>
  //     <OpenCvProvider>
  //       Hi there
  //     </OpenCvProvider>
  //   </RouterProvider>
  // );

  return (
    <Router basename="/IP1">
      <Routes>
        <Route path="/edge" element={<Edge />} />
        <Route path="/sampling" element={<Sampling />} />
      </Routes>
    </Router>
  );

}

export default App;