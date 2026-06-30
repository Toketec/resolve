// 部署到 TRON Shasta 测试网
// 用法: TRON_PRIVATE_KEY=... node scripts/deploy.js
//   可选 USDD_ADDRESS=<现有USDD地址>  → 跳过 MockUSDD 部署
//
// 流程: (可选)部署 MockUSDD → 部署 ResolveSettlement(usdd) → 打印地址。
// 注意: 部署需要钱包有测试 TRX（能量/带宽）。0 余额会失败 —— 去水龙头领取:
//   https://shasta.tronex.io/  或  https://trongrid.io 的 Shasta faucet
const fs = require("node:fs");
const path = require("node:path");
const { TronWeb } = require("tronweb");

const ROOT = path.join(__dirname, "..");
const BUILD = path.join(ROOT, "build");

const FULL_HOST = process.env.TRON_FULL_HOST || "https://api.shasta.trongrid.io";
const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;

async function main() {
  if (!PRIVATE_KEY) {
    console.error("✗ 缺少 TRON_PRIVATE_KEY 环境变量");
    process.exit(1);
  }
  if (!fs.existsSync(path.join(BUILD, "ResolveSettlement.json"))) {
    console.error("✗ 未找到编译产物，请先运行: pnpm --filter @resolve/contracts compile");
    process.exit(1);
  }

  const tronWeb = new TronWeb({ fullHost: FULL_HOST, privateKey: PRIVATE_KEY });
  const me = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
  console.log(`Deployer: ${me}`);
  console.log(`Network:  ${FULL_HOST}`);

  const balanceSun = await tronWeb.trx.getBalance(me).catch(() => 0);
  console.log(`Balance:  ${balanceSun / 1e6} TRX`);
  if (balanceSun === 0) {
    console.error(
      "\n✗ 钱包余额为 0，无法部署。请先到 Shasta 水龙头给该地址充值测试 TRX:\n" +
        "    https://shasta.tronex.io/   (输入上面的 Deployer 地址)\n" +
        "  充值后重新运行本脚本。",
    );
    process.exit(1);
  }

  const deploy = async (name, parameters) => {
    const artifact = JSON.parse(fs.readFileSync(path.join(BUILD, `${name}.json`), "utf8"));
    const tx = await tronWeb.contract().new({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      feeLimit: 1_000_000_000,
      callValue: 0,
      parameters,
    });
    const addr = tronWeb.address.fromHex(tx.address);
    console.log(`✓ ${name} → ${addr}`);
    return addr;
  };

  // 1) USDD（用现有地址或部署 MockUSDD）
  let usdd = process.env.USDD_ADDRESS;
  if (!usdd) {
    console.log("\n部署 MockUSDD（初始供应 1,000,000 USDD）…");
    usdd = await deploy("MockUSDD", [1_000_000_000_000]); // 1e6 * 1e6 decimals
  } else {
    console.log(`使用现有 USDD: ${usdd}`);
  }

  // 2) ResolveSettlement(usdd)
  console.log("\n部署 ResolveSettlement…");
  const settlement = await deploy("ResolveSettlement", [usdd]);

  console.log("\n──────────────── 部署完成 ────────────────");
  console.log(`USDD:               ${usdd}`);
  console.log(`ResolveSettlement:  ${settlement}`);
  console.log("\n下一步: 把地址填入 apps/web/lib/constants.ts");
  console.log(`  USDD_ADDRESS = "${usdd}"`);
  console.log(`  SETTLEMENT_ADDRESS = "${settlement}"`);
}

main().catch((e) => {
  console.error("✗ 部署失败:", e?.message || e);
  process.exit(1);
});
