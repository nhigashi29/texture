import { match } from "ts-pattern";
import type { Context } from "./context.js";

export function toPrompt(ctx: Context): string {
	return match(ctx)
		.with({ type: "message" }, (c) => `[${c.data.role}]: ${c.data.content}`)
		.with(
			{ type: "tool_call" },
			(c) => `tool: ${c.data.name}(${JSON.stringify(c.data.args)})`,
		)
		.with(
			{ type: "tool_result" },
			(c) => `result(${c.data.callId}): ${JSON.stringify(c.data.output)}`,
		)
		.with({ type: "thinking" }, (c) => `thinking: ${c.data.content}`)
		.exhaustive();
}
