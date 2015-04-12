# git-prune

Prune ready branches and old branches on remote repository (origin)

	npm install -g git-prune

## Usage

```shell
git-prune
```

Any branch in the `ready/*` pattern will be deleted from `origin` if it's more than 1 day old.

Any other branch, except `master`, will be deleted fro `origin` if it's more than 30 days old.

No local branches will be deleted.

## License

[MIT](http://opensource.org/licenses/MIT)
