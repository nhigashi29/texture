export type Scope =
	| { type: "all" }
	| { type: "space"; spaceId: string };
