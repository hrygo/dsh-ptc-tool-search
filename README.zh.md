# PTC 工具搜索

[English](README.md) | 中文

独立社区 Host 插件，通过 DeepSeek Harness 官方作用域工具注册表按需加载 PTC SDK。0.1.0 版支持 **Harness 0.2.1-rc.2**、Node.js 24+。

## 安装

在 Harness“插件 → 添加插件”输入 `github:hrygo/dsh-ptc-tool-search#v0.1.0`，或使用官方 CLI：

```sh
dsh plugin --profile desktop add github:hrygo/dsh-ptc-tool-search#v0.1.0
```

建议将版本标签替换为 [Release](https://github.com/hrygo/dsh-ptc-tool-search/releases/tag/v0.1.0) 中的完整提交 SHA，以固定源码。Release 同时提供压缩包与 SHA-256；下载并核验后可运行 `dsh plugin --profile desktop add ./hrygo-dsh-ptc-tool-search-0.1.0.tgz`。

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

9 项单元测试覆盖排序、参数、作用域隔离、策略交集、卸载与重建。2026-10-18 在 macOS ARM64 上，经 CLIProxyAPI Responses 实测 GPT 6.1 Sol、Muse Spark 1.3 的终端调用、多轮记忆和生图。同任务两轮累计输入分别减少 63.65%、52.41%，已计搜索与重试。这是单组任务样本，详见 [验证方法与限制](docs/validation.md)。

无运行依赖、安装脚本、凭据处理、prompt 改写或自定义持久化事件。SDK 生成、审批、策略检查、工具派发和日志仍由 Harness 负责。

采用 [MIT](LICENSE) 许可。
