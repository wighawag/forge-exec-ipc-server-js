```bash
pnpm i
cd package
pnpm build
cd ..
cd examples/demo-js

# we do not use submodule so we install forge here:
forge install --no-git foundry-rs/forge-std

# you can now execute your test
pnpm test

# Note that if you want to use forge directly, you'll need to make sure theforge-exec-ipc-client is in your path
# you can do the following:

PATH=node_modules/.bin:$PATH forge test
```
