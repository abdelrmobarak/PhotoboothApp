import { useRef, useState, useEffect } from 'react';
import Photostrip from './Photostrip';
import StickerToolbar from './StickerToolbar';

// result page with grid editing and photostrip
export default function ResultView({ photos, selectedBorder, BORDERS, switchBorder, stripUrl, setStripUrl, stripMime, setStripMime, clearPhoto, stickers, setStickers }) {
    // some refs for dragging on the grid
    var gridDragId = useRef(null);
    var gridDragIdx = useRef(null);
    var gridDragStartX = useRef(0);
    var gridDragStartY = useRef(0);
    var gridDragStartStkX = useRef(0);
    var gridDragStartStkY = useRef(0);

    // refs for resizing and rotating on the grid
    var gridResizing = useRef(false);
    var gridRotating = useRef(false);
    var gridStartSize = useRef(60);
    var gridStartDist = useRef(0);
    var gridStartRot = useRef(0);
    var gridStartAngle = useRef(0);

    // local selection for grid
    var [selectedId, setSelectedId] = useState(null);
    var [editingId, setEditingId] = useState(null);
    var [tempText, setTempText] = useState('');
    var [tempColor, setTempColor] = useState('#000000');
    var [tempFont, setTempFont] = useState('Arial');
    var [gifFrame, setGifFrame] = useState(0);
    var gifTimer = useRef(null);

    var FONTS = ['Arial', 'Georgia', 'Courier New'];

    var isGifMode = false;
    for (var g = 0; g < photos.length; g++) {
        if (photos[g] && photos[g].frames && photos[g].frames.length > 1) {
            isGifMode = true;
            break;
        }
    }

    function getPhotoFrameSrc(photo, frameIdx) {
        if (!photo) return null;
        if (typeof photo == 'string') return photo;
        if (photo.frames && photo.frames.length > 0) {
            var idx = frameIdx % photo.frames.length;
            return photo.frames[idx];
        }
        return photo.still || null;
    }

    useEffect(function () {
        if (gifTimer.current) {
            clearInterval(gifTimer.current);
            gifTimer.current = null;
        }

        if (isGifMode) {
            gifTimer.current = setInterval(function () {
                setGifFrame(function (prev) { return prev + 1; });
            }, 140);
        }

        return function () {
            if (gifTimer.current) {
                clearInterval(gifTimer.current);
                gifTimer.current = null;
            }
        };
    }, [isGifMode]);

    // constants to match Photostrip
    var stripW = 300;
    var pad = 15;
    var photoW = 270;
    var photoH = 220;
    var gap = 15;

    // handle adding sticker via click
    function handleAddSticker(url) {
        var stk = {
            id: Date.now(),
            url: url,
            x: 150,
            y: 150,
            size: 60,
            rotation: 0,
            type: 'image'
        };
        var next = stickers.slice();
        next.push(stk);
        setStickers(next);
        setSelectedId(stk.id);
    }

    // handle adding text via click
    function handleAddText() {
        var txt = {
            id: Date.now(),
            type: 'text',
            text: 'Edit me!',
            x: 150,
            y: 150,
            size: 40,
            rotation: 0,
            color: '#000000',
            font: 'Arial'
        };
        var next = stickers.slice();
        next.push(txt);
        setStickers(next);
        setSelectedId(txt.id);
    }

    // drop logic for the big grid
    function handleDropOnPhoto(e, idx) {
        e.preventDefault();
        e.stopPropagation(); 

        var type = e.dataTransfer.getData('stickerType');
        var url = e.dataTransfer.getData('stickerUrl');

        if ((!url || url == '') && type != 'text') return;

        var box = e.currentTarget.getBoundingClientRect();
        var lx = e.clientX - box.left;
        var ly = e.clientY - box.top;

        // map grid pixels to strip coordinates
        var mx = pad + (lx / box.width) * photoW;
        var my = (pad + idx * (photoH + gap)) + (ly / box.height) * photoH;

        var newItem;
        if (type == 'text') {
            newItem = {
                id: Date.now(),
                type: 'text',
                text: 'Edit me!',
                x: mx,
                y: my,
                size: 40,
                rotation: 0,
                color: '#000000',
                font: 'Arial'
            };
        } else {
            newItem = {
                id: Date.now(),
                type: 'image',
                url: url,
                x: mx,
                y: my,
                size: 60,
                rotation: 0
            };
        }

        var next = stickers.slice();
        next.push(newItem);
        setStickers(next);
        setSelectedId(newItem.id);
    }

    // start interacting with a grid item
    function handleGridItemDown(e, stk, idx, action) {
        e.stopPropagation();
        setSelectedId(stk.id);

        gridDragIdx.current = idx;
        gridDragStartX.current = e.clientX;
        gridDragStartY.current = e.clientY;
        gridDragStartStkX.current = stk.x;
        gridDragStartStkY.current = stk.y;
        gridDragId.current = stk.id;

        var cell = document.querySelector('[data-grid-idx="' + idx + '"]');
        if (!cell) return;
        var rect = cell.getBoundingClientRect();

        if (action == 'resize') {
            gridResizing.current = true;
            gridStartSize.current = stk.size;
            var cx = (stk.x - pad) / photoW * rect.width;
            var cy = (stk.y - (pad + idx * (photoH + gap))) / photoH * rect.height;
            var dx = e.clientX - rect.left - cx;
            var dy = e.clientY - rect.top - cy;
            gridStartDist.current = Math.sqrt(dx * dx + dy * dy);
        } else if (action == 'rotate') {
            gridRotating.current = true;
            gridStartRot.current = stk.rotation || 0;
            var cx = (stk.x - pad) / photoW * rect.width;
            var cy = (stk.y - (pad + idx * (photoH + gap))) / photoH * rect.height;
            gridStartAngle.current = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx);
        } else {
            gridDragId.current = stk.id;
        }

        window.addEventListener('mousemove', handleGridMouseMove);
        window.addEventListener('mouseup', handleGridMouseUp);
    }

    function handleGridMouseMove(ae) {
        if (!gridDragId.current) return;

        var cell = document.querySelector('[data-grid-idx="' + gridDragIdx.current + '"]');
        if (!cell) return;
        var rect = cell.getBoundingClientRect();

        var id = gridDragId.current;

        setStickers(function (prev) {
            var next = [];
            for (var i = 0; i < prev.length; i++) {
                var s = prev[i];
                if (s.id == id) {
                    if (gridResizing.current) {
                        var cx = (gridDragStartStkX.current - pad) / photoW * rect.width;
                        var cy = (gridDragStartStkY.current - (pad + gridDragIdx.current * (photoH + gap))) / photoH * rect.height;
                        var dx = ae.clientX - rect.left - cx;
                        var dy = ae.clientY - rect.top - cy;
                        var dist = Math.sqrt(dx * dx + dy * dy);
                        var ratio = dist / gridStartDist.current;
                        var nSz = gridStartSize.current * ratio;
                        if (nSz < 10) nSz = 10;
                        if (nSz > 400) nSz = 400;
                        next.push({ ...s, size: nSz });
                    } else if (gridRotating.current) {
                        var cx = (gridDragStartStkX.current - pad) / photoW * rect.width;
                        var cy = (gridDragStartStkY.current - (pad + gridDragIdx.current * (photoH + gap))) / photoH * rect.height;
                        var ang = Math.atan2(ae.clientY - rect.top - cy, ae.clientX - rect.left - cx);
                        var diff = ang - gridStartAngle.current;
                        next.push({ ...s, rotation: gridStartRot.current + diff });
                    } else {
                        var dx = ae.clientX - gridDragStartX.current;
                        var dy = ae.clientY - gridDragStartY.current;
                        var mx = (dx / rect.width) * photoW;
                        var my = (dy / rect.height) * photoH;
                        next.push({ ...s, x: gridDragStartStkX.current + mx, y: gridDragStartStkY.current + my });
                    }
                } else {
                    next.push(s);
                }
            }
            return next;
        });
    }

    function handleGridMouseUp() {
        gridDragId.current = null;
        gridResizing.current = false;
        gridRotating.current = false;
        window.removeEventListener('mousemove', handleGridMouseMove);
        window.removeEventListener('mouseup', handleGridMouseUp);
    }

    function handleDelete(sid) {
        var next = [];
        for (var i = 0; i < stickers.length; i++) {
            if (stickers[i].id != sid) {
                next.push(stickers[i]);
            }
        }
        setStickers(next);
        setSelectedId(null);
    }

    function handleTextClick(stk) {
        setEditingId(stk.id);
        setTempText(stk.text);
        setTempColor(stk.color || '#000000');
        setTempFont(stk.font || 'Arial');
    }

    function finishEdit() {
        if (!editingId) return;
        var eid = editingId;
        setStickers(function (prev) {
            var next = [];
            for (var i = 0; i < prev.length; i++) {
                if (prev[i].id == eid) {
                    next.push({ ...prev[i], text: tempText, color: tempColor, font: tempFont });
                } else {
                    next.push(prev[i]);
                }
            }
            return next;
        });
        setEditingId(null);
    }

    function handleSave() {
        if (!stripUrl) return;
        var link = document.createElement('a');
        var isGif = stripMime == 'image/gif';
        link.download = isGif ? 'photostrip.gif' : 'photostrip.png';
        if (stripUrl.indexOf('data:') == 0) {
            var parts = stripUrl.split(',');
            var meta = parts[0] || '';
            var b64 = parts[1] || '';
            var match = meta.match(/:(.*?);/);
            var mime = match ? match[1] : 'image/png';
            var byteString = atob(b64);
            var len = byteString.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = byteString.charCodeAt(i);
            }
            var blob = new Blob([bytes], { type: mime });
            var url = URL.createObjectURL(blob);
            link.href = url;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } else {
            link.href = stripUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    }

    // border buttons logic
    var borderButtons = [];
    for (let i = 0; i < BORDERS.length; i++) {
        let b = BORDERS[i];
        var isSel = selectedBorder.id == b.id;

        var btnClass = "p-4 rounded-xl font-bold transition-all border-4 text-lg border-gray-200";
        if (isSel) btnClass += "border-blue-500 scale-105 shadow-md ";
        else btnClass += "border-transparent hover:scale-105 ";

        if (b.id == 0) btnClass += "bg-white text-black";
        if (b.id == 1) btnClass += "bg-neutral-900 text-white";
        if (b.id == 2) btnClass += "bg-blue-700 text-white";
        if (b.id == 3) btnClass += "bg-red-600 text-white";

        borderButtons.push(
            <button
                key={b.id}
                onClick={() => switchBorder(b.id)}
                className={btnClass}
            >
                {b.name}
            </button>
        );
    }
    var gridCells = [];
    for (let k = 0; k < 4; k++) {
        var photoSrc = getPhotoFrameSrc(photos[k], gifFrame);
        var itemsInThisCell = [];

        // check each sticker to see if it lives in this photo's vertical slice
        var sliceTop = pad + k * (photoH + gap);
        var sliceBottom = sliceTop + photoH;

        for (var m = 0; m < stickers.length; m++) {
            var s = stickers[m];
            // if sticker center is within the photo bounds
            if (s.y >= sliceTop - s.size && s.y <= sliceBottom + s.size) {
                var isSelected = selectedId == s.id;
                var relX = (s.x - pad) / photoW;
                var relY = (s.y - sliceTop) / photoH;

                // get icon aspect ratio
                var ratio = 1;
                if (s.type == 'image') {
                    // finding aspect ratio for stickers
                    var imgElement = document.createElement('img');
                    imgElement.src = s.url;
                    if (imgElement.naturalWidth > 0) {
                        ratio = imgElement.naturalWidth / imgElement.naturalHeight;
                    }
                }

                var itemWidth = (s.size / photoW * 100) + 'cqw';
                var itemStyle = {
                    left: (relX * 100) + '%',
                    top: (relY * 100) + '%',
                    width: s.type == 'image' ? itemWidth : 'auto',
                    transform: 'translate(-50%, -50%) rotate(' + (s.rotation || 0) + 'rad)',
                };

                itemsInThisCell.push(
                    <div
                        key={s.id + '-' + k}
                        onMouseDown={(e) => handleGridItemDown(e, s, k, 'drag')}
                        onDoubleClick={() => {
                            if (s.type == 'text') handleTextClick(s);
                        }}
                        style={itemStyle}
                        className={"absolute cursor-move select-none pointer-events-auto " + (isSelected ? "ring-2 ring-blue-500 ring-offset-2 z-50" : "z-10")}
                    >
                        {s.type == 'text' ? (
                            <div
                                style={{
                                    color: s.color || '#000000',
                                    fontSize: (s.size / photoH * 100) + 'cqh',
                                    fontFamily: s.font || 'Arial'
                                }}
                                className="font-bold whitespace-nowrap"
                            >
                                {s.text}
                            </div>
                        ) : (
                            <img
                                src={s.url}
                                className="w-full h-auto pointer-events-none block max-w-none"
                            />
                        )}

                        {isSelected && !editingId && (
                            <>
                                <div
                                    onMouseDown={(e) => handleGridItemDown(e, s, k, 'resize')}
                                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-green-500 rounded-full border-2 border-white cursor-nwse-resize shadow flex items-center justify-center"
                                />
                                <div
                                    onMouseDown={(e) => handleGridItemDown(e, s, k, 'rotate')}
                                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-500 rounded-full border-2 border-white cursor-pointer shadow"
                                />
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(s.id);
                                    }}
                                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full border-2 border-white cursor-pointer shadow flex items-center justify-center text-[10px] text-white font-bold"
                                >
                                    ×
                                </div>
                            </>
                        )}
                    </div>
                );
            }
        }


        gridCells.push(
            <div
                key={k}
                data-grid-idx={k}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnPhoto(e, k)}
                onMouseDown={() => setSelectedId(null)}
                className="relative bg-black rounded-lg border-2 border-neutral-300 shadow flex items-center justify-center select-none aspect-[270/220] [container-type:size]"
            >
                {photoSrc ? (
                    <img src={photoSrc} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                    <span className="text-neutral-500 font-bold italic text-xs uppercase">Photo {k + 1}</span>
                )}
                <div className="absolute inset-0 pointer-events-none">
                    {itemsInThisCell}
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-[95vw] lg:max-w-none min-h-screen lg:fixed lg:inset-0 lg:h-screen lg:w-screen p-4 lg:p-0 origin-center'>
            <div className="w-full lg:flex-1 max-w-xl order-2 lg:order-1">
                <h2 className="text-2xl font-black text-neutral-800 mb-6 uppercase">1. Decorate Photos</h2>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-3xl border-2 border-dashed border-neutral-300">
                    {gridCells}
                </div>
                <p className='flex justify-center'>You can drag and drop props onto here and see the preview to the right!</p>

                {editingId && (
                    <div className="mt-8 bg-white p-4 rounded-2xl shadow-2xl border border-neutral-200 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <input
                            autoFocus
                            style={{ fontFamily: tempFont }}
                            value={tempText}
                            onChange={(e) => setTempText(e.target.value)}
                            onKeyDown={(e) => { if (e.key == 'Enter') finishEdit(); }}
                        />

                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-black text-neutral-400">Font</span>
                            <div className="flex gap-2">
                                {FONTS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTempFont(f)}
                                        style={{ fontFamily: f }}
                                        className={"flex-1 py-2 px-1 rounded-lg border-2 text-[10px] font-bold transition-all " + (tempFont == f ? "border-blue-500 bg-blue-50 text-blue-600" : "border-neutral-100 hover:border-neutral-200")}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <input
                                type="color"
                                className="w-12 h-12 cursor-pointer rounded-lg border-2 border-neutral-100 p-1"
                                value={tempColor}
                                onChange={(e) => setTempColor(e.target.value)}
                            />
                            <button
                                onClick={finishEdit}
                                className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase text-sm transition-all"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center order-3 lg:order-2">
                <span className="text-md uppercase font-black text-neutral-400 mb-4">Strip View</span>
                <div>
                    <div className={stripMime == 'image/gif' ? 'hidden' : 'block'}>
                        <Photostrip
                            photos={photos}
                            selectedBorder={selectedBorder}
                            stickers={stickers}
                            setStickers={setStickers}
                            setStripUrl={setStripUrl}
                            setStripMime={setStripMime}
                        />
                    </div>
                    {stripMime == 'image/gif' && stripUrl && (
                        <img
                            src={stripUrl}
                            alt="Animated photostrip preview"
                            className="border border-neutral-200 shadow-2xl max-h-[80vh] w-auto object-contain rounded-md"
                        />
                    )}
                    {stripMime == 'image/gif' && !stripUrl && (
                        <div className="border border-dashed border-neutral-300 rounded-md px-6 py-8 text-sm font-bold text-neutral-400">
                            Rendering GIF...
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:max-w-xs flex flex-col gap-6 order-1 lg:order-3">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
                    <h2 className="text-xl font-black mb-4 text-neutral-800">2. BORDER</h2>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {borderButtons}
                    </div>
                    <StickerToolbar
                        onAddSticker={handleAddSticker}
                        onAddText={handleAddText}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!stripUrl}
                        className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {stripMime == 'image/gif' ? 'SAVE GIF' : 'SAVE STRIP'}
                    </button>
                    <button
                        onClick={clearPhoto}
                        className="w-full bg-gray-300 text-neutral-500 py-4 rounded-2xl font-black text-sm"
                    >
                        TAKE A NEW PHOTO
                    </button>
                </div>
            </div>
        </div>
    );
}
