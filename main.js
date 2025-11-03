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
    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext("webgl2");
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
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
}

main();

