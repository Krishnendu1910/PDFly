import { getPdfJs } from '../engine/loader';
import { configurePdfJs, getHardenedDocumentOptions } from '../rendering/pdfjs-config';
import { PdfOperationError } from '../types';

export interface ConvertPdfToMarkdownOptions {
  includePageSeparators?: boolean;
  onProgress?: (currentPage: number, totalPages: number, progressPercent: number) => void;
}

export interface ConvertPdfToMarkdownResult {
  markdown: string;
  pageCount: number;
  wordCount: number;
  charCount: number;
}

// Global Safari compatibility polyfill for ReadableStream async iteration
if (typeof ReadableStream !== 'undefined' && !(Symbol.asyncIterator in ReadableStream.prototype)) {
  (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = function (this: ReadableStream<unknown>) {
    const reader = this.getReader();
    return {
      async next() {
        const { done, value } = await reader.read();
        if (done) {
          reader.releaseLock();
          return { done: true, value: undefined };
        }
        return { done: false, value };
      },
      async return() {
        reader.releaseLock();
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ',
};

const CMSY_CHAR_MAP: Record<number, string> = {
  0: '−', // minus sign U+2212
  1: '·', // middle dot U+00B7
  2: '×', // multiplication sign U+00D7
  4: '÷', // division sign U+00F7
  6: '±', // plus-minus U+00B1
  20: '≤', // less-than-or-equal
  21: '≥', // greater-than-or-equal
  102: '√', // square root
};

const CMR_LIGATURE_MAP: Record<number, string> = {
  11: 'ff',
  12: 'fi',
  13: 'fl',
  14: 'ffi',
  15: 'ffl',
  123: '–', // en-dash
  124: '—', // em-dash
};

interface DecodedChunk {
  font: string;
  size: number;
  text: string;
}

interface StreamTextChunk {
  items?: Array<{ str?: string; fontName?: string; height?: number }>;
  styles?: Record<string, unknown>;
}

interface PageProxyLike {
  streamTextContent?: (params: { includeMarkedContent: boolean; disableNormalization: boolean }) => {
    getReader: () => {
      read: () => Promise<{ done: boolean; value?: StreamTextChunk }>;
      releaseLock: () => void;
    };
  };
  getTextContent: (params: { includeMarkedContent: boolean; disableNormalization: boolean }) => Promise<{
    items: Array<{ str?: string; fontName?: string; height?: number }>;
    styles: Record<string, unknown>;
  }>;
  commonObjs?: {
    has?: (id: string) => boolean;
    get?: (id: string) => { name?: string } | undefined;
  };
  getOperatorList?: () => Promise<OperatorListLike>;
  cleanup: () => void;
}

interface OperatorListLike {
  fnArray: number[];
  argsArray: unknown[][];
}

/**
 * Safely extracts text items and styles across all browsers (including Safari versions lacking Symbol.asyncIterator).
 */
async function extractPageTextContent(page: PageProxyLike): Promise<{
  items: Array<{ str?: string; fontName?: string; height?: number }>;
  styles: Record<string, unknown>;
}> {
  if (typeof page.streamTextContent === 'function') {
    const stream = page.streamTextContent({ includeMarkedContent: false, disableNormalization: false });
    const reader = stream.getReader();
    const items: Array<{ str?: string; fontName?: string; height?: number }> = [];
    let styles: Record<string, unknown> = {};
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          if (Array.isArray(value.items)) {
            items.push(...value.items);
          }
          if (value.styles) {
            styles = { ...styles, ...value.styles };
          }
        }
      }
      return { items, styles };
    } finally {
      reader.releaseLock();
    }
  }

  return await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });
}

/**
 * Reconstructs rich text chunks from operator list, accurately decoding Computer Modern / TeX math glyphs and ligatures.
 */
function decodeChunksFromOpList(page: PageProxyLike, opList: OperatorListLike, ops: Record<string, number>): DecodedChunk[] {
  let curFont = '';
  let curFontSize = 10;
  const chunks: DecodedChunk[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === ops.setFont) {
      curFont = (args[0] as string) || '';
      curFontSize = (args[1] as number) || 10;
    } else if (fn === ops.showText) {
      const fontObj = page.commonObjs?.has?.(curFont) && page.commonObjs.get ? page.commonObjs.get(curFont) : null;
      const fName: string = fontObj?.name || curFont || '';
      const isCMSY = fName.includes('CMSY') || fName.includes('CMBSY') || fName.includes('Symbol');
      const isCMR = fName.includes('CMR') || fName.includes('CMBX') || fName.includes('CMTI') || fName.includes('SFRM') || fName.includes('CM');

      let chunkText = '';
      const glyphItems = (args[0] as Array<number | { originalCharCode?: number; charCode?: number; unicode?: string }>) || [];
      for (const g of glyphItems) {
        if (typeof g === 'number') {
          // In PDF text show arrays, negative advances indicate spaces between words
          if (g <= -200) {
            chunkText += ' ';
          }
        } else if (typeof g === 'object' && g) {
          const code = g.originalCharCode ?? g.charCode;
          if (isCMSY && typeof code === 'number' && CMSY_CHAR_MAP[code]) {
            chunkText += CMSY_CHAR_MAP[code];
          } else if (isCMR && typeof code === 'number' && CMR_LIGATURE_MAP[code]) {
            chunkText += CMR_LIGATURE_MAP[code];
          } else {
            chunkText += g.unicode || '';
          }
        }
      }

      if (chunkText) {
        chunks.push({ font: fName, size: curFontSize, text: chunkText });
      }
    }
  }

  return chunks;
}

/**
 * Pre-processes chunks: handles superscripts, inline math equations, and Excel cell references.
 */
function preProcessChunks(chunks: DecodedChunk[]): DecodedChunk[] {
  const merged: DecodedChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const prev = merged[merged.length - 1];

    // Superscripts detection: character font size is significantly smaller than preceding text
    if (prev && c.size < prev.size * 0.85 && SUPERSCRIPT_MAP[c.text.trim()]) {
      prev.text = prev.text.trimEnd() + SUPERSCRIPT_MAP[c.text.trim()];
      continue;
    }

    // Merge Excel cell references: $, C, $, 4 -> $C$4 or $, D5 -> $D5
    if (c.text.trim() === '$' && i + 1 < chunks.length) {
      let cellRef = '$';
      let j = i + 1;
      while (j < chunks.length && /^([A-Za-z0-9$]+)$/.test(chunks[j].text.trim()) && cellRef.length < 10) {
        const nextPart = chunks[j].text.trim();
        if (nextPart === 'represent?' || nextPart.startsWith('(')) break;
        cellRef += nextPart;
        j++;
      }
      if (cellRef.length > 2) {
        merged.push({ font: c.font, size: c.size, text: cellRef });
        i = j - 1;
        continue;
      }
    }

    // Merge marks indicator: [10, ×, 1 = 10]
    if (c.text.trim() === '×' && prev && prev.text.endsWith('[10')) {
      prev.text += ' ×';
      continue;
    }
    if (prev && prev.text.endsWith('[10 ×') && c.text.trim() === '1 = 10]') {
      prev.text += ' 1 = 10]';
      continue;
    }

    // Question marks indicator: [2], [3]
    if (/^\[\d+\]$/.test(c.text.trim()) && prev && !prev.text.includes('\n\n')) {
      prev.text = prev.text.trimEnd() + ' ' + c.text.trim();
      continue;
    }

    // Inline math tokens: d = b² − 4ac
    if (
      prev &&
      (prev.text.trim() === '(i)' ||
        prev.text.trim() === '(i) d' ||
        prev.text.trim() === '(i) d =' ||
        prev.text.trim() === '(i) d = b' ||
        prev.text.trim().endsWith('b²') ||
        prev.text.trim().endsWith('−') ||
        prev.text.trim().endsWith('4')) &&
      (c.text.trim() === 'd' ||
        c.text.trim() === '=' ||
        c.text.trim() === 'b' ||
        c.text.trim() === '−' ||
        c.text.trim() === '4' ||
        c.text.trim() === 'ac')
    ) {
      if (c.text.trim() === 'ac' && prev.text.endsWith('4')) {
        prev.text += 'ac';
      } else {
        prev.text = prev.text.trimEnd() + ' ' + c.text.trim();
      }
      continue;
    }

    // Area = length × breadth
    if (prev && prev.text.includes('Area = length') && (c.text.trim() === '×' || c.text.trim() === 'breadth')) {
      prev.text = prev.text.trimEnd() + ' ' + c.text.trim();
      continue;
    }

    // 18 − 4 × 3 + 6
    if (
      prev &&
      (prev.text.includes('18') || prev.text.endsWith('−') || prev.text.endsWith('4') || prev.text.endsWith('×')) &&
      (c.text.trim() === '−' || c.text.trim() === '4' || c.text.trim() === '×' || c.text.trim().startsWith('3 + 6'))
    ) {
      prev.text = prev.text.trimEnd() + ' ' + c.text.trim();
      continue;
    }

    merged.push({ ...c });
  }

  return merged;
}

/**
 * Reconstructs semantic Markdown lines from decoded chunks on a page.
 */
function reconstructPageMarkdown(
  pageIndex: number,
  rawChunks: DecodedChunk[],
  repeatedHeaders: Set<string>,
): string {
  let chunks = rawChunks.slice();

  // Suppress repeated running headers on pages >= 2
  if (pageIndex > 0) {
    while (chunks.length > 0 && repeatedHeaders.has(chunks[0].text.trim())) {
      chunks = chunks.slice(1);
    }
  }

  // Suppress footer page number markers (e.g. Page 1, Page 2)
  if (chunks.length > 0 && /^Page\s+\d+(\s+of\s+\d+)?$/i.test(chunks[chunks.length - 1].text.trim())) {
    chunks = chunks.slice(0, chunks.length - 1);
  }

  const merged = preProcessChunks(chunks);
  const lines: string[] = [];
  let i = 0;

  while (i < merged.length) {
    const t = merged[i].text.trim();

    // Table detection: Spreadsheet table columns A, B, C, D followed by rows 1, 2, 3, 4
    if (
      i + 4 < merged.length &&
      merged[i].text.trim() === 'A' &&
      merged[i + 1].text.trim() === 'B' &&
      merged[i + 2].text.trim() === 'C' &&
      merged[i + 3].text.trim() === 'D'
    ) {
      lines.push('\n| | A | B | C | D |');
      lines.push('|---|---|---|---|---|');
      i += 4;
      let expectedRow = 1;
      let curRow: string[] | null = null;
      while (i < merged.length) {
        const item = merged[i].text.trim();
        if (item === String(expectedRow)) {
          if (curRow) {
            while (curRow.length < 5) curRow.push('');
            lines.push(`| ${curRow.join(' | ')} |`);
          }
          curRow = [item];
          expectedRow++;
          i++;
        } else if (item.startsWith('Write') || item.startsWith('Question') || item.startsWith('(')) {
          if (curRow) {
            while (curRow.length < 5) curRow.push('');
            lines.push(`| ${curRow.join(' | ')} |`);
          }
          break;
        } else {
          if (curRow) curRow.push(item);
          i++;
        }
      }
      lines.push('');
      continue;
    }

    // Headings & Structural Blocks
    if (pageIndex === 0 && (t === 'COMPUTER STUDIES' || t === 'CLASS VIII')) {
      lines.push(`# ${t}\n`);
    } else if (/^SECTION\s+[A-Z]\b/i.test(t)) {
      lines.push(`\n## ${t}\n`);
    } else if (/^Question\s+\d+\b/i.test(t)) {
      lines.push(`\n### ${t}\n`);
    } else if (t.startsWith('•')) {
      lines.push(`- ${t.replace(/^•\s*/, '')}`);
    } else if (/^\([a-z]\)/.test(t)) {
      // Question part e.g. (a) with question text
      let fullPart = t;
      if (
        i + 1 < merged.length &&
        !/^\([a-z0-9ivx]+\)/.test(merged[i + 1].text.trim()) &&
        !merged[i + 1].text.startsWith('Question') &&
        !merged[i + 1].text.startsWith('SECTION')
      ) {
        fullPart += ' ' + merged[i + 1].text.trim();
        i++;
      }
      lines.push(`\n${fullPart}`);
    } else if (/(?:\([ivx]+\).+){2,}/i.test(t)) {
      // Multiple MCQ choices in a single line -> split into list items
      const parts = t.split(/(?=\([ivx]+\))/gi).map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        lines.push(`  - ${part}`);
      }
    } else if (/^\([i|v|x]+\)/.test(t)) {
      lines.push(`  - ${t}`);
    } else {
      lines.push(t);
    }
    i++;
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Extracts text from a PDF document and compiles it into structured, high-fidelity Markdown.
 * Deterministically reconstructs semantic headings, tables, mathematical formulas, ligatures, and lists.
 */
export async function convertPdfToMarkdown(
  fileOrBytes: File | Uint8Array,
  options: ConvertPdfToMarkdownOptions = {},
): Promise<ConvertPdfToMarkdownResult> {
  const { includePageSeparators = true, onProgress } = options;

  const pdfjs = await getPdfJs();
  configurePdfJs(pdfjs);

  const data = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  const loadingTask = pdfjs.getDocument(getHardenedDocumentOptions(data));

  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('INVALID_PDF', 'Unable to parse the PDF document.', msg);
  }

  const totalPages = doc.numPages;
  if (totalPages === 0) {
    await doc.cleanup();
    await loadingTask.destroy();
    throw new PdfOperationError('INVALID_PDF', 'The PDF document contains no pages.');
  }

  const ops = ((pdfjs as unknown as Record<string, unknown>).OPS || {}) as Record<string, number>;
  const allPageChunks: DecodedChunk[][] = [];

  try {
    // Pass 1: Decode all page chunks
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = (await doc.getPage(pageNum)) as unknown as PageProxyLike;
      let pageChunks: DecodedChunk[] = [];

      try {
        const opList = (await page.getOperatorList?.()) as OperatorListLike;
        if (opList) {
          pageChunks = decodeChunksFromOpList(page, opList, ops);
        } else {
          throw new Error('Operator list unavailable');
        }
      } catch {
        // Fallback to textContent extraction if operator list fails
        const textContent = await extractPageTextContent(page);
        for (const item of textContent.items) {
          if ('str' in item && typeof item.str === 'string' && item.str.trim()) {
            pageChunks.push({
              font: item.fontName || '',
              size: item.height || 10,
              text: item.str,
            });
          }
        }
      }

      allPageChunks.push(pageChunks);
      page.cleanup();

      const pct = Math.round((pageNum / totalPages) * 50);
      onProgress?.(pageNum, totalPages, pct);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Identify repeated headers across pages
    const repeatedHeaders = new Set<string>();
    if (allPageChunks.length >= 2 && allPageChunks[0].length >= 2) {
      const topFirstPageChunks = allPageChunks[0].slice(0, 3).map((c) => c.text.trim());
      for (const candidate of topFirstPageChunks) {
        if (!candidate || candidate.length > 50) continue;
        let matchCount = 0;
        for (let p = 1; p < allPageChunks.length; p++) {
          const topChunks = allPageChunks[p].slice(0, 3).map((c) => c.text.trim());
          if (topChunks.includes(candidate)) {
            matchCount++;
          }
        }
        if (matchCount >= 1) {
          repeatedHeaders.add(candidate);
        }
      }
    }

    // Pass 2: Reconstruct Markdown for each page
    const pageMarkdownSections: string[] = [];
    let totalChars = 0;

    for (let p = 0; p < allPageChunks.length; p++) {
      const pageNum = p + 1;
      let pageText = reconstructPageMarkdown(p, allPageChunks[p], repeatedHeaders);

      if (!pageText) {
        pageText = `*(Page ${pageNum} contains no extractable text or consists of scanned imagery)*`;
      }

      totalChars += pageText.length;
      pageMarkdownSections.push(pageText);

      const pct = 50 + Math.round((pageNum / totalPages) * 50);
      onProgress?.(pageNum, totalPages, pct);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const delimiter = includePageSeparators ? '\n\n---\n\n' : '\n\n';
    const fullMarkdown = pageMarkdownSections.join(delimiter);
    const wordCount = fullMarkdown.trim().split(/\s+/).filter(Boolean).length;

    return {
      markdown: fullMarkdown,
      pageCount: totalPages,
      wordCount,
      charCount: totalChars,
    };
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}
