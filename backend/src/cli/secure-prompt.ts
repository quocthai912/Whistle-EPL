import { StringDecoder } from 'node:string_decoder';
import type { Readable, Writable } from 'node:stream';

type TerminalInput = Readable & {
  isTTY?: boolean;
  isRaw?: boolean;
  setRawMode?: (mode: boolean) => unknown;
};
export async function readSecret(
  input: TerminalInput = process.stdin,
  output: Writable = process.stdout,
): Promise<string> {
  if (!input.isTTY || !input.setRawMode)
    throw new Error('Interactive protected terminal required.');
  return new Promise((resolve, reject) => {
    const previousRaw = input.isRaw ?? false;
    const decoder = new StringDecoder('utf8');
    let value = '';
    const finish = (error?: Error) => {
      input.removeListener('data', data);
      input.removeListener('end', ended);
      input.removeListener('error', failed);
      input.setRawMode!(previousRaw);
      input.pause();
      output.write('\n');
      const result = value;
      value = '';
      if (error) reject(error);
      else resolve(result);
    };
    const ended = () => finish(new Error('Credential input interrupted.'));
    const failed = () => finish(new Error('Credential input failed.'));
    const data = (chunk: Buffer) => {
      for (const character of decoder.write(chunk)) {
        if (character === '\u0003' || character === '\u0004' || character === '\u001b') {
          finish(new Error('Credential input cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') value = [...value].slice(0, -1).join('');
        else value += character;
        if ([...value].length > 128) {
          finish(new Error('Credential exceeds maximum length.'));
          return;
        }
      }
    };
    output.write('Temporary password (hidden): ');
    input.setRawMode!(true);
    input.on('data', data).once('end', ended).once('error', failed);
    input.resume();
  });
}
