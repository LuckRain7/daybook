![daybook](logo-169.jpg)

# daybook

一个基于 React + TypeScript + Vite 的极简日记应用。

它只在浏览器本地保存数据，不依赖后端服务。你可以编辑今天的日记，按日期查看历史内容，并通过 JSON 文件导入或导出全部数据。

## 功能

- 仅允许编辑当天日记
- 按日期查看历史日记
- 日记内容与备注分开保存
- 数据持久化到浏览器 `IndexedDB`
- 支持导出全部日记为 JSON 备份
- 支持从备份文件导入并覆盖本地数据
- 历史预览区域支持多行截断，避免内容无限向下撑开

## 技术栈

- React 18
- TypeScript
- Vite 5
- IndexedDB

## 本地开发

先安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## GitHub Pages 自动部署

仓库已包含 GitHub Actions 工作流：[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)。

启用方式：

1. 将代码推送到 GitHub 仓库的 `main` 分支。
2. 打开仓库 `Settings > Pages`。
3. 在 `Build and deployment` 中，将 `Source` 设为 `GitHub Actions`。
4. 之后每次 push 到 `main`，都会自动执行构建并发布到 GitHub Pages。

说明：

- 项目当前按自定义域名根路径部署，`Vite` 的 `base` 为 `/`。
- 仓库已包含 [`public/CNAME`](/Users/nc_rain/raincode/daybook/public/CNAME)，发布后会自动绑定自定义域名 `day.ilabubu.com`。

如果要让 `day.ilabubu.com` 生效，还需要在域名 DNS 提供商处添加记录：

- `CNAME` 记录：`day` 指向 `<你的 GitHub 用户名>.github.io`

然后在仓库 `Settings > Pages` 中确认自定义域名为 `day.ilabubu.com`，等待 GitHub 完成证书签发。

## 使用说明

1. 在左侧编辑区填写今天的日记正文和备注。
2. 点击“保存今天的日记”后，内容会写入当前浏览器的 `IndexedDB`。
3. 在历史查看区选择日期，可以读取对应日期的日记。
4. 点击右下角设置按钮，可以导出全部数据或导入备份文件。

## 数据存储

项目使用浏览器 `IndexedDB`，数据库配置如下：

- Database: `diary-notebook`
- Object Store: `entries`
- Key: `date`

每条日记的结构如下：

```ts
type DiaryEntry = {
  date: string
  content: string
  note: string
  updatedAt: string
}
```

## 备份格式

导出的文件为 JSON，结构示例：

```json
{
  "exportedAt": "2026-04-02T07:00:00.000Z",
  "entries": [
    {
      "date": "2026-04-02",
      "content": "今天写了一些东西。",
      "note": "补充备注",
      "updatedAt": "2026-04-02T07:00:00.000Z"
    }
  ]
}
```

导入时会校验 `entries` 数组中的字段格式，并直接覆盖当前本地已有数据。

## 项目结构

```text
src/
  App.tsx              应用主界面与交互逻辑
  styles.css           页面样式
  types.ts             类型定义
  storage/diaryDb.ts   IndexedDB 读写封装
  utils/date.ts        日期格式化工具
```

## 注意事项

- 数据只保存在当前浏览器中，清除浏览器站点数据后内容可能丢失。
- 不同浏览器或不同设备之间不会自动同步。
- 导入操作会覆盖现有本地数据，执行前建议先导出备份。

## License

当前仓库未声明许可证。如需开源发布，建议补充 `LICENSE` 文件。
