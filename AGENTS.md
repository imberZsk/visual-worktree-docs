# 仓库约定

- 项目级 `.npmrc` 必须提交，且只允许公开、无凭据的 registry 配置。
- 私有 registry、认证 token 和内网地址必须放用户级 `~/.npmrc`，不得提交到仓库。
- `.gitignore` 不得忽略项目级 `.npmrc`。
