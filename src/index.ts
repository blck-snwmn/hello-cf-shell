import { DynamicWorkerExecutor, resolveProvider } from "@cloudflare/codemode";
import type { ExecuteResult } from "@cloudflare/codemode";
import { Workspace } from "@cloudflare/shell";
import { stateTools } from "@cloudflare/shell/workers";
import { DurableObject } from "cloudflare:workers";

const defaultCode = `async () => {
  await state.writeFile("/hello.txt", "Hello from @cloudflare/shell!\\n");

  return {
    content: await state.readFile("/hello.txt"),
    files: await state.readdir("/")
  };
}`;

export class ShellDurableObject extends DurableObject<Env> {
	private readonly workspace: Workspace;
	private readonly executor: DynamicWorkerExecutor;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.workspace = new Workspace({ sql: ctx.storage.sql });
		this.executor = new DynamicWorkerExecutor({ loader: env.LOADER });
	}

	async run(code: string): Promise<ExecuteResult> {
		return this.executor.execute(code, [
			resolveProvider(stateTools(this.workspace)),
		]);
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const name = url.searchParams.get("name") ?? "default";
		let code = defaultCode;

		if (request.method === "POST") {
			const body = await request.json<{ code?: unknown }>();
			if (typeof body.code !== "string" || body.code.length === 0) {
				return Response.json(
					{ error: 'Request body must contain a non-empty "code" string.' },
					{ status: 400 },
				);
			}
			code = body.code;
		} else if (request.method !== "GET") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: { Allow: "GET, POST" },
			});
		}

		const shell = env.SHELL.getByName(name);
		const result = await shell.run(code);

		return Response.json({ name, execution: result });
	},
} satisfies ExportedHandler<Env>;
