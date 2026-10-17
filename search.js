/** Validate model-supplied search JSON against deployment bounds. */
export function validateSearch(args, config) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Expected search arguments object');
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  const limit = args.limit ?? config.maxResults;
  if (!query || query.length > config.maxQueryChars) throw new Error(`query must contain 1..${config.maxQueryChars} characters`);
  if (!Number.isInteger(limit) || limit < 1 || limit > config.maxResults) throw new Error(`limit must be an integer in 1..${config.maxResults}`);
  return { query, limit };
}

/** Rank exact names and lexical capability matches without remote requests. */
export function rankTools(catalog, query, limit) {
  const normalized = query.toLowerCase();
  const words = [...new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean))];
  return catalog.map(tool => {
    const name = tool.name.toLowerCase();
    const description = tool.description.toLowerCase();
    const score = (name === normalized ? 10000 : 0)
      + words.reduce((sum, word) => sum + (name.includes(word) ? 20 : 0) + (description.includes(word) ? 1 : 0), 0);
    return { tool, score };
  }).filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score || (a.tool.name < b.tool.name ? -1 : a.tool.name > b.tool.name ? 1 : 0))
    .slice(0, limit).map(hit => hit.tool);
}
