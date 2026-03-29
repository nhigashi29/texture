import { v7 as uuid } from "uuid";
import type { Context } from "./context.js";

export function createContext<T extends Context["type"]>(
	type: T,
	data: Extract<Context, { type: T }>["data"],
): Extract<Context, { type: T }> {
	return { id: uuid(), type, data } as Extract<Context, { type: T }>;
}
