
# Run the example:

## Install

```bash
cd examples/demo-js
```

```bash
# install forge-exec and forge-exec-ipc-client as npm package
pnpm i

# build forge-exec-ipc-server
pnpm build --filter forge-exec-ipc-server

# install forge-std (we use --no-git as we do not use submodule)
forge install --no-git foundry-rs/forge-std

# compile contract with generated ts
pnpm compile
```

## Run

Simply do :

```bash
pnpm test
```

Note that if you want to use `forge test` you need to make sure [forge-exec-ipc-client](https://github.com/wighawag/forge-exec/tree/main/forge-exec-ipc-client)'s binary is in the path (see [release files](https://github.com/wighawag/forge-exec/releases/tag/forge-exec-ipc-client-v0.1.0))

In this repo since the npm package [forge-exec-ipc-client](https://www.npmjs.com/package/forge-exec-ipc-client) is installed as dependency, we can do the following

```bash
PATH=node_modules/.bin:$PATH forge test
```
