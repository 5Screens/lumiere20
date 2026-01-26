import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

const Noir = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{orange.50}',
      100: '{orange.100}',
      200: '{orange.200}',
      300: '{orange.300}',
      400: '{orange.400}',
      500: '{orange.500}',
      600: '{orange.600}',
      700: '{orange.700}',
      800: '{orange.800}',
      900: '{orange.900}',
      950: '{orange.950}'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{orange.500}',
          inverseColor: '#ffffff',
          hoverColor: '{orange.600}',
          activeColor: '{orange.700}'
        },
        highlight: {
          background: '{orange.50}',
          focusBackground: '{orange.100}',
          color: '{orange.700}',
          focusColor: '{orange.800}'
        }
      },
      dark: {
        primary: {
          color: '{orange.400}',
          inverseColor: '{surface.900}',
          hoverColor: '{orange.300}',
          activeColor: '{orange.200}'
        },
        highlight: {
          background: 'color-mix(in srgb, {orange.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {orange.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        }
      }
    }
  }
})

export default Noir
