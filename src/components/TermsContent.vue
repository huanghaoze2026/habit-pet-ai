<template>
  <view class="content">
    <text class="title">用户协议</text>
    <text class="date">更新日期：2026年6月18日\n生效日期：2026年6月18日</text>

    <view class="welcome-box">
      <text>欢迎使用「好习惯养宠」微信小程序（以下简称"本小程序"）。\n\n本《用户协议》（以下简称"本协议"）是您与运营方之间关于您使用本小程序及相关服务所订立的协议。\n\n请您在注册、登录、使用前认真阅读本协议全部内容。当您点击"同意"或开始使用，即表示已阅读、理解并接受本协议全部内容。</text>
    </view>

    <text class="h2">一、产品说明</text>
    <text class="p">"好习惯养宠"是一款通过任务打卡来养成AI宠物的陪伴型小程序，主要面向8至16岁学生用户及其监护人。</text>
    <text class="p">产品核心功能包括：家长创建习惯任务、学生完成任务打卡、AI电子宠物成长与进化、AI语音与文字对话陪伴、任务提醒与通知。</text>

    <text class="h2">二、账号注册与使用</text>
    <text class="p"><text class="bold">2.1 注册方式</text>\n用户通过微信授权登录本小程序，我们将获取以下必要信息：微信OpenID、微信昵称、微信头像。以上信息仅用于账号识别与基础功能实现。</text>
    <text class="p"><text class="bold">2.2 监护人责任</text>\n未成年人应在监护人指导下使用本小程序；家长账号应妥善管理未成年人账号；家长对未成年人的使用行为承担监护责任。</text>
    <text class="p"><text class="bold">2.3 账号安全</text>\n用户应妥善保管自己的登录设备与账号信息。因用户自身原因导致账号泄露产生的风险，由用户自行承担。</text>

    <text class="h2">三、用户行为规范</text>
    <text class="p">用户在使用过程中不得从事以下行为：发布违法违规内容；侵犯他人合法权益；恶意攻击系统或批量注册账号；利用漏洞牟利；干扰平台正常运行。</text>
    <text class="p">如用户存在上述行为，我们有权限制功能、暂停或永久封禁账号。</text>

    <text class="h2">四、任务与宠物成长机制</text>
    <text class="p">本小程序中的任务、宠物成长、能量值、进化等级等功能，仅作为数字化互动内容，不具有现实货币属性，不可兑换法定货币。平台有权根据运营情况调整成长规则、奖励机制、等级系统、宠物形象等内容。</text>

    <text class="h2">五、AI对话服务说明</text>
    <text class="p">本小程序提供AI语音与文字对话功能。用户理解并同意：AI对话内容由大语言模型生成，仅供参考和陪伴；AI对话记录会被用于改善服务体验和宠物记忆功能；我们不会将对话内容用于其他商业用途；家长可通过宝贝详情页面查看孩子与AI宠物的对话记录。</text>

    <text class="h2">六、付费服务说明</text>
    <text class="p">本小程序未来可能提供会员增值服务。具体服务内容、价格、退款规则以实际开通时的页面说明为准。</text>

    <text class="h2">七、知识产权</text>
    <text class="p">本小程序中的软件代码、UI界面、图标、宠物形象、文案内容、数据结构、交互设计均受法律保护。未经授权，任何组织或个人不得复制、修改、传播或商业化使用。</text>

    <text class="h2">八、服务变更与终止</text>
    <text class="p">我们可能根据业务需要更新功能、调整服务或终止部分服务。因系统维护、网络故障、不可抗力等原因导致服务中断，我们将在合理范围内尽快恢复。</text>

    <text class="h2">九、免责声明</text>
    <text class="p">本小程序属于辅助型习惯养成工具。平台不保证用户一定形成良好习惯或学习成绩一定提高。对于因网络问题、用户设备问题、第三方平台问题造成的损失，我们将在法律允许范围内免责。</text>

    <text class="h2">十、协议修改</text>
    <text class="p">我们有权根据产品发展与法律法规变化更新本协议。更新后将在平台公布，继续使用即视为接受更新后的协议。</text>

    <text class="h2">十一、法律适用</text>
    <text class="p">本协议适用中华人民共和国法律。如发生争议，双方应友好协商；协商不成的，可向运营方所在地人民法院提起诉讼。</text>

    <text class="h2">十二、联系我们</text>
    <view class="contact-box">
      <text class="p">📧 联系邮箱：support@lanyunke.com</text>
      <text class="p">🌐 官方网站：lanyunke.com</text>
      <text class="p">📄 网页版用户协议：lanyunke.com/terms</text>
    </view>

    <text class="footer-text">© 2026 好习惯养宠 · 保留所有权利</text>
  </view>
</template>
<script setup lang="ts"></script>
<style scoped>
.content { padding:30rpx; line-height:2; color:#333; padding-bottom:80rpx; }
.title { font-size:44rpx; color:#5B3E96; text-align:center; display:block; margin-bottom:8rpx; font-weight:bold; }
.date { text-align:center; color:#999; font-size:24rpx; display:block; margin-bottom:40rpx; }
.h2 { font-size:34rpx; color:#5B3E96; display:block; margin-top:36rpx; margin-bottom:16rpx; font-weight:bold; border-left:6rpx solid #FF8E9E; padding-left:16rpx; }
.p { font-size:28rpx; color:#444; display:block; margin-bottom:16rpx; white-space:pre-line; }
.bold { font-weight:bold; }
.welcome-box { background:linear-gradient(135deg, rgba(91,62,150,0.15), rgba(255,142,158,0.15)); border-radius:16rpx; padding:24rpx; margin-bottom:20rpx; }
.welcome-box text { font-size:26rpx; color:#5B3E96; white-space:pre-line; }
.contact-box { background:#fff; border-radius:12rpx; padding:20rpx; margin-top:8rpx; }
.contact-box .p { margin-bottom:8rpx; }
.footer-text { display:block; text-align:center; font-size:22rpx; color:#999; margin-top:60rpx; }
</style>
