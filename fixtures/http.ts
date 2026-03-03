import { baseHttpFixture } from './http/base';
import { demoHttpFixture } from './http/demo';
import { edgeHttpFixture } from './http/edge';
import { failureHttpFixture } from './http/failure';
import type { HttpFixtureSet, MockScenario } from './http/types';

export type { HttpFixtureSet, MockScenario } from './http/types';

export const httpFixtures: Record<MockScenario, HttpFixtureSet> = {
  base: baseHttpFixture,
  demo: demoHttpFixture,
  edge: edgeHttpFixture,
  failure: failureHttpFixture,
};
