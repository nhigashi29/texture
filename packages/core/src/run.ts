import type { Context } from "./context.js";

export type Run = {
	id: string;
	agentId: string;
	status: "running" | "completed" | "failed";
};

export type ExecuteEvent =
	| { type: "run_started"; run: Run }
	| {
			type: "context_emitted";
			runId: string;
			context: Context;
	  }
	| { type: "run_completed"; run: Run }
	| { type: "run_failed"; run: Run; error: unknown };
