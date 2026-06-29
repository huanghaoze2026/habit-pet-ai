<template>
  <scroll-view scroll-y class="page">
    <view class="content">
      <text class="title">隐私政策</text>
      <text class="date">更新日期：2026年6月18日\n生效日期：2026年6月18日</text>

      <text class="p">"打卡养AI宠物"微信小程序（以下简称"我们"）非常重视用户个人信息与隐私保护。本《隐私政策》将向您说明我们如何收集、使用、存储和保护您的信息。</text>

      <text class="h2">一、我们收集的信息</text>
      <text class="p"><text class="bold">1.1 微信授权登录信息</text>\n当您使用微信登录时，我们获取：微信OpenID、微信昵称、微信头像。</text>
      <text class="p"><text class="bold">1.2 您主动提供的信息</text>\n宝贝昵称、年龄、性别、年级；创建的任务内容；与AI宠物的对话记录（文字和语音转文字内容）。</text>
      <text class="p"><text class="bold">1.3 使用记录</text>\n任务完成与打卡记录；宠物成长与互动记录；AI对话次数与Token消耗。</text>
      <text class="p"><text class="bold">1.4 设备与日志信息</text>\n设备型号、操作系统版本；IP地址、网络状态；页面访问日志。</text>

      <text class="h2">二、我们如何使用信息</text>
      <text class="p">提供登录与账号服务；实现任务创建、打卡、宠物成长功能；实现AI对话与宠物记忆功能；为家长提供孩子使用情况查看；优化产品体验与系统安全。</text>

      <text class="h2">三、AI服务说明</text>
      <text class="p">本小程序的AI对话功能依赖第三方大语言模型服务（包括但不限于DeepSeek、Groq等）。用户与AI宠物的对话内容会被发送至AI服务商以生成回复。我们已与AI服务商约定：对话内容仅用于实时生成回复；不会用于模型训练；不会用于其他商业用途。</text>

      <text class="h2">四、信息共享</text>
      <text class="p">我们不会出售您的个人信息。仅在以下情况共享必要信息：微信登录与支付服务；AI服务商（仅限对话内容）；法律法规要求。</text>

      <text class="h2">五、信息存储与保护</text>
      <text class="p">数据存储在腾讯云服务器（新加坡节点）；采用HTTPS加密传输；数据库访问权限隔离；定期安全备份。</text>

      <text class="h2">六、未成年人隐私保护</text>
      <view class="highlight-box">
        <text>本小程序主要面向8至16岁未成年人用户。我们承诺：\n• 未成年人需在监护人同意下使用\n• 仅收集功能必要的最少信息\n• 不开放陌生人社交\n• 不推送不良内容\n• 家长拥有数据查看与管理权限\n• 监护人可随时要求删除未成年人数据或注销账号</text>
      </view>

      <text class="h2">七、用户权利</text>
      <text class="p">您有权：查询、修改个人信息；删除部分信息；申请注销账号；撤回授权。</text>

      <text class="h2">八、账号注销</text>
      <text class="p">用户可通过"我的-设置-注销账号"申请注销。注销后：账号将在30天内完成数据删除；会员权益（如有）将失效；法律法规要求保留的数据除外。</text>

      <text class="h2">九、第三方服务</text>
      <text class="p">本小程序接入以下第三方服务：微信登录SDK、DeepSeek API（AI对话）、Groq API（语音识别）、腾讯云服务（服务器与存储）。第三方服务可能有其独立的隐私政策。</text>

      <text class="h2">十、隐私政策更新</text>
      <text class="p">我们可能根据法律法规或产品变化更新本政策。更新后将在平台公布，继续使用即视为同意。</text>

      <text class="h2">十一、联系我们</text>
      <view class="contact-box">
        <text class="p">📧 联系邮箱：support@lanyunke.com</text>
        <text class="p">🌐 官方网站：lanyunke.com</text>
        <text class="p">📄 网页版隐私政策：lanyunke.com/privacy</text>
      </view>

      <text class="footer-text">© 2026 打卡养AI宠物 · 保留所有权利</text>
    </view>
  </scroll-view>
</template>
<script setup lang="ts"></script>
<style scoped>
.page { height:100vh; background:#F5F0FF; }
.content { padding:30rpx; line-height:2; color:#333; padding-bottom:80rpx; }
.title { font-size:44rpx; color:#5B3E96; text-align:center; display:block; margin-bottom:8rpx; font-weight:bold; }
.date { text-align:center; color:#999; font-size:24rpx; display:block; margin-bottom:40rpx; }
.h2 { font-size:34rpx; color:#5B3E96; display:block; margin-top:36rpx; margin-bottom:16rpx; font-weight:bold; border-left:6rpx solid #FF8E9E; padding-left:16rpx; }
.p { font-size:28rpx; color:#444; display:block; margin-bottom:16rpx; white-space:pre-line; }
.bold { font-weight:bold; }
.highlight-box { background:#FFF3E0; border-left:8rpx solid #FF9800; padding:20rpx 24rpx; border-radius:8rpx; margin:8rpx 0 16rpx; }
.highlight-box text { font-size:26rpx; color:#E65100; white-space:pre-line; }
.contact-box { background:#fff; border-radius:12rpx; padding:20rpx; margin-top:8rpx; }
.contact-box .p { margin-bottom:8rpx; }
.footer-text { display:block; text-align:center; font-size:22rpx; color:#999; margin-top:60rpx; }
</style>
