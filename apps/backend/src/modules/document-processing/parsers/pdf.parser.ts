import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PDFParse, type Screenshot } from 'pdf-parse';
import { ConfigService, type PdfOcrConfig } from '../../../config';
import type { DocumentType } from '../../document';
import {
  MULTIMODAL_PROVIDER,
  type MultimodalProvider,
} from '../../multimodal/providers/multimodal.provider';
import type {
  DocumentParser,
  DocumentParserContext,
  DocumentParsingResult,
} from '../document-parser.interface';

const pageMarkerPattern = /^--\s*\d+\s+of\s+\d+\s*--$/i;
const dimensionSafetyMargin = 8;

interface PdfInfoPage {
  pageNumber: number;
  width: number;
  height: number;
}

interface PdfPageRenderPlan {
  pageNumber: number;
  pageWidth?: number;
  pageHeight?: number;
  renderWidth: number;
}

@Injectable()
export class PdfParser implements DocumentParser {
  constructor(
    private readonly configService: ConfigService,
    @Inject(MULTIMODAL_PROVIDER)
    private readonly multimodalProvider: MultimodalProvider,
  ) {}

  supports(type: DocumentType): boolean {
    return type === 'PDF';
  }

  async parse(buffer: Buffer, context: DocumentParserContext): Promise<DocumentParsingResult> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const text = result.text.trim();

      if (this.hasReadableText(text)) {
        return {
          content: text,
          metadata: {
            ocr: {
              enabled: false,
              mode: 'native-text',
            },
          },
        };
      }

      return await this.parseWithOcr(parser, context);
    } finally {
      await parser.destroy();
    }
  }

  private async parseWithOcr(
    parser: PDFParse,
    context: DocumentParserContext,
  ): Promise<DocumentParsingResult> {
    const pdfOcrConfig = this.configService.getPdfOcrConfig();
    const ocrConfig = this.configService.getOcrConfig();

    if (
      !pdfOcrConfig.enabled ||
      ocrConfig.provider !== 'openai-compatible' ||
      !ocrConfig.apiUrl ||
      !ocrConfig.apiKey ||
      !ocrConfig.model
    ) {
      throw new BadRequestException('PDF requires OCR but OCR provider is not enabled');
    }

    const info = await parser.getInfo({ parsePageInfo: true });
    const pageCount = info.total;

    if (pageCount > pdfOcrConfig.maxPages) {
      throw new BadRequestException(
        `PDF has ${pageCount} pages, exceeding PDF_OCR_MAX_PAGES=${pdfOcrConfig.maxPages}`,
      );
    }

    const pageRenderPlans = this.createPageRenderPlans(info.pages, pageCount, pdfOcrConfig);
    const screenshots: Screenshot[] = [];

    for (const pageRenderPlan of pageRenderPlans) {
      screenshots.push(await this.renderPageScreenshot(parser, pageRenderPlan, pdfOcrConfig));
    }

    const pageTexts = await this.mapWithConcurrency(
      screenshots,
      pdfOcrConfig.concurrency,
      async (screenshot) => this.extractPageText(screenshot, context),
    );
    const readablePages = pageTexts.filter((pageText) => pageText.text.trim());

    if (readablePages.length === 0) {
      throw new BadRequestException('PDF OCR produced no readable content');
    }

    return {
      content: this.buildOcrMarkdown(context.title, pageTexts),
      metadata: {
        ocr: {
          enabled: true,
          failedPages: pageTexts.length - readablePages.length,
          mode: 'ocr',
          model: ocrConfig.model,
          configuredRenderWidth: pdfOcrConfig.renderWidth,
          maxImageDimension: pdfOcrConfig.maxImageDimension,
          pageCount,
          processedPages: readablePages.length,
          provider: ocrConfig.provider,
          renderWidth: this.getMaxRenderedWidth(screenshots),
        },
      },
    };
  }

  private createPageRenderPlans(
    pages: PdfInfoPage[],
    pageCount: number,
    pdfOcrConfig: Readonly<PdfOcrConfig>,
  ): PdfPageRenderPlan[] {
    const pagesByNumber = new Map(
      pages
        .filter(
          (page) =>
            this.isPositiveFiniteNumber(page.pageNumber) &&
            this.isPositiveFiniteNumber(page.width) &&
            this.isPositiveFiniteNumber(page.height),
        )
        .map((page) => [page.pageNumber, page]),
    );

    return Array.from({ length: pageCount }, (_, index) => {
      const pageNumber = index + 1;
      const page = pagesByNumber.get(pageNumber);
      const renderWidth = this.getSafeRenderWidth(page, pdfOcrConfig);

      return {
        pageNumber,
        renderWidth,
        ...(page
          ? {
              pageHeight: page.height,
              pageWidth: page.width,
            }
          : {}),
      };
    });
  }

  private getSafeRenderWidth(
    page: PdfInfoPage | undefined,
    pdfOcrConfig: Readonly<PdfOcrConfig>,
  ): number {
    const maxDimension = Math.max(1, pdfOcrConfig.maxImageDimension - dimensionSafetyMargin);
    const configuredWidth = Math.min(pdfOcrConfig.renderWidth, maxDimension);

    if (!page) {
      return configuredWidth;
    }

    const heightLimitedWidth = Math.floor((maxDimension * page.width) / page.height);

    return Math.max(1, Math.min(configuredWidth, heightLimitedWidth));
  }

  private async renderPageScreenshot(
    parser: PDFParse,
    pageRenderPlan: PdfPageRenderPlan,
    pdfOcrConfig: Readonly<PdfOcrConfig>,
  ): Promise<Screenshot> {
    const screenshot = await this.renderPageScreenshotAtWidth(
      parser,
      pageRenderPlan.pageNumber,
      pageRenderPlan.renderWidth,
    );

    if (this.isWithinImageLimit(screenshot, pdfOcrConfig.maxImageDimension)) {
      return screenshot;
    }

    const retryRenderWidth = this.getRetryRenderWidth(
      pageRenderPlan.renderWidth,
      screenshot,
      pdfOcrConfig.maxImageDimension,
    );

    if (retryRenderWidth >= pageRenderPlan.renderWidth) {
      throw new BadRequestException(
        this.buildImageLimitError(pageRenderPlan, screenshot, pdfOcrConfig.maxImageDimension),
      );
    }

    const resizedScreenshot = await this.renderPageScreenshotAtWidth(
      parser,
      pageRenderPlan.pageNumber,
      retryRenderWidth,
    );

    if (!this.isWithinImageLimit(resizedScreenshot, pdfOcrConfig.maxImageDimension)) {
      throw new BadRequestException(
        this.buildImageLimitError(
          pageRenderPlan,
          resizedScreenshot,
          pdfOcrConfig.maxImageDimension,
        ),
      );
    }

    return resizedScreenshot;
  }

  private async renderPageScreenshotAtWidth(
    parser: PDFParse,
    pageNumber: number,
    renderWidth: number,
  ): Promise<Screenshot> {
    const screenshotResult = await parser.getScreenshot({
      desiredWidth: renderWidth,
      imageBuffer: true,
      imageDataUrl: false,
      partial: [pageNumber],
    });
    const screenshot = screenshotResult.pages[0];

    if (!screenshot) {
      throw new BadRequestException(`PDF page ${pageNumber} could not be rendered for OCR`);
    }

    return screenshot;
  }

  private isWithinImageLimit(screenshot: Screenshot, maxImageDimension: number): boolean {
    return (
      Math.ceil(screenshot.width) <= maxImageDimension &&
      Math.ceil(screenshot.height) <= maxImageDimension
    );
  }

  private getRetryRenderWidth(
    renderWidth: number,
    screenshot: Screenshot,
    maxImageDimension: number,
  ): number {
    const largestDimension = Math.max(screenshot.width, screenshot.height);

    if (!this.isPositiveFiniteNumber(largestDimension)) {
      return renderWidth;
    }

    const targetDimension = Math.max(1, maxImageDimension - dimensionSafetyMargin);

    return Math.max(1, Math.floor(renderWidth * (targetDimension / largestDimension)));
  }

  private buildImageLimitError(
    pageRenderPlan: PdfPageRenderPlan,
    screenshot: Screenshot,
    maxImageDimension: number,
  ): string {
    const renderedWidth = Math.ceil(screenshot.width);
    const renderedHeight = Math.ceil(screenshot.height);
    const pageSize =
      pageRenderPlan.pageWidth && pageRenderPlan.pageHeight
        ? ` from source page ${Math.round(pageRenderPlan.pageWidth)}x${Math.round(
            pageRenderPlan.pageHeight,
          )}`
        : '';

    return [
      `PDF page ${pageRenderPlan.pageNumber} rendered as ${renderedWidth}x${renderedHeight}`,
      `exceeding PDF_OCR_MAX_IMAGE_DIMENSION=${maxImageDimension}${pageSize}.`,
      'Lower PDF_OCR_RENDER_WIDTH or increase PDF_OCR_MAX_IMAGE_DIMENSION for the selected OCR provider.',
    ].join(' ');
  }

  private getMaxRenderedWidth(screenshots: Screenshot[]): number {
    return screenshots.reduce(
      (maxWidth, screenshot) => Math.max(maxWidth, Math.ceil(screenshot.width)),
      0,
    );
  }

  private isPositiveFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  private async extractPageText(
    screenshot: Screenshot,
    context: DocumentParserContext,
  ): Promise<{ pageNumber: number; text: string }> {
    const pageNumber = screenshot.pageNumber;

    try {
      const result = await this.multimodalProvider.extract({
        buffer: Buffer.from(screenshot.data),
        filename: `${context.title} page ${pageNumber}.png`,
        mimeType: 'image/png',
        size: screenshot.data.byteLength,
        type: 'IMAGE',
      });
      const text = result.extractedText.trim();

      if (!text) {
        throw new Error('OCR provider returned empty text');
      }

      return {
        pageNumber,
        text,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR failed';

      throw new BadRequestException(`PDF OCR failed on page ${pageNumber}: ${message}`);
    }
  }

  private buildOcrMarkdown(
    title: string,
    pageTexts: Array<{ pageNumber: number; text: string }>,
  ): string {
    const lines = [`# ${title}`];

    for (const pageText of pageTexts) {
      lines.push('', `## Page ${pageText.pageNumber}`, '', pageText.text.trim());
    }

    return lines.join('\n').trim();
  }

  private hasReadableText(text: string): boolean {
    return this.toReadableText(text).length >= this.configService.getPdfOcrConfig().minTextLength;
  }

  private toReadableText(text: string): string {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !pageMarkerPattern.test(line))
      .join('\n')
      .trim();
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array<R>(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(Math.max(1, concurrency), items.length);

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
          const currentIndex = nextIndex;

          nextIndex += 1;
          results[currentIndex] = await mapper(items[currentIndex]);
        }
      }),
    );

    return results;
  }
}
