# hello-cf-shell

Cloudflare Worker から Durable Object を呼び出し、Durable Object 内の
[`@cloudflare/shell`](https://github.com/cloudflare/agents/tree/main/packages/shell)
で JavaScript を実行するサンプルです。

`@cloudflare/shell` は Bash 互換シェルではありません。Worker Loader が作る隔離された
Worker で JavaScript を実行し、`state.*` API を通して Durable Object の SQLite に
保存される仮想ファイルシステムを操作します。

## 実行

```sh
pnpm dev
```

既定のサンプルは `/hello.txt` を作成して読み返します。

```sh
curl http://localhost:8787
```

任意のコードを実行する場合は `code` を POST します。

```sh
curl http://localhost:8787 \
  -H 'content-type: application/json' \
  -d '{"code":"async () => await state.readFile(\"/hello.txt\")"}'
```

クエリパラメーター `name` ごとに別の Durable Object と Workspace が使われます。

```sh
curl 'http://localhost:8787?name=alice'
```
