import { useState, useRef } from 'react'
import CaptureView from './components/CaptureView';
import ResultView from './components/ResultView';

var CAPTURE_DURATION_MS = 1000;
var CAPTURE_FPS = 8;

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
  var [photos, setPhotos] = useState([null, null, null, null]);
  var [stripUrl, setStripUrl] = useState(null);
  var [stripMime, setStripMime] = useState('image/png');
  var [selectedBorder, setSelectedBorder] = useState(BORDERS[0]);
  var [stickers, setStickers] = useState([]); // for the emoji stickers and stuff
  var [countdown, setCountdown] = useState(null);
  var [isCapturing, setIsCapturing] = useState(false);
  var [captureMode, setCaptureMode] = useState('gif');

  var timerRef = useRef(null);

  // starts the countdown timer before taking photo
  function startCapture() {
    if (photos[3] != null) return;
    if (countdown != null) return;
    if (isCapturing) return;

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

  function captureBurst() {
    return new Promise(function (resolve) {
      if (webcamRef.current == null) return resolve([]);

      var frames = [];
      var frameDelay = Math.round(1000 / CAPTURE_FPS);
      var start = Date.now();

      function grabFrame() {
        var shot = webcamRef.current.getScreenshot();
        if (shot) frames.push(shot);

        if (Date.now() - start >= CAPTURE_DURATION_MS) {
          clearInterval(timer);
          resolve(frames);
        }
      }

      var timer = setInterval(grabFrame, frameDelay);
      grabFrame();
    });
  }

  // actually takes the photo from webcam
  async function doTakePhoto() {
    if (webcamRef.current == null) return;

    if (captureMode == 'image') {
      var screenshot = webcamRef.current.getScreenshot();
      if (screenshot == null || screenshot == '') return;

      setPhotos(function (prev) {
        var next = prev.slice();
        var idx = next.findIndex(function (p) { return p == null; });
        if (idx == -1) return prev;
        next[idx] = screenshot;
        return next;
      });
      return;
    }

    setIsCapturing(true);
    var frames = await captureBurst();
    setIsCapturing(false);
    if (frames.length == 0) return;

    var still = frames[frames.length - 1];
    var nextPhoto = { still: still, frames: frames };

    setPhotos(function (prev) {
      var next = prev.slice();
      var idx = next.findIndex(function (p) { return p == null; });
      if (idx == -1) return prev;
      next[idx] = nextPhoto;
      return next;
    });
  }

  // clears everything and starts over
  function resetAll() {
    setPhotos([null, null, null, null]);
    setStripUrl(null);
    setStripMime('image/png');
    setStickers([]);
    setCountdown(null);
    setIsCapturing(false);
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

  var showResult = photos[3] != null;
  var photoCount = 0;
  for (var i = 0; i < photos.length; i++) {
    if (photos[i] != null) photoCount++;
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen w-full bg-neutral-50'>
      {showResult ? (
        <ResultView
          photos={photos}
          selectedBorder={selectedBorder}
          BORDERS={BORDERS}
          switchBorder={changeBorder}
          stripUrl={stripUrl}
          setStripUrl={setStripUrl}
          stripMime={stripMime}
          setStripMime={setStripMime}
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
          isCapturing={isCapturing}
          captureMode={captureMode}
          setCaptureMode={setCaptureMode}
        />
      )}
    </div>
  )
}

export default App;
