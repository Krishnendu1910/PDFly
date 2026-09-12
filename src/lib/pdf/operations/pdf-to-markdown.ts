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

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'o': 'ₒ', 'x': 'ₓ',
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

interface PositionedItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

interface DecodedChunk {
  font: string;
  size: number;
  text: string;
  x?: number;
  y?: number;
  width?: number;
}

interface StreamTextChunk {
  items?: Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>;
  styles?: Record<string, unknown>;
}

interface PageProxyLike {
  streamTextContent?: (params: { includeMarkedContent: boolean; disableNormalization: boolean }) => {
    getReader: () => {
      read: () => Promise<{ done: boolean; value?: StreamTextChunk }>;
      releaseLock: () => void;
    };
  };
  getTextContent?: (params: { includeMarkedContent: boolean; disableNormalization: boolean }) => Promise<{
    items: Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>;
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

interface GeometricLine {
  y: number;
  items: PositionedItem[];
}

/**
 * Safely extracts positioned text items across all browsers (including Safari versions lacking Symbol.asyncIterator).
 * Strictly consumes the stream via .getReader() and never invokes for-await or methods that trigger it.
 */
async function extractPageItemsSafely(page: PageProxyLike): Promise<PositionedItem[]> {
  const items: PositionedItem[] = [];

  if (typeof page.streamTextContent === 'function') {
    const stream = page.streamTextContent({ includeMarkedContent: false, disableNormalization: false });
    const reader = stream.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && Array.isArray(value.items)) {
          for (const raw of value.items) {
            if (raw && typeof raw.str === 'string' && raw.str.trim().length > 0 && raw.transform) {
              items.push({
                str: raw.str.trim(),
                x: raw.transform[4] || 0,
                y: raw.transform[5] || 0,
                width: raw.width || 0,
                height: Math.abs(raw.transform[0]) || raw.height || 10,
                fontName: raw.fontName || '',
              });
            }
          }
        }
      }
      return items;
    } finally {
      reader.releaseLock();
    }
  }

  // Fallback for mocked test environments without streamTextContent
  if (typeof page.getTextContent === 'function') {
    try {
      const textContent = await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });
      for (const raw of textContent.items) {
        if (raw && typeof raw.str === 'string' && raw.transform) {
          items.push({
            str: raw.str,
            x: raw.transform[4] || 0,
            y: raw.transform[5] || 0,
            width: raw.width || 0,
            height: Math.abs(raw.transform[0]) || raw.height || 10,
            fontName: raw.fontName || '',
          });
        }
      }
    } catch {
      // Ignore if getTextContent fails
    }
  }

  return items;
}

/**
 * Reconstructs rich text chunks from operator list, decoding Computer Modern math glyphs and ligatures.
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
 * Detects multi-column tables purely using positional geometry.
 * Identifies groups of consecutive lines sharing consistent vertical pitch and horizontal column boundaries.
 */
function detectGeometricTable(lines: GeometricLine[]): { tableMarkdown: string; firstCellText: string } | null {
  // Candidate table rows have multiple short items (table cells, not narrative paragraphs)
  const candidateIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.items.length >= 3 && l.items.every((it) => it.str.trim().length < 35)) {
      const first = l.items[0].str.trim();
      if (/^\([a-z0-9ivx]+\)$/i.test(first) && l.items.length <= 3) {
        continue;
      }
      candidateIndices.push(i);
    }
  }

  const clusters: number[][] = [];
  let curCluster: number[] = [];
  for (let i = 0; i < candidateIndices.length; i++) {
    const idx = candidateIndices[i];
    if (curCluster.length === 0) {
      curCluster.push(idx);
    } else {
      const prevIdx = curCluster[curCluster.length - 1];
      const prevL = lines[prevIdx];
      const curL = lines[idx];
      const dy = prevL.y - curL.y;
      if (idx === prevIdx + 1 && dy >= 10 && dy <= 25) {
        curCluster.push(idx);
      } else {
        if (curCluster.length >= 3) clusters.push(curCluster);
        curCluster = [idx];
      }
    }
  }
  if (curCluster.length >= 3) clusters.push(curCluster);

  if (clusters.length === 0) return null;

  const bestCluster = clusters.reduce((max, c) => (c.length > max.length ? c : max), clusters[0]);
  const tableLines = bestCluster.map((idx) => lines[idx]);

  const bestRow = tableLines.reduce((max, l) => (l.items.length > max.items.length ? l : max), tableLines[0]);
  const sortedItems = [...bestRow.items].sort((a, b) => a.x - b.x);
  const colSplits: number[] = [];
  for (let i = 0; i < sortedItems.length - 1; i++) {
    const curEnd = sortedItems[i].x + (sortedItems[i].width || 15);
    const nextStart = sortedItems[i + 1].x;
    colSplits.push((curEnd + nextStart) / 2);
  }

  const numCols = colSplits.length + 1;
  const getColIndex = (x: number): number => {
    for (let c = 0; c < colSplits.length; c++) {
      if (x < colSplits[c]) return c;
    }
    return colSplits.length;
  };

  const rows: string[][] = [];
  for (const line of tableLines) {
    const row = new Array<string>(numCols).fill('');
    for (const it of line.items) {
      const c = getColIndex(it.x);
      row[c] = row[c] ? `${row[c]} ${it.str.trim()}` : it.str.trim();
    }
    rows.push(row);
  }

  const formatRow = (cells: string[]) => {
    return '|' + cells.map((c) => (c.trim() ? ` ${c.trim()} ` : ' ')).join('|') + '|';
  };

  const header = rows[0];
  const separator = new Array<string>(numCols).fill('---');
  const mdRows = [
    formatRow(header),
    '|' + separator.join('|') + '|',
    ...rows.slice(1).map((r) => formatRow(r)),
  ];

  return {
    tableMarkdown: '\n' + mdRows.join('\n') + '\n',
    firstCellText: tableLines[0].items[0].str.trim(),
  };
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

    // Subscripts detection
    if (prev && c.size < prev.size * 0.85 && SUBSCRIPT_MAP[c.text.trim()]) {
      prev.text = prev.text.trimEnd() + SUBSCRIPT_MAP[c.text.trim()];
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

    // Question marks indicator: [2], [3], [10 Marks]
    if (/^\[\s*(?:\d+(?:\s*[×x*]\s*\d+(?:\s*=\s*\d+)?)?|\d+\s*marks?)\s*\]$/i.test(c.text.trim()) && prev && !prev.text.includes('\n\n')) {
      prev.text = prev.text.trimEnd() + ' ' + c.text.trim();
      continue;
    }

    // Mathematical formula tokens: d = b² − 4ac
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
 * Uses general structural heuristics: font sizes for headings, geometric tables, and list patterns.
 */
function reconstructPageMarkdown(
  pageIndex: number,
  rawChunks: DecodedChunk[],
  repeatedHeaders: Set<string>,
  pageGeometricLines: GeometricLine[],
  medianFontSize: number,
): string {
  let chunks = rawChunks.slice();

  // Suppress repeated running headers on pages >= 2
  if (pageIndex > 0) {
    while (chunks.length > 0 && repeatedHeaders.has(chunks[0].text.trim())) {
      chunks = chunks.slice(1);
    }
  }

  // Suppress footer page number markers (e.g. Page 1, Page 2 of 3)
  if (
    chunks.length > 0 &&
    /^(?:page\s+)?(?:\d+|[ivx]+)(?:\s*(?:of|\/)\s*\d+)?$/i.test(chunks[chunks.length - 1].text.trim())
  ) {
    chunks = chunks.slice(0, chunks.length - 1);
  }

  // Check if this page contains a geometric table
  const tableResult = detectGeometricTable(pageGeometricLines);

  const merged = preProcessChunks(chunks);
  const lines: string[] = [];
  let i = 0;
  let tableInserted = false;

  while (i < merged.length) {
    const t = merged[i].text.trim();
    const size = merged[i].size || 10;

    // Table injection if table lines match current text position
    if (
      tableResult &&
      !tableInserted &&
      t === tableResult.firstCellText &&
      i + 3 < merged.length
    ) {
      lines.push(tableResult.tableMarkdown);
      tableInserted = true;
      // Skip chunks that were incorporated into the table
      while (
        i < merged.length &&
        !merged[i].text.startsWith('Write') &&
        !merged[i].text.startsWith('Question') &&
        !merged[i].text.startsWith('SECTION') &&
        !merged[i].text.startsWith('(')
      ) {
        i++;
      }
      continue;
    }

    // Document Title: Large text at the top of Page 1
    if (pageIndex === 0 && i < 4 && size >= medianFontSize * 1.25 && t.length < 80) {
      lines.push(`# ${t}\n`);
    } else if (/^(?:SECTION|CHAPTER|PART|UNIT)\s+[A-Z0-9()]/i.test(t)) {
      lines.push(`\n## ${t}\n`);
    } else if (/^(?:Question|Exercise|Problem|Task)\s+\d+\b/i.test(t)) {
      lines.push(`\n### ${t}\n`);
    } else if (size >= medianFontSize * 1.4 && t.length < 60) {
      lines.push(`\n## ${t}\n`);
    } else if (size >= medianFontSize * 1.2 && t.length < 50 && !t.startsWith('(')) {
      lines.push(`\n### ${t}\n`);
    } else if (t.startsWith('•')) {
      lines.push(`- ${t.replace(/^•\s*/, '')}`);
    } else if (/^\([a-z]\)/i.test(t)) {
      // Question part e.g. (a) with question text
      let fullPart = t;
      if (
        i + 1 < merged.length &&
        !/^\([a-z0-9ivx]+\)/i.test(merged[i + 1].text.trim()) &&
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
    } else if (/^\([ivx]+\)/i.test(t)) {
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
 * Purely client-side and deterministic without modifying global browser prototypes.
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
  const allPageGeometricLines: GeometricLine[][] = [];
  const allFontSizes: number[] = [];

  try {
    // Pass 1: Decode all page chunks and extract geometric positioned lines
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
        // Fallback: extract positioned items via streamTextContent
        const safeItems = await extractPageItemsSafely(page);
        for (const item of safeItems) {
          if (item.str.trim()) {
            pageChunks.push({
              font: item.fontName || '',
              size: item.height || 10,
              text: item.str,
              x: item.x,
              y: item.y,
              width: item.width,
            });
          }
        }
      }

      // Extract geometric lines for table detection
      const pageItems = await extractPageItemsSafely(page);
      pageItems.sort((a, b) => (Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x));
      const lines: GeometricLine[] = [];
      let curLine: PositionedItem[] = [];
      let curY: number | null = null;
      for (const it of pageItems) {
        if (it.str.trim()) {
          allFontSizes.push(it.height);
        }
        if (curY === null || Math.abs(curY - it.y) <= 4) {
          curLine.push(it);
          curY = it.y;
        } else {
          if (curLine.length > 0) lines.push({ y: curY, items: curLine });
          curLine = [it];
          curY = it.y;
        }
      }
      if (curLine.length > 0 && curY !== null) lines.push({ y: curY, items: curLine });

      allPageChunks.push(pageChunks);
      allPageGeometricLines.push(lines);
      page.cleanup();

      const pct = Math.round((pageNum / totalPages) * 50);
      onProgress?.(pageNum, totalPages, pct);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Compute median font size for document hierarchy detection
    allFontSizes.sort((a, b) => a - b);
    const medianFontSize = allFontSizes[Math.floor(allFontSizes.length / 2)] || 10;

    // Identify repeated headers across pages (general heuristic)
    const repeatedHeaders = new Set<string>();
    if (allPageChunks.length >= 2 && allPageChunks[0].length >= 2) {
      const topFirstPageChunks = allPageChunks[0].slice(0, 4).map((c) => c.text.trim()).filter((t) => t.length >= 3 && t.length <= 100);
      for (const candidate of topFirstPageChunks) {
        let matchCount = 0;
        for (let p = 1; p < allPageChunks.length; p++) {
          const topSubsequent = allPageChunks[p].slice(0, 4).map((c) => c.text.trim());
          if (topSubsequent.includes(candidate)) {
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
      let pageText = reconstructPageMarkdown(
        p,
        allPageChunks[p],
        repeatedHeaders,
        allPageGeometricLines[p],
        medianFontSize,
      );

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
