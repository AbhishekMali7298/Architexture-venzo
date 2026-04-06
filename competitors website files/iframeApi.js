// Iframe API listener
window.addEventListener("message", function(e){
    let mType = e.data.type ? e.data.type : e.data;
    let mData = e.data.data ? e.data.data : null;
    let mRequestId = e.data.requestId ? e.data.requestId : 0;
    if (["textureData","getTextureData"].includes(mType)) {
        const textureData = {
            patternName:  artx.patterns[params.patternId].name,
            patternId: artx.patterns[params.patternId].id,
            rows: params.rows,
            columns: params.columns,
            jointWidthHorizontal: params.jointWidthHorizontal,
            jointWidthVertical: params.jointWidthVertical,
            jointRecess: params.recessJoints,
            jointTint: params.jointTint,
            tileWidth: params.tileWidth,
            tileHeight: params.tileHeight,
            tileWidthMin: params.tileMinWidth,
            tileHeightMin: params.tileMinHeight,
            materials: []
        };
        textureData.width = params.inches ? mmToInches(artx.mainTextureGenerator.width_mm) : artx.mainTextureGenerator.width_mm;
        textureData.height = params.inches ? mmToInches(artx.mainTextureGenerator.height_mm) : artx.mainTextureGenerator.height_mm;
        textureData.units = params.inches ? "inches" : "mm" ;
        textureData.jointId = parseInt(params.jointID) !== NaN ? parseInt(params.jointID) : 0 ;
        textureData.jointName = artx.materials.hasOwnProperty(params.jointID) ? artx.materials[params.jointID].name : 0 ;
        textureData.jointSize = params.jointWidthHorizontal;
        textureData.nameParts = artx.nameParts;
        for(const style of Object.values(params.tileStyles)) {
            const name = artx.materials.hasOwnProperty(style.materialId) ? artx.materials[style.materialId].name : false ;
            const id = parseInt(style.materialId) == NaN ? style.materialId : parseInt(style.materialId);
            const sku = artx.materials.hasOwnProperty(style.materialId) && artx.materials[style.materialId].hasOwnProperty("sku") ? artx.materials[style.materialId].sku : 0;
            const collection = artx.materials.hasOwnProperty(style.materialId) && artx.materials[style.materialId].collection ? artx.materials[style.materialId].collection : 0;
            const link = artx.materials.hasOwnProperty(style.materialId) && artx.materials[style.materialId].link ? artx.materials[style.materialId].link : 0;
            textureData.materials.push({
                name: name,
                id: id,
                sku: sku,
                collection: collection,
                link: link,
                tint: style.tint,
                brightness: style.brightness,
                contrast: style.contrast,
                hue: style.hue,
                saturation: style.saturation,
                invert: style.invert,
            });
        }
        iframeMessage(mType, textureData, mRequestId);
    }
    if (["getParams","getParamsExtended"].includes(mType)) {
        iframeMessage(mType, params, mRequestId);
    }

    if (mType === "exportToPlugin") {
        const temParams = mData.params;
        temParams.trigger = "program";
        predraw(temParams).then(function(TextureGenerator) {
            prepareAppExport(TextureGenerator, mData.type, mData.name);
        });
    }

    if (mType === "getPlane") {
        const temParams = (mData && mData.params) ? mData.params : copy(params);
        temParams.view = "plane";
        predraw(temParams).then(function(TextureGenerator) {
            drawPlane({
                textureMaps: TextureGenerator.maps,
                width_mm: TextureGenerator.width_mm,
                height_mm: TextureGenerator.height_mm,
                cameraPosition: mData ? mData.cameraPosition : undefined,
                outputWidth: mData ? mData.outputWidth : undefined,
                outputHeight: mData ? mData.outputHeight : undefined,
            }).then(function(planeCanvas){
                iframeMessage(mType, planeCanvas.toDataURL(), mRequestId);
            });
        });
    }

    // Image requests
    if (["getTexture", "getBump"].includes(mType)) {
        const temParams = copy(params);
        temParams.trigger = "program";
        let isBump = mType === "getBump";
        if (isBump) temParams.view = "bump";
        let targetMap = isBump ? "bump" : "color";
        if (mData && mData.size) temParams.pxSize = mData.size;

        predraw(temParams).then(function(TextureGenerator) {
            let canvas = TextureGenerator.maps[targetMap].canvas;
            if (mData && mData.invert) invertCanvas(canvas);
            let format = (mData && mData.format) ? mData.format : "jpg";
            let quality = (mData && typeof mData.quality !== "undefined") ? mData.quality : 0.8;
            let mimeType = format === "jpg" ? "image/jpeg" : "image/png";
            let dataURL = canvas.toDataURL(mimeType, format === "jpg" ? quality : undefined);
            iframeMessage(mType, dataURL, mRequestId);
        });
    }

    if (mType === "setAppdata" && typeof mData === "object") {
        for (const [key, value] of Object.entries(mData)) {
            artx.appdata[key] = value;
        }
    }
    if (mType === "getSceneImage") iframeMessage(mType, artx.scene && artx.scene.canvas ? artx.scene.canvas.toDataURL() : "No scene image available", mRequestId);
    if (mType === "setTitle") element("#app-title-text").innerHTML = mData;
    if (mType === "setIconSrc") element("#app-title-image").setAttribute("src", mData);
    if (mType === "clickElement") element(mData).click();
    if (mType === "getDisplacement") {
        //iframeMessage({type: mType, data: params, mRequestId});
    }
    if (mType === "getNormal") {
        //iframeMessage({type: mType, data: params, mRequestId});
    }
    if (mType === "loadParams") {
        mData.trigger = "loadParams";
        artx.loadParams(mData).then(function(){
            iframeMessage(mType,  false, mRequestId);
        });
    }
});