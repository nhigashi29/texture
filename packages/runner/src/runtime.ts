import type { Agent } from "@mariozechner/pi-agent-core";
import type {
	AgentDefinition,
	ContextRecord,
	ContextSpace,
	ContextStore,
	ExecuteEvent,
	Scope,
} from "@texture/core";
import { execute } from "./adapter.js";

function byCreatedAt(a: ContextRecord, b: ContextRecord): number {
	return a.createdAt - b.createdAt;
}

export async function* executeWithStore(
	agent: Agent,
	store: ContextStore,
	options: {
		agentDefinition: AgentDefinition;
		readScope: Scope;
		writeSpaceId: string;
	},
): AsyncGenerator<ExecuteEvent> {
	const input = (await store.query(options.readScope))
		.sort(byCreatedAt)
		.map((record) => record.context);

	for await (const event of execute(agent, input, {
		agentId: options.agentDefinition.id,
	})) {
		if (event.type === "context_emitted") {
			await store.append({
				context: event.context,
				spaceId: options.writeSpaceId,
				createdAt: Date.now(),
			});
		}

		yield event;
	}
}

export async function* executeInSpace(
	agent: Agent,
	store: ContextStore,
	options: {
		agentDefinition: AgentDefinition;
		space: ContextSpace;
	},
): AsyncGenerator<ExecuteEvent> {
	if (!options.space.participants.includes(options.agentDefinition.id)) {
		throw new Error(
			`Agent ${options.agentDefinition.id} does not participate in space ${options.space.id}`,
		);
	}

	yield* executeWithStore(agent, store, {
		agentDefinition: options.agentDefinition,
		readScope: { type: "space", spaceId: options.space.id },
		writeSpaceId: options.space.id,
	});
}
