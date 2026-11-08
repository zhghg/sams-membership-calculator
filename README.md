# 会籍小算盘 · sams-membership-calculator

山姆普通会员与卓越会员收益计算器，支持民生山姆联名信用卡返利、年度消费规划和升级回本测算。

正式域名：https://sams-membership-calculator.gavinzh.com

## 功能

- 根据两档年会费及山姆外合资格消费，计算山姆内全年不亏消费门槛。
- 通过年消费滑块或逐月设置，计算两档会员的回馈金和全年净收益。
- 山姆外指定线上消费按0.2%返利，普通会员每月封顶50元、卓越会员100元；仅将升级后的新增部分计入升级收益。
- 累计净赚折线图：先扣除升级会费差额，再逐月累加新增回馈金，标出回本月份。

## 本地开发

需要 Node.js 22 与 npm。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5173/ 。

```sh
npm test
npm run build
```

生产文件生成于 `dist/`。计算规则及其边界见页面底部，独立测算工具，非山姆或民生银行官方产品。

## GitHub Pages 发布

`.github/workflows/deploy.yml` 会在推送到 `main` 后执行安装、测试、构建与部署，也支持手动触发。

仓库 Settings → Pages 的 Source 应设为 **GitHub Actions**，Custom domain 设为 `sams-membership-calculator.gavinzh.com`。

域名 DNS 应设置：

| 类型 | 主机记录 | 目标 |
| --- | --- | --- |
| CNAME | sams-membership-calculator | zhghg.github.io |

DNS 生效且 GitHub 证书签发后启用 Enforce HTTPS。`public/CNAME` 会随构建复制到 `dist/CNAME`，Vite 资源基路径为 `/`，匹配自定义域名根目录。

## 估算说明

山姆外年消费默认均摊至12个月，山姆内可逐月调整。返利上限按月分别计算；回馈金按面值计入，需在有效期内使用。未模拟到账等待时间、逐笔取整、退款及其他会员权益。当前活动到期后的月份按现行规则不变作情景估算。
