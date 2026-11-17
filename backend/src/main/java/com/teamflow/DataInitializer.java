package com.teamflow;

import com.teamflow.entity.Activity;
import com.teamflow.entity.Comment;
import com.teamflow.entity.Project;
import com.teamflow.entity.Task;
import com.teamflow.entity.User;
import com.teamflow.enums.Role;
import com.teamflow.enums.TaskPriority;
import com.teamflow.enums.TaskStatus;
import com.teamflow.repository.ActivityRepository;
import com.teamflow.repository.CommentRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final ActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ProjectRepository projectRepository,
                           TaskRepository taskRepository,
                           CommentRepository commentRepository,
                           ActivityRepository activityRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.activityRepository = activityRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = saveUser("admin", "admin123", "池远", Role.ADMIN);
        User member = saveUser("member", "member123", "林岚", Role.MEMBER);
        User qin = saveUser("qin", "qin123", "秦川", Role.MEMBER);
        User zhou = saveUser("zhou", "zhou123", "周舟", Role.MEMBER);

        Project p1 = saveProject("TeamFlow v1.0 迭代", "完成协作平台首版，包含看板、评论和统计", "#6366f1", admin);
        Project p2 = saveProject("官网改版", "市场官网视觉升级与内容重构", "#ec4899", member);
        Project p3 = saveProject("移动端调研", "移动端方案调研与原型验证", "#10b981", qin);

        Task t1 = saveTask(p1, "设计登录与权限模型", "梳理 RBAC 模型并完成数据库设计", TaskStatus.DONE, TaskPriority.HIGH, admin, LocalDate.now().minusDays(6));
        Task t2 = saveTask(p1, "实现 JWT 登录认证", "登录、注册、Token 刷新与拦截器", TaskStatus.DONE, TaskPriority.HIGH, member, LocalDate.now().minusDays(4));
        Task t3 = saveTask(p1, "任务看板拖拽", "基于 dnd-kit 实现跨列拖拽和排序", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, qin, LocalDate.now().plusDays(2));
        Task t4 = saveTask(p1, "WebSocket 实时同步", "任务变更广播给同项目在线成员", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, zhou, LocalDate.now().plusDays(3));
        Task t5 = saveTask(p1, "统计看板", "燃尽图与成员工作量统计", TaskStatus.TODO, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(7));
        Task t6 = saveTask(p1, "补充单元测试", "覆盖服务层核心逻辑", TaskStatus.TODO, TaskPriority.LOW, member, LocalDate.now().plusDays(10));

        saveTask(p2, "首页视觉稿评审", "确认首屏与产品展示区", TaskStatus.REVIEW, TaskPriority.HIGH, member, LocalDate.now().plusDays(1));
        saveTask(p2, "整理案例内容", "补充 6 个客户案例", TaskStatus.TODO, TaskPriority.MEDIUM, qin, LocalDate.now().plusDays(5));
        saveTask(p2, "响应式适配", "移动端断点适配", TaskStatus.TODO, TaskPriority.MEDIUM, zhou, LocalDate.now().plusDays(8));

        saveTask(p3, "竞品分析", "分析 Planka、Focalboard 等", TaskStatus.DONE, TaskPriority.MEDIUM, qin, LocalDate.now().minusDays(2));
        saveTask(p3, "原型草图", "完成 3 个核心页面草图", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, zhou, LocalDate.now().plusDays(2));

        saveComment(t3, admin, "拖拽排序要先确定 position 的更新策略。");
        saveComment(t3, qin, "已改为后端重新编号，前端只负责乐观更新。");
        saveComment(t4, zhou, " subscribed /topic/project/{id}，多标签页测试正常。");
        saveComment(t5, member, "图表先用 Recharts，数据结构按 status 聚合。");

        log(p1, t1, "创建了任务「设计登录与权限模型」");
        log(p1, t2, "创建了任务「实现 JWT 登录认证」");
        log(p1, t3, "将任务「任务看板拖拽」移动到 IN_PROGRESS");
        log(p2, null, "创建了项目「官网改版」");
        log(p3, t1, "完成了竞品分析");

        // SkyChat Agent 项目
        Project skyChat = saveProject("SkyChat Agent", "SSE 流式对话 + Function Calling 的 AI Agent 演示项目", "#8b5cf6", admin);

        Task sc1 = saveTask(skyChat, "前后端分离骨架搭建", "Spring Boot 3.5 后端 + React 19 前端，Vite 代理配置", TaskStatus.DONE, TaskPriority.HIGH, admin, LocalDate.now().minusDays(12));
        Task sc2 = saveTask(skyChat, "Function Calling 工具调用", "Tool 接口与注册中心，模型决策循环最多 5 轮", TaskStatus.DONE, TaskPriority.HIGH, qin, LocalDate.now().minusDays(10));
        Task sc3 = saveTask(skyChat, "真实大模型 / Mock 双模式", "OpenAI 兼容接口接入 DeepSeek，无 key 自动降级 Mock", TaskStatus.DONE, TaskPriority.MEDIUM, zhou, LocalDate.now().minusDays(9));
        Task sc4 = saveTask(skyChat, "SSE 流式对话主链路", "SseEmitter + 自定义线程池，content/tool_start/tool_end/done 事件", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, qin, LocalDate.now().plusDays(2));
        Task sc5 = saveTask(skyChat, "内置工具集", "时间、计算器、知识检索、天气、汇率五个工具与外部 HTTP 兜底", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, member, LocalDate.now().plusDays(4));
        Task sc6 = saveTask(skyChat, "会话管理与历史回放", "会话列表/重命名/删除，最近 20 条上下文回放", TaskStatus.REVIEW, TaskPriority.HIGH, zhou, LocalDate.now().plusDays(1));
        Task sc7 = saveTask(skyChat, "traceId 全链路追踪", "MDC + 异步线程池显式注入，响应头/SSE/日志一致", TaskStatus.REVIEW, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(3));
        Task sc8 = saveTask(skyChat, "停止生成与重新生成", "显式取消标记 + abort fetch，复用最后提问重跑", TaskStatus.TODO, TaskPriority.MEDIUM, member, LocalDate.now().plusDays(6));
        Task sc9 = saveTask(skyChat, "前端多会话布局", "左侧会话列表 + 右侧对话区，Zustand 状态管理", TaskStatus.TODO, TaskPriority.LOW, qin, LocalDate.now().plusDays(8));

        saveComment(sc4, admin, "SSE 事件统一用 data:{} 格式，帧间空行分隔。");
        saveComment(sc6, zhou, "标题用 custom_title 冗余存储，省掉一张会话表。");

        log(skyChat, null, "创建了项目「SkyChat Agent」");

        // 张江餐饮管理系统 项目
        Project zhangjiang = saveProject("张江餐饮管理系统", "Vue 2 + Element UI 餐饮后台：平台/餐厅/用户/商城/菜品/仓库/钱包/经营分析", "#f59e0b", admin);

        Task zj1 = saveTask(zhangjiang, "项目脚手架与路由搭建", "Vue CLI + Element UI + Vuex，按 perm 配置 12 个模块路由", TaskStatus.DONE, TaskPriority.HIGH, admin, LocalDate.now().minusDays(20));
        Task zj2 = saveTask(zhangjiang, "登录与权限控制", "登录页 + perm 权限位控制菜单与路由访问", TaskStatus.DONE, TaskPriority.HIGH, qin, LocalDate.now().minusDays(18));
        Task zj3 = saveTask(zhangjiang, "平台与系统管理", "组织设置、餐厅设置、账户设置、用户角色、管理权限", TaskStatus.DONE, TaskPriority.MEDIUM, zhou, LocalDate.now().minusDays(15));
        Task zj4 = saveTask(zhangjiang, "餐厅管理模块", "餐别/结算/设备/卡片/托盘设置，门店管理与门店参数", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, member, LocalDate.now().plusDays(3));
        Task zj5 = saveTask(zhangjiang, "菜品管理模块", "菜谱设置、菜谱分类、排餐管理", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, qin, LocalDate.now().plusDays(5));
        Task zj6 = saveTask(zhangjiang, "用户管理模块", "公司/部门/个人/企业用户，补贴管理与角色、招待卡", TaskStatus.REVIEW, TaskPriority.HIGH, zhou, LocalDate.now().plusDays(2));
        Task zj7 = saveTask(zhangjiang, "仓库与供应商管理", "出入库明细、库存统计、供应商、物料分类", TaskStatus.REVIEW, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(4));
        Task zj8 = saveTask(zhangjiang, "经营分析与 ECharts 图表", "菜品订单、营业分析、菜品明细、退款订单、企业订单", TaskStatus.TODO, TaskPriority.HIGH, member, LocalDate.now().plusDays(7));
        Task zj9 = saveTask(zhangjiang, "商城与钱包管理", "商品/订单/明细，余额管理与成交额、交易统计", TaskStatus.TODO, TaskPriority.MEDIUM, qin, LocalDate.now().plusDays(9));
        Task zj10 = saveTask(zhangjiang, "优惠策略与财务对账", "活动优惠策略配置、财务对账", TaskStatus.TODO, TaskPriority.LOW, zhou, LocalDate.now().plusDays(12));

        saveComment(zj4, admin, "餐厅模块字段较多，先按设置类页面统一抽表格组件。");
        saveComment(zj8, member, "营业分析用 ECharts，接口按 analysis 路径聚合。");

        log(zhangjiang, null, "创建了项目「张江餐饮管理系统」");
    }

    private User saveUser(String username, String password, String displayName, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setRole(role);
        return userRepository.save(user);
    }

    private Project saveProject(String name, String description, String color, User owner) {
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setColor(color);
        project.setOwnerId(owner.getId());
        return projectRepository.save(project);
    }

    private Task saveTask(Project project, String title, String description, TaskStatus status,
                          TaskPriority priority, User assignee, LocalDate dueDate) {
        Task task = new Task();
        task.setProjectId(project.getId());
        task.setTitle(title);
        task.setDescription(description);
        task.setStatus(status);
        task.setPriority(priority);
        task.setAssigneeId(assignee.getId());
        task.setAssigneeName(assignee.getDisplayName());
        task.setDueDate(dueDate);
        task.setPosition((int) taskRepository.countByProjectId(project.getId()));
        return taskRepository.save(task);
    }

    private void saveComment(Task task, User author, String content) {
        Comment comment = new Comment();
        comment.setTaskId(task.getId());
        comment.setAuthorId(author.getId());
        comment.setAuthorName(author.getDisplayName());
        comment.setContent(content);
        commentRepository.save(comment);
    }

    private void log(Project project, Task task, String message) {
        Activity activity = new Activity();
        activity.setProjectId(project.getId());
        activity.setTaskId(task == null ? null : task.getId());
        activity.setMessage(message);
        activityRepository.save(activity);
    }
}
