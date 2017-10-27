// import React from 'react';
// import ReactDOM from 'react-dom';
// import './index.css';
// import App from './App';
// import registerServiceWorker from './registerServiceWorker';

// ReactDOM.render(<App />, document.getElementById('root'));
// registerServiceWorker();

import ROT from 'rot-js'
import { CONFIG, SETTINGS, TILES } from './data'

const shuffle = arr => {
    let s = [];
    while (arr.length) s.push(arr.splice(Math.random() * arr.length|0, 1)[0]);
    while (s.length) arr.push(s.pop());
}

const display = new ROT.Display({
    width: document.documentElement.clientWidth / (CONFIG.tileSize * SETTINGS.tileMag),
    height: document.documentElement.clientHeight / (CONFIG.tileSize * SETTINGS.tileMag),
    bg: "#111",
    layout: "tile",
    fontSize: CONFIG.tileSize,
    tileWidth: CONFIG.tileSize,
    tileHeight: CONFIG.tileSize,
    tileSet: TILES.tileSet,
    tileMap: TILES.tilemap,
    tileColorize: false
});

const MAP_LAYERS = {
    BACKGROUND: 0,
    STATIC: 1,
    ACTORS: 2,
    OVERLAY: 3
}
const MAP_LAYER_COUNT = Object.keys(MAP_LAYERS).length;

let map = new Array(MAP_LAYER_COUNT);

const initMap = (width, height) => {
    map = new Array(MAP_LAYER_COUNT);
    for (let i = 0; i < MAP_LAYER_COUNT; i++) {
        map[i] = new Array(width * height);
    }
}

const getRange = (low, high) => Array.from(Array(high - low), (_, i) => i + low)

const generateMap = (width, height) => {
    initMap(width, height);
    const digger = new ROT.Map.Digger(width, height, {
        roomWidth: [3, 9],
        roomHeight: [3, 5],
        corridorLength: [3, 10],
        dugPercentage: 0.3,
        timeLimit: 3000
    });
    const walls = [ TILES.tree, TILES.tree2, TILES.tree3 ];
    const floors = [ TILES.grass_plain, TILES.grass_plain, TILES.grass_plain, TILES.grass_little, TILES.grass_little, TILES.grass_lots ];
    const doors = [ TILES.door_wood, TILES.door_metal ];
    const decor = [ TILES.flowers, TILES.flowers, TILES.bush, TILES.bush, TILES.rocks, TILES.tree, TILES.tree2, TILES.tree3 ];
    digger.create((x, y, isWall) => {
        map[MAP_LAYERS.BACKGROUND][x + y * width] = isWall ? walls.random() : floors.random();
    })
    const freeTiles = [];
    const rooms = digger.getRooms();
    rooms.forEach(room => {
        room.getDoors((x, y) => {
            map[MAP_LAYERS.BACKGROUND][x + y * width] = doors.random();
        })
        for (let y = room.getTop(); y < room.getBottom(); y++) {
            for (let x = room.getLeft(); x < room.getRight(); x++) {
                freeTiles.push({ x, y })
            }
        }
    })

    shuffle(freeTiles)
    let numKeys = Math.floor(Math.random() * 5);
    while (numKeys-- > 0 && freeTiles.length) {
        const keyTile = freeTiles.pop();
        map[MAP_LAYERS.STATIC][keyTile.x, keyTile.y * width] = TILES.key;
    } 

    let numDecor = Math.floor(Math.random() * 40);
    while (numDecor-- > 0 && freeTiles.length) {
        const decorTile = freeTiles.pop();
        map[MAP_LAYERS.STATIC][decorTile.x + decorTile.y * width] = decor.random();
    }

    drawWholeMap();
}

const generateBoxes = (freeCells) =>
    getRange(1, 10).forEach(() => {
        const index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        const key = freeCells.splice(index, 1)[0];
        map[key] = "*";
    })

const makeDrawTile = (tileWidth, tileHeight) => (x, y, tile) => {
    if (!tile) return;
    const tileCoords = tile.tileCoords;
    display._context.drawImage(
        TILES.tileset,
        tileCoords[0], tileCoords[1], tileWidth, tileHeight,
        x*tileWidth, y*tileHeight, tileWidth, tileHeight
    )
}

const drawWholeMap = () => {
    display._context.fillStyle = display._options.bg;
    display._context.fillRect(0, 0, display._context.canvas.width, display._context.canvas.height);

    const width = display.getOptions().width;
    const height = display.getOptions().height;
    const tileWidth = display.getOptions().tileWidth;
    const tileHeight = display.getOptions().tileHeight;

    const drawTile = makeDrawTile(tileWidth, tileHeight);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            drawTile(x, y, map[MAP_LAYERS.BACKGROUND][x + y * width]);
            if (map[MAP_LAYERS.STATIC][x+y*width]) {
                drawTile(x, y, map[MAP_LAYERS.STATIC][x+y*width]);
            }
        }
    }
}

document.body.onload = () => {
    document.body.appendChild(display.getContainer());
    generateMap(50, 50);
}

document.addEventListener("click", () => generateMap(50, 50));