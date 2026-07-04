/**
 * 部署 AgentRegistry 到 Shasta 测试网
 *
 * 前置条件：
 *   1. TronLink 已连接 Shasta 测试网
 *   2. tronbox 或 truffle 编译工具就绪
 *   3. 部署地址有足够的测试 TRX
 *
 * 使用方式：
 *   node scripts/deployAgentRegistry.js [--skip-register]
 *   加 --skip-register 则只部署合约，不调用 register()
 */
const TronWeb = require("tronweb");
const path = require("path");

// TronWeb 实例（默认本地环境变量或硬编码 Shasta 节点）
const fullHost = process.env.TRON_FULL_HOST || "https://api.shasta.trongrid.io";
const privateKey = process.env.TRON_PRIVATE_KEY || "";

const AGENTS = [
  "bull-1",
  "bull-2",
  "bear-1",
  "bear-2",
  "neut-1",
  "neut-2",
];

async function main() {
  if (!privateKey) {
    console.error("❌ 缺少 TRON_PRIVATE_KEY 环境变量（部署者私钥）");
    process.exit(1);
  }

  const tronWeb = new TronWeb({
    fullHost,
    privateKey,
  });

  const deployer = tronWeb.defaultAddress.base58;
  console.log(`📡 节点: ${fullHost}`);
  console.log(`👤 部署者: ${deployer}`);
  console.log(`💰 TRX 余额: ${tronWeb.fromSun(await tronWeb.trx.getBalance(deployer))} TRX\n`);

  // 读取编译后的 ABI 和 bytecode
  const buildDir = path.resolve(__dirname, "..", "build", "contracts");
  const compiled = require(path.join(buildDir, "AgentRegistry.json"));

  console.log("🚀 部署 AgentRegistry...");
  const contract = await tronWeb.contract().new({
    abi: compiled.abi,
    bytecode: compiled.bytecode,
    feeLimit: 1_000_000_000,
    callValue: 0,
    userFeePercentage: 100,
    originEnergyLimit: 5_000_000,
  });

  // 等待上链
  const deployed = await contract;
  const address = deployed.options?.address
    || (typeof deployed.deploy === "function" && deployed._address)
    || tronWeb.address.fromHex(compiled.networks?.["*"]?.address);

  console.log(`✅ AgentRegistry 已部署: ${address}`);
  console.log(`   ${tronWeb.toHex(address)}\n`);

  const skipRegister = process.argv.includes("--skip-register");
  if (skipRegister) {
    console.log("⏭️  跳过 Agent 注册（--skip-register）");
    console.log("\n📋 手动注册命令:");
    for (const id of AGENTS) {
      console.log(`   register("${id}", "${deployer}")`);
    }
    return;
  }

  console.log("📝 注册 6 个 Agent（统一使用部署者地址）...");
  const registry = await tronWeb.contract(compiled.abi, address);

  for (const id of AGENTS) {
    try {
      const tx = await registry.register(id, deployer).send({
        feeLimit: 1_000_000,
      });
      console.log(`   ✅ ${id} → ${deployer}  (tx: ${tx.slice(0, 10)}...)`);
    } catch (e) {
      console.error(`   ❌ ${id} 注册失败: ${e.message}`);
    }
  }

  console.log("\n📋 验证:");
  for (const id of AGENTS) {
    try {
      const addr = await registry.getAgent(id).call();
      console.log(`   ${id} → ${addr}`);
    } catch {}
  }

  console.log(`\n🎯 请将合约地址加入 .env:`);
  console.log(`   NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${address}`);
  console.log(`   NEXT_PUBLIC_AGENT_REGISTRY_MODE=live`);
}

main().catch((err) => {
  console.error("💥 部署失败:", err);
  process.exit(1);
});
