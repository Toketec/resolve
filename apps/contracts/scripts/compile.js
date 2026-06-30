// 编译 *.sol → 输出 ABI + bytecode 到 build/
// 用法: node scripts/compile.js  (或 pnpm --filter @resolve/contracts compile)
const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "build");
const FILES = ["ResolveSettlement.sol", "MockUSDD.sol"];

const sources = {};
for (const f of FILES) {
  sources[f] = { content: fs.readFileSync(path.join(ROOT, f), "utf8") };
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
for (const f of FILES) {
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
