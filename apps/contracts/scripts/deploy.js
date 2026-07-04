/**
 * 部署合约到 TRON Shasta 测试网（按合约名独立部署）
 *
 * 用法:
 *   TRON_PRIVATE_KEY=... node scripts/deploy.js <contract>
 *
 *   node scripts/deploy.js MockUSDD          → 只部署 MockUSDD
 *   node scripts/deploy.js ResolveSettlement → 只部署 ResolveSettlement
 *   node scripts/deploy.js AgentRegistry     → 部署 AgentRegistry + 注册 6 个 Agent
 *   node scripts/deploy.js all               → 按序部署全部 (MockUSDD → ResolveSettlement → AgentRegistry)
 *
 *   不带参数 → 打印用法说明
 *
 * 前置: 先运行 compile（node scripts/compile.js <contract>）
 * 注意: 部署需要钱包有测试 TRX
 */
const path = require("node:path");
const fs = require("node:fs");
const {
  createTronWeb,
  checkBalance,
  deployArtifact,
} = require("./tronweb-helper");

const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;

const AGENTS = ["bull-1", "bull-2", "bear-1", "bear-2", "neut-1", "neut-2"];

function usage() {
  console.log(`
用法:  TRON_PRIVATE_KEY=... node scripts/deploy.js <contract>

  node scripts/deploy.js MockUSDD          → 只部署 MockUSDD
  node scripts/deploy.js ResolveSettlement → 只部署 ResolveSettlement
  node scripts/deploy.js AgentRegistry     → 部署 AgentRegistry + 注册 6 个 Agent
  node scripts/deploy.js all               → 按序部署全部

可选环境变量:
  TRON_FULL_HOST     TRON 节点 (默认 https://api.shasta.trongrid.io)
  USDD_ADDRESS       已有 USDD 合约地址 (部署 ResolveSettlement 时可用，跳过 MockUSDD)
`);
}

// ── 各合约部署逻辑 ──

async function deployMockUSDD(tronWeb) {
  const addr = await deployArtifact(tronWeb, "MockUSDD", [1_000_000_000_000]);
  console.log(`\n📋 NEXT_PUBLIC_USDD_ADDRESS="${addr}"`);
  return addr;
}

async function deployResolveSettlement(tronWeb) {
  const usdd = process.env.USDD_ADDRESS;
  if (!usdd) {
    console.error("✗ 缺少 USDD_ADDRESS。请先部署 MockUSDD 并通过 USDD_ADDRESS 环境变量传入，");
    console.error("  或: node scripts/deploy.js all 一键部署");
    process.exit(1);
  }
  console.log(`使用 USDD: ${usdd}`);
  const addr = await deployArtifact(tronWeb, "ResolveSettlement", [usdd]);
  console.log(`\n📋 NEXT_PUBLIC_SETTLEMENT_ADDRESS="${addr}"`);
  return addr;
}

async function deployAgentRegistry(tronWeb, deployer) {
  const addr = await deployArtifact(tronWeb, "AgentRegistry");

  const BUILD = path.join(__dirname, "..", "build");
  const { abi } = JSON.parse(
    fs.readFileSync(path.join(BUILD, "AgentRegistry.json"), "utf8"),
  );

  // 注册 6 个 Agent
  console.log("\n注册 6 个 Agent（使用部署者地址）…");
  const registry = await tronWeb.contract(abi, addr);

  /** @type {{ agentId: string, address: string, txHash: string }[]} */
  const agents = [];

  for (const id of AGENTS) {
    try {
      const tx = await registry.register(id, deployer).send({ feeLimit: 10_000_000 });
      console.log(`  ✓ ${id} → ${deployer}  (tx: ${tx.slice(0, 10)}…)`);
      agents.push({ agentId: id, address: deployer, txHash: tx });
    } catch (e) {
      console.error(`  ✗ ${id} 注册失败: ${e.message}`);
    }
  }

  console.log("\n验证:");
  for (const id of AGENTS) {
    try {
      const a = await registry.getAgent(id).call();
      console.log(`  ${id} → ${a}`);
    } catch {}
  }

  // 输出部署 JSON（供 sync-agents-to-db.js 读取写入 Supabase）
  const deploymentJson = {
    network: tronWeb.fullHost,
    deployer,
    contract: "AgentRegistry",
    contractAddress: addr,
    deployedAt: new Date().toISOString(),
    agents,
  };
  const outputPath = path.join(__dirname, "..", "deployment-output.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentJson, null, 2), "utf8");
  console.log(`\n✓ 部署信息已写入 ${path.relative(process.cwd(), outputPath)}`);

  console.log(`\n📋 NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="${addr}"`);
  console.log(`📋 NEXT_PUBLIC_AGENT_REGISTRY_MODE=live`);
  console.log(`\n下一步:`);
  console.log(`  1. Supabase SQL Editor 执行: packages/db/migrations/00005_add_agent_onchain_fields.sql`);
  console.log(`  2. 同步到数据库:           node scripts/sync-agents-to-db.js`);
  return addr;
}

async function deployAll(tronWeb, deployer) {
  console.log("━━━ 部署全部合约 ━━━");
  const usdd = process.env.USDD_ADDRESS || (await deployMockUSDD(tronWeb));
  process.env.USDD_ADDRESS = usdd;
  const settlement = await deployResolveSettlement(tronWeb);
  const registry = await deployAgentRegistry(tronWeb, deployer);

  console.log("\n──────────────── 部署完成 ────────────────");
  console.log(`USDD:               ${usdd}`);
  console.log(`ResolveSettlement:  ${settlement}`);
  console.log(`AgentRegistry:      ${registry}`);
}

// ── main ──

async function main() {
  const contract = process.argv[2];
  if (!contract) {
    usage();
    process.exit(0);
  }

  const valid = ["MockUSDD", "ResolveSettlement", "AgentRegistry", "all"];
  if (!valid.includes(contract)) {
    console.error(`✗ 未知合约 "${contract}"，可选: ${valid.join(", ")}`);
    process.exit(1);
  }

  const tronWeb = createTronWeb(PRIVATE_KEY);
  const deployer = await checkBalance(tronWeb);

  switch (contract) {
    case "MockUSDD":
      await deployMockUSDD(tronWeb);
      break;
    case "ResolveSettlement":
      await deployResolveSettlement(tronWeb);
      break;
    case "AgentRegistry":
      await deployAgentRegistry(tronWeb, deployer);
      break;
    case "all":
      await deployAll(tronWeb, deployer);
      break;
  }
}

main().catch((e) => {
  console.error("✗ 部署失败:", e?.message || e);
  process.exit(1);
});
