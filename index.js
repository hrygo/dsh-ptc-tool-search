import { rankTools, validateSearch } from './search.js';

export const name = '@hrygo/dsh-ptc-tool-search';
export const inject = ['tools', 'agents'];

/** Install discovery only for newly created PTC agents; dsh owns SDK generation. */
export function apply(ctx, options = {}) {
  const config = { enabled: true, maxResults: 3, maxQueryChars: 256, maxDescriptionChars: 160, ...options };
  if (typeof config.enabled !== 'boolean') throw new Error('enabled must be boolean');
  for (const field of ['maxResults', 'maxQueryChars', 'maxDescriptionChars']) {
    if (!Number.isSafeInteger(config[field]) || config[field] < 1) throw new Error(`${field} must be a positive integer`);
  }
  if (!config.enabled) return;
  const owners = new Map();
  ctx.on('agent/created', ({ agent }) => {
    const schemas = ctx.tools.schemas(agent);
    if (!schemas.some(tool => tool.name === 'run_code')) return;
    if (schemas.some(tool => tool.name === 'tool_search')) throw new Error('A tool_search tool already exists; enable only one discovery plugin');
    const catalog = schemas.filter(tool => tool.name !== 'run_code')
      .map(tool => ({ name: tool.name, description: tool.description ?? '' }));
    const selected = new Set();
    const dispose = agent.ctx.effect(() => {
      let restriction = agent.ctx.tools.restrict({ allow: [] });
      const unregister = agent.ctx.tools.register({
        name: 'tool_search',
        description: `Find and load tools for this PTC agent. Search exact callable names or English capability keywords (for example bash, terminal shell, generate_image). Optional limit must be in 1..${config.maxResults}; omit it to use ${config.maxResults}. Call with await tools.tool_search({query:"bash",limit:1}) inside run_code. Print OR return the result once. Loaded tools enter the SDK on the NEXT model request; finish this run_code before calling them in another run_code. If the SDK no longer declares a previously used tool after resume, search again.`,
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', minLength: 1, maxLength: config.maxQueryChars },
            limit: { type: 'integer', minimum: 1, maximum: config.maxResults, description: `Optional limit in 1..${config.maxResults}; omit for ${config.maxResults}.` },
          },
          required: ['query'], additionalProperties: false,
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              tools: { type: 'array', items: { type: 'object', properties: {
                name: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' },
              }, required: ['name', 'description', 'status'], additionalProperties: false } },
              selected: { type: 'array', items: { type: 'string' } },
              nextRequest: { type: 'boolean' },
            }, required: ['query', 'tools', 'selected', 'nextRequest'], additionalProperties: false,
          },
          render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
        },
        async execute(args, exec) {
          if (exec.agent !== agent) throw new Error('Search requires its owning live agent');
          exec.signal.throwIfAborted();
          const { query, limit } = validateSearch(args, config);
          const hits = rankTools(catalog, query, limit);
          // Own-scope registrations stay visible independently of inherited masks.
          for (const hit of hits) if (!ctx.tools.get(hit.name, agent)) selected.add(hit.name);
          const replacement = agent.ctx.tools.restrict({ allow: [...selected] });
          restriction();
          restriction = replacement;
          return {
            query,
            tools: hits.map(hit => ({ name: hit.name, description: hit.description.slice(0, config.maxDescriptionChars), status: ctx.tools.get(hit.name, agent) ? 'available_next_request' : 'unavailable_by_policy' })),
            selected: [...selected].sort(), nextRequest: true,
          };
        },
      });
      return () => { restriction(); unregister(); };
    });
    owners.set(agent, dispose);
  });
  ctx.on('agent/disposed', ({ agent }) => { owners.get(agent)?.(); owners.delete(agent); });
  ctx.effect(() => () => { for (const dispose of owners.values()) dispose(); owners.clear(); });
}
