# RESOLVE — 项目管理文档

HTX Genesis 黑客松构建的唯一事实来源。源自已锁定的规划讨论（grill Q1–Q12）。这里没写的，就是还没定的。

> English version: [`README.md`](./README.md)。每篇中文文档都有对应的英文版。

## 索引

| 文档 | 内容 |
|------|------|
| [product-spec.zh.md](./product-spec.zh.md) | 锁定的产品：目标、唯一的「英雄镜头」、范围（必做 / 造假 / 砍掉）、时间线。 |
| [workload-split.zh.md](./workload-split.zh.md) | 12 项锁定后的三人分工（A / B / C）及排期。 |
| [api-contracts.zh.md](./api-contracts.zh.md) | A、B、C 共同构建的第一天接口，让三块并行不阻塞。 |
| [open-questions.zh.md](./open-questions.zh.md) | 从代码中浮现的 8 个未决机制（G1–G8）。**写代码前必读。** |

## 一段话总结

RESOLVE 是为 HTX Genesis 黑客松打造的 AI 原生预测市场。目标是**获胜**——得分的地方做真的，不得分的地方造假。整个 demo 围绕**一个英雄镜头**构建：连接 TronLink → 用测试网稳定币完成一笔真实下注 → 市场到期 → AI 智能体基于精选证据推理 → 共识越过阈值 → 链上测试网真实结算赔付。三位开发者各负责一条垂直切片（链 / AI / 应用），Dev C 负责三块交汇的接缝。

## 唯一的硬性截止日期

**提交：2026 年 7 月 5 日。** 该日期前没有任何强制要求。其余一切（走通骨架、冻结、备用录像）都是工程纪律，而非外部关卡。见 [product-spec.zh.md](./product-spec.zh.md#时间线)。

## 如何使用这些文档

1. 三位开发者先读 [product-spec.zh.md](./product-spec.zh.md) 和 [open-questions.zh.md](./open-questions.zh.md)。
2. 第一天就敲定 [api-contracts.zh.md](./api-contracts.zh.md) 的接口——在任何人写真实逻辑之前。
3. 解决两个阻塞性缺口（G6 智能体数量、G8 英雄市场）——它们决定 Dev B 的工作量。
4. 对着接口开发；在接口背后把 mock 换成真实实现。
