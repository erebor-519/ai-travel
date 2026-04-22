const pptxgen = require("pptxgenjs");
const fs = require("fs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { 
  FaMapMarkerAlt, FaRobot, FaRoute, FaUsers, FaDatabase, FaCloud, 
  FaCheckCircle, FaLightbulb, FaRocket, FaHome, FaCompass, FaMap, 
  FaCalendarAlt, FaComments, FaUserCircle, FaStar, FaSearch, FaCamera
} = require("react-icons/fa");

// Icon helper functions
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Color palette - Ocean Gradient theme for travel/AI
const COLORS = {
  primary: "065A82",      // Deep blue
  secondary: "1C7293",    // Teal
  accent: "00A896",       // Seafoam
  dark: "21295C",         // Midnight
  light: "F8FAFC",        // Off-white
  text: "1E293B",         // Dark text
  muted: "64748B",        // Muted text
  white: "FFFFFF",
  cardBg: "FFFFFF"
};

// Create presentation
let pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "丁弈诚";
pres.title = "灵犀旅伴-AI旅行助手 结项报告";
pres.subject = "项目结项报告";

// Shadow factory function
const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

// ==================== Slide 1: Cover ====================
async function createCoverSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.dark };

  // Decorative circles
  slide.addShape(pres.shapes.OVAL, { x: -1, y: -1, w: 4, h: 4, fill: { color: COLORS.primary, transparency: 60 } });
  slide.addShape(pres.shapes.OVAL, { x: 7.5, y: 3.5, w: 5, h: 5, fill: { color: COLORS.secondary, transparency: 50 } });
  slide.addShape(pres.shapes.OVAL, { x: 8, y: -2, w: 3, h: 3, fill: { color: COLORS.accent, transparency: 70 } });

  // Main title
  slide.addText("灵犀旅伴", {
    x: 0.5, y: 1.8, w: 9, h: 1.2,
    fontSize: 60, fontFace: "微软雅黑", bold: true, color: COLORS.white,
    align: "center"
  });

  slide.addText("AI 旅行助手", {
    x: 0.5, y: 2.9, w: 9, h: 0.8,
    fontSize: 40, fontFace: "微软雅黑", color: COLORS.accent,
    align: "center"
  });

  // Subtitle
  slide.addText("项目结项报告", {
    x: 0.5, y: 4.0, w: 9, h: 0.5,
    fontSize: 24, fontFace: "微软雅黑", color: COLORS.muted,
    align: "center"
  });

  // Bottom info
  slide.addShape(pres.shapes.RECTANGLE, { x: 3, y: 4.8, w: 4, h: 0.02, fill: { color: COLORS.accent } });
  
  slide.addText([
    { text: "项目负责人：丁弈诚", options: { breakLine: true } },
    { text: "完成日期：2026年4月22日" }
  ], {
    x: 0.5, y: 5.0, w: 9, h: 0.6,
    fontSize: 14, fontFace: "微软雅黑", color: COLORS.muted,
    align: "center"
  });
}

// ==================== Slide 2: Table of Contents ====================
async function createTOCSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header bar
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("目录", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 32, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  const tocItems = [
    { num: "01", title: "项目概述", desc: "项目背景与目标" },
    { num: "02", title: "技术架构", desc: "技术栈与系统架构" },
    { num: "03", title: "功能模块", desc: "核心功能详解" },
    { num: "04", title: "数据库设计", desc: "数据集合与字段" },
    { num: "05", title: "云函数接口", desc: "后端服务接口" },
    { num: "06", title: "项目亮点", desc: "创新点与特色" }
  ];

  tocItems.forEach((item, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.4 + row * 1.3;

    // Card background
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.3, h: 1.1, fill: { color: COLORS.cardBg }, shadow: makeShadow() });
    
    // Accent bar
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08, h: 1.1, fill: { color: COLORS.accent } });

    // Number
    slide.addText(item.num, {
      x: x + 0.2, y: y + 0.15, w: 0.8, h: 0.5,
      fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.primary
    });

    // Title
    slide.addText(item.title, {
      x: x + 1.0, y: y + 0.2, w: 3, h: 0.4,
      fontSize: 18, fontFace: "微软雅黑", bold: true, color: COLORS.text
    });

    // Description
    slide.addText(item.desc, {
      x: x + 1.0, y: y + 0.6, w: 3, h: 0.3,
      fontSize: 12, fontFace: "微软雅黑", color: COLORS.muted
    });
  });
}

// ==================== Slide 3: Project Overview ====================
async function createOverviewSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("01  项目概述", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Background section
  slide.addText("项目背景", {
    x: 0.5, y: 1.3, w: 4.3, h: 0.4,
    fontSize: 18, fontFace: "微软雅黑", bold: true, color: COLORS.primary
  });

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.75, w: 4.3, h: 1.8, fill: { color: COLORS.cardBg }, shadow: makeShadow() });
  slide.addText("随着人工智能技术的快速发展，旅行规划方式正在经历深刻变革。传统的旅行规划需要用户花费大量时间搜索目的地信息、比较景点优劣、规划行程路线，整个过程耗时且往往难以获得最优方案。", {
    x: 0.7, y: 1.9, w: 3.9, h: 1.5,
    fontSize: 12, fontFace: "微软雅黑", color: COLORS.text, valign: "top"
  });

  // Goals section
  slide.addText("项目目标", {
    x: 5.2, y: 1.3, w: 4.3, h: 0.4,
    fontSize: 18, fontFace: "微软雅黑", bold: true, color: COLORS.primary
  });

  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.75, w: 4.3, h: 1.8, fill: { color: COLORS.cardBg }, shadow: makeShadow() });

  const goals = [
    "AI智能规划 - 基于用户需求自动生成旅行计划",
    "路线可视化 - 在交互式地图上展示完整路线",
    "旅行社区 - 支持用户分享、浏览、点赞规划",
    "用户体系 - 完整的认证和个人中心功能"
  ];

  goals.forEach((goal, i) => {
    slide.addText(goal, {
      x: 5.4, y: 1.9 + i * 0.4, w: 3.9, h: 0.35,
      fontSize: 11, fontFace: "微软雅黑", color: COLORS.text
    });
  });

  // Stats row
  const stats = [
    { value: "4", label: "核心页面" },
    { value: "4", label: "云函数" },
    { value: "2", label: "数据库集合" },
    { value: "AI", label: "智能规划" }
  ];

  stats.forEach((stat, i) => {
    const x = 0.5 + i * 2.4;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 4.0, w: 2.1, h: 1.3, fill: { color: COLORS.primary }, shadow: makeShadow() });
    slide.addText(stat.value, {
      x, y: 4.1, w: 2.1, h: 0.7,
      fontSize: 36, fontFace: "Arial", bold: true, color: COLORS.white, align: "center"
    });
    slide.addText(stat.label, {
      x, y: 4.8, w: 2.1, h: 0.4,
      fontSize: 12, fontFace: "微软雅黑", color: COLORS.accent, align: "center"
    });
  });
}

// ==================== Slide 4: Tech Stack ====================
async function createTechSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("02  技术架构", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Tech stack cards
  const techItems = [
    { title: "前端框架", items: ["Vue 3 + Composition API", "Vite 构建工具", "Vue Router 4"], color: "42B883" },
    { title: "地图服务", items: ["高德地图 AMap", "DragRoute 路径规划", "地点搜索服务"], color: "FF6B00" },
    { title: "后端服务", items: ["腾讯云 CloudBase", "云函数", "静态托管"], color: "00A4E4" },
    { title: "数据库", items: ["腾讯云 NoSQL", "posts 集合", "users 集合"], color: "00D9A6" },
    { title: "AI能力", items: ["OpenAI API", "astron-code 模型", "旅行规划生成"], color: "9B59B6" },
    { title: "SDK支持", items: ["@cloudbase/js-sdk", "云开发 JS SDK", "身份认证"], color: "E74C3C" }
  ];

  techItems.forEach((tech, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 0.5 + col * 3.1;
    const y = 1.3 + row * 2.0;

    // Card
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.9, h: 1.8, fill: { color: COLORS.cardBg }, shadow: makeShadow() });
    
    // Top accent
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.9, h: 0.08, fill: { color: tech.color } });

    // Title
    slide.addText(tech.title, {
      x: x + 0.15, y: y + 0.2, w: 2.6, h: 0.4,
      fontSize: 16, fontFace: "微软雅黑", bold: true, color: COLORS.text
    });

    // Items
    tech.items.forEach((item, j) => {
      slide.addText("• " + item, {
        x: x + 0.15, y: y + 0.65 + j * 0.35, w: 2.6, h: 0.3,
        fontSize: 10, fontFace: "微软雅黑", color: COLORS.muted
      });
    });
  });
}

// ==================== Slide 5: Function Modules ====================
async function createFunctionsSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("03  功能模块", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Function cards in 2x2 grid
  const functions = [
    { 
      title: "首页模块", 
      icon: "🏠",
      items: ["目的地地图展示", "AI目的地推荐", "快速规划入口"]
    },
    { 
      title: "AI旅行规划", 
      icon: "🤖",
      items: ["智能计划生成", "交互式路线规划", "计划保存与复现"]
    },
    { 
      title: "探索目的地", 
      icon: "🔍",
      items: ["AI目的地搜索", "热门景点展示", "相关帖子关联"]
    },
    { 
      title: "旅行社区", 
      icon: "📝",
      items: ["帖子发布与图片上传", "点赞互动", "路线展示"]
    }
  ];

  functions.forEach((func, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.2 + row * 2.1;

    // Card
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.4, h: 1.9, fill: { color: COLORS.cardBg }, shadow: makeShadow() });

    // Left accent
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.06, h: 1.9, fill: { color: COLORS.accent } });

    // Icon and title
    slide.addText(func.icon + " " + func.title, {
      x: x + 0.25, y: y + 0.15, w: 4, h: 0.5,
      fontSize: 18, fontFace: "微软雅黑", bold: true, color: COLORS.primary
    });

    // Items
    func.items.forEach((item, j) => {
      slide.addText("✓ " + item, {
        x: x + 0.25, y: y + 0.7 + j * 0.35, w: 4, h: 0.3,
        fontSize: 12, fontFace: "微软雅黑", color: COLORS.text
      });
    });
  });
}

// ==================== Slide 6: AI Planning Detail ====================
async function createAIPlanningSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("03  核心功能 - AI旅行规划", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Left side - features
  slide.addText("功能特性", {
    x: 0.5, y: 1.2, w: 4.5, h: 0.4,
    fontSize: 18, fontFace: "微软雅黑", bold: true, color: COLORS.primary
  });

  const features = [
    { title: "AI计划生成", desc: "用户输入旅行需求，AI自动生成包含行程概览、每日安排、注意事项的完整旅行计划" },
    { title: "智能路线规划", desc: "利用高德地图DragRoute功能自动计算最优路径，支持途经点顺序调整" },
    { title: "交互式地图", desc: "在地图上展示起点、途经点、终点，用户可拖拽调整路线位置" },
    { title: "计划保存", desc: "登录用户可将旅行规划保存到云端，便于日后查看和复用" }
  ];

  features.forEach((feature, i) => {
    const y = 1.7 + i * 0.95;
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 4.5, h: 0.85, fill: { color: COLORS.cardBg }, shadow: makeShadow() });
    
    // Number badge
    slide.addShape(pres.shapes.OVAL, { x: 0.65, y: y + 0.2, w: 0.45, h: 0.45, fill: { color: COLORS.accent } });
    slide.addText(String(i + 1), {
      x: 0.65, y: y + 0.2, w: 0.45, h: 0.45,
      fontSize: 14, fontFace: "Arial", bold: true, color: COLORS.white, align: "center", valign: "middle"
    });

    slide.addText(feature.title, {
      x: 1.2, y: y + 0.1, w: 3.6, h: 0.35,
      fontSize: 13, fontFace: "微软雅黑", bold: true, color: COLORS.text
    });
    slide.addText(feature.desc, {
      x: 1.2, y: y + 0.45, w: 3.6, h: 0.35,
      fontSize: 9, fontFace: "微软雅黑", color: COLORS.muted
    });
  });

  // Right side - workflow
  slide.addText("生成流程", {
    x: 5.3, y: 1.2, w: 4.2, h: 0.4,
    fontSize: 18, fontFace: "微软雅黑", bold: true, color: COLORS.primary
  });

  slide.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.65, w: 4.2, h: 3.7, fill: { color: COLORS.cardBg }, shadow: makeShadow() });

  const steps = [
    "用户输入旅行需求",
    "AI生成初始旅行计划",
    "解析计划中的地点",
    "高德地图路径规划",
    "显示交互式路线",
    "用户可拖拽调整"
  ];

  steps.forEach((step, i) => {
    const y = 1.85 + i * 0.55;
    
    // Step circle
    slide.addShape(pres.shapes.OVAL, { x: 5.5, y, w: 0.4, h: 0.4, fill: { color: COLORS.primary } });
    slide.addText(String(i + 1), {
      x: 5.5, y, w: 0.4, h: 0.4,
      fontSize: 12, fontFace: "Arial", bold: true, color: COLORS.white, align: "center", valign: "middle"
    });

    // Arrow (except last)
    if (i < steps.length - 1) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.68, y: y + 0.4, w: 0.04, h: 0.15, fill: { color: COLORS.accent } });
    }

    slide.addText(step, {
      x: 6.0, y, w: 3.3, h: 0.4,
      fontSize: 12, fontFace: "微软雅黑", color: COLORS.text, valign: "middle"
    });
  });
}

// ==================== Slide 7: Database Design ====================
async function createDatabaseSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("04  数据库设计", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Users collection
  slide.addText("users 用户集合", {
    x: 0.5, y: 1.2, w: 4.3, h: 0.35,
    fontSize: 16, fontFace: "微软雅黑", bold: true, color: COLORS.secondary
  });

  slide.addTable([
    [
      { text: "字段名", options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true } },
      { text: "类型", options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true } },
      { text: "说明", options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true } }
    ],
    ["_id", "String", "用户唯一标识"],
    ["username", "String", "用户名"],
    ["nickname", "String", "昵称"],
    ["avatar", "String", "头像URL"],
    ["email", "String", "邮箱"],
    ["createdAt", "Date", "创建时间"]
  ], {
    x: 0.5, y: 1.6, w: 4.3, fontSize: 9, fontFace: "微软雅黑",
    color: COLORS.text, border: { pt: 0.5, color: "E2E8F0" },
    colW: [1.3, 1.0, 2.0]
  });

  // Posts collection
  slide.addText("posts 帖子集合", {
    x: 5.2, y: 1.2, w: 4.3, h: 0.35,
    fontSize: 16, fontFace: "微软雅黑", bold: true, color: COLORS.secondary
  });

  slide.addTable([
    [
      { text: "字段名", options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true } },
      { text: "类型", options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true } },
      { text: "说明", options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true } }
    ],
    ["_id", "String", "帖子唯一标识"],
    ["userId", "String", "发布用户ID"],
    ["title", "String", "帖子标题"],
    ["content", "String", "旅行规划内容"],
    ["location", "String", "旅行地点"],
    ["tags", "Array", "标签数组"],
    ["places", "Array", "地点坐标"],
    ["images", "Array", "图片URL"],
    ["likes", "Array", "点赞用户ID"]
  ], {
    x: 5.2, y: 1.6, w: 4.3, fontSize: 9, fontFace: "微软雅黑",
    color: COLORS.text, border: { pt: 0.5, color: "E2E8F0" },
    colW: [1.3, 1.0, 2.0]
  });
}

// ==================== Slide 8: Cloud Functions ====================
async function createCloudFunctionsSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("05  云函数接口", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Function cards
  const functions = [
    { name: "auth", desc: "用户认证", details: "处理用户登录、注册、获取用户信息", status: "已部署" },
    { name: "forum", desc: "帖子管理", details: "帖子的CRUD、搜索、点赞功能", status: "已部署" },
    { name: "travel-plans", desc: "规划管理", details: "旅行规划的保存、查询、删除", status: "已部署" },
    { name: "upload-image", desc: "图片上传", details: "处理帖子的图片上传到云存储", status: "已部署" }
  ];

  functions.forEach((func, i) => {
    const y = 1.2 + i * 1.05;
    
    // Card
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 9, h: 0.9, fill: { color: COLORS.cardBg }, shadow: makeShadow() });

    // Left accent
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 0.06, h: 0.9, fill: { color: COLORS.accent } });

    // Function name badge
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: y + 0.2, w: 1.6, h: 0.5, fill: { color: COLORS.primary } });
    slide.addText(func.name, {
      x: 0.7, y: y + 0.2, w: 1.6, h: 0.5,
      fontSize: 11, fontFace: "Consolas", color: COLORS.white, align: "center", valign: "middle"
    });

    // Description
    slide.addText(func.desc, {
      x: 2.5, y: y + 0.15, w: 2, h: 0.35,
      fontSize: 14, fontFace: "微软雅黑", bold: true, color: COLORS.text
    });
    slide.addText(func.details, {
      x: 2.5, y: y + 0.5, w: 5, h: 0.3,
      fontSize: 10, fontFace: "微软雅黑", color: COLORS.muted
    });

    // Status badge
    slide.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: y + 0.3, w: 1, h: 0.35, fill: { color: "10B981" } });
    slide.addText(func.status, {
      x: 8.3, y: y + 0.3, w: 1, h: 0.35,
      fontSize: 10, fontFace: "微软雅黑", color: COLORS.white, align: "center", valign: "middle"
    });
  });
}

// ==================== Slide 9: Highlights ====================
async function createHighlightsSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.light };

  // Header
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: COLORS.primary } });
  slide.addText("06  项目亮点", {
    x: 0.5, y: 0.25, w: 9, h: 0.5,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.white
  });

  // Highlight cards
  const highlights = [
    { 
      title: "AI智能规划", 
      desc: "利用大语言模型，根据用户输入自动生成个性化的旅行计划，包含行程安排、预算建议、注意事项等",
      icon: "🤖"
    },
    { 
      title: "交互式地图", 
      desc: "集成高德地图DragRoute功能，用户可在地图上拖拽调整途经点，系统自动重新规划最优路线",
      icon: "🗺️"
    },
    { 
      title: "社区互动", 
      desc: "支持用户分享旅行规划、浏览他人帖子、点赞互动，形成良好的旅行交流社区氛围",
      icon: "👥"
    },
    { 
      title: "云端同步", 
      desc: "基于腾讯云CloudBase，用户数据安全存储在云端，支持多设备访问和数据同步",
      icon: "☁️"
    }
  ];

  highlights.forEach((item, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 4.7;
    const y = 1.2 + row * 2.1;

    // Card
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.4, h: 1.9, fill: { color: COLORS.cardBg }, shadow: makeShadow() });

    // Icon circle
    slide.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.8, h: 0.8, fill: { color: COLORS.accent } });
    slide.addText(item.icon, {
      x: x + 0.2, y: y + 0.25, w: 0.8, h: 0.7,
      fontSize: 28, align: "center", valign: "middle"
    });

    // Title
    slide.addText(item.title, {
      x: x + 1.1, y: y + 0.3, w: 3.1, h: 0.4,
      fontSize: 16, fontFace: "微软雅黑", bold: true, color: COLORS.primary
    });

    // Description
    slide.addText(item.desc, {
      x: x + 0.2, y: y + 1.1, w: 4, h: 0.7,
      fontSize: 11, fontFace: "微软雅黑", color: COLORS.text
    });
  });
}

// ==================== Slide 10: Conclusion ====================
async function createConclusionSlide() {
  let slide = pres.addSlide();
  slide.background = { color: COLORS.dark };

  // Decorative elements
  slide.addShape(pres.shapes.OVAL, { x: -2, y: 3, w: 6, h: 6, fill: { color: COLORS.primary, transparency: 50 } });
  slide.addShape(pres.shapes.OVAL, { x: 7, y: -1, w: 4, h: 4, fill: { color: COLORS.secondary, transparency: 40 } });

  // Title
  slide.addText("总结与展望", {
    x: 0.5, y: 1.0, w: 9, h: 0.8,
    fontSize: 40, fontFace: "微软雅黑", bold: true, color: COLORS.white, align: "center"
  });

  // Summary content
  slide.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 2.0, w: 7, h: 2.5, fill: { color: COLORS.white, transparency: 10 } });

  slide.addText("灵犀旅伴-AI旅行助手已成功完成开发部署，实现了智能旅行规划、交互式地图展示、旅行社区互动等核心功能。项目采用Vue 3 + 腾讯云CloudBase的技术架构，为用户提供流畅的旅行规划体验。", {
    x: 1.8, y: 2.2, w: 6.4, h: 1.2,
    fontSize: 14, fontFace: "微软雅黑", color: COLORS.white, align: "center"
  });

  slide.addText("未来可进一步优化AI规划算法、扩展目的地覆盖范围、增加个性化推荐功能，为用户打造更智能、更贴心的旅行规划服务。", {
    x: 1.8, y: 3.5, w: 6.4, h: 0.8,
    fontSize: 14, fontFace: "微软雅黑", color: COLORS.accent, align: "center"
  });

  // Thank you
  slide.addText("感谢观看", {
    x: 0.5, y: 4.8, w: 9, h: 0.6,
    fontSize: 28, fontFace: "微软雅黑", bold: true, color: COLORS.accent, align: "center"
  });
}

// Main execution
async function main() {
  console.log("Creating presentation...");

  await createCoverSlide();
  console.log("✓ Slide 1: Cover");
  
  await createTOCSlide();
  console.log("✓ Slide 2: Table of Contents");
  
  await createOverviewSlide();
  console.log("✓ Slide 3: Project Overview");
  
  await createTechSlide();
  console.log("✓ Slide 4: Tech Stack");
  
  await createFunctionsSlide();
  console.log("✓ Slide 5: Function Modules");
  
  await createAIPlanningSlide();
  console.log("✓ Slide 6: AI Planning Detail");
  
  await createDatabaseSlide();
  console.log("✓ Slide 7: Database Design");
  
  await createCloudFunctionsSlide();
  console.log("✓ Slide 8: Cloud Functions");
  
  await createHighlightsSlide();
  console.log("✓ Slide 9: Highlights");
  
  await createConclusionSlide();
  console.log("✓ Slide 10: Conclusion");

  const outputPath = "c:/Users/丁弈诚/Documents/GitHub/ai-travel/aitravel/灵犀旅伴_AI旅行助手_结项报告.pptx";
  await pres.writeFile({ fileName: outputPath });
  console.log(`\n✓ Presentation saved to: ${outputPath}`);
}

main().catch(console.error);
