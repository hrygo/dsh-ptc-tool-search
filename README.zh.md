<img src="icon.svg" width="72" height="72" alt="PTC Tool Search" />

# PTC 工具搜索

[English](README.md) | 中文

按需加载 PTC 工具定义，保留对话历史。12 个真实四轮会话中，启用插件后累计对话输入平均减少 **51.46%（GPT）**、**50.00%（Muse）**。输出 token 和延迟也一并列出。

独立社区 Host 插件，使用 DeepSeek Harness 官方作用域工具注册表。0.1.1 版支持 **Harness 0.2.1-rc.2**、Node.js 24+。

## 重复实测成效

2026-10-18，macOS ARM64、Desktop 0.2.1-rc.2、CLIProxyAPI Responses。每模型每组重复 **3 次**，共 **12 个新会话、48 轮对话、12 次真实生图**。相同四轮任务覆盖读取 JSON、终端执行、写入结果、无工具记忆、生图和文件回读。A 使用完整 PTC SDK，B 启用本插件；下表为每个四轮会话的均值。

| 模型 | 输入 token A → B | 输入减少 | 输出 token A → B | 活跃耗时 A → B（秒） | 流程完成 A / B |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT 6.1 Sol | 153,825.0 → 74,669.7 | **51.46%** | 814.3 → 1,161.0 | 48.01 → 64.44 | 3/3 · 3/3 |
| Muse Spark 1.3 | 193,155.3 → 96,569.0 | **50.00%** | 4,173.3 → 3,728.0 | 45.93 → 43.10 | 3/3 · 3/3 |

未缓存输入也需单独看：GPT 6.1 Sol: 23,521.0 → 31,405.7 (+33.52%); Muse Spark 1.3: 25,761.0 → 31,464.0 (+22.14%)。因此这轮数据不能证明费用下降。

输入包含缓存读取与写入，已计入搜索和重试；输出统计为对话模型 token，生图服务未提供自身 token。活跃耗时包含工具和生图，排除两次用户发送之间的间隔。**实际费用：未提供**，未将其当作零费用，也不宣称账单降幅。

初始 SDK 从 **35 个定义减至 2 个**；首请求输入平均减少 **80.27–80.79%**。两组 API 层均只暴露 `run_code`。按需发现需要额外往返，平均模型请求数为 GPT 6.1 Sol: 7.0 → 11.7; Muse Spark 1.3: 8.0 → 12.0。输出和延迟并不保证减少，所选工具累积后 SDK 也会增长。GPT 无工具错误；Muse A/B 分别出现 4/3 次可恢复错误，均自行重试完成，开销已计入。

**生图尺寸：**各次均请求 `1024x1024`，实际返回 GPT 6.1 Sol: 1254×1254 (n=6); Muse Spark 1.3: 1536×1024 (n=6)，严格符合请求尺寸 **0/12**；工作流成功表示工具、计算、记忆和图片产物通过核验，不代表尺寸符合请求。A/B 对照按同一模型分别比较，不据此跨模型比较生图速度。

这是一个固定工作流的小样本重复测试。完整逐次结果、均值/中位数/范围、方法和限制见 [实测报告](docs/benchmark-2026-10-18.md) 与 [可核对数据](docs/benchmark-2026-10-18.json)。

## 安装

在 Harness“插件 → 添加插件”输入 `github:hrygo/dsh-ptc-tool-search#v0.1.1`，或使用官方 CLI：

```sh
dsh plugin --profile desktop add github:hrygo/dsh-ptc-tool-search#v0.1.1
```

建议将版本标签替换为 [Release](https://github.com/hrygo/dsh-ptc-tool-search/releases/tag/v0.1.1) 中的完整提交 SHA，以固定源码。Release 同时提供压缩包与 SHA-256；下载并核验后可运行 `dsh plugin --profile desktop add ./hrygo-dsh-ptc-tool-search-0.1.1.tgz`。

包内直接包含 ESM JavaScript，无需编译、安装依赖或批准构建脚本。替换旧版本后重启 Desktop，再新建 PTC 会话。此前通过本地目录安装过该插件时，先在插件管理器卸载旧包；只能启用一个注册 `tool_search` 的插件。

发布方式遵循 [Harness 官方打包安装指南](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)，当前未发布至 npm。

## 使用

新 PTC agent 初始可见 `tools.tool_search` 和 agent 自有工具。在 `run_code` 中搜索：

```js
return await tools.tool_search({ query: 'bash', limit: 1 });
```

结束本次 `run_code`；下一次模型请求的 SDK 才会包含所选工具，再用另一个 `run_code` 调用 `tools.bash`。搜索结果只打印或返回一次。优先使用精确工具名和 `limit:1`，也支持简短英文能力词；搜索采用本地词法匹配，不调用网络或嵌入模型。

选择在当前 live agent 内累积。重启、恢复或重建 agent 后重新搜索；安装前已有的 live agent 保留原工具面。agent 创建之后新注册的工具需新建 agent 才进入目录。Standard/native 模式不受影响，其他策略禁止的工具不能被本插件授予。

配置行 ID 为 `ptc-tool-search`。`enabled` 默认 `true`；`maxResults`、`maxQueryChars`、`maxDescriptionChars` 默认为 `3`、`256`、`160`，均须为正整数。搜索摘要会截短，加载后的 SDK 保留完整定义。搜索增加模型往返，宽泛查询可能加载额外工具，随着选择增加 SDK 也会增长。

在插件管理器关闭或卸载“PTC 工具搜索”，新建 PTC 会话即可恢复完整 SDK。

## 验证

9 项单元测试覆盖排序、参数、作用域隔离、策略交集、卸载与重建。2026-10-18 在 macOS ARM64 上，经 CLIProxyAPI Responses 实测 GPT 6.1 Sol、Muse Spark 1.3 的终端调用、多轮记忆和生图。生图附件与文件核验等细节见 [验收记录](docs/validation.md)。

无运行依赖、安装脚本、凭据处理、prompt 改写或自定义持久化事件。SDK 生成、审批、策略检查、工具派发和日志仍由 Harness 负责。

采用 [MIT](LICENSE) 许可。
