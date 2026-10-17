import test from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../index.js';

function fixture() {
  const handlers = new Map();
  const effects = [];
  const agents = new Map();
  const catalog = [
    {name:'run_code', description:'PTC transport'},
    {name:'bash', description:'Run terminal shell commands. ' + 'Detailed shell execution guidance. '.repeat(20)},
    {name:'generate_image', description:'Generate an image'},
  ];
  const visible = agent => catalog.filter(t => t.name === 'run_code'
    || (agents.get(agent).masks.every(m => m.has(t.name)) && !agents.get(agent).denied.has(t.name)))
    .concat([...agents.get(agent).own.values()]);
  const ctx = {
    tools: { schemas: visible, get: (name, agent) => visible(agent).find(t => t.name === name) },
    on: (event, callback) => { handlers.set(event, callback); },
    effect: fn => { effects.push(fn()); },
  };
  function create({ptc = true, denied = []} = {}) {
    const agent = {};
    const state = {own:new Map(), masks:[], denied:new Set(denied)};
    agents.set(agent, state);
    agent.ctx = {
      effect: fn => fn(),
      tools: {
        restrict: ({allow}) => {
          if (allow.includes('run_code')) throw new Error('reserved');
          const mask = new Set(allow); state.masks.push(mask);
          return () => { state.masks = state.masks.filter(x => x !== mask); };
        },
        register: def => { state.own.set(def.name, def); return () => state.own.delete(def.name); },
      },
    };
    if (!ptc) {
      const original = ctx.tools.schemas;
      ctx.tools.schemas = a => original(a).filter(t => t.name !== 'run_code');
      handlers.get('agent/created')({agent}); ctx.tools.schemas = original;
    } else handlers.get('agent/created')({agent});
    return agent;
  }
  apply(ctx);
  return {create, visible, agents, handlers, unload: () => effects.forEach(fn => fn()),
    search: (agent, args) => ctx.tools.get('tool_search', agent).execute(args, {agent, signal:new AbortController().signal})};
}

test('PTC starts with discovery only and loads selected tool for the next SDK', async () => {
  const f = fixture(); const a = f.create();
  assert.deepEqual(f.visible(a).map(t => t.name), ['run_code','tool_search']);
  assert.match(f.visible(a).find(t => t.name === 'tool_search').description, /limit.*1\.\.3/);
  const out = await f.search(a, {query:'bash',limit:1});
  assert.deepEqual(out.selected, ['bash']);
  assert.equal(out.tools[0].status, 'available_next_request');
  assert.equal(out.tools[0].description.length, 160);
  assert(f.visible(a).find(t => t.name === 'bash').description.length > 160);
  assert.deepEqual(f.visible(a).map(t => t.name), ['run_code','bash','tool_search']);
  await f.search(a, {query:'generate_image',limit:1});
  assert.deepEqual(f.visible(a).map(t => t.name), ['run_code','bash','generate_image','tool_search']);
});
test('search selection is isolated per agent and cannot widen another restriction', async () => {
  const f = fixture(); const a = f.create(); const b = f.create({denied:['generate_image']});
  await f.search(a, {query:'bash',limit:1});
  assert.deepEqual(f.visible(b).map(t => t.name), ['run_code','tool_search']);
  assert.deepEqual((await f.search(b, {query:'generate_image',limit:1})).tools, []);
  f.agents.get(a).denied.add('generate_image');
  const out = await f.search(a, {query:'generate_image',limit:1});
  assert.equal(out.tools[0].status, 'unavailable_by_policy');
  assert(!f.visible(a).some(t => t.name === 'generate_image'));
});
test('invalid search leaves visibility unchanged and owner check rejects cross-agent use', async () => {
  const f = fixture(); const a = f.create(); const b = f.create();
  await assert.rejects(f.search(a, {query:'bash',limit:99}));
  const tool = f.visible(a).find(t => t.name === 'tool_search');
  await assert.rejects(tool.execute({query:'bash'}, {agent:b,signal:new AbortController().signal}));
  assert.deepEqual(f.visible(a).map(t => t.name), ['run_code','tool_search']);
});
test('unload lifts only this plugin mask and removes its owned tool', async () => {
  const f = fixture(); const a = f.create({denied:['generate_image']});
  f.unload();
  assert.deepEqual(f.visible(a).map(t => t.name), ['run_code','bash']);
});
test('native agent is not changed and a recreated PTC agent discovers again', async () => {
  const f = fixture(); const native = f.create({ptc:false});
  assert(!f.visible(native).some(t => t.name === 'tool_search'));
  const a = f.create(); await f.search(a, {query:'bash',limit:1});
  f.handlers.get('agent/disposed')({agent:a});
  const b = f.create(); assert.deepEqual(f.visible(b).map(t => t.name), ['run_code','tool_search']);
});
