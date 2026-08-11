import { describe, expect, it } from 'vitest';
import { parseGithubPrUrl } from './parseGithubPrUrl';

describe('parseGithubPrUrl', () => {
  it('parses and normalizes a public GitHub pull request URL', () => {
    expect(parseGithubPrUrl(' https://github.com/facebook/react/pull/123/?tab=files ')).toEqual({
      owner: 'facebook',
      repo: 'react',
      pullNumber: 123,
      url: 'https://github.com/facebook/react/pull/123',
    });
  });

  it.each([
    'http://github.com/facebook/react/pull/1',
    'https://gitlab.com/facebook/react/pull/1',
    'https://github.com/facebook/react/issues/1',
    'https://github.com/facebook/react/pull/not-a-number',
  ])('rejects invalid input: %s', (value) => {
    expect(parseGithubPrUrl(value)).toBeNull();
  });
});
