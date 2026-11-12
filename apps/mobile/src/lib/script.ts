export type Script = 'latin' | 'sinhala' | 'tamil';

const SINHALA = /[඀-෿]/;
const TAMIL = /[஀-௿]/;

/** Picks the script a string is written in, so text renders in a font that has its glyphs. */
export function detectScript(text: string): Script {
  if (SINHALA.test(text)) return 'sinhala';
  if (TAMIL.test(text)) return 'tamil';
  return 'latin';
}
