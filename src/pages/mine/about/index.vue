<template>
  <view class="page-about">
    <image
      class="about-image"
      src="/static/guide-flow.jpg"
      mode="widthFix"
      @click="previewImage"
    />
  </view>
</template>

<script setup lang="ts">
const previewImage = () => {
  uni.previewImage({
    urls: ['/static/guide-flow.jpg'],
    current: '/static/guide-flow.jpg',
  })
}
</script>

<style scoped>
.page-about {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F0FF, #EBE0FF);
}
.about-image {
  width: 100%;
}
</style>
