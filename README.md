# TeamFlow 团队协作平台

一个可直接本地运行的全栈项目：React 19 + TypeScript 前端，Spring Boot 3 后端，支持 JWT 登录、RBAC、项目看板、任务拖拽、评论、WebSocket 实时协作和统计看板。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query · Zustand · React Hook Form · Zod · dnd-kit · Recharts · STOMP.js |
| 后端 | Java 21 · Spring Boot 3.2 · Spring Security · JWT · Spring Data JPA · WebSocket/STOMP |
| 数据库 | MySQL 8（默认，持久化存储），可通过 profile 切换为 H2 文件库，启动自动灌入演示数据 |
| 部署 | Docker / Docker Compose / Nginx（可选） |

## 功能

- 用户登录、注册、JWT 鉴权
- RBAC 权限：管理员 / 成员。成员可查看、创建/编辑/移动任务、评论；项目新建/删除、任务删除仅管理员可用（`@PreAuthorize` 方法级拦截 + 前端入口隐藏，越权返回 403）
- 项目创建、项目列表、项目删除（新建/删除入口仅管理员可见）
- 四列任务看板：待办 / 进行中 / 待评审 / 已完成
- 任务拖拽跨列移动与排序
- 任务创建、编辑、删除
- 负责人、优先级、标签式状态、截止日期
- 任务评论与操作动态
- WebSocket 实时推送项目变更
- 工作台统计：项目数、任务数、成员数、完成率、任务状态分布

## 本地启动

### 1. 启动后端

要求：JDK 21 + Maven 3.9+

默认使用 MySQL 8，需先建库（连接信息由环境变量提供，不会写入源码）：

```sql
CREATE DATABASE IF NOT EXISTS teamflow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```powershell
cd d:\demo\teamflow\backend
$env:MYSQL_PASSWORD = "你的 MySQL root 密码"
mvn spring-boot:run
```

可选环境变量：`MYSQL_HOST`（默认 localhost）、`MYSQL_PORT`（默认 3306）、`MYSQL_DB`（默认 teamflow）、`MYSQL_USER`（默认 root）。

想零配置运行（无需 MySQL），可切换到 H2 文件库 profile，数据同样落盘不丢：

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

后端地址：

```text
http://localhost:8083
```

H2 控制台（仅 `h2` profile 下可用）：

```text
http://localhost:8083/h2-console
```

JDBC URL：`jdbc:h2:file:./data/teamflow;MODE=MySQL;DB_CLOSE_ON_EXIT=FALSE`，用户 `sa`，密码留空。

### 2. 启动前端

要求：Node 20+

```powershell
cd d:\demo\teamflow\frontend
npm install
npm run dev
```

前端地址：

```text
http://localhost:5177
```

开发环境下前端通过 Vite 代理把 `/api` 和 `/ws` 转发到 `http://localhost:8083`。

## 演示账号

| 账号 | 密码 | 角色 | 姓名 |
|---|---|---|---|
| admin | admin123 | 管理员 | 池远 |
| member | member123 | 成员 | 林岚 |
| qin | qin123 | 成员 | 秦川 |
| zhou | zhou123 | 成员 | 周舟 |

## 主要接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/auth/me` | 当前用户 |
| GET | `/api/projects` | 项目列表 |
| POST | `/api/projects` | 新建项目 |
| GET | `/api/projects/{id}/tasks` | 项目任务列表 |
| POST | `/api/projects/{id}/tasks` | 新建任务 |
| PUT | `/api/tasks/{id}` | 更新任务 |
| PATCH | `/api/tasks/{id}/move` | 移动任务 |
| DELETE | `/api/tasks/{id}` | 删除任务 |
| GET | `/api/tasks/{id}/comments` | 任务评论 |
| POST | `/api/tasks/{id}/comments` | 添加评论 |
| GET | `/api/dashboard/overview` | 工作台统计 |
| WS | `/ws` | STOMP 实时推送，`/topic/project/{id}` |

## Docker 启动（可选）

```powershell
cd d:\demo\teamflow
docker compose up --build
```

启动后：

```text
前端：http://localhost:5177
后端：http://localhost:8083
```

## 目录结构

```text
teamflow/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/teamflow/
│       ├── config/        JWT、Security、WebSocket 配置
│       ├── controller/    接口层
│       ├── dto/           请求 DTO
│       ├── entity/        JPA 实体
│       ├── enums/         枚举
│       ├── repository/    数据访问层
│       ├── service/       业务层
│       └── DataInitializer.java
├── src/test/              JUnit + MockMvc 集成测试
└── src/main/resources/
    ├── application.yml        默认 MySQL 配置（环境变量注入连接信息）
    └── application-h2.yml      H2 文件库 profile
└── frontend/
    ├── src/
    │   ├── components/    布局、任务卡片、任务抽屉
    │   ├── hooks/         WebSocket hook
    │   ├── lib/           axios 封装、格式化
    │   ├── pages/         登录、工作台、项目、看板、成员
    │   └── store/         Zustand 状态
    └── vite.config.ts
```

## 测试

后端包含 11 个集成测试，覆盖认证、RBAC 越权拦截、任务协作、拖拽 position 重排和统计接口。测试使用独立内存库，不影响本地数据：

```powershell
cd d:\demo\teamflow\backend
mvn test
```
