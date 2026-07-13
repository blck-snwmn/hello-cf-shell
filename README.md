# hello-cf-shell

A sample using Cloudflare Workers, Durable Objects, and `@cloudflare/shell`.

## Run

```sh
pnpm dev
```

```sh
curl http://localhost:8787
```

```sh
curl http://localhost:8787 -H 'content-type: application/json' -d '{"code":"async () => await state.readFile(\"/hello.txt\")"}'
```
