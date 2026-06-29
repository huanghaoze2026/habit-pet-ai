<template>
  <web-view :src="url" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const url = ref('')

onLoad((options?: any) => {
  const raw = options?.url || 'https://lanyunke.com/#about'
  url.value = decodeURIComponent(raw)
})
</script>
