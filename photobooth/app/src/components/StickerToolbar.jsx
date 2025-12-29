// sticker selection toolbar
export default function StickerToolbar({ onAddSticker, onAddText }) {

    // local svg props in the public folder
    var stickerList = [
        { id: 'heart', url: '/heart.svg', name: 'Heart' },
        { id: 'sunglasses', url: '/sunglasses.svg', name: 'Sunglasses' },
        { id: 'moustache', url: '/moustache.png', name: 'Moustache' },
        { id: 'kiss', url: '/kiss.png', name: 'Kiss' },
        { id: 'pirate', url: '/pirate-hat.png', name: 'Pirate Hat' },
    ];

    function handleDragStart(e, url) {
        e.dataTransfer.setData('stickerUrl', url);
    }

    function handleClick(url) {
        onAddSticker(url);
    }

    // build the button list manually
    var buttons = [];
    for (var i = 0; i < stickerList.length; i++) {
        var stk = stickerList[i];
        buttons.push(
            <button
                key={stk.id}
                draggable={true}
                onDragStart={function (url) { return function (e) { handleDragStart(e, url); }; }(stk.url)}
                onClick={function (url) { return function () { handleClick(url); }; }(stk.url)}
                className="w-12 h-12 p-2 bg-white rounded-lg border border-neutral-200 hover:border-blue-400 hover:scale-110 transition-all flex items-center justify-center shadow-sm"
            >
                <img src={stk.url} alt={stk.name} className="w-full h-full object-contain" />
            </button>
        );
    }

    return (
        <div className="w-full">
            <h3 className="text-sm font-bold uppercase mb-3">Props & Text</h3>
            <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-xl mb-3">
                {buttons}
            </div>
            <button
                onClick={onAddText}
                draggable={true}
                onDragStart={function (e) {
                    e.dataTransfer.setData('stickerType', 'text');
                }}
                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-neutral-700 transition-all cursor-move"
            >
                Add Text
            </button>
            <p className="flex items-center justify-center text-sm text-gray-400 mt-2">Drag and drop to add props or text!</p>
        </div>
    );
}
