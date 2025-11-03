#version 300 es
precision mediump float;
out vec4 fragColor;
in vec2 vTexCoord;

uniform float uCanvasWidth;
uniform float uCanvasHeight;
uniform sampler2D uImage;

void main() {
    vec2 pixelPos = gl_FragCoord.xy;

    vec4 color = texture(uImage, vTexCoord);
    //fragColor = vec4(pixelPos.x / uCanvasWidth, pixelPos.y / uCanvasHeight, 1.0, 1.0); // Example
    fragColor = color;
    
}
