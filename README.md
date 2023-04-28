```bash
pnpm i
cd package
pnpm build
cd examples/demo-js
pnpm link <path-to-forge-exec>
PATH=node_modules/forge-exec/bin:$PATH forge test
```