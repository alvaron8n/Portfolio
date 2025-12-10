/**
 * Sistema de Comparación de Texto (Diff)
 *
 * Permite comparar versiones de texto para mostrar
 * qué cambios ha realizado la IA.
 */

export interface DiffSegment {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

export interface DiffResult {
  segments: DiffSegment[];
  addedCount: number;
  removedCount: number;
  changedPercentage: number;
}

/**
 * Comparar dos textos y generar diff
 * Implementación simple basada en palabras
 */
export function compareTexts(original: string, modified: string): DiffResult {
  const originalWords = tokenize(original);
  const modifiedWords = tokenize(modified);

  const lcs = longestCommonSubsequence(originalWords, modifiedWords);
  const segments = buildDiffSegments(originalWords, modifiedWords, lcs);

  // Contar cambios
  let addedCount = 0;
  let removedCount = 0;
  let totalOriginal = 0;

  segments.forEach(seg => {
    if (seg.type === 'added') addedCount += seg.text.split(/\s+/).length;
    if (seg.type === 'removed') removedCount += seg.text.split(/\s+/).length;
  });

  totalOriginal = originalWords.length || 1;
  const changedPercentage = Math.round(((addedCount + removedCount) / totalOriginal) * 100);

  return { segments, addedCount, removedCount, changedPercentage };
}

/**
 * Tokenizar texto en palabras, preservando espacios
 */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter(t => t.length > 0);
}

/**
 * Encontrar la subsecuencia común más larga (LCS)
 */
function longestCommonSubsequence(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Construir segmentos de diff a partir de LCS
 */
function buildDiffSegments(original: string[], modified: string[], lcs: number[][]): DiffSegment[] {
  const segments: DiffSegment[] = [];
  let i = original.length;
  let j = modified.length;

  const changes: { type: 'equal' | 'added' | 'removed'; text: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === modified[j - 1]) {
      changes.unshift({ type: 'equal', text: original[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      changes.unshift({ type: 'added', text: modified[j - 1] });
      j--;
    } else if (i > 0) {
      changes.unshift({ type: 'removed', text: original[i - 1] });
      i--;
    }
  }

  // Combinar segmentos consecutivos del mismo tipo
  let currentSegment: DiffSegment | null = null;

  changes.forEach(change => {
    if (currentSegment && currentSegment.type === change.type) {
      currentSegment.text += change.text;
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = { type: change.type, text: change.text };
    }
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Comparación simplificada por líneas
 */
export function compareByLines(original: string, modified: string): DiffResult {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  const segments: DiffSegment[] = [];
  let addedCount = 0;
  let removedCount = 0;

  const lcs = longestCommonSubsequence(originalLines, modifiedLines);

  let i = originalLines.length;
  let j = modifiedLines.length;

  const changes: { type: 'equal' | 'added' | 'removed'; text: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
      changes.unshift({ type: 'equal', text: originalLines[i - 1] + '\n' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      changes.unshift({ type: 'added', text: modifiedLines[j - 1] + '\n' });
      addedCount++;
      j--;
    } else if (i > 0) {
      changes.unshift({ type: 'removed', text: originalLines[i - 1] + '\n' });
      removedCount++;
      i--;
    }
  }

  // Combinar segmentos consecutivos
  let currentSegment: DiffSegment | null = null;
  changes.forEach(change => {
    if (currentSegment && currentSegment.type === change.type) {
      currentSegment.text += change.text;
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = { type: change.type, text: change.text };
    }
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }

  const totalLines = originalLines.length || 1;
  const changedPercentage = Math.round(((addedCount + removedCount) / totalLines) * 100);

  return { segments, addedCount, removedCount, changedPercentage };
}

/**
 * Renderizar segmento como clase CSS
 */
export function getSegmentClassName(type: DiffSegment['type']): string {
  switch (type) {
    case 'added':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    case 'removed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through';
    case 'equal':
    default:
      return '';
  }
}
