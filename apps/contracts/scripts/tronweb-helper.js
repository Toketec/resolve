/**
 * TronWeb 共享工具
 *
 * 三个合约公用：TronWeb 实例创建、余额检查、部署函数。
 */
const { TronWeb } = require("tronweb");

const FULL_HOST = process.env.TRON_FULL_HOST || "https://api.shasta.trongrid.io";

/** 检查私钥是否存在，不存在则退出 */
function requirePrivateKey(privateKey) {
  if (!privateKey) {
    console.error("✗ 缺少 TRON_PRIVATE_KEY 环境变量");
    process.exit(1);
  }
}

/** 创建 TronWeb 实例 */
function createTronWeb(privateKey) {
  requirePrivateKey(privateKey);
  return new TronWeb({ fullHost: FULL_HOST, privateKey });
}

/** 打印部署者信息 + 余额检查，余额为 0 则退出 */
async function checkBalance(tronWeb) {
  const me = tronWeb.defaultAddress.base58;
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
  return me;
}

/** 通用部署函数：读取 build/<name>.json → 部署 → 返回地址 */
async function deployArtifact(tronWeb, name, parameters = []) {
  const path = require("path");
  const fs = require("fs");
  const BUILD = path.join(__dirname, "..", "build");
  const artifactPath = path.join(BUILD, `${name}.json`);

  if (!fs.existsSync(artifactPath)) {
    console.error(`✗ 未找到编译产物: build/${name}.json`);
    console.error(`  请先运行: node scripts/compile.js ${name}`);
    process.exit(1);
  }

  const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log(`\n部署 ${name}…`);
  const tx = await tronWeb.contract().new({
    abi,
    bytecode,
    feeLimit: 1_000_000_000,
    callValue: 0,
    parameters,
  });

  const addr = tronWeb.address.fromHex(tx.address ?? tx);
  console.log(`✓ ${name} → ${addr}`);
  return addr;
}

module.exports = { FULL_HOST, requirePrivateKey, createTronWeb, checkBalance, deployArtifact };
