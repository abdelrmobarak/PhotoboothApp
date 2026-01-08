import { useState, useRef } from 'react'
import CaptureView from './components/CaptureView';
import ResultView from './components/ResultView';

// border options for the photostrip
var BORDERS = [
  { id: 0, name: 'White', color: '#ffffff', textColor: '#000000', borderColor: '#eeeeee' },
  { id: 1, name: 'Black', color: '#1a1a1a', textColor: '#ffffff', borderColor: '#333333' },
  { id: 2, name: 'Blue', color: '#0000ff', textColor: '#ffffff', borderColor: '#0000ff' },
  { id: 3, name: 'Red', color: '#ff0000', textColor: '#ffffff', borderColor: '#ff0000' },
];

function App() {
  var webcamRef = useRef(null);

  // storing all the images
  var [imgSrc, setImgSrc] = useState(null);
  var [imgSrc2, setImgSrc2] = useState(null);
  var [imgSrc3, setImgSrc3] = useState(null);
  var [imgSrc4, setImgSrc4] = useState(null);
  var [stripUrl, setStripUrl] = useState(null);
  var [selectedBorder, setSelectedBorder] = useState(BORDERS[0]);
  var [photoCount, setPhotoCount] = useState(0);
  var [stickers, setStickers] = useState([]); // for the emoji stickers and stuff
  var [countdown, setCountdown] = useState(null);

  var timerRef = useRef(null);

  // starts the countdown timer before taking photo
  function startCapture() {
    if (imgSrc4 != null) return;
    if (countdown != null) return;

    var count = 3;
    setCountdown(count);

    // countdown 3, 2, 1 then take the picture
    timerRef.current = setInterval(function () {
      count = count - 1;
      if (count <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setCountdown(null);
        doTakePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }

  // actually takes the photo from webcam
  function doTakePhoto() {
    if (webcamRef.current == null) return;

    var screenshot = webcamRef.current.getScreenshot();
    if (screenshot == null || screenshot == '') return;

    // set the image to the next available slot
    if (imgSrc == null) {
      setImgSrc(screenshot);
      setPhotoCount(1);
    } else if (imgSrc2 == null) {
      setImgSrc2(screenshot);
      setPhotoCount(2);
    } else if (imgSrc3 == null) {
      setImgSrc3(screenshot);
      setPhotoCount(3);
    } else if (imgSrc4 == null) {
      setImgSrc4(screenshot);
      setPhotoCount(4);
    }
  }

  // clears everything and starts over
  function resetAll() {
    setImgSrc(null);
    setImgSrc2(null);
    setImgSrc3(null);
    setImgSrc4(null);
    setPhotoCount(0);
    setStripUrl(null);
    setStickers([]);
    setCountdown(null);
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // switch between border colors etc
  function changeBorder(id) {
    for (var i = 0; i < BORDERS.length; i++) {
      if (BORDERS[i].id == id) {
        setSelectedBorder(BORDERS[i]);
        break;
      }
    }
  }

  var showResult = imgSrc4 != null;

  return (
    <div className='flex flex-col items-center justify-center min-h-screen w-full bg-neutral-50'>
      {showResult ? (
        <ResultView
          photos={[imgSrc, imgSrc2, imgSrc3, imgSrc4]}
          selectedBorder={selectedBorder}
          BORDERS={BORDERS}
          switchBorder={changeBorder}
          stripUrl={stripUrl}
          setStripUrl={setStripUrl}
          clearPhoto={resetAll}
          stickers={stickers}
          setStickers={setStickers}
        />
      ) : (
        <CaptureView
          webcamRef={webcamRef}
          capture={startCapture}
          photoCount={photoCount}
          countdown={countdown}
        />
      )}
    </div>
  )
}

export default App;
