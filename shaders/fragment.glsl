#version 300 es
precision mediump float;

out vec4 fragColor;
in vec2 vTexCoord;

#define NUM_COLORS 40

uniform float uCanvasWidth;
uniform float uCanvasHeight;
uniform sampler2D uImage;
uniform vec4 uColorScheme[NUM_COLORS];

// sRGB to linear RGB gamma correct
float GammaCorrect(float color) {
    if (color <= 0.04045) {
        return color / 12.92;
    } else {
        return pow((color + 0.055) / 1.055, 2.4);
    }
}

// Convert RGB to CIE XYZ
vec3 RGBToXYZ(vec3 rgb) {

    // Necessary to correct yellows, but not necessarily in line with the
    // transform article from Bruce Lindbloom.
    // In theory, you would be able to transform sRGB??
    rgb.r = GammaCorrect(rgb.r);
    rgb.g = GammaCorrect(rgb.g);
    rgb.b = GammaCorrect(rgb.b);

    // RGB to XYZ conversion matrix (sRGB to XYZ using D65 white point)
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    mat3 rgb2xyzMat = mat3(
        0.4124564, 0.3575761, 0.1804375,
        0.2126729, 0.7151522, 0.0721750,
        0.0193339, 0.1191920, 0.9503041
    );
    vec3 xyz = rgb * rgb2xyzMat;

    // Normalize XYZ for D65 reference white
    xyz.r /= 0.95047; // X normalization
    xyz.b /= 1.08883; // Z normalization

    return xyz;
}

// Convert XYZ to LAB
// https://en.wikipedia.org/wiki/CIELAB_color_space#From_CIE_XYZ_to_CIELAB
vec3 XYZToLab(vec3 xyz) {

    // D65 reference white
    // https://en.wikipedia.org/wiki/Standard_illuminant#D65_values
    vec3 refWhite = vec3(0.95047, 1.00000, 1.08883);

    // Normalize XYZ to reference white
    xyz = xyz / refWhite;

    // Step 1: Compute f(x) for each component
    vec3 fxyz = pow(xyz, vec3(1.0/3.0)); // Apply cube root for XYZ > 0.008856
    fxyz = mix(fxyz, (xyz * 903.3 + 16.0) / 116.0, step(0.008856, xyz));  // Component-wise condition

    // Step 2: Calculate L, a, b
    float L = (116.0 * fxyz.g) - 16.0;           // L = 116 * fy - 16
    float a = 500.0 * (fxyz.r - fxyz.g);         // a = 500 * (fx - fy)
    float b = 200.0 * (fxyz.g - fxyz.b);         // b = 200 * (fy - fz)

    return vec3(L, a, b);
}

float customDistance(vec4 color1, vec4 color2) {
    return distance(XYZToLab(RGBToXYZ(color1.rgb)), XYZToLab(RGBToXYZ(color2.rgb)));
}

vec4 getClosestColor(vec4 color) {
    vec4 match = uColorScheme[0];
    float minDistance = 1e20; // Exceedingly large, arbitrary value

    for (int i = 0; i < NUM_COLORS; i++) {
        float newDistance = customDistance(uColorScheme[i], color);
        if (newDistance < minDistance) {
            minDistance = newDistance;
            match = uColorScheme[i];
        }
    }

    return match;
}

void main() {
    vec4 color = texture(uImage, vTexCoord);
    vec4 match = getClosestColor(color);
    fragColor = vec4(match.rgb, color.a);
}
