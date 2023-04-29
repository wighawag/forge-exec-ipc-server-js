import type {AbiParameterToPrimitiveType, ResolvedConfig} from 'abitype';

export type String0x = `0x${string}`;
export type Address = String0x;
export type BytesData = String0x;

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
	send(request: SendRequest): Promise<boolean>;
	static_call(request: StaticCallRequest): Promise<CallResponse>;
	create(request: CreateRequest): Promise<Address>;
  create2(request: Create2Request): Promise<Address>;
	balance(account: AbiParameterToPrimitiveType<{type: 'address'}>): Promise<BigInt>;
}
