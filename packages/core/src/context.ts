type ContextBase<
	T extends string = string,
	M extends Record<string, unknown> = Record<string, unknown>,
> = {
	id: string;
	type: T;
	data: M;
};

export type Message = ContextBase<
	"message",
	{
		role: "user" | "assistant" | "system";
		content: string;
	}
>;

export type ToolCall = ContextBase<
	"tool_call",
	{
		callId?: string;
		name: string;
		args: Record<string, unknown>;
	}
>;

export type ToolResult = ContextBase<
	"tool_result",
	{
		callId: string;
		output: unknown;
	}
>;

export type Thinking = ContextBase<
	"thinking",
	{
		content: string;
	}
>;

export type Context = Message | ToolCall | ToolResult | Thinking;
