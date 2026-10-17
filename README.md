# PTC Tool Search

English | [中文](README.zh.md)

An independent DeepSeek Harness Host bundle that loads PTC tool SDK definitions on demand through the official scoped registry. Version 0.1.0 supports **Harness 0.2.1-rc.2** and Node.js 24+. It does not implement a provider's native search protocol.

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

Nine tests cover ranking, bounds, scope isolation, policy intersection, unload and recreation. Local macOS ARM64 acceptance on 2026-10-18 verified GPT 6.1 Sol and Muse Spark 1.3 over CLIProxyAPI Responses, including terminal calls, follow-up memory and image generation. The same two-turn task reduced cumulative input by 63.65% and 52.41%, counting searches and retries. These are individual samples, not general cost or latency guarantees; see [method and limitations](docs/validation.md).

No runtime dependencies, credential handling, install scripts, prompt rewriting or custom persistent session events are added. Harness owns SDK generation, guarded tool dispatch, approvals and logging.

## License

[MIT](LICENSE).
