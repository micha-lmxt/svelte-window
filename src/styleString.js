export const styleString = (s) => (s.position !== undefined ? "position: " + s.position + ";" : "") +
    (s.left !== undefined ? "left: " + s.left + "px;" : "") +
    (s.right !== undefined ? "right: " + s.right + "px;" : "") +
    (s.top !== undefined ? "top: " + s.top + "px;" : "") +
    (s.height !== undefined ?
        "height: " + (typeof s.height === "number" ? s.height + "px" : s.height) + ";"
        : "") +
    (s.width !== undefined ?
        "width: " + (typeof s.width === "number" ? s.width + "px" : s.width) + ";"
        : "");