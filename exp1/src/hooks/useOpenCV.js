import { useState, useEffect } from "react";

export function useOpenCV() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (window.cv && window.cv.imread) {
            console.log("✅ OpenCV is already loaded!");
            setIsLoaded(true);
            return;
        }

        console.log("⏳ Loading OpenCV...");
        const script = document.createElement("script");
        script.src = "https://docs.opencv.org/4.x/opencv.js";
        script.async = true;
        script.onload = () => {
            console.log("✅ OpenCV script loaded!");
            window.cv.onRuntimeInitialized = () => {
                console.log("✅ OpenCV is fully ready!");
                setIsLoaded(true);
            };
        };

        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return isLoaded;
}
