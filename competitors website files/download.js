document.querySelector("[data-action='download']").addEventListener("click", () => {
    const notification = addNotification({
        text: "Preparing download...",
        image: "spinner"
    });
    let downloadFormat = document.getElementById("download-format").value;
    iframeMessage("downloadRequest");
    if (artx.appdata && artx.appdata.preventDownloads === true) return;
    const filename = artx.nameParts.join(" ") + " " + params.view + ".jpg";
    recordAppDownload(downloadFormat).then(response => {
        // Temporarily disable chek due to branded materials
        if (response.rawResponse.status !== 200) {
            notification.updateNotification({
                text: "Cannot download asset",
                image: "warning"
            });
            return;
        }

        if (params.hasOwnProperty("view") && params.view == "scene") {
            downloadTexture(artx.scene.canvas, 0.95);
        } else if (params.hasOwnProperty("view") && params.view === "plane") {
            drawPlane({
                textureMaps: artx.mainTextureGenerator.maps,
                width_mm: artx.mainTextureGenerator.width_mm,
                height_mm: artx.mainTextureGenerator.height_mm,
            }).then(planeCanvas => {
                downloadFile(planeCanvas.toDataURL("image/jpeg", 0.7), filename);
            });
        } else if (params.hasOwnProperty("view") && params.view === "sphere") {
            drawCroppedSphere().then(sphere => {
                filename.replace(".jpg", ".png");
                downloadFile(sphere.toDataURL(), filename);
            });
        } else if (downloadFormat === "png") {
            downloadFile(artx.mainTextureGenerator.maps.hatch.canvas.toDataURL("image/png"), filename.replace(".jpg", ".png"));
        } else if (["autocad_hatch", "revit_model_pattern", "revit_drafting_pattern"].includes(downloadFormat)) {
            showSpinner();
            getHatch(artx.mainTextureGenerator, downloadFormat, artx.patterns[artx.mainTextureGenerator.params.patternId]).then(function(hatchData){
                const blob = new Blob([hatchData.string], {type: "text/plain;charset=utf-8"});
                const stringUrl = URL.createObjectURL(blob)
                downloadFile(stringUrl, hatchData.filename + ".pat");
            }).finally(function(){
                hideSpinner();
            });
        } else if (downloadFormat === "svg") {
            const svg = generateSvg(artx.mainTextureGenerator.rowData, artx.mainTextureGenerator.width_mm, artx.mainTextureGenerator.height_mm);
            const svgBlob = new Blob([svg.outerHTML], {type: "image/svg+xml;charset=utf-8"});
            const svgUrl = URL.createObjectURL(svgBlob);
            downloadFile(svgUrl, filename.replace(".jpg", ".svg"));
            URL.revokeObjectURL(svgUrl);
        } else if (downloadFormat === "dxf") {
            fetch("https://apps.architextures.org/dxf/", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rowData: artx.mainTextureGenerator.rowData,
                    textureWidth: artx.mainTextureGenerator.width_mm,
                    textureHeight: artx.mainTextureGenerator.height_mm
                })
            })
                .then(response => response.blob())
                .then(response => downloadFile(URL.createObjectURL(response), filename.replace(".jpg", ".dxf")));
        } else {
            let targetMap = downloadFormat === "texture" ? "color" : downloadFormat;
            let pixelWidthInput = document.querySelector('[data-pixel-width]').value;

            if (!artx.pro && parseInt(pixelWidthInput) > 1024) {
                pixelWidthInput = 1024;
            }

            let downloadParams = copy(params, {pixelWidth: pixelWidthInput, trigger: "program"});
            predraw(downloadParams).then(function(TextureGenerator){
                if (downloadFormat === "normal") {
                    height2normal(TextureGenerator.maps.bump.canvas);
                    downloadFile(TextureGenerator.maps.bump.canvas.toDataURL(), filename.replace(".jpg", ".png"));
                } else {
                    downloadFile(TextureGenerator.maps[targetMap].canvas.toDataURL("image/jpeg", 0.9), filename);
                }
            });
        }
        artx.materialsUsed.forEach(matId => postJson("/app/material-download", {id:matId,page:window.location.href}) );
        notification.updateNotification({
            text: "Downloading",
            image: "tick",
            duration: 2000
        });
    });
});

function recordAppDownload(downloadFormat){
    // Send params to download database
    const data = {
        "format": downloadFormat,
        "params": JSON.stringify(params),
        "materials": artx.materialsUsed
    };

    return postJson("/app/downloads", data);
}
