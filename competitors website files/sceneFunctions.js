function drawScene (sceneParams, sceneCanvas, tempScene){
    return new Promise(function(resolve, reject){
        var promises = [];
        if (!tempScene) tempScene = {};
        if (!sceneCanvas) sceneCanvas = document.createElement("canvas");
        var ctx = sceneCanvas.getContext("2d");
        var sceneScale = sceneParams.hasOwnProperty("sceneScale") ? parseFloat(sceneParams.sceneScale) : 1;

        // If image has changed
        if (!tempScene.baseImage || tempScene.baseImage.src !== artx.imagePath(sceneParams.image)) {
            // Reset the entire scene
            promises.push(
                new Promise(function(r2, reject){
                    // Load the base image
                    tempScene.baseImage = new Image();
                    tempScene.baseImage.crossOrigin = "anonymous";
                    tempScene.baseImage.onload = function(baseImage){
                        tempScene.width = 3000;
                        //if (tempScene.width > 4000) tempScene.width = 4000;
                        tempScene.height = tempScene.width / (tempScene.baseImage.width/tempScene.baseImage.height);
                        r2();
                    }
                    tempScene.baseImage.src = artx.imagePath(sceneParams.image, {quality: 60});
                })
            );

            if (sceneParams.clip) {
                promises.push(
                    new Promise(function(r1, reject){
                        // Load the clip image
                        tempScene.clipImage = new Image()
                        tempScene.clipImage.crossOrigin = "anonymous";
                        tempScene.clipImage.onload = function(){
                            r1();
                        }
                        tempScene.clipImage.src = artx.imagePath(sceneParams.clip);
                    })
                )
            }
        }

        //disposeCanvas(artx.displacement.canvas);
        Promise.all(promises).then(function(){
            renderModel({
                width: tempScene.width,
                height: tempScene.height,
                textures: sceneParams.textures,
                fov: sceneParams.fov,
                mesh_file: sceneParams.mesh_file,
                camera_file: sceneParams.camera_file,
                camera_name: sceneParams.camera_name,
                crop_x: sceneParams.crop_x,
                crop_y: sceneParams.crop_y,
                crop_width: sceneParams.crop_width,
                colors: sceneParams.colors,
                renderer: sceneParams.renderer ? sceneParams.renderer : false,
            }, tempScene).then(function(textureRender){
                sceneCanvas.width = tempScene.width*sceneScale;
                sceneCanvas.height = tempScene.height*sceneScale;
                if (sceneParams.mirror) {
                    ctx.scale(-1,1);
                    ctx.translate(-sceneCanvas.width,0);
                }
                // Draw the clip image
                if (sceneParams.clip) ctx.drawImage(tempScene.clipImage, 0, 0, Math.floor(tempScene.clipImage.width), Math.floor(tempScene.clipImage.height), 0, 0, tempScene.width*sceneScale, tempScene.height*sceneScale);
                // Draw the textures
                var renderScale = sceneParams.scale;
                var anchor_3d = typeof sceneParams.anchor_3d === "string" ? JSON.parse(sceneParams.anchor_3d) : sceneParams.anchor_3d;
                var anchor_render = typeof sceneParams.anchor_render === "string" ? JSON.parse(sceneParams.anchor_render) : sceneParams.anchor_render;
                var texturesX = anchor_3d ? anchor_3d[0]*renderScale*tempScene.width : 0;
                var texturesY = anchor_3d ? anchor_3d[1]*renderScale*tempScene.height : 0;
                var imageX = anchor_render ? anchor_render[0]*tempScene.width : 0;
                var imageY = anchor_render ? anchor_render[1]*tempScene.height : 0;
                ctx.globalCompositeOperation = "source-in";
                ctx.drawImage(textureRender.canvas, 0, 0, Math.floor(tempScene.width), Math.floor(tempScene.height), imageX-texturesX, imageY-texturesY, tempScene.width*renderScale, tempScene.height*renderScale);
                disposeCanvas(textureRender.canvas)
                // Draw the base image
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(tempScene.baseImage, 0, 0, tempScene.width, tempScene.height);
                //disposeCanvas(artx.texture);
                ctx.restore();
                resolve({canvas: sceneCanvas, settings: textureRender.settings});
            });
        });
    });
}

function renderModel(renderParams, tempScene) {
    return new Promise(function(resolveRender){
        var newModel = false;
        // If there's an existing scene, remove it;
        if (!tempScene || (tempScene.camera_name !== renderParams.camera_name || tempScene.mesh_file !== renderParams.mesh_file)) {
            newModel = true;
            // Remove the previous data
            if (tempScene) delete tempScene;
            if (tempScene && tempScene.renderer) disposeCanvas(tempScene.renderer.domElement);
            // Create new data
            tempScene = {};
            tempScene.threeScene = new THREE.Scene();
            tempScene.meshModels = {};
            tempScene.cameraModels = {};
            tempScene.materials = {};
            tempScene.colorsByMesh = {};
        }
        tempScene.materialsByMesh = {};

        // Store scene name reference
        tempScene.camera_name = renderParams.camera_name;
        var scene = tempScene.threeScene;
        var texturePromises = [];

        var textures = renderParams.textures ? renderParams.textures : [];
        textures.forEach(function(artxTx){
            let texturePromise = new Promise((resolve, reject) => {
                let textureName = artxTx.hasOwnProperty("canvas") ? "canvas" : artxTx.image;
                let texture;
                if (artxTx.hasOwnProperty("canvas")) {
                    texture = new THREE.CanvasTexture(artxTx.canvas);
                    finalizeTexture(texture, textureName);
                } else if (artxTx.hasOwnProperty("image")) {
                    new THREE.TextureLoader().load(artxTx.image, function(textureObj) {
                        texture = textureObj;
                        finalizeTexture(texture, textureName);
                    });
                }

                function finalizeTexture(texture, textureName) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.rotation = artxTx.rotation ? (artxTx.rotation * Math.PI / 180) : 0;

                    var realWidth = artxTx.width;
                    var realHeight = realWidth / (texture.image.width / texture.image.height);
                    texture.repeat.set((1000 / realWidth), -(1000 / realHeight));

                    var material = new THREE.MeshStandardMaterial({
                        map: texture,
                        side: THREE.DoubleSide
                    });

                    tempScene.materials[textureName] = material;

                    if (!artxTx.hasOwnProperty("meshes")) {
                        tempScene.defaultMaterial = material;
                    }

                    
                    if (artxTx.hasOwnProperty("meshes")) {
                        artxTx.meshes.forEach(function(meshIndex) {
                            tempScene.materialsByMesh[meshIndex] = textureName;
                        });
                    }
                    resolve();
                }
            });

            texturePromises.push(texturePromise);
        });

        // Load the Collada file for the camera position textured mesh
        if (!tempScene.cameraModels.hasOwnProperty(renderParams.camera_file)) {
            const loadingManager = new THREE.LoadingManager(function () { });
            const loader = new ColladaLoader(loadingManager);
            var colladaPromise = new Promise((resolve, reject) => {
                loader.load(artx.imagePath(renderParams.camera_file), function (filea) {
                    tempScene.cameraModels[renderParams.camera_file] = filea;
                    resolve();
                });
            });
        }

        // Load the GLTF file for the textured mesh
        if (!tempScene.meshModels.hasOwnProperty(renderParams.mesh_file)) {
            const gltfLoadingManager = new THREE.LoadingManager(function () { });
            const gltfLoader = new GLTFLoader(gltfLoadingManager);
            var gltfPromise = new Promise((resolve, reject) => {
                gltfLoader.load(artx.imagePath(renderParams.mesh_file), function (fileb) {
                    tempScene.meshModels[renderParams.mesh_file] = fileb;
                    tempScene.mesh_file = renderParams.mesh_file
                    resolve();
                });
            });
        }

        Promise.all([...texturePromises, colladaPromise, gltfPromise]).then(function(){
            var gltfModel = tempScene.meshModels[renderParams.mesh_file].scene;
            var daeModel = tempScene.cameraModels[renderParams.camera_file].scene;

            // Function performs function on all children
            function allChildren(object, actionFunction){
                actionFunction(object);
                // If this object has children, check those too
                if (object.children.length) {
                    object.children.forEach(function(child){allChildren(child, actionFunction)});
                }
            }

            // Apply materials to meshes in the model
            var meshes = [];
            var meshIndex = 0;
            allChildren(gltfModel, function(object){
                if (object.type == "Mesh") {
                    meshes.push(object);
                    if (!textures.length) {
                        // Distinct colours sourced from: https://sashamaps.net/docs/resources/20-colors/
                        let distinctColors = ["#e6194B","#3cb44b","#ffe119","#4363d8","#f58231","#911eb4","#42d4f4","#f032e6","#bfef45","#fabed4","#469990","#dcbeff","#9A6324","#fffac8","#800000","#aaffc3","#808000","#ffd8b1","#000075","#a9a9a9","#000000","#eeeeee"]
                        var color = renderParams.colors && renderParams.colors[meshIndex] ? renderParams.colors[meshIndex] : distinctColors[meshIndex];
                        tempScene.colorsByMesh[meshIndex] = color;
                        object.material = new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide});
                    } else {
                        object.material = tempScene.materialsByMesh[meshIndex] ? tempScene.materials[tempScene.materialsByMesh[meshIndex]] : tempScene.defaultMaterial;
                    }
                    meshIndex++;
                }
            });

            if (newModel) {
                scene.add(gltfModel);
                scene.add(daeModel);
                scene.add(new THREE.AmbientLight("#FFFFFF"));
                // Check for cameras
                var cameras = [];
                allChildren(daeModel, function(object){
                    if (object.type == "PerspectiveCamera") {
                        cameras.push(object);
                    }
                });
                tempScene.camera =  renderParams.camera_name ? cameras.find(camera => camera.name === renderParams.camera_name) : cameras[0];
                // If this view has crop offset data
                if (renderParams.crop_x !== null && renderParams.crop_x !== undefined) {
                    let fullWidth = renderParams.width/renderParams.crop_width;
                    let fullHeight = fullWidth/(renderParams.width/renderParams.height);
                    tempScene.camera.setViewOffset(fullWidth, fullHeight, renderParams.crop_x*fullWidth, renderParams.crop_y*fullHeight, fullWidth*renderParams.crop_width, (fullWidth*renderParams.crop_width)/(renderParams.width/renderParams.height));
                }
                tempScene.camera.aspect = renderParams.width / renderParams.height;
                tempScene.camera.far = 10000;
                if (renderParams.fov) tempScene.camera.fov = renderParams.fov;
                tempScene.camera.updateProjectionMatrix();
            }

            artx.sceneRenderer = (artx.sceneRenderer) ? artx.sceneRenderer : new THREE.WebGLRenderer({alpha: true, antialias: true});
            let sceneRenderer = (renderParams.renderer) ? renderParams.renderer : artx.sceneRenderer;
            sceneRenderer.setSize(renderParams.width, renderParams.height);
            sceneRenderer.render(scene, tempScene.camera);
            resolveRender({canvas: sceneRenderer.domElement, settings: tempScene});
        });
    });
}
