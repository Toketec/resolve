/**
 * 同步部署数据到 Supabase
 *
 * 读取 deploy.js 产出的 deployment-output.json，
 * 通过 Supabase REST API 更新 agents 表的链上字段。
 *
 * 用法:
 *   node scripts/sync-agents-to-db.js
 *
 * 前置条件:
 *   1. deploy.js AgentRegistry 已执行，deployment-output.json 已生成
 *   2. Supabase migration 00005 已在 SQL Editor 中执行
 *   3. 环境变量: SUPABASE_URL / SUPABASE_ANON_KEY（从 apps/web/.env 读取）
 */
const path = require("node:path");
const fs = require("node:fs");

const DEPLOYMENT_JSON = path.join(__dirname, "..", "deployment-output.json");
const ENV_FILE = path.join(__dirname, "..", "..", "web", ".env");

// ── 读取 Supabase 凭据 ──────────────────────────────────────────────
function loadEnv() {
  // 优先从环境变量读取，其次从 .env 文件解析
  const url = process.env.SUPABASE_URL || readEnvFile("SUPABASE_URL");
  const key = process.env.SUPABASE_ANON_KEY || readEnvFile("SUPABASE_ANON_KEY");

  if (!url || !key) {
    console.error("✗ 缺少 Supabase 凭据。请设置 SUPABASE_URL / SUPABASE_ANON_KEY 环境变量，");
    console.error("  或在 apps/web/.env 中配置。");
    process.exit(1);
  }
  return { url, key };
}

function readEnvFile(key) {
  try {
    const content = fs.readFileSync(ENV_FILE, "utf8");
    const lines = content.split("\n");
    for (const line of lines) {
      const m = line.match(new RegExp(`^${key}\\s*=\\s*(.+)$`));
      if (m) return m[1].trim();
    }
  } catch {}
  return null;
}

// ── 调用 Supabase REST API ──────────────────────────────────────────
async function updateAgent(supabaseUrl, anonKey, agentId, data) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/agents?agent_id=eq.${encodeURIComponent(agentId)}`,
    {
      method: "PATCH",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// ── main ────────────────────────────────────────────────────────────
async function main() {
  console.log("━━━ 同步 Agent 链上数据到 Supabase ━━━");

  // 1. 读取部署 JSON
  if (!fs.existsSync(DEPLOYMENT_JSON)) {
    console.error(`✗ 未找到 ${DEPLOYMENT_JSON}`);
    console.error("  请先运行: node scripts/deploy.js AgentRegistry");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_JSON, "utf8"));
  console.log(`部署日期: ${deployment.deployedAt}`);
  console.log(`合约地址: ${deployment.contractAddress}`);
  console.log(`部署者:   ${deployment.deployer}`);
  console.log(`Agent 数: ${deployment.agents.length}`);
  console.log("");

  // 2. 连接 Supabase
  const { url, key } = loadEnv();
  console.log(`Supabase: ${url}\n`);

  // 3. 逐条更新
  let success = 0;
  let failed = 0;

  for (const agent of deployment.agents) {
    const payload = {
      tron_address: agent.address,
      deployment_tx_hash: agent.txHash,
      registry_contract: deployment.contractAddress,
      deployment_status: "deployed",
      deployed_at: deployment.deployedAt,
    };

    try {
      const result = await updateAgent(url, key, agent.agentId, payload);
      console.log(`  ✓ ${agent.agentId} → ${agent.address}  (tx: ${agent.txHash.slice(0, 10)}…)`);
      success++;
    } catch (e) {
      console.error(`  ✗ ${agent.agentId}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`完成: ${success} 成功, ${failed} 失败`);
  if (failed > 0) {
    console.warn("\n⚠ 部分 Agent 同步失败。请检查:");
    console.warn("  1. migration 00005 是否已在 Supabase SQL Editor 中执行");
    console.warn("  2. RLS 策略是否允许更新 agents 表");
    console.warn("  3. 可重试: node scripts/sync-agents-to-db.js\n");
  } else {
    console.log("\n✓ 所有 Agent 链上信息已同步到数据库。");
    console.log("  Web 端将自动从 DB 读取链上身份数据。\n");
  }
}

main().catch((e) => {
  console.error("✗ 同步失败:", e.message);
  process.exit(1);
});
