import { Injectable } from '@nestjs/common';
import type { DocumentContentLanguage } from '../../document';

const chineseCharacterPattern = /[\u3400-\u9fff]/gu;
const latinLetterPattern = /[A-Za-z]/g;

@Injectable()
export class LanguageDetector {
  detect(content: string): DocumentContentLanguage {
    const chineseCount = this.countMatches(content, chineseCharacterPattern);
    const latinCount = this.countMatches(content, latinLetterPattern);

    if (chineseCount === 0 && latinCount === 0) {
      return 'unknown';
    }

    if (chineseCount > 0 && latinCount > 0) {
      return 'mixed';
    }

    return chineseCount > 0 ? 'zh' : 'en';
  }

  private countMatches(content: string, pattern: RegExp): number {
    return content.match(pattern)?.length ?? 0;
  }
}
