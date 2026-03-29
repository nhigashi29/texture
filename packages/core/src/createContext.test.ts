import { describe, expect, it } from "vitest";
import { createContext } from "./createContext.js";

describe("createContext", () => {
	it("should create a message context with auto-generated id", () => {
		const ctx = createContext("message", { role: "user", content: "hello" });
		expect(ctx.type).toBe("message");
		expect(ctx.data.role).toBe("user");
		expect(ctx.data.content).toBe("hello");
		expect(ctx.id).toBeDefined();
	});

	it("should create a tool_call context", () => {
		const ctx = createContext("tool_call", {
			name: "search",
			args: { q: "test" },
		});
		expect(ctx.type).toBe("tool_call");
		expect(ctx.data.name).toBe("search");
	});

	it("should generate unique ids", () => {
		const a = createContext("message", { role: "user", content: "a" });
		const b = createContext("message", { role: "user", content: "b" });
		expect(a.id).not.toBe(b.id);
	});
});
