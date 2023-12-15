import fs from 'fs';
import AdmZip from 'adm-zip';

const rootProject = 'common'
const zip = new AdmZip(`${rootProject}.zip`);
zip.extractAllTo('.');

if (!fs.existsSync('node_modules/.bin')) {
	fs.mkdirSync('node_modules/.bin');
}

fs.symlinkSync('../esbuild/bin/esbuild', 'node_modules/.bin/esbuild');
fs.chmodSync('node_modules/.bin/esbuild', 0o777);
