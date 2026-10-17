# PTC Tool Search

English | [中文](README.zh.md)

Load PTC tool definitions only when needed. In a real two-model A/B test, this plugin reduced **first-request input by about 81%** and **cumulative input across two turns by 52–64%**, including search and retry overhead.

An independent community Host bundle for DeepSeek Harness, using its official scoped tool registry. Version 0.1.0 supports **Harness 0.2.1-rc.2** and Node.js 24+.

## Measured results

Tested on 2026-10-18 with GPT 6.1 Sol and Muse Spark 1.3 through CLIProxyAPI Responses on macOS ARM64. A used the full PTC SDK; B enabled this plugin. Both groups received identical prompts: execute `printf 137`, calculate from the actual output, then recall the result in a second turn without tools. All four sessions answered correctly.

| Model | First request input A → B | Reduction | Two-turn cumulative input A → B | Reduction |
| --- | ---: | ---: | ---: | ---: |
| GPT 6.1 Sol | 21,102 → 3,957 | **81.25%** | 63,669 → 23,143 | **63.65%** |
| Muse Spark 1.3 | 21,046 → 4,057 | **80.72%** | 64,487 → 30,689 | **52.41%** |

Counts are provider-reported input tokens, including cache reads and writes. The initial generated SDK exposed **2 tool definitions instead of 35** (`tool_search` and agent-owned `subagent`); selected definitions appeared on subsequent requests. The plugin defers tool definitions while preserving conversation history. Both groups still exposed only `run_code` as the API-level tool; this is not a provider-native search protocol.

**Tradeoff:** the first task took 4 model requests with discovery versus 2 with the full SDK. Search and retries remain included above; SDK input grows as more tools are selected. Each model has one A/B pair, so these results describe this task, not average savings or a billing or latency guarantee. See [measurement details and limitations](docs/validation.md).

## Install

Use Harness **Plugins → Add plugin**, then enter `github:hrygo/dsh-ptc-tool-search#v0.1.0`, or use the official CLI:

```sh
dsh plugin --profile desktop add github:hrygo/dsh-ptc-tool-search#v0.1.0
```

For an immutable installation, replace `v0.1.0` with the full commit SHA in the [release notes](https://github.com/hrygo/dsh-ptc-tool-search/releases/tag/v0.1.0). The release also provides a tarball and SHA-256 checksum. Download and verify them, then install with `dsh plugin --profile desktop add ./hrygo-dsh-ptc-tool-search-0.1.0.tgz`.

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
