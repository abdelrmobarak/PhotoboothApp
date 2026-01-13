import Webcam from 'react-webcam'

// main capture screen
export default function CaptureView({ webcamRef, capture, photoCount, countdown, isCapturing, captureMode, setCaptureMode }) {

    var buttonText = "Capture Photo " + photoCount + "/4";
    if (countdown != null) {
        buttonText = "Get Ready!";
    }
    if (isCapturing) {
        buttonText = "Capturing GIF...";
    }

    var isDisabled = countdown != null || isCapturing;
    var lockMode = photoCount > 0 || isDisabled;

    return (
        <div className="flex flex-col items-center gap-8">
            <div className='text-6xl font-black text-neutral-800'>Photobooth</div>
            <div className="relative rounded-3xl overflow-hidden border-8 border-white shadow-2xl bg-black">
                <Webcam
                    ref={webcamRef}
                    mirrored={true}
                    audio={false}
                    screenshotFormat="image/png"
                    videoConstraints={{ facingMode: 'user' }}
                    className="w-full max-w-[85vw] aspect-video object-cover"
                />
            </div>

            {countdown != null && (
                <div className="text-8xl font-black text-neutral-900">
                    {countdown}
                </div>
            )}
            {isCapturing && countdown == null && (
                <div className="text-3xl font-black text-neutral-900 uppercase tracking-wide">
                    Capturing...
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    disabled={lockMode}
                    onClick={() => setCaptureMode('gif')}
                    className={"px-5 py-2 rounded-full text-sm font-black uppercase tracking-wide border-2 transition-all " + (captureMode == 'gif' ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500") + (lockMode ? " opacity-50 cursor-not-allowed" : "")}
                >
                    GIF Strip
                </button>
                <button
                    type="button"
                    disabled={lockMode}
                    onClick={() => setCaptureMode('image')}
                    className={"px-5 py-2 rounded-full text-sm font-black uppercase tracking-wide border-2 transition-all " + (captureMode == 'image' ? "bg-black text-white border-black" : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500") + (lockMode ? " opacity-50 cursor-not-allowed" : "")}
                >
                    Image Strip
                </button>
            </div>

            <button
                onClick={capture}
                disabled={isDisabled}
                className="bg-neutral-900 text-white px-12 py-6 rounded-full font-bold text-xl hover:bg-neutral-800 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        </div>
    );
}
