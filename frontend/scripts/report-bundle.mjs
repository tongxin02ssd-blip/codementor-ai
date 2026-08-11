import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const distPath = resolve('dist');
const html = readFileSync(resolve(distPath, 'index.html'), 'utf8');
const entryMatch = html.match(/<script[^>]+src="([^"]+\.js)"/);
if (!entryMatch) throw new Error('Unable to find the production entry script in dist/index.html.');
const entryPath = resolve(distPath, entryMatch[1].replace(/^\//, ''));
const jsFiles = readdirSync(resolve(distPath, 'assets')).filter((file) => file.endsWith('.js'));
const entryBuffer = readFileSync(entryPath);
const report = {
  entryFile: entryPath.replace(`${distPath}\\`, ''),
  entryBytes: entryBuffer.byteLength,
  entryGzipBytes: gzipSync(entryBuffer).byteLength,
  totalJavaScriptBytes: jsFiles.reduce((total, file) => total + statSync(resolve(distPath, 'assets', file)).size, 0),
  javascriptChunkCount: jsFiles.length,
};
console.log(JSON.stringify(report, null, 2));
