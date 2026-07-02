<template>
  <view class="pet-animator">
    <image
      v-if="displaySrc"
      :src="displaySrc"
      mode="aspectFit"
      class="pet-anim-img"
      :class="{ 'pet-anim-img--bounce': altAction === 'bounce' }"
      @error="handleError"
    />
    <slot v-if="!displaySrc" />
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  imageSrc: string
  altAction?: string
}>()

const displaySrc = ref(props.imageSrc)

function handleError() {
  displaySrc.value = ''
}

watch(() => props.imageSrc, (v) => {
  displaySrc.value = v
})
</script>

<style scoped>
.pet-animator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pet-anim-img {
  width: 560rpx;
  height: 560rpx;
}

.pet-anim-img--bounce {
  animation: pet-bounce 0.5s ease-in-out;
}

@keyframes pet-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
}
</style>
