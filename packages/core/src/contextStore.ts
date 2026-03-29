import type { ContextRecord } from "./contextRecord.js";
import type { Scope } from "./scope.js";

export interface ContextStore {
	append(record: ContextRecord): Promise<void>;
	query(scope: Scope): Promise<ContextRecord[]>;
	subscribe(listener: (record: ContextRecord) => void): () => void;
}
