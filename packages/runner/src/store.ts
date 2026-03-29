import type { ContextRecord, ContextStore, Scope } from "@texture/core";

export class InMemoryContextStore implements ContextStore {
	private readonly records: ContextRecord[] = [];
	private readonly listeners = new Set<(record: ContextRecord) => void>();

	async append(record: ContextRecord): Promise<void> {
		this.records.push(record);
		for (const listener of this.listeners) {
			listener(record);
		}
	}

	async query(scope: Scope): Promise<ContextRecord[]> {
		switch (scope.type) {
			case "all":
				return [...this.records];
			case "space":
				return this.records.filter((record) => record.spaceId === scope.spaceId);
		}
	}

	subscribe(listener: (record: ContextRecord) => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
}
