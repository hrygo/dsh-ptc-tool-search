<img src="icon.svg" width="72" height="72" alt="PTC Tool Search" />

# PTC Tool Search

English | [中文](README.zh.md)

Load PTC tool definitions on demand while preserving conversation history. Across 12 live four-turn sessions, the plugin reduced mean cumulative conversation input by **51.46% (GPT)** and **50.00% (Muse)**. Output tokens and latency are reported alongside the reductions.

An independent community Host bundle using the official DeepSeek Harness scoped tool registry. Version 0.1.1 supports **Harness 0.2.1-rc.2** and Node.js 24+.

## Repeated live results

Measured on 2026-10-18: macOS ARM64, Desktop 0.2.1-rc.2, CLIProxyAPI Responses. **3 runs per model per group: 12 new sessions, 48 turns and 12 real image generations.** Identical four-turn prompts cover JSON reading, terminal execution, result writing, tool-free recall, image generation and file readback. A uses the full PTC SDK; B enables this plugin. Values below are means per complete four-turn session.

| Model | Input tokens A → B | Input reduction | Output tokens A → B | Active seconds A → B | Workflow completion A / B |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT 6.1 Sol | 153,825.0 → 74,669.7 | **51.46%** | 814.3 → 1,161.0 | 48.01 → 64.44 | 3/3 · 3/3 |
| Muse Spark 1.3 | 193,155.3 → 96,569.0 | **50.00%** | 4,173.3 → 3,728.0 | 45.93 → 43.10 | 3/3 · 3/3 |

Uncached input increased: GPT 6.1 Sol: 23,521.0 → 31,405.7 (+33.52%); Muse Spark 1.3: 25,761.0 → 31,464.0 (+22.14%). These results do not establish billing savings.

Input includes cache reads/writes, searches and retries. Output counts conversation-model tokens; the image service does not expose its own token usage. Active time includes tools and image generation, excluding gaps between user prompts. **Actual charges: not reported**, never treated as zero; no billing reduction is claimed.

The initial SDK shrank from **35 definitions to 2**; mean first-request input fell **80.27–80.79%**. Both groups expose only `run_code` at the API level. Discovery adds round trips: mean model requests were GPT 6.1 Sol: 7.0 → 11.7; Muse Spark 1.3: 8.0 → 12.0. Output and latency need not decrease, and the SDK grows as tools accumulate. GPT had no tool errors; Muse A/B had 4/3 recoverable errors respectively, all retried to completion and included.

**Image dimensions:** every call requested `1024x1024`, returned GPT 6.1 Sol: 1254×1254 (n=6); Muse Spark 1.3: 1536×1024 (n=6); exact size matches: **0/12**. Workflow success covers tool execution, arithmetic, recall and image artifacts, not requested-size compliance. Compare A/B within each model, not image speed across models.

This is a small repeated sample of one fixed workflow. See the [per-run report, method and limitations](docs/benchmark-2026-10-18.md) and [auditable data](docs/benchmark-2026-10-18.json) for means, medians and ranges.

## Install

Use Harness **Plugins → Add plugin**, then enter `github:hrygo/dsh-ptc-tool-search#v0.1.1`, or use the official CLI:

```sh
dsh plugin --profile desktop add github:hrygo/dsh-ptc-tool-search#v0.1.1
```

For an immutable installation, replace `v0.1.1` with the full commit SHA in the [release notes](https://github.com/hrygo/dsh-ptc-tool-search/releases/tag/v0.1.1). The release also provides a tarball and SHA-256 checksum. Download and verify them, then install with `dsh plugin --profile desktop add ./hrygo-dsh-ptc-tool-search-0.1.1.tgz`.

This package ships executable ESM JavaScript: no compilation, dependencies, `prepare` script or build-script permission is needed. Restart Desktop after replacing an installed version, then create a PTC session. Remove a previous local development installation first; only one `tool_search` plugin may be enabled.

Distribution follows the official [package and install guide](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish). This package is not currently published to npm.

## Use

New PTC agents initially see `tools.tool_search` plus agent-owned tools. Inside `run_code`:

```js
return await tools.tool_search({ query: 'bash', limit: 1 });
```

End that `run_code`. On the next model request Harness regenerates the SDK with the selected tool; call `tools.bash` in another `run_code`. Print or return the search result once. Prefer exact callable names and `limit:1`; short English capability keywords also work. Search uses deterministic lexical matching, without network calls or embeddings.

Selections accumulate for each live agent. Recreated agents, including after restart or resume, discover again. Existing live agents at installation retain their previous surface. Tools registered after agent creation need a new agent to enter its catalog. Standard/native mode is unaffected. Other policy restrictions remain enforced; discovery cannot grant an excluded capability.

## Configuration and rollback

The bundle inserts row `ptc-tool-search`. Configure it through Harness plugin configuration:

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Enable discovery for new PTC agents. |
| `maxResults` | `3` | Maximum results accepted by a search call; positive integer. |
| `maxQueryChars` | `256` | Maximum query length; positive integer. |
| `maxDescriptionChars` | `160` | Search result description length; positive integer. |

The selected SDK retains full tool definitions. Search adds a model round trip; broad queries can load unnecessary definitions. As tools are selected, the SDK grows.

Disable or uninstall **PTC Tool Search** in Plugin Manager and create a new PTC session to restore full SDK visibility. No app or proxy changes are required.

## Verification

```sh
npm test
npm run check
npm pack --dry-run
```

Nine tests cover ranking, bounds, scope isolation, policy intersection, unload and recreation. Local macOS ARM64 acceptance on 2026-10-18 verified GPT 6.1 Sol and Muse Spark 1.3 over CLIProxyAPI Responses, including terminal calls, follow-up memory and image generation. See [acceptance details](docs/validation.md), including image attachment and file checks.

No runtime dependencies, credential handling, install scripts, prompt rewriting or custom persistent session events are added. Harness owns SDK generation, guarded tool dispatch, approvals and logging.

## License

[MIT](LICENSE).
