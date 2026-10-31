const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { buildSchema, parse, validate } = require('graphql');
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: path => path === './types' ? load('src/api/types.ts') : require(path), fetch, AbortController, setTimeout, clearTimeout, Error, Promise });
  return exports;
}
const { createGraphqlClient, ApiError, errorMessage } = load('src/api/graphql-client.ts');
const session = { accessToken: 'old-access', refreshToken: 'refresh', user: { id: 'patient-1', role: 'PATIENT', profileComplete: true } };
const renewed = { ...session, accessToken: 'new-access', refreshToken: 'new-refresh' };
const json = data => new Response(JSON.stringify({ data }), { status: 200 });
const unauth = () => new Response(JSON.stringify({ errors: [{ message: 'Expired', extensions: { code: 'UNAUTHENTICATED' } }] }), { status: 200 });
test('authenticated requests use the configured endpoint, bearer token, and GraphQL variables', async () => {
  const client = createGraphqlClient('https://example.test/graphql', () => {}, async (url, options) => { assert.equal(url, 'https://example.test/graphql'); assert.equal(options.headers.Authorization, 'Bearer old-access'); assert.equal(JSON.parse(options.body).variables.amount, 25); return json({ topUpWallet: { balance: 25 } }); });
  await client.setSession(session); assert.equal((await client.request('mutation Test', { amount: 25 })).topUpWallet.balance, 25);
});
test('concurrent expired requests share one refresh and retry with the new token', async () => {
  let refreshes = 0; let successful = 0;
  const client = createGraphqlClient('https://example.test/graphql', () => {}, async (_url, options) => { const body = JSON.parse(options.body); if (body.query.includes('mutation Refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); return json({ refreshToken: renewed }); } if (options.headers.Authorization === 'Bearer old-access') return unauth(); successful++; return json({ ok: true }); });
  await client.setSession(session); await Promise.all([client.request('query A'), client.request('query B')]); assert.equal(refreshes, 1); assert.equal(successful, 2);
});
test('logging out during refresh cannot restore the old session', async () => {
  let finish; let began; const started = new Promise(resolve => { began = resolve; }); const waiting = new Promise(resolve => { finish = resolve; });
  const client = createGraphqlClient('https://example.test/graphql', () => {}, async (_url, options) => { if (JSON.parse(options.body).query.includes('mutation Refresh')) { began(); await waiting; return json({ refreshToken: renewed }); } return unauth(); });
  await client.setSession(session); const request = client.request('query Private'); const result = assert.rejects(request, error => error.code === 'SESSION_CHANGED'); await started; await client.setSession(null); finish(); await result; assert.equal(client.getSession(), null);
});
test('network failures do not retry or duplicate wallet mutations', async () => {
  let requests = 0; const client = createGraphqlClient('https://example.test/graphql', () => {}, async () => { requests++; throw new Error('Offline'); }); await client.setSession(session);
  await assert.rejects(client.request('mutation TopUp'), error => error.code === 'NETWORK'); assert.equal(requests, 1); assert.equal(client.getSession().accessToken, 'old-access');
});
test('recoverable payment errors remain actionable and do not trigger refresh', async () => {
  let requests = 0; const client = createGraphqlClient('https://example.test/graphql', () => {}, async () => { requests++; return new Response(JSON.stringify({ errors: [{ message: 'Low funds', extensions: { code: 'INSUFFICIENT_FUNDS' } }] })); }); await client.setSession(session);
  await assert.rejects(client.request('mutation Payment'), error => { assert.match(errorMessage(error), /Top up/); return error.code === 'INSUFFICIENT_FUNDS'; }); assert.equal(requests, 1);
});
test('anonymous requests cannot access patient data', async () => {
  const client = createGraphqlClient('https://example.test/graphql', () => {}, async () => { throw new Error('Must not fetch'); }); await assert.rejects(client.request('query Private'), error => error instanceof ApiError && error.code === 'UNAUTHENTICATED');
});
test('patient dashboard and QR operations match the supplied schema', () => {
  const schema = buildSchema(fs.readFileSync('docs/backend-schema.graphql','utf8'));
  for (const operation of [load('src/api/types.ts').PATIENT_QUERY, 'mutation { generateQrToken { token qrCodeUrl expiresAt } }', 'mutation TopUp($amount: Float!) { topUpWallet(amount: $amount) { balance } }']) assert.equal(validate(schema, parse(operation)).length, 0);
});
