export interface ReviewTextSegment {
  type: 'text' | 'code';
  value: string;
}

function findRegexLiteralEnd(value: string, start: number) {
  let escaped = false;
  let inCharacterClass = false;
  for (let index = start + 1; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '[') {
      inCharacterClass = true;
      continue;
    }
    if (character === ']') {
      inCharacterClass = false;
      continue;
    }
    if (character === '/' && !inCharacterClass) {
      let end = index + 1;
      while (end < value.length && /[dgimsuvy]/.test(value[end])) end += 1;
      return end;
    }
  }
  return -1;
}

export function splitReviewText(value: string): ReviewTextSegment[] {
  const segments: ReviewTextSegment[] = [];
  let textStart = 0;
  let index = 0;

  const pushCode = (start: number, end: number, contentStart = start, contentEnd = end) => {
    if (start > textStart) segments.push({ type: 'text', value: value.slice(textStart, start) });
    segments.push({ type: 'code', value: value.slice(contentStart, contentEnd) });
    index = end;
    textStart = end;
  };

  while (index < value.length) {
    if (value[index] === '`') {
      const closingBacktick = value.indexOf('`', index + 1);
      if (closingBacktick > index + 1) {
        pushCode(index, closingBacktick + 1, index + 1, closingBacktick);
        continue;
      }
    }
    if (value[index] === '/' && value[index + 1] === '^') {
      const regexEnd = findRegexLiteralEnd(value, index);
      if (regexEnd > index + 2) {
        pushCode(index, regexEnd);
        continue;
      }
    }
    index += 1;
  }

  if (textStart < value.length) segments.push({ type: 'text', value: value.slice(textStart) });
  return segments;
}
