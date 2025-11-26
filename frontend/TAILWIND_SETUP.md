# Tailwind CSS 4.1 Configuration

## Installation

Tailwind CSS 4.1 has been successfully installed and configured in this project.

**Note**: Tailwind CSS 4.x requires the `@tailwindcss/postcss` package instead of using `tailwindcss` directly as a PostCSS plugin.

## Files Created/Modified

### Configuration Files
- **tailwind.config.js**: Main Tailwind configuration with custom primary color palette
- **postcss.config.js**: PostCSS configuration using `@tailwindcss/postcss` plugin
- **src/assets/styles/tailwind.css**: Main Tailwind CSS file with directives

### Modified Files
- **vite.config.js**: Added PostCSS configuration
- **src/main.js**: Imported Tailwind CSS file
- **package.json**: Added tailwindcss, @tailwindcss/postcss, postcss, and autoprefixer dependencies

## Usage

### Using Tailwind Classes in Vue Components

You can now use Tailwind utility classes directly in your Vue components:

```vue
<template>
  <div class="flex items-center justify-center p-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
    <h1 class="text-2xl font-bold">Hello Tailwind!</h1>
  </div>
</template>
```

### Custom Primary Color

The primary color palette has been configured to match your existing blue theme:
- `primary-50` to `primary-950` are available as utility classes
- Example: `bg-primary-500`, `text-primary-700`, `border-primary-300`

### PrimeVue Compatibility

The configuration is set up to work alongside PrimeVue:
- CSS layer order is configured in `main.js` for proper precedence
- Tailwind's preflight is enabled but won't conflict with PrimeVue styles

### Common Utility Classes

- **Layout**: `flex`, `grid`, `block`, `inline-block`, `hidden`
- **Spacing**: `p-4`, `m-2`, `px-6`, `py-3`, `gap-4`
- **Colors**: `bg-primary-500`, `text-white`, `border-gray-300`
- **Typography**: `text-xl`, `font-bold`, `text-center`, `uppercase`
- **Sizing**: `w-full`, `h-screen`, `max-w-lg`, `min-h-0`
- **Flexbox**: `justify-center`, `items-center`, `flex-col`, `flex-wrap`
- **Borders**: `rounded-lg`, `border`, `border-2`, `border-solid`
- **Effects**: `shadow-md`, `hover:shadow-lg`, `transition-all`

### Responsive Design

Use responsive prefixes for different screen sizes:
```vue
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- Full width on mobile, half on tablet, third on desktop -->
</div>
```

### Dark Mode

Tailwind supports dark mode with the `dark:` prefix:
```vue
<div class="bg-white dark:bg-gray-800 text-black dark:text-white">
  <!-- Adapts to dark mode -->
</div>
```

## Development

When running `npm run dev`, Vite will automatically process Tailwind CSS and generate the necessary styles based on the classes you use in your components.

## Build

When running `npm run build`, Tailwind will automatically purge unused styles to keep the final CSS bundle size minimal.

## Notes

- The `@tailwind` warnings in the IDE are normal and will be resolved by PostCSS during build
- Tailwind classes can be used alongside existing custom CSS
- The configuration respects the existing PrimeVue setup
