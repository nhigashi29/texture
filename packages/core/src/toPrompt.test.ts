import { describe, expect, it } from "vitest";
import type { Message, ToolCall, ToolResult } from "./context.js";
import { toPrompt } from "./toPrompt.js";

describe("toPrompt", () => {
	it("should convert message to prompt", () => {
		const ctx: Message = {
			id: "1",
			type: "message",
			data: { role: "user", content: "hello" },
		};
		expect(toPrompt(ctx)).toBe("[user]: hello");
	});

	it("should convert tool_call to prompt", () => {
		const ctx: ToolCall = {
			id: "2",
			type: "tool_call",
			data: { name: "search", args: { q: "test" } },
		};
		expect(toPrompt(ctx)).toBe('tool: search({"q":"test"})');
	});

	it("should convert tool_result to prompt", () => {
		const ctx: ToolResult = {
			id: "3",
			type: "tool_result",
			data: { callId: "2", output: "found it" },
		};
		expect(toPrompt(ctx)).toBe('result(2): "found it"');
	});
});
