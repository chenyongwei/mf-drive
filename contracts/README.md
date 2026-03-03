# contracts

Shared source-of-truth for:
- HTTP contracts (OpenAPI)
- Event contracts (AsyncAPI)
- JSON Schemas
- Mock fixtures and profiles
- Generated TypeScript types

## Commands

- `npm run generate-types`
- `npm run validate-contracts`
- `npm run check-breaking`
- `npm run baseline:update`
- `npm run contract:test`
- `npm run contract:check`

## Profiles

`MOCK_PROFILE` supports `base`, `demo`, `edge`, `failure`.

`failure` profile supports deterministic fault injection:
- `?failure=401|403|409|500|timeout`
- Header override: `x-mock-failure: 401|403|409|500|timeout`
