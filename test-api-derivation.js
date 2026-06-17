const http = require('http');

const baseSeed = 'test-seed-12345';
const userModel = {
  name: 'user',
  fields: [
    { name: 'id', type: 'number', label: 'ID', rule: { min: 1, max: 99999 } },
    { name: 'name', type: 'string', label: '姓名', rule: { format: 'chineseName' } },
    { name: 'age', type: 'number', label: '年龄', rule: { min: 18, max: 65 } },
    { name: 'region', type: 'string', label: '地区', rule: { minLength: 2, maxLength: 10 } }
  ]
};

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== API 种子派生测试 ===\n');

  try {
    console.log('--- 测试1: 派生单个种子 ---');
    const result1 = await makeRequest('/api/seed/derive', {
      baseSeed: baseSeed,
      rule: 'region:beijing',
      index: 0
    });
    console.log(`主种子: ${result1.data.baseSeed}`);
    console.log(`派生种子: ${result1.data.derivedSeed.substring(0, 20)}...`);
    console.log(`规则: ${result1.data.rule}`);
    console.log(`索引: ${result1.data.index}\n`);

    console.log('--- 测试2: 批量派生种子 ---');
    const result2 = await makeRequest('/api/seed/derive-multiple', {
      baseSeed: baseSeed,
      rule: 'variant',
      count: 3
    });
    console.log(`派生出 ${result2.data.count} 个种子:`);
    result2.data.derivedSeeds.forEach(s => {
      console.log(`  [${s.index}]: ${s.seed.substring(0, 20)}...`);
    });
    console.log(``);

    console.log('--- 测试3: 生成变体数据 ---');
    const result3 = await makeRequest('/api/generate/variants', {
      model: userModel,
      count: 2,
      seed: baseSeed,
      variants: [
        { name: 'beijing', region: '北京' },
        { name: 'shanghai', region: '上海' }
      ]
    });
    console.log(`主种子: ${result3.data.baseSeed}`);
    console.log(`每个变体生成 ${result3.data.count} 条记录:`);
    for (const [key, variant] of Object.entries(result3.data.variants)) {
      console.log(`\n  ${key} (种子: ${variant.seed.substring(0, 16)}...):`);
      variant.data.forEach((record, i) => {
        console.log(`    [${i}] ${record.name}, 年龄: ${record.age}`);
      });
    }
    console.log(``);

    console.log('--- 测试4: 生成单个派生数据 ---');
    const result4 = await makeRequest('/api/generate/derived', {
      model: userModel,
      count: 3,
      seed: baseSeed,
      rule: 'region:guangzhou',
      index: 0
    });
    console.log(`派生种子: ${result4.data.derivedSeed.substring(0, 20)}...`);
    console.log(`生成3条记录:`);
    result4.data.data.forEach((record, i) => {
      console.log(`  [${i}] ${record.name}, 年龄: ${record.age}`);
    });
    console.log(``);

    console.log('--- 测试5: 验证可重现性 ---');
    const result5a = await makeRequest('/api/seed/derive', {
      baseSeed: baseSeed,
      rule: 'test',
      index: 0
    });
    const result5b = await makeRequest('/api/seed/derive', {
      baseSeed: baseSeed,
      rule: 'test',
      index: 0
    });
    console.log(`第一次派生: ${result5a.data.derivedSeed.substring(0, 20)}...`);
    console.log(`第二次派生: ${result5b.data.derivedSeed.substring(0, 20)}...`);
    console.log(`可重现性: ${result5a.data.derivedSeed === result5b.data.derivedSeed ? 'PASS ✓' : 'FAIL ✗'}\n`);

    console.log('=== 所有API测试完成 ===');

  } catch (error) {
    console.error('测试失败:', error.message);
    console.log('\n提示: 请确保服务器已启动 (npm start)');
  }
}

runTests();
