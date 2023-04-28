import {defineConfig} from 'tsup';
import fs from 'node:fs';

export default defineConfig({
	async onSuccess() {
		if (fs.existsSync('dist/cjs/')) {
			fs.writeFileSync('dist/cjs/package.json', `{"type": "commonjs"}`);
		}
		if (fs.existsSync('dist/esm/')) {
			fs.writeFileSync('dist/esm/package.json', `{"type": "module"}`);
		}
	},
});
