window.addEventListener("load", function() {
    const interactiveSvgController = (() => {
        let currentSvg = null;
        let currentStyleId = null;
        const svgContainer = document.getElementById("svg-canvas-container");

        function show() {
            if (svgContainer) svgContainer.style.display = "";
        }

        function hide() {
            if (svgContainer) svgContainer.style.display = "none";
        }

        function render(styleId, rowData, width, height, angle = 0) {
            currentStyleId = styleId;

            const newSvg = generateSvg(rowData, width, height, angle);
            newSvg.setAttribute("data-trigger", styleId);
            newSvg.classList.add("canvas");
            newSvg.style.zIndex = 1000;
            newSvg.style.width = "100%";

            svgContainer.innerHTML = "";
            svgContainer.appendChild(newSvg);

            // Style paths for the current style
            newSvg.querySelectorAll("path").forEach(path => {
                path.style.stroke = "rgba(76, 114, 255, 1)";
                path.style.fill = "rgba(255, 255, 255, 0)";
                path.setAttribute("vector-effect", "non-scaling-stroke");
                // path.setAttribute("stroke-dasharray", "7,3");
                if (path.getAttribute("data-style") === styleId) {
                    path.classList.add("selected");
                    path.style.strokeWidth = "5px";
                    // path.removeAttribute("stroke-dasharray");
                }
            });

            currentSvg = newSvg;
            svgPathListener(currentSvg);
        }

        function update(rowData, width, height, angle = 0) {
            if (currentStyleId) {
                render(currentStyleId, rowData, width, height, angle);
            }
        }

        function getCurrentStyleId() {
            return currentStyleId;
        }

        return {
            render,
            update,
            show,
            hide,
            getCurrentStyleId
        };
    })();

    // When a material is added, new select buttons are created
    window.addEventListener("materialAdded", (e) => {
        let selectTilesButtons = document.querySelectorAll(".placement-select");
        selectTilesButtons.forEach(button => {
            button.removeEventListener("click", handleClick);
            button.addEventListener("click", handleClick);
        });

        function handleClick(event) {
            const tileButton = event.currentTarget;
            const styleId = tileButton.closest(".additional-material-section").getAttribute("data-style-name");

            tileButton.classList.toggle("active");
            if (tileButton.classList.contains("active")) {
                interactiveSvgController.render(
                    styleId,
                    artx.mainTextureGenerator.rowData,
                    artx.mainTextureGenerator.width_mm,
                    artx.mainTextureGenerator.height_mm,
                    artx.mainTextureGenerator.params.patternRotateAngle
                );
                interactiveSvgController.show();
            } else {
                interactiveSvgController.hide();
            }
        }
    });

    window.addEventListener("materialRemoved", (e) => {
        interactiveSvgController.hide();
        document.getElementById("svg-canvas-container").innerHTML = "";
    });

    window.addEventListener("drawComplete", (e) => {
        interactiveSvgController.update(
            artx.mainTextureGenerator.rowData,
            artx.mainTextureGenerator.width_mm,
            artx.mainTextureGenerator.height_mm,
            artx.mainTextureGenerator.params.patternRotateAngle
        );
    });

    function svgPathListener(interactiveSvg) {
        const paths = interactiveSvg.querySelectorAll("path");

        paths.forEach(path => {
            // Hover in
            path.addEventListener("mouseenter", function () {
                path.style.fill = "rgba(76, 114, 255, 0.2)";
            });

            // Hover out
            path.addEventListener("mouseleave", function () {
                path.style.fill = "rgba(0, 0, 0, 0)";
            });

            // Click
            path.addEventListener("click", function () {
                const row = parseInt(path.getAttribute("data-row"));
                const column = parseInt(path.getAttribute("data-column"));
                const styleId = path.closest("svg").getAttribute("data-trigger");
                const tileKey = `${row},${column}`;

                path.classList.toggle("selected");
                if (path.classList.contains("selected")) {
                    path.style.strokeWidth = "5px";
                    params.selectedTiles[tileKey] = styleId;
                } else {
                    path.style.strokeWidth = "2px";
                    delete params.selectedTiles[tileKey];
                }

                params.selectedTile = [row, column];
                predraw();
            });
        });
    }
});