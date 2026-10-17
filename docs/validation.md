# Validation

Verified on 2026-10-18 with DeepSeek Harness Desktop and CLI 0.2.1-rc.2 on macOS ARM64. Runtime code was exercised before publication as a local bundle; the public package renames that bundle without changing discovery behavior.

## Unit and distribution checks

Nine tests cover exact-name ranking, capability terms, no-match queries, bounds, progressive visibility, independent agents, policy intersection, ownership checks, unload and recreation. The release tarball is tested after extraction, with manifest exports, locales, SVG and file allowlisting checked. No runtime dependencies or install/build scripts are required.

## Identical-task comparison

A used the full PTC SDK. B used progressive discovery with the same profile, workspace, business plugins, models and prompts. The first turn ran `printf 137`, read its real output and calculated `n * 3 + 9`. A second turn recalled `AB-137` and added one without tools. All four sessions returned the expected `AB-137 / 137 / 420` and `AB-137 / 421`.

Models were `gpt-6.1-sol` and `opencode-go-muse-spark-1.3`, both using CLIProxyAPI Responses. Counts use provider-reported input, including cache reads and writes. Inputs plus output reconcile with reported total tokens. Cumulative counts include searches and retries, but exclude independent title requests and later image-generation turns.

| Model | First input A → B | Reduction | Two-turn input A → B | Reduction |
| --- | ---: | ---: | ---: | ---: |
| GPT 6.1 Sol | 21,102 → 3,957 | 81.25% | 63,669 → 23,143 | 63.65% |
| Muse Spark 1.3 | 21,046 → 4,057 | 80.72% | 64,487 → 30,689 | 52.41% |

The first task needed 2 model requests in A and 4 in B for both models. GPT B retried after an empty `run_code.justification` was rejected by Harness. Muse B searched twice because its initial code did not print or return the search result. Its broad query also selected two unused definitions; no extra business tools were executed. These costs remain included. Prefer exact tool names with `limit:1` and return the result once.

Each model has one sample per group. The figures establish real input reduction for this task, not an average, billing prediction or latency guarantee. Cached tokens still occupy context. The plugin delays tool definitions; it does not summarize conversation history. Input grows as more definitions are loaded.

## Image generation and follow-up

Both models searched `generate_image`, ended that `run_code`, then called `tools.generate_image` from a later request. Existing `openai-compat/gpt-image-2.5-flare` generated an image, displayed its attachment and saved it to the workspace. Nested searches, terminal calls and image calls succeeded. Requested size was 1024×1024; the image service returned 1254×1254. PNG signatures, dimensions and attachment hashes were checked, and images were inspected visually.

The package does not configure CLIProxyAPI or image providers. A compatible image-generation bundle and provider must already be installed. Standard/native mode and other operating systems have not received the same live provider acceptance coverage.
