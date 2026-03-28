import type { TextureConfig } from '@textura/shared';

/**
 * Default texture configuration — used when creating a new project.
 */
export const DEFAULT_TEXTURE_CONFIG: TextureConfig = {
  version: 1,
  seed: 42,  // Fixed seed — avoids Next.js hydration mismatch
  units: 'mm',

  pattern: {
    type: 'herringbone',
    category: 'paving',
    rows: 8,
    columns: 8,
    angle: 45,
    stretchers: 1,
    weaves: 1,
  },

  materials: [
    {
      id: 'mat_1',
      definitionId: 'granite',
      source: {
        type: 'image',
        asset: { path: 'materials/1/thumb_200.jpg', mimeType: 'image/jpeg', width: 200, height: 200 },
        fallbackColor: '#d8d9d4',
      },
      uploadWidth: null,
      width: 300,
      height: 300,
      minWidth: 10,
      minHeight: 10,

      appearance: {
        lightIntensity: 50,
        surface: 'none',
        surfaceScale: 50,
      },

      adjustments: {
        brightness: 0,
        contrast: 0,
        hue: 0,
        saturation: 0,
        invertColors: false,
      },
      tint: null,

      edges: {
        style: 'handmade',
        perimeterScale: 50,
        profileWidth: 50,
        excludeSides: [],
      },

      profile: null,
      finish: null,
      toneVariation: 42,
      randomiseFillAngle: false,

      placement: {
        mode: 'random',
        frequency: 100,
        rules: null,
      },

      pbr: {
        bump: {
          geometry: true,
          edgeDepth: 50,
          imageSource: 'grayscale',
          adjustments: { brightness: 0, contrast: 0, hue: 0, saturation: 0, invertColors: false, opacity: 100 },
        },
        specular: {
          geometry: true,
          edgeDepth: 30,
          imageSource: 'none',
          adjustments: { brightness: 0, contrast: 0, hue: 0, saturation: 0, invertColors: false, opacity: 100 },
        },
        normal: {
          geometry: true,
          edgeDepth: 50,
          imageSource: 'grayscale',
          adjustments: { brightness: 0, contrast: 0, hue: 0, saturation: 0, invertColors: false, opacity: 100 },
        },
        displacement: {
          geometry: true,
          edgeDepth: 50,
          imageSource: 'grayscale',
          adjustments: { brightness: 0, contrast: 0, hue: 0, saturation: 0, invertColors: false, opacity: 100 },
        },
        roughness: {
          geometry: true,
          edgeDepth: 30,
          baseRoughness: 70,
          imageSource: 'grayscale',
          adjustments: { brightness: -10, contrast: 20, hue: 0, saturation: 0, invertColors: false, opacity: 50 },
        },
        metalness: {
          geometry: false,
          edgeDepth: 0,
          baseMetalness: 0,
          imageSource: 'none',
          adjustments: { brightness: 0, contrast: 0, hue: 0, saturation: 0, invertColors: false, opacity: 100 },
        },
      },
    },
  ],

  joints: {
    materialSource: { type: 'solid', color: '#e8e6e0' },
    tint: '#FFFFFF',
    horizontalSize: 5,
    verticalSize: 5,
    linkedDimensions: true,
    shadowOpacity: 20,
    recess: false,
    concave: false,
    adjustments: {
      brightness: 0,
      contrast: 0,
      hue: 0,
      saturation: 0,
      invertColors: false,
    },
  },

  hatch: null,
  surfaceProfile: null,
  surfaceFinish: null,

  output: {
    widthPx: 1200,
    heightPx: 1200,
  },
};
