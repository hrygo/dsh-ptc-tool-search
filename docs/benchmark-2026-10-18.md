# Repeated live benchmark — 2026-10-18

DeepSeek Harness Desktop 0.2.1-rc.2, macOS ARM64; CLIProxyAPI Responses; plugin runtime 0.1.0. Release 0.1.1 changes artwork and documentation, with identical discovery code. Twelve independent sessions: two models × two modes × three repetitions, four turns each.

## Task and measurement

1. Read the synthetic JSON fixture with `read`, execute `printf 137` with `bash`, calculate from the real outputs, and save the result with `write`.
2. Recall the passphrase, sum and result without tools.
3. Generate one 1024×1024 teal paper-crane illustration with `generate_image`, save it and display its attachment.
4. Read the saved result and continue the calculation.

A uses the full SDK; B enables this plugin. Both receive the same four prompts. Each run starts with a new PTC agent and no result file; previous synthetic results are archived between runs. The same Desktop profile, tool catalog, provider routes, model defaults and image provider are used throughout. Runs are serial. Group order is counterbalanced across models/repetitions; upstream caches are neither cleared nor controlled. The exact fixture, prompts, per-request counters and descriptive statistics are in [the data file](benchmark-2026-10-18.json).

Input is the sum of normalized uncached input, cache reads and cache writes reported in conversation-model `assistant/message.usage`. Output includes the conversation model’s reported output tokens. Every counted request reconciles input plus output with total tokens. Search, retries and failed tool calls remain included; independent session-title requests are excluded. Image-model token usage is not exposed by this image tool and is **not included** in these conversation-model token totals.

Active time is the sum of the four `turn/start` → `turn/end` durations. It includes model, search, business-tool and image-generation time; it excludes gaps between user prompts. Image time is also recorded separately from `tool/ptc-dispatch-start` to its completion. These are client-observed durations, not upstream-only latency or time to first token.

Actual charges are **not reported**, for both conversation and image generation. No per-request billing ledger is available; unknown charges are stored as JSON `null`, never zero. Adapter cost defaults and public list prices are not treated as actual payments. No cost-saving percentage is claimed.

## Group means

Means are per complete four-turn session, with three runs per row. Percent change is `(mean B / mean A − 1) × 100`; negative input change means less input.

| Model | Mode | Input tokens | Output tokens | Model requests | Active seconds | Success |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| GPT 6.1 Sol | A | 153,825.0 | 814.3 | 7.0 | 48.01 | 3/3 |
| GPT 6.1 Sol | B | 74,669.7 | 1,161.0 | 11.7 | 64.44 | 3/3 |
| Muse Spark 1.3 | A | 193,155.3 | 4,173.3 | 8.0 | 45.93 | 3/3 |
| Muse Spark 1.3 | B | 96,569.0 | 3,728.0 | 12.0 | 43.10 | 3/3 |

## Cache accounting

Per-session means from provider-reported conversation usage. These counters do not establish actual charges.

| Model | Mode | Uncached input | Cache reads | Cache writes |
| --- | --- | ---: | ---: | ---: |
| GPT 6.1 Sol | A | 23,521.0 | 130,304.0 | 0.0 |
| GPT 6.1 Sol | B | 31,405.7 | 43,264.0 | 0.0 |
| Muse Spark 1.3 | A | 25,761.0 | 167,394.3 | 0.0 |
| Muse Spark 1.3 | B | 31,464.0 | 65,105.0 | 0.0 |

## Recovered execution errors

GPT had no tool-result errors. Muse had four in A and three in B: six rejected terminal argument combinations (`justification` without `sandbox_permissions`) and one PTC completion that was not lossless JSON. All runs recovered without rerunning or excluding a session. Their conversation tokens and time remain included; successful image generation is counted from the actual artifact even when its enclosing PTC completion needed recovery.

## Every run

| Model | Mode | Repeat | Input | Output | Requests | Active seconds | Image seconds | Tool errors | Pass |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GPT 6.1 Sol | A | 1 | 153,668 | 782 | 7 | 49.46 | 15.00 | 0 | yes |
| GPT 6.1 Sol | A | 2 | 153,703 | 782 | 7 | 44.34 | 15.51 | 0 | yes |
| GPT 6.1 Sol | A | 3 | 154,104 | 879 | 7 | 50.21 | 15.95 | 0 | yes |
| GPT 6.1 Sol | B | 1 | 82,826 | 1,278 | 13 | 66.85 | 14.55 | 0 | yes |
| GPT 6.1 Sol | B | 2 | 69,958 | 1,140 | 11 | 62.40 | 15.28 | 0 | yes |
| GPT 6.1 Sol | B | 3 | 71,225 | 1,065 | 11 | 64.07 | 18.84 | 0 | yes |
| Muse Spark 1.3 | A | 1 | 197,772 | 4,748 | 8 | 45.22 | 13.38 | 1 | yes |
| Muse Spark 1.3 | A | 2 | 188,566 | 3,164 | 8 | 47.04 | 12.75 | 1 | yes |
| Muse Spark 1.3 | A | 3 | 193,128 | 4,608 | 8 | 45.52 | 13.52 | 2 | yes |
| Muse Spark 1.3 | B | 1 | 90,087 | 3,268 | 12 | 39.91 | 13.15 | 1 | yes |
| Muse Spark 1.3 | B | 2 | 100,794 | 4,177 | 12 | 43.83 | 13.01 | 1 | yes |
| Muse Spark 1.3 | B | 3 | 98,826 | 3,739 | 12 | 45.57 | 12.93 | 1 | yes |

## Acceptance and limits

A successful run must complete all four turns with the expected arithmetic and memory results, execute the required business tools, and produce exactly one image. Image bytes are checked for PNG format and attachment SHA-256 agreement; returned dimensions are recorded separately and images are inspected visually. Workflow success does not mean the requested pixel dimensions were honored. Initial SDK visibility is checked independently: 35 definitions for A and 2 for B. Both modes expose only `run_code` as the API-level tool.

These are repeated observations of one fixed synthetic workflow, not a representative workload survey. Three repetitions per group provide descriptive means, medians, ranges and sample standard deviations; they do not establish population confidence intervals or general cost/latency savings. The saved data includes all twelve planned runs. More tools, different prompts, caching, upstream load and generation variability can change the result. Provider-internal retries and unavailable image-model usage cannot be recovered from these session counters. Discovery preserves conversation history and defers definitions; selected SDK definitions accumulate.

The image route is the existing `openai-compat/gpt-image-2.5-flare` bundle/provider. Image-provider usage and charges remain unknown. The plugin does not install or configure that provider. Other operating systems and native/standard mode are outside this live benchmark.

Every image call requested `1024x1024`. Returned dimensions: GPT 6.1 Sol: 1254×1254 (n=6); Muse Spark 1.3: 1536×1024 (n=6). Exact pixel-size matches: **0/12**. This discrepancy was observed in both discovery and full-SDK modes; no provider configuration or prompt was changed mid-benchmark.
