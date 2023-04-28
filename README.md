```bash
pnpm i
cd package
pnpm build
cd ..
cd examples/demo-js

# we do not use submodule so we install forge here:
forge install --no-git foundry-rs/forge-std#

# we need this as we do not want to go through node to execute it
PATH=node_modules/forge-exec/bin:$PATH forge test
```