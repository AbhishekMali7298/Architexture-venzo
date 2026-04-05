// Returns a hatch string from a multiColor canvas. Lines are converted into small horizontal or vertical segments for compatibility with .pat format.
function hatchFromCanvas(huCanvas, width_mm, downloadFormat, usesInches, hatchName) {
	// Calculate how many real world units each pixel represents
	let pixelScale;
	let decimalPrecision = 2;
	if (downloadFormat === "revit_drafting_pattern") {
		// For drafting patterns the scale is not important but the maximum offset is 84.85 inches and 2,155 mm. This is also the maximum for the sum of all dash and gap values. Inches need to be reduced because the default scale would result in 280 inches
		pixelScale = (usesInches) ? 84 / Math.max(huCanvas.width, huCanvas.height) : 1;
	} else {
		// For model patterns the hatch should match the real world scale
		pixelScale = (usesInches) ? round(mmToInches(width_mm) / huCanvas.width, decimalPrecision) : round(width_mm / huCanvas.width, decimalPrecision);
	}

	let autoHatch = {
		"horizontalActive": false,
		"verticalActive": false,
		"rows": [],
		"columns": [],
		"rowDefinitions": [],
		"columnDefinitions": [],
	};

	//Get the pixel data
	let huCtx = huCanvas.getContext("2d", { willReadFrequently: true });
	let imageData = huCtx.getImageData(0,0,huCanvas.width,huCanvas.height);
	// Iterate over pixels and check difference with pixel above and to the left
	let pixelIndex = 0;
	for (i = 0; i < imageData.data.length; i += 4) {
		let row = Math.floor((i/4)/huCanvas.width);
		let column = (i/4)%huCanvas.width;
		let indexAbove = i-(imageData.width*4) < 0 ? (i-(imageData.width*4))+imageData.data.length : i-(imageData.width*4);
		let indexLeft = i-4 < 0 ? (i-4)+imageData.data.length : i-4;
		let refData = imageData;
		let differenceAbove = Math.abs(imageData.data[i]-refData.data[indexAbove]) + Math.abs(imageData.data[i+1]-refData.data[indexAbove+1]) + Math.abs(imageData.data[i+2]-refData.data[indexAbove+2]);
		let differenceLeft = Math.abs(imageData.data[i]-refData.data[indexLeft]) + Math.abs(imageData.data[i+1]-refData.data[indexLeft+1]) + Math.abs(imageData.data[i+2]-refData.data[indexLeft+2]);
		let threshold = 5;
		if (!autoHatch.rows[row]) autoHatch.rows[row] = [];
		if (!autoHatch.columns[column]) autoHatch.columns[column] = [];
		autoHatch.rows[row].push(differenceAbove > threshold ? 1 : 0);
		autoHatch.columns[column].push(differenceLeft > threshold ? 1 : 0);
		pixelIndex++;
	}

	function processAxis(axis, axisArray, axisDefinitions, hatchCanvas) {
		axisArray.forEach(function (patternArray, index) {
			var lineDef = {
				"angle": axis === "row" ? 0 : 90,
				"x": axis === "row" ? 0 : index,
				"y": axis === "row" ? index : 0,
				"shift": 0,
				"offset": axisArray.length
			};
	
			var dashGap = [];
			var lineShift = 0;
	
			patternArray.forEach(function (value, i) {
				if (i === 0) {
					lineDef.lineStart = (value === 0) ? "gap" : "dash";
					dashGap.push(1);
				} else {
					if (value === patternArray[i - 1]) {
						dashGap[dashGap.length - 1]++;
					} else {
						dashGap.push(1);
					}
				}
			});
	
			var initialLineValue = dashGap[0];
	
			if (lineDef.lineStart === "gap") {
				if (dashGap.length !== 1) {
					dashGap = dashGap.slice(1);
					var dashGapLength = dashGap.length;
	
					if (dashGapLength % 2 === 0) {
						dashGap[dashGapLength - 1] += initialLineValue;
					} else {
						dashGap.push(initialLineValue);
					}
					lineShift = initialLineValue;
				}
			} else {
				var dashGapLength = dashGap.length;
				var lastValue = dashGap[dashGapLength - 1];
	
				if (dashGapLength % 2 !== 0) {
					dashGap[0] += lastValue;
					dashGap.pop();
					lineShift = -lastValue;
				}
			}
	
			if (dashGap.length > 6) {
				var chunks = [];
				while (dashGap.length > 1) {
					chunks.push({ "dashGap": dashGap.splice(0, 6) });
				}
				chunks.forEach(function (obj, i) {
					var newShift = 0;
					for (var j = 0; j < i; j++) {
						chunks[j].dashGap.forEach(function (val) {
							newShift += Math.abs(val);
						});
					}
					obj.shift = lineShift + newShift;
				});
				chunks.forEach(function (obj, i) {
					var chunkSize = 0;
					obj.dashGap.forEach(function (val) {
						chunkSize += Math.abs(val);
					});
					var leftOver = axis === "row" ? hatchCanvas.width - chunkSize : hatchCanvas.height - chunkSize;
					obj.dashGap[obj.dashGap.length - 1] += leftOver;
					axisDefinitions.push({
						"angle": axis === "row" ? 0 : 90,
						"x": axis === "row" ? obj.shift : lineDef.x,
						"y": axis === "row" ? lineDef.y : obj.shift,
						"shift": 0,
						"offset": axisArray.length,
						"dashGap": obj.dashGap,
					});
				});
			} else {
				lineDef.dashGap = dashGap;
				let letterAxis = axis === "row" ? "x" : "y"; 
				lineDef[letterAxis] = lineShift;
				axisDefinitions.push(lineDef);
			}
		});
	}

	processAxis("row", autoHatch.rows, autoHatch.rowDefinitions, huCanvas);
	processAxis("column", autoHatch.columns, autoHatch.columnDefinitions, huCanvas);

    // Change the filename for drafting or model patterns
    let hatchString = '';
    let units = (usesInches) ? "INCH" : "MM";
    if (downloadFormat === "revit_model_pattern" || downloadFormat === "revit_drafting_pattern") {
        hatchString = `;%UNITS=${units}`;
        hatchString += "\r\n;%VERSION=3.0";
        hatchString += "\r\n;\r\n";
        hatchString += `*${hatchName}, created with architextures.org`;
        hatchString += `\r\n;%TYPE=${downloadFormat === "revit_model_pattern" ? "MODEL" : "DRAFTING"}`;
        hatchString += "\r\n;";
    } else {
        hatchString += `*${hatchName}, created with architextures.org`;
    }
    hatchString += "\r\n";

	function definitionsToHatchString(definitions) {
		// Print the definitions into the final string file
		definitions.forEach(function(object,index){
			// If the definition contains start and stop data
			if (object.dashGap.length !== 1) {
				var lineStyle = [];
				object.dashGap.forEach(function(value,index){
					if (index % 2 == 0) {
						lineStyle.push(round(value*pixelScale,decimalPrecision));
					} else {
						lineStyle.push(round(-value*pixelScale,decimalPrecision));
					}
				});
				hatchLineParts = [object.angle, round(object.x*pixelScale,decimalPrecision), round(object.y*pixelScale,decimalPrecision),  round(object.shift*pixelScale,decimalPrecision), round(object.offset*pixelScale,decimalPrecision), ...lineStyle];
				hatchString += hatchLineParts.join(",") + "\n";
			}
		});
	}

	definitionsToHatchString(autoHatch.rowDefinitions);
	definitionsToHatchString(autoHatch.columnDefinitions);
	return hatchString;
}

function hatchFromRowData(hTG, downloadFormat, hatchName) {
	// File header and string setup
    let hatchString = '';
    let units = (hTG.params.inches) ? "INCH" : "MM";
    if (downloadFormat === "revit_model_pattern" || downloadFormat === "revit_drafting_pattern") {
        hatchString = `;%UNITS=${units}`;
        hatchString += "\r\n;%VERSION=3.0";
        hatchString += "\r\n;\r\n";
        hatchString += `*${hatchName}, created with architextures.org`;
        hatchString += `\r\n;%TYPE=${downloadFormat === "revit_model_pattern" ? "MODEL" : "DRAFTING"}`;
        hatchString += "\r\n;";
    } else {
        hatchString += `*${hatchName}, created with architextures.org`;
    }
    hatchString += "\r\n";

	// Geometry
	let scale = (hTG.params.inches) ? 1/25.4 : 1 ;
	let max_value = (downloadFormat === "revit_drafting_pattern") ? 21552 * scale * 0.1 : 21550 * scale; // Values should not exceed around 21,552mm mm or 848.5 inches
	let initial_diagonal = round(Math.sqrt(Math.pow(hTG.width_mm * scale, 2) + Math.pow(hTG.height_mm * scale, 2)), 2);
	if (initial_diagonal > max_value) scale *= (max_value / initial_diagonal) * 0.9;
	let repeat_horizontal = hTG.width_mm * scale;
	let repeat_vertical = hTG.height_mm * scale;
	let repeat_diagonal = round(Math.sqrt(Math.pow(repeat_horizontal, 2) + Math.pow(repeat_vertical, 2)), 2); // Hypotenuse
	let hatchLines = [];
	hTG.rowData.forEach(row => {
		row.tiles.forEach(tile => {
			let x = tile.x * scale;
			let y = tile.y * scale;
			tile.edges.forEach(edge => {
				// Create a hatch string for each edge
				let angle = edge.direction;
				let hypotenuse = repeat_vertical;
				let known_angle = 90 - angle;
				let adjacent = round(Math.cos(known_angle * (Math.PI / 180)) * hypotenuse, 3);
				let opposite = round(Math.sin(known_angle * (Math.PI / 180)) * hypotenuse, 3);
				let repeat_distance = [0,-0,180,-180].includes(angle) ? repeat_horizontal : [90,-90, 270, -270].includes(angle) ? repeat_vertical : repeat_diagonal;
				let shift = [0,-0,180,-180,90,-90,270,-270].includes(angle) ? 0 : adjacent;
				let offset = [0,-0,180,-180].includes(angle) ? repeat_vertical : [90,-90, 270, -270].includes(angle) ? repeat_horizontal : opposite;
				let dash = edge.edgeLength * scale;
				let gap = repeat_distance - dash;
				if (gap < 0) gap = 0;
				let lineString = round(angle,4) + "," + round(x,4) + "," + round(y,4) + "," + round(shift, 4) + "," + round(offset,4) + "," + round(dash,4) + ",-" + round(gap,4); // Start of the line
				hatchLines.push(lineString);

				// Move x and y to new position based on direction and length of current edge
				x += Math.cos(angle * (Math.PI / 180)) * dash;
				y += Math.sin(angle * (Math.PI / 180)) * dash;
			});
		})
	});

	// Combine hatch line data with header
	hatchString += hatchLines.join("\n");
	hatchString += "\n";
	return hatchString;
}

// Returns promise that resolves an object {string: hatchString, filename: hatchName}, downloadFormat can be "autocad_hatch", "revit_model_pattern" or "revit_drafting_pattern".
function getHatch(TextureGenerator, downloadFormat, patternData) {
    return new Promise((resolve) => {
        // Draw a multiColor image, used to convert complex patterns to hatches
        let hatchMethod = (TextureGenerator.params.hatchJoints) ? patternData.hatchJoints : patternData.hatchEdges;
        let hatchName = trainify(artx.patterns[TextureGenerator.params.patternId].name, "_").substring(0,20).toUpperCase()+"_"+parseInt(TextureGenerator.params.tileWidth)+"X"+parseInt(TextureGenerator.params.tileHeight);
        hatchName.replace("-","_");
        hatchName = hatchName.substring(0,24);
        hatchName += "_"+generateUid().toUpperCase();
		hatchName += (downloadFormat === "revit_model_pattern") ? "_MODEL" : (downloadFormat === "revit_drafting_pattern") ? "_DRAFTING" : "";

		if (hatchMethod === "standard") {
            // Get hatch from the server
            let hatchParams = copy(TextureGenerator.params);
            hatchParams.hatchName = hatchName;
            hatchParams.downloadFormat = downloadFormat;
            hatchParams.rowData = TextureGenerator.rowData;
            hatchParams.width_mm = TextureGenerator.width_mm;
            hatchParams.height_mm = TextureGenerator.height_mm;
            hatchParams.tileWidthInches = (TextureGenerator.params.inches === true) ? mmToInches(inchesToMm(TextureGenerator.params.tileWidth)) : mmToInches(TextureGenerator.params.tileWidth);
            hatchParams.tileHeightInches = (TextureGenerator.params.inches === true) ? mmToInches(inchesToMm(TextureGenerator.params.tileHeight)) : mmToInches(TextureGenerator.params.tileHeight);
            postJson("/app/hatch", hatchParams).then(function(response){
                resolve({string: response.hatch, filename: hatchName});
            });
        } else {
			let hParams = copy(TextureGenerator.params);
			hParams.view = "hatch";
			hParams.pxSize = 250;
			hParams.trigger = "program";
			let irregularPatterns = [5,7,8]; // The row and column multiples for these patterns are not the minimum repeatable area. Preserve user input rows and columns
			if (!irregularPatterns.includes(parseInt(hParams.patternId))) {
				// The values for rowMultiple and columnMultiple are the minimum rows/cols for the repeating pattern. 
				// This condition prevents drawing unnecessary rows/columns, reduces filesize and means there's more geometry data per pixel
				hParams.rows = patternData.rowMultiple;
				hParams.columns = patternData.columnMultiple;
			}
			
			// Trigger a drawing to retrieve rowData before deciding which method to use
			predraw(hParams).then(function(hatchTG){
				let containsSafeAnglesOnly = true;
				// Code to calculate safe angles to draw basic hatches
				let safeAngles = [0, 90, -90, 180, -180, 270, -270];
				// Calculate angle of the hypotenuse of the tile rectangle
				let safeAngle = round(Math.atan(hatchTG.height_mm / hatchTG.width_mm) * (180 / Math.PI), 1);
				// Push all combinations of the safe angle into the array
				safeAngles.push(safeAngle, -safeAngle, safeAngle+180, -safeAngle+180, safeAngle-180, -safeAngle-180);
				hatchTG.rowData.forEach(row => {
					row.tiles.forEach(tile => {
						tile.edges.forEach(edge => {
							if (!safeAngles.includes(round(edge.direction,1))) {
								containsSafeAnglesOnly = false;
							}
						});
					})
				});

				if (containsSafeAnglesOnly) {
					let hatchString = hatchFromRowData(hatchTG, downloadFormat, hatchName)
					resolve({string: hatchString, filename: hatchName});
				} else {
					// Generate hatch from  canvas
					let mcParams = copy(TextureGenerator.params);
					mcParams.view = "multiColor";
					mcParams.pxSize = 250;
					mcParams.trigger = "program";
					// Draw the multiColor canvas
					predraw(mcParams).then(function(mcTG){
						let mcCanvas = mcTG.maps.color.canvas;
						// downloadFile(Canvas.toDataURL(), hatchName+".png");
						let hatchString = hatchFromCanvas(mcCanvas, mcTG.width_mm, downloadFormat, mcTG.params.inches, hatchName);
						resolve({string: hatchString, filename: hatchName});
					});
				}
			});
        }
    });
}