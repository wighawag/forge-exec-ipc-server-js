import fs from 'node:fs';
import stream from 'stream';

export const FORGE_EXEC_LOGS = process.env.FORGE_EXEC_LOGS;

let _LOG_IPC_SERVER = false
let _LOG_INFO = false;
let _LOG_ERROR = false;
if (FORGE_EXEC_LOGS) {
  const split = FORGE_EXEC_LOGS.split(":");
  const filename = split[1] || '.ipc.log';
  if (filename !== '-') {
    const logPath = filename.indexOf("PROCESS_ID") > 0 ? filename.replace("PROCESS_ID", process.pid.toString()) : filename;
    const access = fs.createWriteStream(logPath, {flags: 'a'});
    process.stdout.write = process.stderr.write = access.write.bind(access);
  }
  if (split[0]) {
    const to_log = split[0].split(",");
    for (const l of to_log) {
      if (l === 'ipc') {
        _LOG_IPC_SERVER = true;
      } else if (l === 'info') {
        _LOG_INFO = true;
        _LOG_ERROR = true;
      } else if (l === 'error') {
        _LOG_ERROR = true;
      }

    }
  }
} else {
  const thevoid = new stream.Writable({
    write: function(chunk, encoding, next) {
      next();
    }
  });
  process.stdout.write = process.stderr.write = thevoid.write.bind(thevoid);
}

export const LOG_IPC_SERVER = _LOG_IPC_SERVER;
export const LOG_INFO = _LOG_INFO;
export const LOG_ERROR = _LOG_INFO;

export function log_error(...args: any[]) {
  if (LOG_ERROR) {
    console.error(...args);
  }
}

export function log_msg(...args: any[]) {
  if (LOG_INFO) {
    console.log(...args);
  }
}
