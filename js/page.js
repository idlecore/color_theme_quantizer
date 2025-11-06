import { updateTextureWithImage } from './texture-utils.js';
import { getThemes, updateTheme, getCurrentTheme} from './theme-utils.js';


function updateColorTheme(gl, color, programInfo) {

}

function initDrop() {
    const dropArea = document.getElementById('drop-area');
    const fileElem = document.getElementById('fileElem');
    const canvas = document.getElementById('canvas');

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.background = '#eef';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.background = '';
        }, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => fileElem.click());
    fileElem.addEventListener('change', handleFiles);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = function () {
                        //canvas.width = img.width;
                        //canvas.height = img.height;
                        // adjust canvas aspect ratio
                        canvas.width = Math.min(img.width, 800);
                        canvas.height = img.height * (canvas.width / img.width);
                        window.gl.canvas.width = img.width;
                        window.gl.canvas.height = img.height;
                        updateTextureWithImage(window.gl, img, window.programInfo, window.render);
                        // Fit image to canvas
                        // let scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                        // let x = (canvas.width / 2) - (img.width / 2) * scale;
                        // let y = (canvas.height / 2) - (img.height / 2) * scale;
                        // ctx.drawImage(img, 0, 0);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        }
    }
}

function initDownloadButton() {
    const downloadButton = document.getElementById('download-button');
    downloadButton.addEventListener('click', () => {
        // const ctx = document.getElementById('canvas').getContext('2d')
        // ctx.drawImage(window.gl.canvas, 0, 0);
        window.render(true, () => {
            const img = window.gl.canvas.toDataURL();
            const link = document.createElement('a');
            link.download = 'processed_image.png';
            link.href = img;
            link.click();
        });
    });
}


document.addEventListener('DOMContentLoaded', function () {
    initDrop();
    initDownloadButton();

    const themeSelect = document.getElementById('theme-select');
    getThemes().then(themes => {
        for (let i = 0; i < themes.length; ++i) {
            const option = document.createElement('option');
            option.value = i;
            option.text = themes[i].name;
            themeSelect.appendChild(option);
        }
        themeSelect.value = 3;
        console.log("Got themes!");
    });



    // Select onChange listener
    themeSelect.addEventListener('change', (e) => {
        getCurrentTheme().then(theme => {
            updateTheme(window.gl, theme.data, window.programInfo, window.render);
        });
   });

});
