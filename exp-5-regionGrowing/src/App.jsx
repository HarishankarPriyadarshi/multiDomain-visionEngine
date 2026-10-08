import  GrowingPage from "./homePage/GrowingPage.jsx";
import { OpenCvProvider } from "opencv-react";
function App() {
  return (
    <OpenCvProvider>
      <GrowingPage />
    </OpenCvProvider>
  );
}

export default App;
