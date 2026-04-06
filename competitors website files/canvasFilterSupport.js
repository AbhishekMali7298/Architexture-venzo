function rangeInputWorks() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    return !!ctx && 'filter' in ctx;
}

if (!rangeInputWorks()) {
    document.querySelectorAll("[data-canvas-support-message]").forEach(el => el.classList.remove("hide-me"));
    document.querySelectorAll("[data-canvas-support-section]").forEach(el => el.classList.add("adjustments-menus-disabled"));
}