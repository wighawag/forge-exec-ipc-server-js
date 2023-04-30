import * as ipcModule from '@achrinza/node-ipc';
const ipc = ipcModule.default?.default || ipcModule.default || ipcModule; // fix issue with cjs
import {decodeAbiParameters, encodeAbiParameters} from 'viem';
import type {AbiParameter, AbiParametersToPrimitiveTypes, Narrow} from 'abitype';
import {Bytes32, BytesData, CallRequest, CallResponse, Create2Request, CreateRequest, Forge, SendRequest, StaticCallRequest} from './types';
import { FORGE_EXEC_LOGS, LOG_INFO, LOG_IPC_SERVER, log_error, log_msg } from './log';

const AddressZero = '0x0000000000000000000000000000000000000000';
const Bytes32Zero = '0x0000000000000000000000000000000000000000000000000000000000000000';

function exitProcess(errorCode?: number, alwaysInstant?: boolean) {
	try {
		ipc.server.stop();
	} catch (err) {
		log_error(err);
	}

	if (alwaysInstant || !FORGE_EXEC_LOGS) {
		process.exit(errorCode);
	} else {
		// give time for log to show up in log file
		setTimeout(() => process.exit(errorCode), 100);
		// process.exit(errorCode);
	}
}

process.on('uncaughtException', function (err) {
	log_error(err);
	try {
		ipc.server.stop();
	} catch (err) {
		log_error(err);
	}
	setTimeout(() => process.exit(1), 100);
});

export type ToDecode<TParams extends readonly AbiParameter[] | readonly unknown[]> = {
	types: Narrow<TParams>;
	values: TParams extends readonly AbiParameter[] ? AbiParametersToPrimitiveTypes<TParams> : never;
};
export type ExecuteReturnResult<TParams extends readonly AbiParameter[] | readonly unknown[] = AbiParameter[]> =
	| string
	| void
	| ToDecode<TParams>;

export type ExecuteFunction<T extends ExecuteReturnResult> = (forge: Forge) => T | Promise<T>;

type ResolveFunction<T = any> = (response: T) => void;

export type EncodedRequest = {type: number; data: `0x${string}`};

export type Handler<T> = {request: EncodedRequest; resolution: (v: string) => Promise<T>};

export type QueueElement<T> = {resolve: ResolveFunction<T>; handler: Handler<T>};

export class ReverseIPCProvider<T extends ExecuteReturnResult> {
	socketID: string;
	socket: any;
	resolveQueue: QueueElement<any>[] | undefined;
	timeout: NodeJS.Timeout | undefined;

	constructor(protected script: ExecuteFunction<T>, socketID: string) {
		this.socketID = socketID;
	}

	private onTimeout() {
		log_error(`!!! TIMEOUT`);
		exitProcess(1, true);
	}

	private stopTimeout() {
		clearTimeout(this.timeout);
	}
	private resetTimeout() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		// 20 second timeout
		// TODO config for debugging purpose might be useful
		this.timeout = setTimeout(this.onTimeout.bind(this), 20000);
	}

	serve() {
		// we start the timeout on start
		this.resetTimeout();

    if (LOG_INFO) {
      setInterval(() => log_msg(`!!! pid: ${process.pid}`), 20000);
    }

    if (LOG_IPC_SERVER) {
      ipc.config.logger = (...args) => log_msg(`!!!IPC`, ...args);
    } else {
      ipc.config.logger = () => {};
    }
		ipc.config.retry = 1500;
		ipc.config.rawBuffer = true;

		try {
			ipc.serve(this.socketID, this.onServing.bind(this));
			ipc.server.start();
		} catch (err) {
			log_msg(`!!!IPC ERROR`, err);
			exitProcess(1, true);
		}

		ipc.server.on('error', (err) => {
			log_msg(`!!!IPC ERROR`, err);
			exitProcess(1, true);
		});
	}

	private onServing() {
		log_msg(`!!! serving...`);
		ipc.server.on('data', this.onMessage.bind(this));
	}

	private abort(err: any) {
		log_error(`!!! AN ERROR HAPPEN IN THE SCRIPT`);
		log_error(`!!! ${err}`);
		exitProcess(1);
	}

	private returnResult(v: T) {
		log_error(`!!! THE SCRIPT ENDED WITH: ${JSON.stringify(v)}`);

		if (this.socket) {
			let data: `0x${string}` = '0x';
			if (v) {
				if (typeof v === 'string') {
					if (!v.startsWith('0x')) {
						throw new Error(
							`if you return a string, it needs to be an hex string (prepended with 0x) that represent abi encoded data.`
						);
					} else {
						data = v as `0x${string}`;
					}
				} else if (v.types && v.values) {
					data = encodeAbiParameters(v.types, v.values);
				} else {
					throw new Error(
						`If you do not return a string, you must return a {types, values} object that is used to abi encode.`
					);
				}
			}

			const request = encodeAbiParameters([{type: 'uint256'}, {type: 'bytes'}], [0n, data]);
			ipc.server.emit(this.socket, request + `\n`);
			exitProcess();
		} else {
			log_error(`!!! NO SOCKET`);
			exitProcess(1);
		}
	}

	private wrapHandler<T>(handler: Handler<T>) {
		const promise = new Promise<T>((resolve) => {
			this.resolveQueue.push({resolve, handler});
			if (this.resolveQueue.length == 1) {
				this.processPendingRequest();
			}
		});
		return promise;
	}

	private executeScript() {
		const self = this;
		const forge: Forge = {
			call(tx: CallRequest): Promise<CallResponse> {
				if (!tx.from) {
					throw new Error(`no from specified ${JSON.stringify(tx)}`);
				}
				const request = {
					data: encodeAbiParameters(
						[{type: 'bool'}, {type: 'address'}, {type: 'bytes'}, {type: 'address'}, {type: 'uint256'}],
						[
              tx.broadcast || false,
							tx.from || AddressZero,
							tx.data || '0x',
							tx.to || '0x0000000000000000000000000000000000000000',
							BigInt(tx.value || 0),
						]
					),
					type: 0xf1,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => {
						const result = decodeAbiParameters([{type: 'bool'}, {type: 'bytes'}], v as `0x${string}`);
						return {
							success: result[0],
							data: result[1],
						};
					},
				});
			},
      static_call(tx: StaticCallRequest): Promise<CallResponse> {
				if (!tx.from) {
					throw new Error(`no from specified ${JSON.stringify(tx)}`);
				}
				const request = {
					data: encodeAbiParameters(
						[{type: 'address'}, {type: 'bytes'}, {type: 'address'}],
						[
							tx.from || AddressZero,
							tx.data || '0x',
							tx.to || '0x0000000000000000000000000000000000000000'
						]
					),
					type: 0xfa,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => {
						const result = decodeAbiParameters([{type: 'bool'}, {type: 'bytes'}], v as `0x${string}`);
						return {
							success: result[0],
							data: result[1],
						};
					},
				});
			},
			create(create: CreateRequest): Promise<BytesData> {
				const request = {
					data: encodeAbiParameters(
						[{type: 'bool'}, {type: 'address'}, {type: 'bytes'}, {type: 'uint256'}],
						[create.broadcast || false, create.from || AddressZero, create.data || '0x', BigInt(create.value || 0)]
					),
					type: 0xf0,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => {
						// TODO handle normal tx
						if (v === AddressZero) {
							throw new Error(`Could not create contract`);
						}
						return v as BytesData;
					},
				});
			},
      create2(create: Create2Request): Promise<BytesData> {
				const request = {
					data: encodeAbiParameters(
						[{type: 'bool'}, {type: 'address'}, {type: 'bytes'}, {type: 'uint256'}, {type: 'bytes32'}],
						[create.broadcast || false, create.from || AddressZero, create.data || '0x', BigInt(create.value || 0), create.salt || Bytes32Zero]
					),
					type: 0xf5,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => {
						// TODO handle normal tx
						if (v === AddressZero) {
							throw new Error(`Could not create contract`);
						}
						return v as BytesData;
					},
				});
			},
      code(account: `0x${string}`): Promise<BytesData> {
				const request = {
					data: encodeAbiParameters([{type: 'address'}], [account]),
					type: 0x3c,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => v as BytesData,
				});
			},
      code_hash(account: `0x${string}`): Promise<Bytes32> {
        const request = {
					data: encodeAbiParameters([{type: 'address'}], [account]),
					type: 0x3f,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => v as Bytes32,
				});
      },
      code_size(account: `0x${string}`): Promise<BigInt> {
        const request = {
					data: encodeAbiParameters([{type: 'address'}], [account]),
					type: 0x3b,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => BigInt(v),
				});
      },
      block_hash(num: number): Promise<Bytes32> {
        const request = {
					data: encodeAbiParameters([{type: 'uint256'}], [BigInt(num)]),
					type: 0x40,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => v as Bytes32,
				});
      },
      block_timestamp(): Promise<number> {
        const request = {
					data: "0x" as `0x${string}`,
					type: 0x42,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => parseInt(v),
				});
      },
      block_number(): Promise<number> {
        const request = {
					data: "0x" as `0x${string}`,
					type: 0x43,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => parseInt(v),
				});
      },
      chainid(): Promise<BigInt> {
        const request = {
					data: "0x" as `0x${string}`,
					type: 0x46,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => BigInt(v),
				});
      },
			send(send: SendRequest): Promise<boolean> {
				const request = {
					data: encodeAbiParameters(
						[{type: 'bool'}, {type: 'address'}, {type: 'bytes'}, {type: 'uint256'}],
						[send.broadcast || false, send.from || AddressZero, send.to, BigInt(send.value || 0)]
					),
					type: 0xf100,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => {
						return v == 'true' ? true : false;
					},
				});
			},
			balance(account: `0x${string}`): Promise<BigInt> {
				const request = {
					data: encodeAbiParameters([{type: 'address'}], [account]),
					type: 0x31,
				};
				return self.wrapHandler({
					request,
					resolution: async (v) => BigInt(v),
				});
			},
		};

		log_error('!!! EXECUTING SCRIPT');
		try {
			const promiseOrResult = this.script(forge);
			if (promiseOrResult instanceof Promise) {
				promiseOrResult
					.then((v) => {
						this.returnResult(v);
					})
					.catch((err) => {
						this.abort(err);
					});
			} else {
				this.returnResult(promiseOrResult);
			}
		} catch (err) {
			this.abort(err);
		}
	}

	private async resolvePendingRequest(data: any) {
		if (!this.resolveQueue || this.resolveQueue.length === 0) {
			log_error(`RESOLUTION QUEUE IS EMPTY`);
			exitProcess(1, true);
		} else {
			log_msg('!!! RESOLVING PREVIOUS REQUEST');
			const next = this.resolveQueue.shift();
			const transformedData = await next.handler.resolution(data);
			next.resolve(transformedData);
			if (this.resolveQueue.length >= 1) {
				this.processPendingRequest();
			}
		}
	}

	private processPendingRequest() {
		const next = this.resolveQueue[0];
		const request = encodeAbiParameters(
			[{type: 'uint32'}, {type: 'bytes'}],
			[next.handler.request.type, next.handler.request.data]
		);
		// we restart the timeout
		this.resetTimeout();
		ipc.server.emit(this.socket, request + `\n`);
	}

	private onMessage(response, socket) {
		// we stop the timeout on each message we receive.
		// we will restart it on the request made , see
		this.stopTimeout();

		this.socket = socket;
		const data = response.toString('utf8').slice(0, -1);

		log_msg(`!!! MESSAGE from client`);

		if (data.startsWith('terminate:')) {
			// TODO good terminate ?
			log_error(`!!! TERMINATING: ${data.slice(10)}`);
			exitProcess(1);
		} else if (data.startsWith('response:')) {
			if (!this.resolveQueue) {
				this.resolveQueue = [];
				this.executeScript();
				// log_error(`!!! ERRRO no request to resolve`);
				// must be the first message, we can execute
			} else {
				this.resolvePendingRequest(data.slice(9));
			}
		} else {
			log_error(`!!! INVALID RESPONSE, need to start with "terminate:", or "response:": ${data}`);
			exitProcess(1);
		}
	}
}
