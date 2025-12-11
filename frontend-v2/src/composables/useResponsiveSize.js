import { ref, onMounted, onUnmounted, computed } from 'vue'

/**
 * Composable to detect screen size and return appropriate PrimeVue DataTable size
 * - Small screens (< 768px): 'small'
 * - Medium screens (768px - 1024px): null (normal)
 * - Large screens (> 1024px): 'large'
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

  const tableSize = computed(() => {
    if (windowWidth.value < 768) {
      return 'small'
    } else if (windowWidth.value >= 768 && windowWidth.value < 1024) {
      return null
    } else {
      return 'large'
    }
  })

  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
  const isDesktop = computed(() => windowWidth.value >= 1024)

  return {
    windowWidth,
    tableSize,
    isMobile,
    isTablet,
    isDesktop
  }
}
