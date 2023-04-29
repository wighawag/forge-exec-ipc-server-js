import { execute } from "forge-exec-ipc-server";
import { encodeDeployData, encodeFunctionData } from 'viem';

import Counter from './contracts/Counter.sol:Counter.js';

execute(async (forge) => {
  const counter = await forge.create({
    from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    data:encodeDeployData(Counter)
  });

  await forge.call({
    from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    to: counter,
    data: encodeFunctionData({...Counter, functionName: 'setNumber', args: [42n]})
  });

  return {
    types: [{
      type: "address",
    },{
      type: "address",
    },{
      type: "address",
    }],
    values: [counter, counter, counter],
  };
});
