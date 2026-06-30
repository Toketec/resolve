// tronbox 配置（可选部署方式；本项目默认用 scripts/deploy.js + tronweb）
// 用法: tronbox migrate --network shasta
// 私钥从环境变量读取，绝不硬编码。
require("dotenv").config({ path: "../../.env" });

module.exports = {
  contracts_directory: "./",
  networks: {
    shasta: {
      privateKey: process.env.TRON_PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1_000_000_000,
      fullHost: process.env.TRON_FULL_HOST || "https://api.shasta.trongrid.io",
      network_id: "2",
    },
    development: {
      privateKey: process.env.TRON_PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1_000_000_000,
      fullHost: "http://127.0.0.1:9090",
      network_id: "9",
    },
  },
  compilers: {
    solc: {
      version: "0.8.24",
      settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "istanbul" },
    },
  },
};
