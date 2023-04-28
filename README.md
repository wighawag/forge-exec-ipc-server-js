```bash
pnpm i
cd package
pnpm build
cd examples/demo-js
chmod u+x node_modules/forge-exec/bin/forge-exec-ipc-client
PATH=node_modules/forge-exec/bin:$PATH forge test
```