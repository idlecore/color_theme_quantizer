const catpuccin = [
    [245, 224, 220, 255],
    [242, 205, 205, 255],
    [245, 194, 231, 255],
    [203, 166, 247, 255],
    [243, 139, 168, 255],
    [235, 160, 172, 255],
    [250, 179, 135, 255],
    [249, 226, 175, 255],
    [166, 227, 161, 255],
    [148, 226, 213, 255],
    [137, 220, 235, 255],
    [116, 199, 236, 255],
    [137, 180, 250, 255],
    [180, 190, 254, 255],
    [205, 214, 244, 255],
    [186, 194, 222, 255],
    [166, 173, 200, 255],
    [147, 153, 178, 255],
    [127, 132, 156, 255],
    [108, 112, 134, 255],
    [88, 91, 112, 255],
    [69, 71, 90, 255],
    [49, 50, 68, 255],
    [30, 30, 46, 255],
    [24, 24, 37, 255],
    [17, 17, 27, 255],
    [69, 71, 90, 255],
    [88, 91, 112, 255],
    [166, 227, 161, 255],
    [137, 216, 139, 255],
    [249, 226, 175, 255],
    [235, 211, 145, 255],
    [137, 180, 250, 255],
    [116, 168, 252, 255],
    [245, 194, 231, 255],
    [242, 174, 222, 255],
    [148, 226, 213, 255],
    [107, 215, 202, 255],
    [166, 173, 200, 255],
    [186, 194, 222, 255]
];

// webgl-utils.js
async function fetchShaderFile(url) {
    return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
        req.addEventListener("load", function () {
            resolve(this.responseText);
    });
        req.addEventListener("error", function () {
            reject(new Error(`Failed to load shader: ${url}`));
        });
        req.open("GET", url);
    req.send();
    });
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initGLContext(canvasId) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
    if (!gl) {
        console.error("WebGL required!");
        return null;
    }
    return { gl, canvas };
}

async function loadShaders() {
    const vsSource = await fetchShaderFile("/shaders/vertex.glsl");
    const fsSource = await fetchShaderFile("/shaders/fragment.glsl");
    return { vsSource, fsSource };
}

function createShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function createProgramInfo(gl, shaderProgram) {
    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            texCoord: gl.getAttribLocation(shaderProgram, 'aTexCoord'),
        },
        uniformLocations: {
            canvasWidth: gl.getUniformLocation(shaderProgram, 'uCanvasWidth'),
            canvasHeight: gl.getUniformLocation(shaderProgram, 'uCanvasHeight'),
            image: gl.getUniformLocation(shaderProgram, 'uImage'),
            colorscheme: gl.getUniformLocation(shaderProgram, 'uColorScheme'),
        }
    };
}

function createBuffers(gl) {
    const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
    ]);
    const texCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    return { positionBuffer, texCoordBuffer };
}

function setAttributes(gl, programInfo, buffers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2, gl.FLOAT, false, 0, 0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);
    gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.texCoord,
        2, gl.FLOAT, false, 0, 0
    );
}

function setUniforms(gl, programInfo, canvas) {
    gl.uniform1f(programInfo.uniformLocations.canvasWidth, canvas.width);
    gl.uniform1f(programInfo.uniformLocations.canvasHeight, canvas.height);
    gl.uniform4fv(programInfo.uniformLocations.colorscheme, new Float32Array(catpuccin.flat().map(v => v / 255)));
}

// texture-utils.js
function loadAndBindTexture(gl, imageUrl, programInfo, onLoad) {
    const image = new Image();
    image.src = imageUrl;
    image.onload = function() {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.image, 0);

        if (onLoad) onLoad();
    };
}

// main.js
async function main() {
    const { gl, canvas } = initGLContext('canvas');
    if (!gl) return;

    let vsSource, fsSource;
    try {
        ({ vsSource, fsSource } = await loadShaders());
        console.log("Loaded shaders");
    } catch (e) {
        console.error(e);
        return;
    }

    const shaderProgram = createShaderProgram(gl, vsSource, fsSource);
    const programInfo = createProgramInfo(gl, shaderProgram);
    const buffers = createBuffers(gl);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    setAttributes(gl, programInfo, buffers);
    setUniforms(gl, programInfo, canvas);

    loadAndBindTexture(gl, '/test.png', programInfo, () => {
        render();
    });

    window.gl = gl;
    window.programInfo = programInfo;
    window.render = render;

    function render(fullsize=false, callback=null) {
        requestAnimationFrame(() => {
            console.time("render");
            const visibleCanvas = document.getElementById('canvas');
            const ctx = visibleCanvas.getContext('2d');
            const w = gl.canvas.width;
            const h = gl.canvas.height;

            if (fullsize) {
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            } else {
                const w = gl.canvas.width;
                const h = gl.canvas.height;

                gl.canvas.width = visibleCanvas.width;
                gl.canvas.height = visibleCanvas.height;

                gl.viewport(0, 0, visibleCanvas.width, visibleCanvas.height);
            }

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            ctx.drawImage(canvas, 0, 0, visibleCanvas.width, visibleCanvas.height);

            if (!fullsize) {
                gl.canvas.width = w;
                gl.canvas.height = h;
            }

            console.timeEnd("render");
            if (callback) callback();
        });
    }
}

main();
