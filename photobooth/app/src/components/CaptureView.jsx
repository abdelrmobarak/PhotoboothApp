import Webcam from 'react-webcam'

// main capture screen
export default function CaptureView({ webcamRef, capture, photoCount, countdown }) {

    var buttonText = "Capture Photo " + photoCount + "/4";
    if (countdown != null) {
        buttonText = "Taking the Photo!";
    }

    var isDisabled = countdown != null;

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
