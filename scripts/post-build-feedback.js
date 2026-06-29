/**
 * Post-build: 补充 uni-app 编译器遗漏的 feedback 页面
 * 
 * P58: 现在 pages.json 已正确注册 feedback 页面，uni-app 会自动编译。
 * 此脚本仅作为兜底：只添加缺失的路由和文件，不覆盖已有编译产出。
 */
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../dist/build/mp-weixin');
const APP_JSON = path.join(DIST, 'app.json');
const FEEDBACK_DIR = path.join(DIST, 'pages/feedback');

// 1. 确保 feedback 路由在 app.json
const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
const fbPages = ['pages/feedback/index', 'pages/feedback/list', 'pages/feedback/detail'];
const existing = new Set(app.pages.map(p => typeof p === 'string' ? p : p.path));
let changed = false;
for (const fb of fbPages) {
  if (!existing.has(fb)) {
    app.pages.push(fb);
    changed = true;
  }
}
if (changed) {
  fs.writeFileSync(APP_JSON, JSON.stringify(app, null, 2));
  console.log('[post-build] Added feedback pages to app.json');
}

// 2. 仅当编译产出缺失时才注入备用文件（不覆盖 uni-app 编译产物）
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

const compiledIndexJs = path.join(FEEDBACK_DIR, 'index.js');
if (fs.existsSync(compiledIndexJs) && fs.statSync(compiledIndexJs).size > 100) {
  console.log('[post-build] Feedback pages already compiled by uni-app, skipping injection');
  return;
}

console.log('[post-build] uni-app 编译产物缺失，注入备用文件...');

const files = {
  'index.json': '{"usingComponents":{}}',
  'index.js': `"use strict";var c=require("../../common/vendor.js"),a=require("../../services/api.js"),t={data:function(){return{title:"",content:"",loading:!1}},methods:{submit:function(){var t=this;if(!t.title.trim())return uni.showToast({title:"请输入标题",icon:"none"});if(!t.content.trim())return uni.showToast({title:"请输入内容",icon:"none"});t.loading=!0,a.default.post("/feedback",{title:t.title.trim(),content:t.content.trim()}).then(function(){uni.showToast({title:"感谢反馈！",icon:"success"}),setTimeout(function(){uni.navigateTo({url:"/pages/feedback/list"})},1e3)}).catch(function(e){uni.showToast({title:(null==e?void 0:e.message)||"提交失败",icon:"none"})}).finally(function(){t.loading=!1})},goList:function(){uni.navigateTo({url:"/pages/feedback/list"})}}};c._export_sfc(t,[["render",function(){return{}}],["__scopeId","data-v-fbidx"]]);wx.createPage(t);`,
  'index.wxml': '<view class="page"><view class="header"><text class="title">意见反馈</text></view><view class="form"><input class="input" placeholder="简单描述你的问题或建议" maxlength="100" value="{{title}}" bindinput="__e" data-event-opts="{{[[\'input\',[[\'$set\',[\'title\',\'$event\']]]]]}}"/><textarea class="textarea" placeholder="请详细描述你遇到的问题，或想提出的建议..." maxlength="1000" value="{{content}}" bindinput="__e" data-event-opts="{{[[\'input\',[[\'$set\',[\'content\',\'$event\']]]]]}}"/><button class="submit-btn" loading="{{loading}}" bindtap="submit">提交反馈</button></view><view class="link" bindtap="goList"><text>查看我的反馈记录</text></view></view>',
  'index.wxss': '.page{padding:30rpx;min-height:100vh;background:#f5f5f5}.header{text-align:center;padding:40rpx 0}.title{font-size:36rpx;font-weight:bold;color:#333}.form{background:#fff;border-radius:16rpx;padding:30rpx}.input{width:100%;height:80rpx;border:1px solid #e0e0e0;border-radius:12rpx;padding:0 20rpx;font-size:28rpx;margin-bottom:20rpx;box-sizing:border-box}.textarea{width:100%;height:300rpx;border:1px solid #e0e0e0;border-radius:12rpx;padding:20rpx;font-size:28rpx;box-sizing:border-box}.submit-btn{width:100%;height:88rpx;line-height:88rpx;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:32rpx;border-radius:44rpx;margin-top:30rpx;border:none}.link{text-align:center;padding:30rpx;color:#667eea;font-size:28rpx}',
  'list.json': '{"usingComponents":{}}',
  'list.js': `"use strict";var c=require("../../common/vendor.js"),a=require("../../services/api.js"),t={data:function(){return{list:[]}},methods:{goAdd:function(){uni.navigateTo({url:"/pages/feedback/index"})},goDetail:function(e){uni.navigateTo({url:"/pages/feedback/detail?id="+e.currentTarget.dataset.id})}},onLoad:function(){var t=this;a.default.get("/feedback/list").then(function(r){t.list=(r.data&&r.data.data)||r.data||[]}).catch(function(){})}};c._export_sfc(t,[["render",function(){return{}}],["__scopeId","data-v-fblist"]]);wx.createPage(t);`,
  'list.wxml': '<view class="page"><view class="header"><text class="title">我的反馈</text><view class="add-btn" bindtap="goAdd"><text>+ 新增反馈</text></view></view><block wx:if="{{list.length===0}}"><view class="empty"><text class="empty-text">暂无反馈记录</text></view></block><block wx:for="{{list}}" wx:key="id"><view class="card" data-id="{{item.id}}" bindtap="goDetail"><view class="card-top"><text class="card-title">{{item.title}}</text><text class="card-status {{item.replied?\'replied\':\'pending\'}}">{{item.replied?\'已回复\':\'待回复\'}}</text></view><text class="card-time">{{item.createdAt}}</text></view></block></view>',
  'list.wxss': '.page{padding:30rpx;min-height:100vh;background:#f5f5f5}.header{display:flex;justify-content:space-between;align-items:center;padding:20rpx 0 30rpx}.title{font-size:36rpx;font-weight:bold;color:#333}.add-btn{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:12rpx 24rpx;border-radius:30rpx;font-size:26rpx}.empty{text-align:center;padding:100rpx 0}.empty-text{font-size:30rpx;color:#999}.card{background:#fff;border-radius:16rpx;padding:24rpx;margin-bottom:20rpx}.card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12rpx}.card-title{font-size:30rpx;font-weight:600;color:#333;flex:1}.card-status{font-size:24rpx;padding:4rpx 16rpx;border-radius:20rpx}.card-status.replied{background:#e8f5e9;color:#2e7d32}.card-status.pending{background:#fff3e0;color:#e65100}.card-time{font-size:22rpx;color:#aaa}',
  'detail.json': '{"usingComponents":{}}',
  'detail.js': `"use strict";var c=require("../../common/vendor.js"),a=require("../../services/api.js"),t={data:function(){return{detail:{title:"",content:"",createdAt:"",replied:!1,reply:null}}},onLoad:function(e){var t=this;e&&e.id&&a.default.get("/feedback/"+e.id).then(function(r){t.detail=(r.data&&r.data.data)||r.data||t.detail}).catch(function(){uni.showToast({title:"加载失败",icon:"none"})})}};c._export_sfc(t,[["render",function(){return{}}],["__scopeId","data-v-fbdet"]]);wx.createPage(t);`,
  'detail.wxml': '<view class="page"><view class="card"><text class="card-title">{{detail.title}}</text><text class="card-time">提交于 {{detail.createdAt}}</text><view class="divider"></view><text class="card-content">{{detail.content}}</text></view><block wx:if="{{detail.replied}}"><view class="card"><view class="reply-header"><text class="reply-label">管理员回复</text><text class="reply-time">{{detail.reply.createdAt}}</text></view><view class="divider"></view><text class="reply-content">{{detail.reply.content}}</text></view></block><block wx:else><view class="empty-reply"><text>🕐 管理员正在快马加鞭赶来...</text></view></block></view>',
  'detail.wxss': '.page{padding:30rpx;min-height:100vh;background:#f5f5f5}.card{background:#fff;border-radius:16rpx;padding:30rpx;margin-bottom:24rpx}.card-title{font-size:34rpx;font-weight:bold;color:#333;display:block;margin-bottom:8rpx}.card-time{font-size:22rpx;color:#aaa}.card-content{font-size:28rpx;color:#555;line-height:1.8;display:block}.divider{height:1px;background:#f0f0f0;margin:20rpx 0}.reply-header{display:flex;justify-content:space-between;align-items:center}.reply-label{font-size:28rpx;font-weight:600;color:#667eea}.reply-time{font-size:22rpx;color:#aaa}.reply-content{font-size:28rpx;color:#444;line-height:1.8;display:block}.empty-reply{text-align:center;padding:80rpx 0;font-size:28rpx;color:#999}',
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(FEEDBACK_DIR, filename), content);
}
console.log('[post-build] Feedback pages injected');
