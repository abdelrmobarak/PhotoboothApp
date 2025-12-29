import Webcam from "react-webcam";
import { useState, useRef, useEffect } from 'react'

function App() {

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [imgSrc, setImgSrc] = useState(null);
  const [stripUrl, setStripUrl] = useState(null);

  function capture() {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }

  function clearPhoto() {
    setImgSrc(null);
  }

  useEffect(() => {
    if (!imgSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.src = imgSrc;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, 300, 220);
      ctx.drawImage(img, 0, 220, 300, 220);
      ctx.drawImage(img, 0, 440, 300, 220);
      ctx.drawImage(img, 0, 660, 300, 220);
      setStripUrl(canvas.toDataURL("image/png"));

    };
  }, [imgSrc]);


  return (
    <div className='flex flex-col items-center justify-center w-screen h-screen'>
      {imgSrc ? (
        <div className='flex flex-col'>
          <canvas ref={canvasRef} width="300" height="880" className="border-2 border-black"></canvas>
          <a href={stripUrl} download="photostrip.png">
            <button>Download Strip</button>
          </a>
          <button onClick={(clearPhoto)}>Clear photo</button>
        </div>
      ) : (
        <div>
          <h1 className='text-5xl'>Photobooth</h1>
          <Webcam ref={webcamRef}
            mirrored={true}
            height={400}
            width={600}
          />
          <button onClick={capture}>Capture Photo</button>
        </div>
      )}
    </div>
  )
}

export default App;