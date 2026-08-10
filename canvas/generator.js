class BackroomsGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.mapSize = 24;
        this.map = [];
        this.fov = Math.PI / 1.8; // 100 degrees (Wide panoramic view)
        
        // Colors from Level 0 aesthetic
        this.colors = {
            wallBase: '#C7B97A',
            wallShadow: '#7A7045',
            floorBase: '#6B5F18',
            floorShadow: '#3D350B',
            ceilingBase: '#E0DAB6',
            ceilingShadow: '#857C41',
            light: '#FFFFEE'
        };

        this.minimapCanvas = document.getElementById('minimapCanvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }

    generateMap() {
        this.map = [];
        let tempMap = [];
        // Step 1: Initial random noise
        for (let y = 0; y < this.mapSize; y++) {
            let row = [];
            for (let x = 0; x < this.mapSize; x++) {
                if (x === 0 || x === this.mapSize - 1 || y === 0 || y === this.mapSize - 1) {
                    row.push(1);
                } else {
                    row.push(Math.random() > 0.6 ? 1 : 0); // 40% walls
                }
            }
            tempMap.push(row);
        }
        
        // Step 2: Cellular Automata smoothing (creates rooms and continuous walls)
        for(let i=0; i<3; i++) {
            let newMap = [];
            for (let y = 0; y < this.mapSize; y++) {
                let row = [];
                for (let x = 0; x < this.mapSize; x++) {
                    if (x === 0 || x === this.mapSize - 1 || y === 0 || y === this.mapSize - 1) {
                        row.push(1);
                        continue;
                    }
                    let neighbors = 0;
                    for(let dy=-1; dy<=1; dy++){
                        for(let dx=-1; dx<=1; dx++){
                            if(tempMap[y+dy][x+dx] > 0) neighbors++;
                        }
                    }
                    if(neighbors >= 5) row.push(1);
                    else row.push(0);
                }
                newMap.push(row);
            }
            tempMap = newMap;
        }

        // Step 3: Add anomalies logically
        let doorCount = 0;
        for (let y = 1; y < this.mapSize - 1; y++) {
            for (let x = 1; x < this.mapSize - 1; x++) {
                if (tempMap[y][x] === 1) {
                    // Check if it's a flat wall (connects two walls, open on sides)
                    let isHorizontalWall = (tempMap[y][x-1]===1 && tempMap[y][x+1]===1 && tempMap[y-1][x]===0 && tempMap[y+1][x]===0);
                    let isVerticalWall = (tempMap[y-1][x]===1 && tempMap[y+1][x]===1 && tempMap[y][x-1]===0 && tempMap[y][x+1]===0);
                    let isFlatWall = isHorizontalWall || isVerticalWall;

                    let rand = Math.random();
                    if (isFlatWall && rand > 0.95 && doorCount < 2) {
                        tempMap[y][x] = 2; // Door
                        doorCount++;
                    } else if (isFlatWall && rand < 0.02) {
                        tempMap[y][x] = 7; // Exit sign
                    } else if (isFlatWall && rand < 0.04) {
                        tempMap[y][x] = 10; // Stain
                    } else if (rand < 0.01) {
                        tempMap[y][x] = 6; // Blackout
                    } else if (rand > 0.99) {
                        tempMap[y][x] = 9; // Red Wall
                    }
                } else if (tempMap[y][x] === 0) {
                    // Empty space anomalies
                    let rand = Math.random();
                    if (rand > 0.985) tempMap[y][x] = 3; // Hanging wall
                    else if (rand > 0.97) tempMap[y][x] = 4; // Half wall
                }
            }
        }
        
        this.map = tempMap;
    }

    interpolateColor(c1, c2, factor) {
        const hexToRgb = hex => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        const color1 = hexToRgb(c1);
        const color2 = hexToRgb(c2);
        
        if (!color1 || !color2) return c1;

        const r = Math.round(color1.r + factor * (color2.r - color1.r));
        const g = Math.round(color1.g + factor * (color2.g - color1.g));
        const b = Math.round(color1.b + factor * (color2.b - color1.b));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    castRays() {
        // Find a random starting position and direction that has a clear view ahead
        let posX = 1.5, posY = 1.5;
        let dirX = 1, dirY = 0;
        let foundEmpty = false;
        
        while (!foundEmpty) {
            posX = Math.floor(Math.random() * (this.mapSize - 2)) + 1 + 0.5;
            posY = Math.floor(Math.random() * (this.mapSize - 2)) + 1 + 0.5;
            
            if (this.map[Math.floor(posY)][Math.floor(posX)] === 0) {
                // Try 8 different directions to find a clear view of at least 5 blocks
                let startAngle = Math.random() * Math.PI * 2;
                for (let i = 0; i < 8; i++) {
                    let angle = startAngle + (i * Math.PI / 4);
                    let dx = Math.cos(angle);
                    let dy = Math.sin(angle);
                    
                    let hitWall = false;
                    for (let step = 1; step <= 5; step++) {
                        let cx = Math.floor(posX + dx * step);
                        let cy = Math.floor(posY + dy * step);
                        if (cx <= 0 || cx >= this.mapSize - 1 || cy <= 0 || cy >= this.mapSize - 1) {
                            hitWall = true; break;
                        }
                        let cell = this.map[cy][cx];
                        if (cell === 1 || cell === 2 || cell === 6 || cell === 7 || cell === 9 || cell === 10) {
                            hitWall = true;
                            break;
                        }
                    }
                    
                    if (!hitWall) {
                        dirX = dx;
                        dirY = dy;
                        foundEmpty = true;
                        break;
                    }
                }
            }
        }
        
        this.posX = posX;
        this.posY = posY;
        this.dirX = dirX;
        this.dirY = dirY;
        
        // Plane vector (perpendicular to dir)
        const planeX = -dirY * Math.tan(this.fov / 2);
        const planeY = dirX * Math.tan(this.fov / 2);

        // Draw ceiling and floor with depth gradient
        for (let y = 0; y < this.height / 2; y++) {
            // Distance factor based on screen Y
            let z = (this.height / 2.0) / (this.height / 2.0 - y);
            
            let ceilColor = this.interpolateColor(this.colors.ceilingBase, this.colors.ceilingShadow, Math.min(1, z / 15));
            this.ctx.fillStyle = ceilColor;
            this.ctx.fillRect(0, y, this.width, 1);
            
            let floorColor = this.interpolateColor(this.colors.floorBase, this.colors.floorShadow, Math.min(1, z / 15));
            this.ctx.fillStyle = floorColor;
            this.ctx.fillRect(0, this.height - 1 - y, this.width, 1);
        }

        // Simple raycaster
        for (let x = 0; x < this.width; x++) {
            const cameraX = 2 * x / this.width - 1;
            const rayDirX = dirX + planeX * cameraX;
            const rayDirY = dirY + planeY * cameraX;

            let mapX = Math.floor(posX);
            let mapY = Math.floor(posY);

            let sideDistX, sideDistY;

            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            let perpWallDist;

            let stepX, stepY;
            let hit = 0;
            let side; // 0 for NS, 1 for EW

            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (posX - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - posX) * deltaDistX;
            }
            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (posY - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - posY) * deltaDistY;
            }

            let transparentHits = [];

            while (hit === 0) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                if (mapX >= 0 && mapX < this.mapSize && mapY >= 0 && mapY < this.mapSize) {
                    let cell = this.map[mapY][mapX];
                    if (cell === 1 || cell === 2 || cell === 6 || cell === 7 || cell === 9 || cell === 10) {
                        hit = 1; 
                    } else if (cell === 3 || cell === 4 || cell === 5 || cell === 8) {
                        let tPerpWallDist;
                        if (side === 0) tPerpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
                        else           tPerpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;
                        
                        transparentHits.push({
                            type: cell,
                            side: side,
                            dist: tPerpWallDist
                        });
                    }
                } else {
                    hit = 1; // Out of bounds
                }
            }

            if (side === 0) perpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
            else           perpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;

            // Wall rendering (floor and ceiling are already drawn)


            // Draw wall
            const lineHeight = Math.floor(this.height / perpWallDist);
            const actualTop = -lineHeight / 2 + this.height / 2;
            let drawStart = Math.max(0, actualTop);
            const drawEnd = Math.min(this.height - 1, lineHeight / 2 + this.height / 2);
            
            // Distance shadow
            const shadowFactor = Math.min(1, perpWallDist / 15);

            // Calculate where exactly the wall was hit (0.0 to 1.0)
            let wallX;
            if (side === 0) wallX = posY + perpWallDist * rayDirY;
            else           wallX = posX + perpWallDist * rayDirX;
            wallX -= Math.floor(wallX);

            let color;
            let isDoorVisible = (this.map[mapY][mapX] === 2) && (wallX > 0.3 && wallX < 0.7);

            if (isDoorVisible) {
                // Door color (faded yellow / white)
                color = side === 1 ? '#E6E2CA' : '#D1CDAF'; 
                
                // Make the door slightly shorter than a full wall
                const actualDoorTop = actualTop + (lineHeight * 0.3); // 30% wall above
                const doorDrawTop = Math.max(0, actualDoorTop);
                
                // Draw the piece of wall above the door
                if (doorDrawTop > drawStart) {
                    let wallColorAbove = side === 1 ? '#B5A566' : this.colors.wallBase;
                    wallColorAbove = this.interpolateColor(wallColorAbove, '#000000', shadowFactor);
                    this.ctx.fillStyle = wallColorAbove;
                    this.ctx.fillRect(x, drawStart, 1, doorDrawTop - drawStart);
                }
                
                drawStart = doorDrawTop; // Start drawing the door lower
            } else if (this.map[mapY][mapX] === 6) { // Blackout
                color = '#050505';
            } else if (this.map[mapY][mapX] === 9) { // Red Glitch Wall
                color = side === 1 ? '#5A1B1B' : '#4A1111';
            } else {
                // Wall color
                color = side === 1 ? '#B5A566' : this.colors.wallBase;
            }
            
            color = this.interpolateColor(color, '#000000', shadowFactor);

            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);

            if (this.map[mapY][mapX] === 7) { // Exit sign
                if (wallX > 0.35 && wallX < 0.65) {
                    let signTop = actualTop + (lineHeight * 0.1);
                    let signBottom = signTop + (lineHeight * 0.1);
                    signTop = Math.max(0, signTop);
                    signBottom = Math.min(this.height - 1, signBottom);
                    if (signBottom > signTop) {
                        this.ctx.fillStyle = '#CC2222'; // Glowing red
                        this.ctx.fillRect(x, signTop, 1, signBottom - signTop);
                    }
                }
            }

            if (this.map[mapY][mapX] === 10) { // Stain
                if (wallX > 0.4 && wallX < 0.6) {
                    let stainTop = actualTop + (lineHeight * 0.4);
                    let stainBottom = actualTop + (lineHeight * 0.7);
                    stainTop = Math.max(0, stainTop);
                    stainBottom = Math.min(this.height - 1, stainBottom);
                    if (stainBottom > stainTop) {
                        let stainColor = this.interpolateColor('#221105', '#000000', shadowFactor);
                        this.ctx.fillStyle = stainColor;
                        this.ctx.fillRect(x, stainTop, 1, stainBottom - stainTop);
                    }
                }
            }

            // Draw transparent hits (from furthest to closest)
            for (let i = transparentHits.length - 1; i >= 0; i--) {
                let tHit = transparentHits[i];
                let tDist = tHit.dist;
                let tLineHeight = Math.floor(this.height / tDist);
                let tActualTop = -tLineHeight / 2 + this.height / 2;
                let tDrawStart = Math.max(0, tActualTop);
                let tDrawEnd = Math.min(this.height - 1, tLineHeight / 2 + this.height / 2);
                let tShadow = Math.min(1, tDist / 15);
                
                let tColor = tHit.side === 1 ? '#B5A566' : this.colors.wallBase;
                tColor = this.interpolateColor(tColor, '#000000', tShadow);
                
                if (tHit.type === 3) { // Hanging wall (ceiling)
                    let hEnd = Math.min(this.height - 1, tActualTop + tLineHeight * 0.4);
                    if (hEnd > tDrawStart) {
                        this.ctx.fillStyle = tColor;
                        this.ctx.fillRect(x, tDrawStart, 1, hEnd - tDrawStart);
                    }
                } else if (tHit.type === 4) { // Half wall (floor)
                    let hStart = Math.max(0, tActualTop + tLineHeight * 0.6);
                    if (tDrawEnd > hStart) {
                        this.ctx.fillStyle = tColor;
                        this.ctx.fillRect(x, hStart, 1, tDrawEnd - hStart);
                    }
                }
            }
        }
    }

    applyPostProcessing() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let i = 0; i < data.length; i += 4) {
            // Add noise
            const noise = (Math.random() - 0.5) * 40;
            
            // Vignette
            const pixelIndex = i / 4;
            const x = pixelIndex % this.width;
            const y = Math.floor(pixelIndex / this.width);
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const vignette = 1 - (dist / maxDist) * 0.7; // Darken edges

            // VHS-like yellow tint
            const tintR = 1.1;
            const tintG = 1.05;
            const tintB = 0.8;

            data[i] = Math.min(255, Math.max(0, (data[i] + noise) * vignette * tintR));
            data[i+1] = Math.min(255, Math.max(0, (data[i+1] + noise) * vignette * tintG));
            data[i+2] = Math.min(255, Math.max(0, (data[i+2] + noise) * vignette * tintB));
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    drawMinimap() {
        const ctx = this.minimapCtx;
        const cellSize = 10; // 24 mapSize * 10 = 240px width/height
        
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Draw map blocks
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                let cell = this.map[y][x];
                if (cell > 0) {
                    if (cell === 1) ctx.fillStyle = '#C7B97A'; // Wall
                    else if (cell === 2) ctx.fillStyle = '#E6E2CA'; // Door
                    else if (cell === 3 || cell === 4) ctx.fillStyle = '#666'; // Half/hanging
                    else if (cell === 6) ctx.fillStyle = '#333'; // Blackout (drawn greyish on map to see it)
                    else if (cell === 7) ctx.fillStyle = '#CC2222'; // Exit
                    else if (cell === 9) ctx.fillStyle = '#5A1B1B'; // Red wall
                    else if (cell === 10) ctx.fillStyle = '#4A3A1A'; // Stain
                    else ctx.fillStyle = '#888';
                    
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        
        // Draw camera position
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.posX * cellSize, this.posY * cellSize, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw camera direction
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.posX * cellSize, this.posY * cellSize);
        ctx.lineTo((this.posX + this.dirX * 2.5) * cellSize, (this.posY + this.dirY * 2.5) * cellSize);
        ctx.stroke();
        
        // Draw FOV cone
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(this.posX * cellSize, this.posY * cellSize);
        const fovLeftX = Math.cos(Math.atan2(this.dirY, this.dirX) - this.fov/2);
        const fovLeftY = Math.sin(Math.atan2(this.dirY, this.dirX) - this.fov/2);
        const fovRightX = Math.cos(Math.atan2(this.dirY, this.dirX) + this.fov/2);
        const fovRightY = Math.sin(Math.atan2(this.dirY, this.dirX) + this.fov/2);
        ctx.lineTo((this.posX + fovLeftX * 5) * cellSize, (this.posY + fovLeftY * 5) * cellSize);
        ctx.lineTo((this.posX + fovRightX * 5) * cellSize, (this.posY + fovRightY * 5) * cellSize);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    generate() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.generateMap();
        this.castRays();
        this.applyPostProcessing();
        
        if (this.minimapCtx) {
            this.drawMinimap();
        }
    }
}

class SeededRandom {
    constructor(seedStr) {
        this.seed = 0;
        for(let i=0; i<seedStr.length; i++) {
            this.seed = (this.seed << 5) - this.seed + seedStr.charCodeAt(i);
            this.seed |= 0;
        }
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

class BigMapGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.mapSize = 80;
        this.map = [];
        this.seed = "";
    }

    generate() {
        // Generate random seed (like "lvl0-a4f9b2")
        this.seed = "lvl0-" + Math.random().toString(16).substr(2, 6);
        document.querySelector('#seedDisplay span').textContent = this.seed;
        
        let rng = new SeededRandom(this.seed);

        this.map = [];
        let tempMap = [];
        
        // Step 1: Initial random noise
        for (let y = 0; y < this.mapSize; y++) {
            let row = [];
            for (let x = 0; x < this.mapSize; x++) {
                if (x === 0 || x === this.mapSize - 1 || y === 0 || y === this.mapSize - 1) {
                    row.push(1);
                } else {
                    row.push(rng.next() > 0.6 ? 1 : 0);
                }
            }
            tempMap.push(row);
        }
        
        // Step 2: Cellular Automata smoothing
        for(let i=0; i<4; i++) {
            let newMap = [];
            for (let y = 0; y < this.mapSize; y++) {
                let row = [];
                for (let x = 0; x < this.mapSize; x++) {
                    if (x === 0 || x === this.mapSize - 1 || y === 0 || y === this.mapSize - 1) {
                        row.push(1);
                        continue;
                    }
                    let neighbors = 0;
                    for(let dy=-1; dy<=1; dy++){
                        for(let dx=-1; dx<=1; dx++){
                            if(tempMap[y+dy][x+dx] > 0) neighbors++;
                        }
                    }
                    if(neighbors >= 5) row.push(1);
                    else row.push(0);
                }
                newMap.push(row);
            }
            tempMap = newMap;
        }

        // Step 3: Add anomalies
        let doorCount = 0;
        for (let y = 1; y < this.mapSize - 1; y++) {
            for (let x = 1; x < this.mapSize - 1; x++) {
                if (tempMap[y][x] === 1) {
                    let isHorizontalWall = (tempMap[y][x-1]===1 && tempMap[y][x+1]===1 && tempMap[y-1][x]===0 && tempMap[y+1][x]===0);
                    let isVerticalWall = (tempMap[y-1][x]===1 && tempMap[y+1][x]===1 && tempMap[y][x-1]===0 && tempMap[y][x+1]===0);
                    let isFlatWall = isHorizontalWall || isVerticalWall;

                    let rand = rng.next();
                    if (isFlatWall && rand > 0.95 && doorCount < (this.mapSize / 5)) {
                        tempMap[y][x] = 2; // Door
                        doorCount++;
                    } else if (isFlatWall && rand < 0.01) {
                        tempMap[y][x] = 7; // Exit sign
                    } else if (isFlatWall && rand < 0.02) {
                        tempMap[y][x] = 10; // Stain
                    } else if (rand < 0.005) {
                        tempMap[y][x] = 6; // Blackout
                    } else if (rand > 0.995) {
                        tempMap[y][x] = 9; // Red Wall
                    }
                }
            }
        }
        this.map = tempMap;
        this.drawMap();
    }

    drawMap() {
        const cellSize = this.canvas.width / this.mapSize;
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                let cell = this.map[y][x];
                if (cell > 0) {
                    if (cell === 1) this.ctx.fillStyle = '#C7B97A'; // Wall
                    else if (cell === 2) this.ctx.fillStyle = '#E6E2CA'; // Door
                    else if (cell === 6) this.ctx.fillStyle = '#333'; // Blackout 
                    else if (cell === 7) this.ctx.fillStyle = '#CC2222'; // Exit
                    else if (cell === 9) this.ctx.fillStyle = '#5A1B1B'; // Red wall
                    else if (cell === 10) this.ctx.fillStyle = '#4A3A1A'; // Stain
                    else this.ctx.fillStyle = '#888';
                    
                    this.ctx.fillRect(x * cellSize, y * cellSize, Math.ceil(cellSize), Math.ceil(cellSize));
                }
            }
        }
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const generator = new BackroomsGenerator('backroomsCanvas');
    generator.generate();

    document.getElementById('generateBtn').addEventListener('click', () => {
        generator.generate();
    });

    const bigmap = new BigMapGenerator('bigmapCanvas');
    bigmap.generate();

    document.getElementById('generateBigmapBtn').addEventListener('click', () => {
        bigmap.generate();
    });
});
