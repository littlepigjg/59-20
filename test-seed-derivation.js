const RandomGenerator = require('./server/utils/random');
const DataGenerator = require('./server/generator/DataGenerator');

console.log('=== 种子派生机制测试 ===\n');

const baseSeed = 'test-seed-12345';
console.log(`主种子: ${baseSeed}\n`);

console.log('--- 测试1: 确定性派生验证 ---');
const seed1 = RandomGenerator.deriveSeed(baseSeed, 'region:beijing', 0);
const seed2 = RandomGenerator.deriveSeed(baseSeed, 'region:beijing', 0);
console.log(`相同参数派生种子1: ${seed1.substring(0, 20)}...`);
console.log(`相同参数派生种子2: ${seed2.substring(0, 20)}...`);
console.log(`可重现性验证: ${seed1 === seed2 ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试2: 不同规则产生不同种子 ---');
const seedBeijing = RandomGenerator.deriveSeed(baseSeed, 'region:beijing', 0);
const seedShanghai = RandomGenerator.deriveSeed(baseSeed, 'region:shanghai', 0);
console.log(`北京地区种子: ${seedBeijing.substring(0, 20)}...`);
console.log(`上海地区种子: ${seedShanghai.substring(0, 20)}...`);
console.log(`差异性验证: ${seedBeijing !== seedShanghai ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试3: 不同索引产生不同种子 ---');
const seedIdx0 = RandomGenerator.deriveSeed(baseSeed, 'region:beijing', 0);
const seedIdx1 = RandomGenerator.deriveSeed(baseSeed, 'region:beijing', 1);
console.log(`索引0种子: ${seedIdx0.substring(0, 20)}...`);
console.log(`索引1种子: ${seedIdx1.substring(0, 20)}...`);
console.log(`索引差异性验证: ${seedIdx0 !== seedIdx1 ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试4: 实例方法派生 ---');
const baseRng = new RandomGenerator(baseSeed);
const childRng1 = baseRng.deriveChild('region:beijing', 0);
const childRng2 = baseRng.deriveChild('region:beijing', 0);
console.log(`子种子1: ${childRng1.getSeed().substring(0, 20)}...`);
console.log(`子种子2: ${childRng2.getSeed().substring(0, 20)}...`);
console.log(`实例派生可重现性: ${childRng1.getSeed() === childRng2.getSeed() ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`父种子记录: ${childRng1.getParentSeed() === baseSeed ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`派生规则记录: ${childRng1.getDerivationRule() === 'region:beijing' ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试5: 批量派生子种子 ---');
const children = baseRng.deriveChildren('variant', 3);
console.log(`派生3个子种子:`);
children.forEach((child, i) => {
  console.log(`  [${i}]: ${child.getSeed().substring(0, 20)}...`);
});
const allUnique = new Set(children.map(c => c.getSeed())).size === 3;
console.log(`所有子种子唯一: ${allUnique ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试6: 命名派生子种子 ---');
const namedChildren = baseRng.deriveNamedChildren([
  { name: 'beijing', region: '北京' },
  { name: 'shanghai', region: '上海' },
  { name: 'guangzhou', region: '广州' }
]);
console.log(`命名派生种子:`);
for (const [key, rng] of Object.entries(namedChildren)) {
  console.log(`  ${key}: ${rng.getSeed().substring(0, 20)}...`);
}
console.log(`\n`);

console.log('--- 测试7: 多层派生（种子树）---');
const level1 = baseRng.deriveChild('level1', 0);
const level2 = level1.deriveChild('level2', 0);
const level3 = level2.deriveChild('level3', 0);
console.log(`Level 1 种子: ${level1.getSeed().substring(0, 20)}...`);
console.log(`Level 2 种子: ${level2.getSeed().substring(0, 20)}...`);
console.log(`Level 3 种子: ${level3.getSeed().substring(0, 20)}...`);
console.log(`Level 1 父种子正确: ${level1.getParentSeed() === baseSeed ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`Level 2 父种子正确: ${level2.getParentSeed() === level1.getSeed() ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`Level 3 父种子正确: ${level3.getParentSeed() === level2.getSeed() ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试8: 派生种子的随机数独立性 ---');
const rngA = RandomGenerator.createDerivedGenerator(baseSeed, 'A', 0);
const rngB = RandomGenerator.createDerivedGenerator(baseSeed, 'B', 0);
const rngA2 = RandomGenerator.createDerivedGenerator(baseSeed, 'A', 0);
const rngA3 = RandomGenerator.createDerivedGenerator(baseSeed, 'A', 0);
const valA1 = rngA.random();
const valB1 = rngB.random();
const valA2 = rngA2.random();
const valA3_1 = rngA3.random();
const valA3_2 = rngA3.random();
const rngA4 = RandomGenerator.createDerivedGenerator(baseSeed, 'A', 0);
const valA4_1 = rngA4.random();
const valA4_2 = rngA4.random();
console.log(`派生A的第一个随机数: ${valA1}`);
console.log(`派生B的第一个随机数: ${valB1}`);
console.log(`派生A的第一个随机数(重复): ${valA2}`);
console.log(`A与B不同: ${valA1 !== valB1 ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`A可重现(第一个数): ${valA1 === valA2 ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`A序列可重现: ${valA3_1 === valA4_1 && valA3_2 === valA4_2 ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试9: 数据生成变体 ---');
const userModel = {
  name: 'user',
  fields: [
    { name: 'id', type: 'number', label: 'ID', rule: { min: 1, max: 99999 } },
    { name: 'name', type: 'string', label: '姓名', rule: { format: 'chineseName' } },
    { name: 'age', type: 'number', label: '年龄', rule: { min: 18, max: 65 } },
    { name: 'region', type: 'string', label: '地区', rule: { minLength: 2, maxLength: 10 } }
  ]
};

const dataGenerator = new DataGenerator(baseSeed);
const variantRules = [
  { 
    name: 'beijing', 
    region: '北京',
    fieldOverrides: {
      region: (value, rng, idx) => '北京市'
    }
  },
  { 
    name: 'shanghai', 
    region: '上海',
    fieldOverrides: {
      region: (value, rng, idx) => '上海市'
    }
  },
  { 
    name: 'guangzhou', 
    region: '广州',
    fieldOverrides: {
      region: (value, rng, idx) => '广州市'
    }
  }
];

const variantResult = dataGenerator.generateWithVariants(userModel, 3, variantRules);
console.log(`主种子: ${variantResult.baseSeed}`);
console.log(`每个变体生成3条记录:`);
for (const [key, variant] of Object.entries(variantResult.variants)) {
  console.log(`\n  ${key} (种子: ${variant.seed.substring(0, 20)}...):`);
  variant.data.forEach((record, i) => {
    console.log(`    [${i}] ${record.name}, 年龄: ${record.age}, 地区: ${record.region}`);
  });
}
console.log(`\n`);

console.log('--- 测试10: 变体数据可重现性 ---');
const dataGenerator2 = new DataGenerator(baseSeed);
const variantResult2 = dataGenerator2.generateWithVariants(userModel, 3, variantRules);
const firstRecord1 = variantResult.variants.beijing.data[0];
const firstRecord2 = variantResult2.variants.beijing.data[0];
console.log(`第一次生成北京用户: ${firstRecord1.name}, 年龄: ${firstRecord1.age}`);
console.log(`第二次生成北京用户: ${firstRecord2.name}, 年龄: ${firstRecord2.age}`);
console.log(`数据可重现: ${firstRecord1.name === firstRecord2.name && firstRecord1.age === firstRecord2.age ? 'PASS ✓' : 'FAIL ✗'}\n`);

console.log('--- 测试11: 单派生数据生成 ---');
const derivedResult = dataGenerator.generateDerived(userModel, 5, 'variant:A', { index: 2 });
console.log(`派生种子: ${derivedResult.derivedSeed.substring(0, 20)}...`);
console.log(`生成5条记录:`);
derivedResult.data.forEach((record, i) => {
  console.log(`  [${i}] ${record.name}, 年龄: ${record.age}`);
});

console.log('\n=== 所有测试完成 ===');
