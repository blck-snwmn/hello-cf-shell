import { DynamicWorkerExecutor, resolveProvider } from "@cloudflare/codemode";
import type { ExecuteResult, ToolProvider } from "@cloudflare/codemode";
import { Workspace } from "@cloudflare/shell";
import { stateTools } from "@cloudflare/shell/workers";
import { DurableObject } from "cloudflare:workers";

const modules = {
	"run-message.js": `
export function formatRun(count) {
  return \`Run #\${count}\`;
}
`,
};

const myTools: ToolProvider = {
	name: "myTools",
	tools: {
		decorate: {
			description: "Decorate a message.",
			async execute(message: unknown): Promise<string> {
				if (typeof message !== "string") {
					throw new TypeError("message must be a string");
				}
				return `*** ${message} ***`;
			},
		},
	},
};

const code = `async () => {
  const { formatRun } = await import("./run-message.js");
  const previous = await state.exists("/counter.txt")
    ? await state.readFile("/counter.txt")
    : "0";
  const count = Number(previous) + 1;

  await state.writeFile("/counter.txt", String(count));

  const moduleMessage = formatRun(count);
  const message = await myTools.decorate(moduleMessage);
  const history = await state.exists("/history.txt")
    ? await state.readFile("/history.txt")
    : "";
  const updatedHistory = history + message + "\\n";

  await state.writeFile("/history.txt", updatedHistory);

  return {
    count,
    moduleMessage,
    message,
    history: updatedHistory
  };
}`;

export class ShellDurableObject extends DurableObject<Env> {
	private readonly workspace: Workspace;
	private readonly executor: DynamicWorkerExecutor;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.workspace = new Workspace({ sql: ctx.storage.sql });
		this.executor = new DynamicWorkerExecutor({
			loader: env.LOADER,
			modules,
		});
	}

	async run(): Promise<ExecuteResult> {
		return this.executor.execute(code, [
			resolveProvider(stateTools(this.workspace)),
			resolveProvider(myTools),
		]);
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method !== "GET") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: { Allow: "GET" },
			});
		}

		const url = new URL(request.url);
		const name = url.searchParams.get("name") ?? "default";
		const shell = env.SHELL.getByName(name);
		const result = await shell.run();

		return Response.json({ name, execution: result });
	},
} satisfies ExportedHandler<Env>;
