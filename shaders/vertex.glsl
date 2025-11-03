#version 300 es

in vec4 aVertexPosition;
in vec2 aTexCoord;
out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = aVertexPosition;
}
