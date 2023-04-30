import type {AbiParameterToPrimitiveType, ResolvedConfig} from 'abitype';

export type String0x = `0x${string}`;
export type Address = String0x;
export type BytesData = String0x;
export type Bytes32 = String0x;

export type CallRequest = {
  broadcast?: AbiParameterToPrimitiveType<{type: 'bool'}>;
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	to?: AbiParameterToPrimitiveType<{type: 'address'}>;
	data?: AbiParameterToPrimitiveType<{type: 'bytes'}>;
	value?: AbiParameterToPrimitiveType<{type: 'uint256'}>;
};
export type CallResponse = {success: boolean; data: BytesData};

export type StaticCallRequest = {
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	to?: AbiParameterToPrimitiveType<{type: 'address'}>;
	data?: AbiParameterToPrimitiveType<{type: 'bytes'}>;
};

export type CreateRequest = {
  broadcast?: AbiParameterToPrimitiveType<{type: 'bool'}>;
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	data?: AbiParameterToPrimitiveType<{type: 'bytes'}>;
	value?: AbiParameterToPrimitiveType<{type: 'uint256'}>;
};

export type Create2Request = {
  broadcast?: AbiParameterToPrimitiveType<{type: 'bool'}>;
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	data?: AbiParameterToPrimitiveType<{type: 'bytes'}>;
	value?: AbiParameterToPrimitiveType<{type: 'uint256'}>;
  salt?: AbiParameterToPrimitiveType<{type: 'bytes32'}>;
};

export type SendRequest = {
  broadcast?: AbiParameterToPrimitiveType<{type: 'bool'}>;
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	to: AbiParameterToPrimitiveType<{type: 'address'}>;
	value: AbiParameterToPrimitiveType<{type: 'uint256'}>;
};

export interface Forge {
	call(request: CallRequest): Promise<CallResponse>;
	static_call(request: StaticCallRequest): Promise<CallResponse>;
	create(request: CreateRequest): Promise<Address>;
  create2(request: Create2Request): Promise<Address>;
	balance(account: AbiParameterToPrimitiveType<{type: 'address'}>): Promise<BigInt>;
  code(account: `0x${string}`): Promise<BytesData>;
  code_hash(account: `0x${string}`): Promise<Bytes32>;
  code_size(account: `0x${string}`): Promise<BigInt>;
  block_hash(num: number): Promise<Bytes32>;
  block_timestamp(): Promise<number>;
  block_number(): Promise<number>;
  chainid(): Promise<BigInt>;
  send(request: SendRequest): Promise<boolean>;
}
