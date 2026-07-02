/**
 * 微信小程序 CI 上传脚本
 *
 * 用法:
 *   node scripts/ci-upload.js preview --desc="测试描述"
 *   node scripts/ci-upload.js upload --desc="正式上传" --version="1.0.0"
 *
 * 依赖: miniprogram-ci (已安装)
 * 密钥: ci-key/private.wx33b9235184a825ea.key
 */

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

// ============ 配置 ============

const CONFIG = {
  appid: 'wx33b9235184a825ea',
  projectPath: path.resolve(__dirname, '../dist/build/mp-weixin'),
  privateKeyPath: path.resolve(__dirname, '../ci-key/private.wx33b9235184a825ea.key'),
  // 忽略的文件
  ignores: ['node_modules/**/*'],
};

// ============ 参数解析 ============

const args = process.argv.slice(2);
const mode = args[0]; // 'preview' | 'upload'

// 解析 --key=value 格式参数
const params = {};
for (let i = 1; i < args.length; i++) {
  const match = args[i].match(/^--(.+?)=(.+)$/);
  if (match) {
    params[match[1]] = match[2];
  }
}

const desc = params.desc || `构建时间: ${new Date().toLocaleString('zh-CN')}`;
const version = params.version || `1.0.${Date.now()}`;

// ============ 校验 ============

if (!['preview', 'upload'].includes(mode)) {
  console.error('❌ 用法: node scripts/ci-upload.js <preview|upload> [--desc="描述"] [--version="1.0.0"]');
  process.exit(1);
}

if (!fs.existsSync(CONFIG.privateKeyPath)) {
  console.error(`❌ 密钥文件不存在: ${CONFIG.privateKeyPath}`);
  console.error('   请将微信小程序上传密钥放在 ci-key/ 目录下');
  process.exit(1);
}

if (!fs.existsSync(path.join(CONFIG.projectPath, 'app.json'))) {
  console.error(`❌ 编译产物不存在: ${CONFIG.projectPath}`);
  console.error('   请先执行 npm run build:mp-weixin 编译项目');
  process.exit(1);
}

// ============ 执行 ============

async function main() {
  console.log(`\n🚀 微信小程序 CI ${mode === 'preview' ? '预览' : '上传'}`);
  console.log(`   AppID: ${CONFIG.appid}`);
  console.log(`   描述: ${desc}`);
  if (mode === 'upload') console.log(`   版本: ${version}`);
  console.log(`   项目: ${CONFIG.projectPath}\n`);

  // 创建项目实例
  const project = new ci.Project({
    appid: CONFIG.appid,
    type: 'miniProgram',
    projectPath: CONFIG.projectPath,
    privateKeyPath: CONFIG.privateKeyPath,
    ignores: CONFIG.ignores,
  });

  try {
    if (mode === 'preview') {
      // ===== 预览模式：生成二维码供手机扫描 =====
      const previewResult = await ci.preview({
        project,
        desc,
        setting: {
          es6: true,
          es7: true,
          minify: true,
          autoPrefixWXSS: true,
        },
        qrcodeFormat: 'terminal', // 终端输出二维码
        qrcodeOutputDest: path.resolve(__dirname, '../dist/preview-qrcode.txt'),
        onProgressUpdate: (info) => {
          if (info.status === 'done') {
            console.log('✅ 预览包上传成功！');
          }
        },
      });

      // 打印二维码到终端
      console.log('\n📱 用手机微信扫描以下二维码查看:\n');
      if (previewResult && previewResult.subPackageInfo) {
        console.log('分包信息:', JSON.stringify(previewResult.subPackageInfo, null, 2));
      }

      // 读取并显示二维码
      const qrcodePath = path.resolve(__dirname, '../dist/preview-qrcode.txt');
      if (fs.existsSync(qrcodePath)) {
        const qrcode = fs.readFileSync(qrcodePath, 'utf-8');
        console.log(qrcode);
      } else {
        console.log('📱 请在微信公众平台查看预览二维码');
      }
    } else {
      // ===== 上传模式：上传为开发版 =====
      const uploadResult = await ci.upload({
        project,
        version,
        desc,
        setting: {
          es6: true,
          es7: true,
          minify: true,
          autoPrefixWXSS: true,
        },
        onProgressUpdate: (info) => {
          if (info.status === 'done') {
            console.log('✅ 上传成功！');
          }
        },
      });

      console.log('\n📋 上传完成！');
      console.log('   在微信公众平台 → 版本管理 → 开发版本中可看到此版本');
      console.log('   设置为体验版后，可在手机上通过「体验版」入口查看\n');
    }
  } catch (error) {
    console.error('\n❌ 上传失败:', error.message);
    if (error.message.includes('private key')) {
      console.error('   提示：请确认密钥文件是否有效，以及在微信公众平台是否已启用');
    }
    if (error.message.includes('IP')) {
      console.error('   提示：请将服务器 IP 添加到微信公众平台 → 开发 → 开发设置 → IP 白名单');
    }
    process.exit(1);
  }
}

main();
