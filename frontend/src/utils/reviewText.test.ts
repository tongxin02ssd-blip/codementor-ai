import { describe, expect, it } from 'vitest';
import { splitReviewText } from './reviewText';

describe('splitReviewText', () => {
  it('separates an unmarked regular expression from surrounding Chinese text', () => {
    const expression = '/^https:\\/\\/github\\.com\\/[^/]+\\/pull\\/\\d+$/';
    expect(splitReviewText(`当前正则${expression}无法匹配查询参数。`)).toEqual([
      { type: 'text', value: '当前正则' },
      { type: 'code', value: expression },
      { type: 'text', value: '无法匹配查询参数。' },
    ]);
  });

  it('renders explicitly marked inline code without exposing backticks', () => {
    expect(splitReviewText('建议使用 `new URL(value)` 解析链接。')).toEqual([
      { type: 'text', value: '建议使用 ' },
      { type: 'code', value: 'new URL(value)' },
      { type: 'text', value: ' 解析链接。' },
    ]);
  });

  it('keeps ordinary Chinese prose unchanged', () => {
    expect(splitReviewText('当前实现缺少异常处理。')).toEqual([
      { type: 'text', value: '当前实现缺少异常处理。' },
    ]);
  });
});
