import type { TextureConfig } from '@textura/shared';

/**
 * Default texture configuration — used when creating a new project.
 */
export const DEFAULT_TEXTURE_CONFIG: TextureConfig = {
  version: 1,
  seed: 42, // Fixed seed — avoids Next.js hydration mismatch
  units: 'mm',

  pattern: {
    type: 'stack_bond',
    category: 'brick_bond',
    orientation: 'horizontal',
    rows: 6,
    columns: 4,
    angle: 0,
    stretchers: 1,
    weaves: 1,
  },

  materials: [
    {
      id: 'mat_1',
      definitionId: 'graphite',
      source: {
        type: 'image',
        asset: {
          path: '/materials/graphite.jpg',
          mimeType: 'image/jpeg',
        },
        fallbackColor: '#4a4a4a',
      },
      uploadWidth: null,
      width: 400,
      height: 100,
      minWidth: 50,
      minHeight: 50,

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




      profile: null,
      finish: null,

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
          adjustments: {
            brightness: 0,
            contrast: 0,
            hue: 0,
            saturation: 0,
            invertColors: false,
            opacity: 100,
          },
        },
        specular: {
          geometry: true,
          edgeDepth: 30,
          imageSource: 'none',
          adjustments: {
            brightness: 0,
            contrast: 0,
            hue: 0,
            saturation: 0,
            invertColors: false,
            opacity: 100,
          },
        },
        normal: {
          geometry: true,
          edgeDepth: 50,
          imageSource: 'grayscale',
          adjustments: {
            brightness: 0,
            contrast: 0,
            hue: 0,
            saturation: 0,
            invertColors: false,
            opacity: 100,
          },
        },
        displacement: {
          geometry: true,
          edgeDepth: 50,
          imageSource: 'grayscale',
          adjustments: {
            brightness: 0,
            contrast: 0,
            hue: 0,
            saturation: 0,
            invertColors: false,
            opacity: 100,
          },
        },
        roughness: {
          geometry: true,
          edgeDepth: 30,
          baseRoughness: 70,
          imageSource: 'grayscale',
          adjustments: {
            brightness: -10,
            contrast: 20,
            hue: 0,
            saturation: 0,
            invertColors: false,
            opacity: 50,
          },
        },
        metalness: {
          geometry: false,
          edgeDepth: 0,
          baseMetalness: 0,
          imageSource: 'none',
          adjustments: {
            brightness: 0,
            contrast: 0,
            hue: 0,
            saturation: 0,
            invertColors: false,
            opacity: 100,
          },
        },
      },
    },
  ],

  joints: {
    materialSource: { type: 'solid', color: '#FFFFFF' },

    horizontalSize: 5,
    verticalSize: 5,
    linkedDimensions: true,

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
