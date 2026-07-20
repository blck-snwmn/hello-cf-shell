# hello-cf-shell

A sample using Cloudflare Workers, Durable Objects, and `@cloudflare/shell`.

## Run

```sh
pnpm dev
```

```sh
curl http://localhost:8787
```

Each request increments a counter and appends a message to a history file in the Durable Object workspace.
