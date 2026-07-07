import { Injectable } from '@nestjs/common';
import { defaultSectionTitle, type MarkdownSection } from '../chunk.types';

const markdownHeaderPattern = /^(#{1,3})\s+(.+?)\s*#*\s*$/;

@Injectable()
export class MarkdownHeaderSplitter {
  split(markdown: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    const lines = markdown.split(/\r?\n/);
    let sectionTitle = defaultSectionTitle;
    let sectionLines: string[] = [];
    let inCodeFence = false;

    for (const line of lines) {
      if (this.isFence(line)) {
        inCodeFence = !inCodeFence;
      }

      const header = inCodeFence ? null : line.match(markdownHeaderPattern);

      if (header) {
        this.pushSection(sections, sectionTitle, sectionLines);
        sectionTitle = this.cleanTitle(header[2]);
        sectionLines = [line];
        continue;
      }

      sectionLines.push(line);
    }

    this.pushSection(sections, sectionTitle, sectionLines);

    return sections;
  }

  private pushSection(
    sections: MarkdownSection[],
    sectionTitle: string,
    sectionLines: string[],
  ): void {
    const content = sectionLines.join('\n').trim();

    if (!content) {
      return;
    }

    sections.push({
      sectionTitle,
      content,
    });
  }

  private cleanTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ') || defaultSectionTitle;
  }

  private isFence(line: string): boolean {
    const trimmedLine = line.trim();

    return trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~');
  }
}
