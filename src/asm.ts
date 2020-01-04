import { readFileSync } from 'fs';
import asmRaw from './asm-raw';
import { instantiateSync, ASUtil } from 'assemblyscript/lib/loader';

const compiled = instantiateSync(readFileSync(__dirname + '/../asm/sylvester.wasm'));

export const asm: ASUtil & typeof asmRaw = compiled as any;
