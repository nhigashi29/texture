import type {
	Agent,
	AgentEvent,
	AgentMessage,
} from "@mariozechner/pi-agent-core";
import type { AssistantMessage, ToolResultMessage } from "@mariozechner/pi-ai";
import type {
	Context,
	ExecuteEvent,
	Message,
	Run,
	Thinking,
	ToolCall,
	ToolResult,
} from "@texture/core";
import { v7 as uuid } from "uuid";

function extractFromAssistantMessage(msg: AssistantMessage): Context[] {
	const contexts: Context[] = [];
	for (const block of msg.content) {
		switch (block.type) {
			case "text":
				contexts.push({
					id: uuid(),
					type: "message",
					data: { role: "assistant", content: block.text },
				} satisfies Message);
				break;
			case "thinking":
				contexts.push({
					id: uuid(),
					type: "thinking",
					data: { content: block.thinking },
				} satisfies Thinking);
				break;
			case "toolCall":
				contexts.push({
					id: uuid(),
					type: "tool_call",
					data: {
						callId: block.id,
						name: block.name,
						args: block.arguments ?? {},
					},
				} satisfies ToolCall);
				break;
		}
	}
	return contexts;
}

function stringifyContent(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function createAssistantMessage(
	content: AssistantMessage["content"],
): AssistantMessage {
	return {
		role: "assistant",
		content,
		api: "openai-responses",
		provider: "openai",
		model: "unknown",
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				total: 0,
			},
		},
		stopReason: "stop",
		timestamp: Date.now(),
	};
}

function toAgentMessages(input: Context[]): AgentMessage[] {
	const messages: AgentMessage[] = [];
	const assistantContent: AssistantMessage["content"] = [];
	const toolNames = new Map<string, string>();

	const flushAssistant = () => {
		if (assistantContent.length === 0) {
			return;
		}

		messages.push(createAssistantMessage([...assistantContent]));
		assistantContent.length = 0;
	};

	for (const ctx of input) {
		switch (ctx.type) {
			case "message": {
				if (ctx.data.role === "assistant") {
					assistantContent.push({
						type: "text",
						text: ctx.data.content,
					});
					break;
				}

				flushAssistant();
				if (ctx.data.role === "user") {
					messages.push({
						role: "user",
						content: ctx.data.content,
						timestamp: Date.now(),
					});
				}
				break;
			}

			case "thinking":
				assistantContent.push({
					type: "thinking",
					thinking: ctx.data.content,
				});
				break;

			case "tool_call": {
				const callId = ctx.data.callId ?? uuid();
				toolNames.set(callId, ctx.data.name);
				assistantContent.push({
					type: "toolCall",
					id: callId,
					name: ctx.data.name,
					arguments: ctx.data.args,
				});
				break;
			}

			case "tool_result": {
				flushAssistant();
				const toolResult: ToolResultMessage = {
					role: "toolResult",
					toolCallId: ctx.data.callId,
					toolName: toolNames.get(ctx.data.callId) ?? "unknown",
					content: [
						{
							type: "text",
							text: stringifyContent(ctx.data.output),
						},
					],
					details: ctx.data.output,
					isError: false,
					timestamp: Date.now(),
				};
				messages.push(toolResult);
				break;
			}

		}
	}

	flushAssistant();
	return messages;
}

export async function* execute(
	agent: Agent,
	input: Context[],
	options?: {
		agentId?: string;
	},
): AsyncGenerator<ExecuteEvent> {
	const run: Run = {
		id: uuid(),
		agentId: options?.agentId ?? "main",
		status: "running",
	};

	yield { type: "run_started", run: { ...run } };

	const eventQueue: AgentEvent[] = [];
	let resolve: (() => void) | null = null;
	let done = false;
	let runError: unknown;

	const unsubscribe = agent.subscribe((event) => {
		eventQueue.push(event);
		resolve?.();
	});

	try {
		const messages = toAgentMessages(input);
		agent.replaceMessages(messages);

		const lastMessage = messages.at(-1);
		if (lastMessage?.role === "user" || lastMessage?.role === "toolResult") {
			void agent.continue().catch((err) => {
				runError = err;
				done = true;
				resolve?.();
			});
		} else {
			done = true;
		}

		while (!done) {
			if (eventQueue.length === 0) {
				await new Promise<void>((r) => {
					resolve = r;
				});
				resolve = null;
			}

			if (runError) {
				throw runError;
			}

			while (eventQueue.length > 0) {
				const event = eventQueue.shift();
				if (!event) continue;

				switch (event.type) {
					case "message_end": {
						const msg = event.message;
						if (msg && "role" in msg && msg.role === "assistant") {
							const contexts = extractFromAssistantMessage(
								msg as AssistantMessage,
							);
							for (const ctx of contexts) {
								yield {
									type: "context_emitted",
									runId: run.id,
									context: ctx,
								};
							}
						}
						break;
					}

					case "tool_execution_end": {
						const ctx: ToolResult = {
							id: uuid(),
							type: "tool_result",
							data: {
								callId: event.toolCallId,
								output: event.result,
							},
						};
						yield {
							type: "context_emitted",
							runId: run.id,
							context: ctx,
						};
						break;
					}

					case "agent_end": {
						done = true;
						break;
					}
				}
			}
		}

		if (runError) {
			throw runError;
		}

		run.status = "completed";
		yield { type: "run_completed", run: { ...run } };
	} catch (err) {
		run.status = "failed";
		yield { type: "run_failed", run: { ...run }, error: err };
		throw err;
	} finally {
		unsubscribe();
	}
}
