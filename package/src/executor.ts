import {encodeAbiParameters} from 'viem';
import * as ipcModule from '@achrinza/node-ipc';
const ipc = ipcModule.default?.default || ipcModule.default || ipcModule; // fix issue with cjs
import {fork} from 'child_process';
import fs from 'fs';

function socketComponents(socketID: string): {
	id: string;
	appSpace: string;
	socketRoot: string;
} {
	const rootEnd = socketID.lastIndexOf('/') + 1;
	const appEnd = socketID.lastIndexOf('.') + 1;
	const socketRoot = socketID.slice(0, rootEnd);
	const appSpace = socketID.slice(rootEnd, appEnd);
	const id = socketID.slice(appEnd);
	return {id, socketRoot, appSpace};
}

const logPath = '.executor.log'; // `.executor_${process.pid}.log`
const access = fs.createWriteStream(logPath, {flags: 'a'});
const oldStdoutWrite = process.stdout.write.bind(process.stdout);
// const oldStderrWrite = process.stdout.write.bind(process.stderr);
if (process.env.FORGE_EXECUTOR_LOGS === '') {
	process.env.FORGE_EXECUTOR_LOGS = undefined;
}
if (!process.env.FORGE_EXECUTOR_LOGS) {
	process.stdout.write = process.stderr.write = access.write.bind(access);
}

const args = process.argv.slice(2);

function exitToTest() {
	// oldStdoutWrite(
	// 	'0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002676d000000000000000000000000000000000000000000000000000000000000'
	// );
	oldStdoutWrite(encodeAbiParameters(Array(args.length).fill({type: 'string'}), args));
	process.exit();
}

if (args[0] === 'init') {
	const socketID = '/tmp/app.world';
	console.log('!!! initialization...');
	const server = process.env.FORGE_EXECUTOR_LOGS
		? fork(args[1], [`ipc:${socketID}`])
		: fork(args[1], [`ipc:${socketID}`], {detached: true, silent: true});
	console.log(`!!! serverPID: ${server.pid}`);
	const encoded = encodeAbiParameters([{type: 'string'}], [socketID]);
	// console.log(`!!! ${encoded}`);

	let exiting = false;
	function connectAndExit() {
		const {id} = socketComponents(socketID);
		// const clientID = 'executor';
		// ipc.config.id = clientID;
		ipc.config.retry = 1500;
		ipc.config.rawBuffer = true;

		ipc.connectTo(id, socketID, function () {
			ipc.of[id].on('connect', function () {
				console.log(`!!! FIRST CONNECT to ${socketID}`);
				exiting = true;
				oldStdoutWrite(encoded);
				// setTimeout(() => {
				// 	process.exit();
				// }, 100);
				process.exit();
			});
			ipc.of[id].on('disconnect', function () {
				console.log(`!!! disconnected, RETRY`);
				if (!exiting) {
					setTimeout(connectAndExit, 50);
				}
			});
		});
	}
	connectAndExit();
} else {
	ipc.config.logger = (...args) => console.log(`!!!EXECUTOR`, ...args);
	// ipc.config.logger = () => {};
	ipc.config.id = 'executor';
	ipc.config.retry = 1500;
	ipc.config.rawBuffer = true;

	const socketID = args[1];
	const {id} = socketComponents(socketID);
	console.log(`!!! EXECUTOR ${socketID}`);

	if (args[0] === 'exec') {
		ipc.connectTo(id, socketID, function () {
			ipc.of[id].on('connect', function () {
				console.log(`!!! connected to ${socketID}`);
				ipc.of[id].emit(`response:${args[2]}\n`);
			});
			ipc.of[id].on('disconnect', function () {
				// console.log(`!!! disconnected`);
				// console.error('!!! disconnected from world');
				process.exit(0);
			});
			ipc.of[id].on('data', function (encoded) {
				const data = encoded.toString('utf8').slice(0, -1);
				console.log(`!!! writing encoded data: ${data}`);
				oldStdoutWrite(data);
				// console.log(`!!! exiting...`);
				process.exit();
			});
		});
	} else if (args[0] === 'terminate') {
		ipc.connectTo(id, socketID, function () {
			ipc.of[id].on('connect', function () {
				ipc.of[id].emit(`terminate:${args[2]}\n`);
				oldStdoutWrite('0x');
				process.exit();
			});
			ipc.of[id].on('disconnect', function () {
				oldStdoutWrite('failed to terminate');
				process.exit(1);
			});
		});
	} else {
		console.log(`!!! invalid command`);
		process.exit(1);
	}
}
