export function normalizeMultilineText(value: string): string {
  return value.normalize('NFC').trim().replace(/\r\n?/g, '\n');
}
