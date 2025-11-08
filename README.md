# A Better Theme Converter

This theme converter provides more accurate color matching by utilizing CIE LAB color differencing, which models human color perception. As a result, theme conversions are visually consistent and superior to traditional RGB-based methods. Additionally, the conversion and rendering are performed in a WebGL fragment shader, making the conversion process significantly faster than JavaScript image processing.

## Supported Themes

- [Catpuccin](https://catppuccin.com/)
- [Gruvbox](https://github.com/morhetz/gruvbox/tree/master)
- [Rose Pine](https://rosepinetheme.com/)

Want a new theme? Submit a pull request or an issue! Themes are all contained
in the themes.json file.


## TODO:
- RGB->LAB should be pre-computed for all theme colors. This will save
  n * y, where y = |Colors in theme| time, which could be substantial
  \(ROM of seconds\)
