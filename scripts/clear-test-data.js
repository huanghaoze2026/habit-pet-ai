/**
 * 清理测试数据脚本
 * 用法: node scripts/clear-test-data.js
 */
const { execSync } = require('child_process');

const DB_HOST = '127.0.0.1';
const DB_USER = 'pet_user';
const DB_PASS = 'PetHabit@2026!Secure';
const DB_NAME = 'pet_stage';

// 按外键依赖排序：被引用的表放后面，引用方放前面
// 先删引用方(checkins/tasks引child_profiles/User)，再删child_profiles(引pets)，再删pets，最后User
const tables = [
  'checkins',
  'tasks',
  'ai_conversations',
  'ai_logs',
  'user_memories',
  'ai_memories',
  'ai_memory_consolidations',
  'ai_episodic_memories',
  'pet_emotional_state',
  'pet_growth_state',
  'pet_relationship_state',
  'pet_relationship_milestones',
  'pet_personality_traits',
  'child_profiles',     // 必须先于 pets：child_profiles 引用了 pets
  'pets',               // 在 child_profiles 之后删除
  'User',               // 最后
];

console.log('🧹 清理测试数据...\n');

for (const table of tables) {
  try {
    const cmd = `mysql -u ${DB_USER} -p'${DB_PASS}' -h ${DB_HOST} ${DB_NAME} -e "DELETE FROM \\\`${table}\\\`" 2>/dev/null`;
    execSync(cmd, { stdio: 'pipe' });
    const countCmd = `mysql -u ${DB_USER} -p'${DB_PASS}' -h ${DB_HOST} ${DB_NAME} -e "SELECT COUNT(*) as cnt FROM \\\`${table}\\\`" -N 2>/dev/null`;
    const remaining = execSync(countCmd, { encoding: 'utf8' }).trim();
    console.log(`  ✅ ${table}: ${remaining} rows remaining`);
  } catch (e) {
    console.log(`  ⚠️ ${table}: skipped (${e.message.substring(0, 50)})`);
  }
}

console.log('\n✅ 清理完成');
