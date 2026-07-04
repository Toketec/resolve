# RESOLVE — AI 原生预测市场（HTX Genesis 黑客松）

> 英文版：`docs/ENG/README.md`（英语文档目录）
>
> 英文单项文档：`docs/ENG/architecture-overview.md`、`docs/ENG/dev-execution-spec.md`、`docs/ENG/judge-qa.md`、`docs/ENG/workload-split.md`、`docs/ENG/api-contracts.md`

RESOLVE 是为 **HTX Genesis 黑客松**打造的 AI 原生预测市场。核心创新：用多个 AI 智能体独立推理 + 加权共识替代传统中心化预言机，实现自动链上结算。三位开发者（链/钱、AI/路演、应用/接缝）并行开发，围绕一个英雄镜头端到端演示。

## 文档目录

| 文档 | 一句话说明 |
|------|-----------|
| [architecture-overview.zh.md](./architecture-overview.zh.md) | 系统三层架构设计（应用层/智能体层/链层）、技术选型与部署策略 |
| [dev-execution-spec.zh.md](./dev-execution-spec.zh.md) | 按 A/B/C 切片的 35+ 项具体开发任务、验收标准与集成时间线 |
| [judge-qa.zh.md](./judge-qa.zh.md) | 决赛评委 Q&A 预判——HTX 生态、AI 架构、经济模型、常见质疑 |
| [workload-split.zh.md](./workload-split.zh.md) | 三位开发者分工（A 链/钱、B AI/路演、C 应用/接缝）及排期 |
| [api-contracts.zh.md](./api-contracts.zh.md) | 第一天锁定的 5 个跨切片接口契约（解析/交易/价格/B.AI/Hybrid 数据层） |
|| [competition-strategy.zh.md](./competition-strategy.zh.md) | 比赛全景：晋级路径、评分五维、赛道策略、技术战略、风险预判 |
|| [video-script.zh.md](./video-script.zh.md) | 40 秒产品介绍视频剧本（即梦 AI 生成）+ 答辩素材截图/录制建议 |
|| [check.md](../../check.md) | 验收方案与测试检查表（AI 自检 + 人工验证，确保每次提交可跑可演） |

## 快速入门

1. **先读 competition-strategy.zh.md**（3 分钟）——理解比赛全局与得分策略
2. **再读 workload-split.zh.md**（5 分钟）——了解谁做什么、优先级
3. **第一天敲定 api-contracts.zh.md**（10 分钟）——A/B/C 对齐接口，开始并行开发
4. **遵循 check.md** 验收——每次提交前 AI 自检 + 人工验证端到端流程
5. **唯一死线：2026 年 7 月 5 日**——提交截止，在此之前只需对工程纪律负责

> 三人各读自己的切片文档后，务必全体对齐接口。类型定义在 `packages/shared/src/index.ts`，改动必须通知另外两人。
