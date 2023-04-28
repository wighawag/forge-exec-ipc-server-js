```bash
pnpm i
cd package
pnpm build
cd examples/demo-js

# we need this as we do not want to go through node to execute it
PATH=node_modules/forge-exec/bin:$PATH forge test
```