import { fetchFile } from "./util.js";

let themes = null;

async function getThemes() {
    if (themes == null) {
        const themeFile = await fetchFile("themes.json");
        themes = JSON.parse(themeFile);
    }

    return themes;
}

async function getCurrentTheme() {
    const themes = await getThemes();
    const selection = document.getElementById('theme-select').value;
    return themes[selection];
}

function updateTheme(gl, themeData, program, onLoad) {
    gl.uniform4fv(program.uniformLocations.colorscheme, new Float32Array(themeData.flat().map(v => v / 255)));

    if (onLoad) onLoad();
}

export { getThemes, getCurrentTheme, updateTheme};
