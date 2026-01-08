import { useEffect, useRef, useState } from 'react';

// photostrip view used for rotating stickers and moving them around
export default function Photostrip({ photos, selectedBorder, stickers, setStickers, setStripUrl }) {
    const canvasRef = useRef(null);
    const imageCache = useRef(new Map());
    const [version, setVersion] = useState(0);

    // all the drag states for stickers
    var isDragging = useRef(false);
    var currentSticker = useRef(null);
    var dragOffsetX = useRef(0);
    var dragOffsetY = useRef(0);
    var resizing = useRef(false);
    var rotating = useRef(false);
    var startSize = useRef(50);
    var startDist = useRef(0);
    var startRot = useRef(0);
    var startAngle = useRef(0);

    const [selectedId, setSelectedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [tempText, setTempText] = useState('');
    const [tempColor, setTempColor] = useState('#000000');

    function loadImage(src) {
        if (src == null || src == undefined) return null;
        if (imageCache.current.has(src)) {
            var cached = imageCache.current.get(src);
            if (cached.complete && cached.naturalWidth > 0) return cached;
            return null;
        }
        var newImg = new Image();
        newImg.src = src;
        imageCache.current.set(src, newImg);
        newImg.onload = function () {
            setVersion(function (v) { return v + 1; });
        };
        newImg.onerror = function () {
            console.log('Failed to load image:', src);
        };
        return null;
    }

    // draws image with cover fit like css object-fit
    function coverDraw(ctx, img, x, y, w, h) {
        var imgRatio = img.width / img.height;
        var boxRatio = w / h;
        var sx = 0;
        var sy = 0;
        var sw = img.width;
        var sh = img.height;
        if (imgRatio > boxRatio) {
            sw = img.height * boxRatio;
            sx = (img.width - sw) / 2;
        } else {
            sh = img.width / boxRatio;
            sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }

    // main drawing function - runs whenever something changes
    useEffect(function () {
        var canvas = canvasRef.current;
        if (canvas == null) return;

        var ctx = canvas.getContext("2d");
        var stripWidth = 300;
        var pad = 15;
        var photoW = stripWidth - pad * 2;
        var photoH = 220;
        var gap = 15;
        var footerH = 100;

        // get all the photos that are not null
        var activePhotos = [];
        for (var i = 0; i < photos.length; i++) {
            if (photos[i]) activePhotos.push(photos[i]);
        }

        var totalH = pad + activePhotos.length * (photoH + gap) + footerH;
        canvas.width = stripWidth;
        canvas.height = totalH;

        // background color
        ctx.fillStyle = selectedBorder.color;
        ctx.fillRect(0, 0, stripWidth, totalH);

        // draw each photo with border
        for (var idx = 0; idx < activePhotos.length; idx++) {
            var yPos = pad + idx * (photoH + gap);
            ctx.fillStyle = selectedBorder.borderColor || '#eee';
            ctx.fillRect(pad - 2, yPos - 2, photoW + 4, photoH + 4);

            var theImg = loadImage(activePhotos[idx]);
            if (theImg != null) {
                coverDraw(ctx, theImg, pad, yPos, photoW, photoH);
            }
        }

        // draw the stickers/text on top
        for (var j = 0; j < stickers.length; j++) {
            var stk = stickers[j];

            if (stk.type == 'text') {
                // draw the text center-aligned
                ctx.save();
                ctx.translate(stk.x, stk.y);
                if (stk.rotation) {
                    ctx.rotate(stk.rotation);
                }

                ctx.font = 'bold ' + stk.size + 'px ' + (stk.font || 'Arial');
                ctx.fillStyle = stk.color || '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // skip if editing
                if (editingId != stk.id) {
                    ctx.fillText(stk.text, 0, 0);
                }

                // show controls if selected
                if (selectedId == stk.id && editingId != stk.id) {
                    var textLines = ctx.measureText(stk.text);
                    var textW = textLines.width;
                    var textH = stk.size;

                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.strokeRect(-textW / 2 - 5, -textH / 2 - 5, textW + 10, textH + 10);
                    ctx.setLineDash([]);

                    // resize dot
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.arc(textW / 2 + 10, textH / 2 + 10, 7, 0, Math.PI * 2);
                    ctx.fill();

                    // rotate dot
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(0, -textH / 2 - 18, 7, 0, Math.PI * 2);
                    ctx.fill();

                    // delete dot
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(textW / 2 + 10, -textH / 2 - 10, 7, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            } else {
                // image handling
                var imgToDraw = loadImage(stk.url);
                if (imgToDraw != null) {
                    ctx.save();
                    ctx.translate(stk.x, stk.y);
                    if (stk.rotation) {
                        ctx.rotate(stk.rotation);
                    }

                    // get proper aspect ratio
                    var naturalW = imgToDraw.width;
                    var naturalH = imgToDraw.height;
                    var artRatio = naturalW / naturalH;

                    var finalW = stk.size;
                    var finalH = stk.size / artRatio;

                    ctx.drawImage(imgToDraw, -finalW / 2, -finalH / 2, finalW, finalH);

                    if (selectedId == stk.id) {
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 4]);
                        ctx.strokeRect(-finalW / 2 - 3, -finalH / 2 - 3, finalW + 6, finalH + 6);
                        ctx.setLineDash([]);

                        // handles
                        ctx.fillStyle = '#22c55e';
                        ctx.beginPath();
                        ctx.arc(finalW / 2 + 8, finalH / 2 + 8, 7, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#f97316';
                        ctx.beginPath();
                        ctx.arc(0, -finalH / 2 - 18, 7, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath();
                        ctx.arc(finalW / 2 + 8, -finalH / 2 - 8, 7, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }
        }

        var logoImg = loadImage('/logo.png');
        if (logoImg != null) {
            var logoSz = 60;
            var logoX = (stripWidth - logoSz) / 2;
            var logoY = totalH - footerH + (footerH - logoSz) / 2 - 10;
            ctx.drawImage(logoImg, logoX, logoY, logoSz, logoSz);
        }

        ctx.fillStyle = selectedBorder.textColor;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PHOTOBOOTH', stripWidth / 2, totalH - 20);

        if (canvasRef.current) {
            try {
                setStripUrl(canvasRef.current.toDataURL("image/png"));
            } catch (err) {
                setStripUrl(null);
            }
        }
    }, [photos, selectedBorder, stickers, version, selectedId, editingId]);

    function getCanvasCoords(e) {
        var box = canvasRef.current.getBoundingClientRect();
        var scaleX = canvasRef.current.width / box.width;
        var scaleY = canvasRef.current.height / box.height;
        return {
            x: (e.clientX - box.left) * scaleX,
            y: (e.clientY - box.top) * scaleY
        };
    }

    // search for sticker at pixel position
    function findStickerAt(mx, my) {
        var context = canvasRef.current.getContext("2d");
        for (var i = stickers.length - 1; i >= 0; i--) {
            var item = stickers[i];
            var rot = item.rotation || 0;
            var dx = mx - item.x;
            var dy = my - item.y;

            // rotate the search point
            var localX = dx * Math.cos(-rot) - dy * Math.sin(-rot);
            var localY = dx * Math.sin(-rot) + dy * Math.cos(-rot);

            if (item.type == 'text') {
                context.font = 'bold ' + item.size + 'px Arial';
                var textW = context.measureText(item.text).width;
                var textH = item.size;
                if (localX >= -textW / 2 && localX <= textW / 2 && localY >= -textH / 2 && localY <= textH / 2) {
                    return item;
                }
            } else {
                var loaded = loadImage(item.url);
                var ratio = 1;
                if (loaded) ratio = loaded.width / loaded.height;
                var halfW = item.size / 2;
                var halfH = (item.size / ratio) / 2;
                if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
                    return item;
                }
            }
        }
        return null;
    }

    function onMouseDown(e) {
        if (editingId != null) return;

        var coords = getCanvasCoords(e);
        var cx = coords.x;
        var cy = coords.y;

        // check if we are clicking a handle of the selected item
        if (selectedId != null) {
            var target = null;
            for (var m = 0; m < stickers.length; m++) {
                if (stickers[m].id == selectedId) {
                    target = stickers[m];
                    break;
                }
            }

            if (target != null) {
                var ang = target.rotation || 0;
                var offX = cx - target.x;
                var offY = cy - target.y;
                var lx = offX * Math.cos(-ang) - offY * Math.sin(-ang);
                var ly = offX * Math.sin(-ang) + offY * Math.cos(-ang);

                var w, h, rotPosY, delPosY;
                if (target.type == 'text') {
                    var ctx = canvasRef.current.getContext("2d");
                    ctx.font = 'bold ' + target.size + 'px Arial';
                    w = ctx.measureText(target.text).width;
                    h = target.size;
                    rotPosY = -h / 2 - 18;
                    delPosY = -h / 2 - 10;
                } else {
                    var img = loadImage(target.url);
                    var rat = 1;
                    if (img) rat = img.width / img.height;
                    w = target.size;
                    h = target.size / rat;
                    rotPosY = -h / 2 - 18;
                    delPosY = -h / 2 - 8;
                }

                // handle delete
                var distDel = Math.sqrt(Math.pow(lx - (w / 2 + 10), 2) + Math.pow(ly - delPosY, 2));
                if (distDel < 12) {
                    var sid = target.id;
                    setStickers(function (old) {
                        var filtered = [];
                        for (var i = 0; i < old.length; i++) {
                            if (old[i].id != sid) filtered.push(old[i]);
                        }
                        return filtered;
                    });
                    setSelectedId(null);
                    return;
                }

                // handle resize
                var distRes = Math.sqrt(Math.pow(lx - (w / 2 + 8), 2) + Math.pow(ly - (h / 2 + 8), 2));
                if (distRes < 12) {
                    resizing.current = true;
                    currentSticker.current = target;
                    startSize.current = target.size;
                    startDist.current = Math.sqrt(offX * offX + offY * offY);
                    return;
                }

                // handle rotate
                var distRot = Math.sqrt(lx * lx + Math.pow(ly - rotPosY, 2));
                if (distRot < 12) {
                    rotating.current = true;
                    currentSticker.current = target;
                    startRot.current = ang;
                    startAngle.current = Math.atan2(cy - target.y, cx - target.x);
                    return;
                }
            }
        }

        var found = findStickerAt(cx, cy);
        if (found != null) {
            isDragging.current = true;
            currentSticker.current = found;
            dragOffsetX.current = cx - found.x;
            dragOffsetY.current = cy - found.y;
            setSelectedId(found.id);
        } else {
            setSelectedId(null);
        }
    }

    function onMouseMove(e) {
        if (editingId != null) return;

        var coords = getCanvasCoords(e);
        var cx = coords.x;
        var cy = coords.y;

        if (isDragging.current && currentSticker.current) {
            var nx = cx - dragOffsetX.current;
            var ny = cy - dragOffsetY.current;
            var cid = currentSticker.current.id;

            setStickers(function (old) {
                var next = [];
                for (var i = 0; i < old.length; i++) {
                    var it = old[i];
                    if (it.id == cid) {
                        next.push({ ...it, x: nx, y: ny });
                    } else {
                        next.push(it);
                    }
                }
                return next;
            });
        }

        if (resizing.current && currentSticker.current) {
            var dx = cx - currentSticker.current.x;
            var dy = cy - currentSticker.current.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            var ratio = d / startDist.current;
            var newsz = startSize.current * ratio;

            if (newsz < 10) newsz = 10;
            if (newsz > 400) newsz = 400;

            var rid = currentSticker.current.id;
            setStickers(function (old) {
                var next = [];
                for (var i = 0; i < old.length; i++) {
                    var it = old[i];
                    if (it.id == rid) {
                        next.push({ ...it, size: newsz });
                    } else {
                        next.push(it);
                    }
                }
                return next;
            });
        }

        if (rotating.current && currentSticker.current) {
            var ang = Math.atan2(cy - currentSticker.current.y, cx - currentSticker.current.x);
            var delta = ang - startAngle.current;
            var newRot = startRot.current + delta;

            var roid = currentSticker.current.id;
            setStickers(function (old) {
                var next = [];
                for (var i = 0; i < old.length; i++) {
                    var it = old[i];
                    if (it.id == roid) {
                        next.push({ ...it, rotation: newRot });
                    } else {
                        next.push(it);
                    }
                }
                return next;
            });
        }
    }

    function onMouseUp() {
        isDragging.current = false;
        resizing.current = false;
        rotating.current = false;
        currentSticker.current = null;
    }

    function onDoubleClick(e) {
        var pts = getCanvasCoords(e);
        var hit = findStickerAt(pts.x, pts.y);
        if (hit && hit.type == 'text') {
            setEditingId(hit.id);
            setTempText(hit.text);
            setTempColor(hit.color || '#000000');
        }
    }

    function finishEdit() {
        if (editingId == null) return;
        var eid = editingId;
        setStickers(function (old) {
            var next = [];
            for (var i = 0; i < old.length; i++) {
                var it = old[i];
                if (it.id == eid) {
                    next.push({ ...it, text: tempText, color: tempColor });
                } else {
                    next.push(it);
                }
            }
            return next;
        });
        setEditingId(null);
    }

    function onDrop(e) {
        e.preventDefault();
        var url = e.dataTransfer.getData('stickerUrl');
        if (!url || url == '') return;

        var pts = getCanvasCoords(e);
        var stk = {
            id: Date.now(),
            type: 'image',
            url: url,
            x: pts.x,
            y: pts.y,
            size: 60,
            rotation: 0
        };
        var nextStks = stickers.slice();
        nextStks.push(stk);
        setStickers(nextStks);
        setSelectedId(stk.id);
    }

    // find the edited sticker for class calculation
    var edited = null;
    var sw = 1, sh = 1;
    if (editingId != null && canvasRef.current) {
        for (var i = 0; i < stickers.length; i++) {
            if (stickers[i].id == editingId) {
                edited = stickers[i];
                break;
            }
        }
        var bounds = canvasRef.current.getBoundingClientRect();
        sw = bounds.width / canvasRef.current.width;
        sh = bounds.height / canvasRef.current.height;
    }

    return (
        <div className="relative inline-block leading-[0]">
            <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onDoubleClick={onDoubleClick}
                onDragOver={function (e) { e.preventDefault(); }}
                onDrop={onDrop}
                className="border border-neutral-200 shadow-2xl bg-white max-h-[80vh] w-auto object-contain cursor-crosshair"
            />

            {editingId && edited && (
                <div
                    className="absolute z-[100] text-center font-bold bg-white border-2 border-blue-500 px-2 py-1 shadow-xl"
                    style={{
                        left: (edited.x * sw) + 'px',
                        top: (edited.y * sh) + 'px',
                        transform: 'translate(-50%, -50%) rotate(' + (edited.rotation || 0) + 'rad)',
                        fontSize: (edited.size * sh) + 'px',
                        color: tempColor
                    }}
                >
                    <input
                        autoFocus
                        className="bg-transparent border-none outline-none w-full text-center font-bold font-sans tracking-tight"
                        style={{ color: 'inherit', font: 'inherit' }}
                        value={tempText}
                        onChange={function (e) { setTempText(e.target.value); }}
                        onKeyDown={function (e) { if (e.key == 'Enter') finishEdit(); }}
                    />

                    {/* color picker popup */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-2 rounded-lg border border-neutral-200 flex items-center gap-3 shadow-2xl">
                        <input
                            type="color"
                            className="w-10 h-10 cursor-pointer border-none bg-transparent"
                            value={tempColor}
                            onChange={function (e) { setTempColor(e.target.value); }}
                        />
                        <button
                            onClick={finishEdit}
                            className="bg-neutral-900 text-white px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
