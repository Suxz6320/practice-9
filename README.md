# 校园学习生活信息中心

个人实训作品：一个围绕校园学习生活主题的信息与数据展示中心响应式前端应用。

## 功能模块

- **首页（index.html）**：统计概览卡片、数据图表、Three.js 校园三维模型、运行说明
- **自习室管理（study-rooms.html）**：搜索、按楼栋/楼层/状态筛选、添加、修改、删除自习室（数据保存到 localStorage）
- **食堂信息（cafeteria.html）**：食堂卡片展示、按区域筛选与排序、评分与客流图表

## 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 + CSS3 + JavaScript (ES6) | 页面结构、样式与逻辑 |
| Bootstrap 5.3 | 响应式布局与组件 |
| jQuery 3.7 | DOM 操作与事件处理 |
| ECharts 5.4 | 柱状图、折线图 |
| Chart.js 4.4 | 环形图、多系列折线图 |
| Three.js 0.160 | 校园建筑三维展示（OrbitControls） |
| 本地 JSON | 数据来源（`data/` 目录） |

> 满足要求：jQuery 与 Bootstrap 均使用；ECharts 与 Chart.js 两类图表；Three.js 三维展示；JSON 数据加载。

## 运行方法

### 方式一：本地静态服务器（推荐）

由于浏览器安全策略，直接双击打开时 `fetch` 加载本地 JSON 可能被拦截，建议启动本地服务器：

```bash
# Python
python -m http.server 8000

# Node.js
npx serve
# 或
npx http-server
```

然后在浏览器访问 `http://localhost:8000`。

VS Code 用户可安装 **Live Server** 插件，右键 `index.html` → Open with Live Server。

### 方式二：直接打开

本项目内置了兜底数据（`js/fallback-data.js`），即使 `fetch` 失败，页面仍可正常展示。控制台会出现黄色警告，属正常现象。

## 目录结构

```
practice-9/
├── index.html            # 首页
├── study-rooms.html      # 自习室管理
├── cafeteria.html        # 食堂信息
├── css/
│   └── style.css         # 自定义样式
├── js/
│   ├── app.js            # 公共逻辑（数据加载、错误提示、导航高亮）
│   ├── fallback-data.js  # 兜底数据（file:// 协议下使用）
│   ├── home.js           # 首页统计与图表
│   ├── three-scene.js    # Three.js 三维场景
│   ├── study-rooms.js    # 自习室增删改查
│   └── cafeteria.js      # 食堂信息与图表
├── data/
│   ├── study-rooms.json  # 自习室数据
│   ├── cafeteria.json    # 食堂数据
│   └── stats.json        # 首页统计数据
└── README.md
```

## 错误处理说明

- **网络断开 / fetch 失败**：自动使用内嵌兜底数据，页面正常展示，并在控制台打印警告
- **数据为空**：列表区域显示"暂无数据"提示
- **数据格式错误**：显示红色错误提示框，说明失败原因
- **表单非法输入**：名称/楼栋为空时弹出警告提示；已占用超过总座位时自动修正

## 响应式适配

- 桌面端（≥1200px）：多列网格布局
- 平板（768px）：两列布局
- 手机（≤576px）：单列布局，导航折叠为汉堡菜单，图表与三维区高度自适应

## 数据与资源来源

- 数据为模拟数据，存放于 `data/` 目录下的 JSON 文件
- 第三方库通过 CDN 加载（staticfile.org / jsdelivr），版本号已固定
