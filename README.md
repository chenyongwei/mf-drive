# drive

独立图纸云存储服务仓。

- `api`: 元数据与授权校验 API（Express, mock/live 双模式）
- `web`: 轻量前端（容器管理 + 上传/检索 + 下载链接，OAuth 授权）

## 启动

```bash
npm run dev:mock
```

- drive-api: `http://localhost:31210`
- drive-web: `http://localhost:31211/drive/files`（通过网关访问推荐：`http://localhost:31200/drive/files`）
