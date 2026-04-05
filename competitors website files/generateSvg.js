function generateSvg(rowData, textureWidth, textureHeight, angle = 0) {
    let svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");

    if (angle === 90 || angle === 270) {
        [textureWidth, textureHeight] = [textureHeight, textureWidth];
    }
    
    svg.setAttribute("width", textureWidth);
    svg.setAttribute("height", textureHeight);
    svg.setAttribute("viewBox", `0 0 ${textureWidth} ${textureHeight}`);
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.style.transform = `rotate(${angle}deg)`;

    let tileGroup = document.createElementNS(svgNS, "g");
    tileGroup.setAttribute("id", "tileGroup");

    rowData.forEach((group, rowIndex) => {
        group.tiles.forEach((tile, columnIndex) => {
            let pathData = `M ${tile.x} ${tile.y} `;
            let currentX = tile.x;
            let currentY = tile.y;

            tile.edges.forEach(edge => {
                let radians = (edge.direction * Math.PI) / 180;
                let newX = currentX + edge.edgeLength * Math.cos(radians);
                let newY = currentY + edge.edgeLength * Math.sin(radians);
                pathData += `L ${newX} ${newY} `;
                currentX = newX;
                currentY = newY;
            });
            pathData += "Z";

            let path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", pathData);
            path.setAttribute("stroke", "black");
            path.setAttribute("fill", "white");
            path.setAttribute("stroke-width", "2"); 
            path.setAttribute("data-row", rowIndex);
            path.setAttribute("data-column", columnIndex);
            path.setAttribute("data-style", tile.styleId);
            tileGroup.appendChild(path);
        });
    });

    svg.appendChild(tileGroup);

    let tileWidth = textureWidth;
    let tileHeight = textureHeight;

    // Create <use> elements for the remaining 3 repeats
    for (let x = -textureWidth; x < textureWidth; x += tileWidth) {
        for (let y = -textureHeight; y < textureHeight; y += tileHeight) {
            // Skip the original position (0,0) since we already have the actual group there
            if (x === 0 && y === 0) {
                continue;
            }
            
            let use = document.createElementNS(svgNS, "use");
            use.setAttribute("href", "#tileGroup");
            use.setAttribute("x", x);
            use.setAttribute("y", y);
            svg.appendChild(use);
        }
    }
    return svg;
}