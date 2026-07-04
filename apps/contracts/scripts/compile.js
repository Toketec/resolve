/**
 * 编译 Solidity 合约 → 输出 ABI + bytecode 到 build/
 *
 * 用法:
 *   node scripts/compile.js                  → 编译所有合约
 *   node scripts/compile.js ResolveSettlement → 编译指定合约
 *   node scripts/compile.js MockUSDD AgentRegistry → 编译多个指定合约
 */
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "build");

// 已知合约清单
const KNOWN = [
  "ResolveSettlement",
  "MockUSDD",
  "AgentRegistry",
];

// 参数过滤：取命令行参数中匹配的已知合约名
const targets = process.argv.slice(2).filter((a) => KNOWN.includes(a));
const compileAll = targets.length === 0;

if (!compileAll) {
  console.log(`编译目标: ${targets.join(", ")}`);
} else {
  console.log(`编译目标: 全部 (${KNOWN.join(", ")})`);
}

const sources = {};
const files = compileAll ? KNOWN.map((n) => `${n}.sol`) : targets.map((n) => `${n}.sol`);

for (const f of files) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) {
    console.error(`✗ 文件不存在: ${f}`);
    process.exit(1);
  }
  sources[f] = { content: fs.readFileSync(p, "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "istanbul", // TRON TVM 兼容
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const out = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (out.errors || []).filter((e) => e.severity === "error");
const warnings = (out.errors || []).filter((e) => e.severity === "warning");
warnings.forEach((w) => console.warn("⚠", w.formattedMessage));
if (errors.length) {
  errors.forEach((e) => console.error("✗", e.formattedMessage));
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
console.log(`✓ Compiled with solc ${solc.version()}`);

for (const f of files) {
  const name = f.replace(".sol", "");
  const c = out.contracts[f][name];
  fs.writeFileSync(
    path.join(OUT_DIR, `${name}.json`),
    JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object }, null, 2),
  );
  console.log(
    `  ${name}: ${c.abi.length} ABI entries, ${c.evm.bytecode.object.length / 2} bytes → build/${name}.json`,
  );
}
