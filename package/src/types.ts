import type {AbiParameterToPrimitiveType, ResolvedConfig} from 'abitype';

export type String0x = `0x${string}`;
export type Address = String0x;
export type BytesData = String0x;

export type CallRequest = {
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	to?: AbiParameterToPrimitiveType<{type: 'address'}>;
	data?: AbiParameterToPrimitiveType<{type: 'bytes'}>;
	value?: AbiParameterToPrimitiveType<{type: 'uint256'}>;
};
export type CallResponse = {success: boolean; data: BytesData};

export type CreateRequest = {
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	data?: AbiParameterToPrimitiveType<{type: 'bytes'}>;
	value?: AbiParameterToPrimitiveType<{type: 'uint256'}>;
};

export type SendRequest = {
	from?: AbiParameterToPrimitiveType<{type: 'address'}>;
	to: AbiParameterToPrimitiveType<{type: 'address'}>;
	value: AbiParameterToPrimitiveType<{type: 'uint256'}>;
};

export interface Forge {
	call(request: CallRequest): Promise<CallResponse>;
	send(request: SendRequest): Promise<boolean>;
	// static_call(request: TransactionRequest): Promise<>;
	create(request: CreateRequest): Promise<Address>;
	balance(account: AbiParameterToPrimitiveType<{type: 'address'}>): Promise<BigInt>;
}
