import Webcam from "react-webcam";
import { useState, useRef, useEffect} from 'react'

function App() {

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [imgSrc, setImgSrc] = useState(null);

  function capture() {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }

  function clearPhoto() {
    setImgSrc(null);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    const imgTwo = new Image();
    const imgThree = new Image();

    img.src = imgSrc;
    img.width = 300;
    img.height = 220;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 300, 220);
      ctx.drawImage(img, 0, 220, 300, 220);
      ctx.drawImage(img, 0, 440, 300, 220);
      ctx.drawImage(img, 0, 660, 300, 220);
    }
  }, [imgSrc]);

  return (
    <div className='flex flex-col items-center justify-center w-screen h-screen'>
      {imgSrc ? (
        <div>
          <canvas ref={canvasRef} width="300" height="880" className="border-2 border-black"></canvas>
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