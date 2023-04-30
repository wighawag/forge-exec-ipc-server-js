import {ExecuteReturnResult, ReverseIPCProvider} from './ReverseIPCProvider';
import { log_msg } from './log';
import {Forge} from './types';

const args = process.argv.slice(2);
const lastArg = args[args.length - 1];
let socketID: string | undefined;
if (lastArg.startsWith('ipc:')) {
	socketID = lastArg.slice(4);
}

if (!socketID) {
	throw new Error(`no sockerID specified`);
}

log_msg(`!!! pid: ${process.pid}`);

log_msg(`socketID: ${socketID}`);
log_msg(`args: "${args.join('" "')}"`);



export function execute<T extends ExecuteReturnResult>(func: (forge: Forge) => T | Promise<T>) {
	const provider = new ReverseIPCProvider(func, socketID);
	provider.serve();
}
