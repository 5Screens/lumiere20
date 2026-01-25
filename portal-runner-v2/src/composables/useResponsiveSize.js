import { ref, onMounted, onUnmounted, computed } from 'vue'

/**
 * Composable to detect screen size and device type
 * - Smartphone (< 768px): isMobile = true
 * - Tablet (768px - 1024px): isTablet = true
 * - Desktop (> 1024px): isDesktop = true
 */
export function useResponsiveSize() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
  const isDesktop = computed(() => windowWidth.value >= 1024)

  // Device type as string for convenience
  const deviceType = computed(() => {
    if (windowWidth.value < 768) return 'mobile'
    if (windowWidth.value < 1024) return 'tablet'
    return 'desktop'
  })

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    deviceType
  }
}
