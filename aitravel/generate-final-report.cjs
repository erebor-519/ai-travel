const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Icon rendering helpers
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

async function main() {
  // Import icons
  const { FaMapMarkedAlt, FaRobot, FaComments, FaRoute, FaImage, FaCamera, FaUsers, FaServer, FaDatabase, FaShieldAlt, FaArrowRight, FaCheckCircle, FaLightbulb, FaChartLine, FaGlobe, FaCode, FaMobileAlt, FaBrain, FaSearch, FaStar, FaCloud, FaRocket, FaLink, FaExternalLinkAlt } = require("react-icons/fa");

  // Pre-generate icons
  const iconMap = await iconToBase64Png(FaMapMarkedAlt, "#FFFFFF", 256);
  const iconRobot = await iconToBase64Png(FaRobot, "#FFFFFF", 256);
  const iconComments = await iconToBase64Png(FaComments, "#0D7377", 256);
  const iconRoute = await iconToBase64Png(FaRoute, "#0D7377", 256);
  const iconImage = await iconToBase64Png(FaImage, "#0D7377", 256);
  const iconCamera = await iconToBase64Png(FaCamera, "#0D7377", 256);
  const iconUsers = await iconToBase64Png(FaUsers, "#0D7377", 256);
  const iconServer = await iconToBase64Png(FaServer, "#0D7377", 256);
  const iconDatabase = await iconToBase64Png(FaDatabase, "#0D7377", 256);
  const iconShield = await iconToBase64Png(FaShieldAlt, "#0D7377", 256);
  const iconArrow = await iconToBase64Png(FaArrowRight, "#0D7377", 256);
  const iconCheck = await iconToBase64Png(FaCheckCircle, "#14B8A6", 256);
  const iconLightbulb = await iconToBase64Png(FaLightbulb, "#0D7377", 256);
  const iconChart = await iconToBase64Png(FaChartLine, "#0D7377", 256);
  const iconGlobe = await iconToBase64Png(FaGlobe, "#0D7377", 256);
  const iconCode = await iconToBase64Png(FaCode, "#0D7377", 256);
  const iconMobile = await iconToBase64Png(FaMobileAlt, "#0D7377", 256);
  const iconBrain = await iconToBase64Png(FaBrain, "#0D7377", 256);
  const iconSearch = await iconToBase64Png(FaSearch, "#0D7377", 256);
  const iconStar = await iconToBase64Png(FaStar, "#F59E0B", 256);
  const iconCloud = await iconToBase64Png(FaCloud, "#0D7377", 256);
  const iconRocket = await iconToBase64Png(FaRocket, "#FFFFFF", 256);
  const iconRocketTeal = await iconToBase64Png(FaRocket, "#0D7377", 256);
  const iconLink = await iconToBase64Png(FaLink, "#0D7377", 256);
  const iconExtLink = await iconToBase64Png(FaExternalLinkAlt, "#FFFFFF", 256);

  const iconCheckWhite = await iconToBase64Png(FaCheckCircle, "#FFFFFF", 256);
  const iconArrowWhite = await iconToBase64Png(FaArrowRight, "#FFFFFF", 256);
  const iconRobotTeal = await iconToBase64Png(FaRobot, "#0D7377", 256);
  const iconMapTeal = await iconToBase64Png(FaMapMarkedAlt, "#0D7377", 256);
  const iconGlobeWhite = await iconToBase64Png(FaGlobe, "#FFFFFF", 256);
  const iconDatabaseWhite = await iconToBase64Png(FaDatabase, "#FFFFFF", 256);
  const iconCodeWhite = await iconToBase64Png(FaCode, "#FFFFFF", 256);
  const iconShieldWhite = await iconToBase64Png(FaShieldAlt, "#FFFFFF", 256);
  const iconCommentsWhite = await iconToBase64Png(FaComments, "#FFFFFF", 256);
  const iconCloudWhite = await iconToBase64Png(FaCloud, "#FFFFFF", 256);

  // Load screenshots from footmarks.world
  const screenshotsDir = path.join(__dirname, "screenshots");
  const loadScreenshot = async (name) => {
    const filePath = path.join(screenshotsDir, name);
    if (!fs.existsSync(filePath)) {
      console.warn(`Screenshot not found: ${filePath}`);
      return null;
    }
    const buf = await sharp(filePath)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return "image/png;base64," + buf.toString("base64");
  };

  console.log("Loading screenshots from footmarks.world...");
  const imgHome = await loadScreenshot("home.png");
  const imgExplore = await loadScreenshot("explore.png");
  const imgTravelPlan = await loadScreenshot("travelplan.png");
  const imgCommunity = await loadScreenshot("community.png");
  const imgProfile = await loadScreenshot("profile.png");
  console.log("Screenshots loaded.");

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "丁弈诚";
  pres.title = "FDUROP结项报告 - 灵犀旅伴Web版";

  // Color palette
  const C = {
    primary: "0D7377",
    secondary: "14919B",
    accent: "14B8A6",
    accentLight: "A7F3D0",
    dark: "0F172A",
    textDark: "1E293B",
    textMuted: "64748B",
    textLight: "94A3B8",
    bgLight: "F0FDFA",
    bgWhite: "FFFFFF",
    border: "E2E8F0",
    gold: "F59E0B",
    coral: "F96167",
  };

  const makeShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.12 });
  const makeCardShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.1 });

  // ==================== SLIDE 1: TITLE ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.dark };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.accent } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.545, w: 10, h: 0.08, fill: { color: C.accent } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.accent } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.5, w: 0.6, h: 0.04, fill: { color: C.accent, transparency: 60 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.5, w: 0.04, h: 0.6, fill: { color: C.accent, transparency: 60 } });
    slide.addImage({ data: iconGlobeWhite, x: 4.5, y: 0.8, w: 1.0, h: 1.0 });
    slide.addText("灵犀旅伴", { x: 0.5, y: 2.0, w: 9, h: 1.0, fontSize: 44, fontFace: "Arial Black", color: C.bgWhite, align: "center", bold: true });
    slide.addText("基于大语言模型的智能旅行助手 Web 应用", { x: 0.5, y: 3.0, w: 9, h: 0.6, fontSize: 22, fontFace: "Calibri", color: C.accent, align: "center" });
    slide.addShape(pres.shapes.LINE, { x: 3.0, y: 3.75, w: 4.0, h: 0, line: { color: C.accent, width: 1.5, dashType: "dash" } });
    slide.addText("FDUROP 课题结项报告", { x: 0.5, y: 4.0, w: 9, h: 0.5, fontSize: 18, fontFace: "Calibri", color: C.textLight, align: "center" });
    slide.addText([
      { text: "负责人：丁弈诚", options: { color: C.textLight, fontSize: 14, breakLine: true } },
      { text: "成员：张洗镔、陶天宇", options: { color: C.textLight, fontSize: 14, breakLine: true } },
      { text: "指导老师：冯辉", options: { color: C.textLight, fontSize: 14 } }
    ], { x: 0.5, y: 4.6, w: 9, h: 0.9, fontFace: "Calibri", align: "center" });
  }

  // ==================== SLIDE 2: 目录 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("目录", { x: 0.5, y: 0.3, w: 3, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: C.primary, bold: true });
    slide.addText("Contents", { x: 0.5, y: 0.9, w: 3, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.textMuted, italic: true });

    const tocItems = [
      { num: "01", title: "课题背景与目标", desc: "项目缘起与研究意义", icon: iconGlobe },
      { num: "02", title: "前期工作回顾", desc: "微信小程序中期成果", icon: iconMobile },
      { num: "03", title: "Web版架构设计", desc: "技术选型与系统架构", icon: iconCode },
      { num: "04", title: "核心功能实现", desc: "五大功能模块详解", icon: iconBrain },
      { num: "05", title: "部署与成果展示", desc: "上线网站与界面演示", icon: iconRocketTeal },
      { num: "06", title: "创新与展望", desc: "项目亮点与未来规划", icon: iconLightbulb },
    ];

    tocItems.forEach((item, i) => {
      const yBase = 1.6 + i * 0.62;
      slide.addText(item.num, { x: 0.7, y: yBase, w: 0.6, h: 0.5, fontSize: 22, fontFace: "Arial Black", color: C.accent, bold: true });
      slide.addImage({ data: item.icon, x: 1.4, y: yBase + 0.05, w: 0.35, h: 0.35 });
      slide.addText(item.title, { x: 1.9, y: yBase, w: 3, h: 0.3, fontSize: 16, fontFace: "Calibri", color: C.textDark, bold: true });
      slide.addText(item.desc, { x: 1.9, y: yBase + 0.28, w: 3, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.textMuted });
      if (i < tocItems.length - 1) {
        slide.addShape(pres.shapes.LINE, { x: 1.9, y: yBase + 0.56, w: 6, h: 0, line: { color: C.border, width: 0.5 } });
      }
    });

    slide.addShape(pres.shapes.RECTANGLE, { x: 9.5, y: 0, w: 0.5, h: 5.625, fill: { color: C.primary } });
    slide.addText("灵犀旅伴\n结项报告", { x: 9.5, y: 2.0, w: 0.5, h: 1.6, fontSize: 12, fontFace: "Calibri", color: C.bgWhite, bold: true, align: "center", valign: "middle" });
  }

  // ==================== SLIDE 3: 课题背景与目标 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("01", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("课题背景与目标", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Background card
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 4.3, h: 2.0, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 0.06, h: 2.0, fill: { color: C.primary } });
    slide.addText("课题背景", { x: 0.8, y: 1.3, w: 3.5, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.primary, bold: true });
    slide.addText([
      { text: "旅行规划耗时费力，信息碎片化", options: { breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "传统旅游APP缺乏智能交互能力", options: { breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "大语言模型为旅行助手提供新可能", options: { fontSize: 12, color: C.textDark } },
    ], { x: 0.8, y: 1.75, w: 3.8, h: 1.3, fontFace: "Calibri" });

    // Goal card
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.3, h: 2.0, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 0.06, h: 2.0, fill: { color: C.accent } });
    slide.addText("项目目标", { x: 5.5, y: 1.3, w: 3.5, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.accent, bold: true });
    slide.addText([
      { text: "构建AI驱动的智能旅行助手", options: { breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "实现多模态交互与路径规划", options: { breakLine: true, fontSize: 12, color: C.textDark } },
      { text: "从小程序扩展为Web全栈应用并部署上线", options: { fontSize: 12, color: C.textDark } },
    ], { x: 5.5, y: 1.75, w: 3.8, h: 1.3, fontFace: "Calibri" });

    // Evolution section
    slide.addText("项目演进", { x: 0.5, y: 3.5, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.textDark, bold: true });

    // Phase 1 - Mini Program
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.0, w: 2.8, h: 1.3, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addImage({ data: iconMobile, x: 0.8, y: 4.1, w: 0.4, h: 0.4 });
    slide.addText("Phase 1", { x: 1.3, y: 4.1, w: 1.8, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.textMuted });
    slide.addText("微信小程序", { x: 0.8, y: 4.5, w: 2.2, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.textDark, bold: true });
    slide.addText("Qwen3-4B · 腾讯地图\nAR识别 · 智能对话", { x: 0.8, y: 4.85, w: 2.2, h: 0.4, fontSize: 10, fontFace: "Calibri", color: C.textMuted });

    // Arrow
    slide.addImage({ data: iconArrow, x: 3.5, y: 4.4, w: 0.4, h: 0.4 });

    // Phase 2 - Web
    slide.addShape(pres.shapes.RECTANGLE, { x: 4.1, y: 4.0, w: 2.8, h: 1.3, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addImage({ data: iconGlobe, x: 4.4, y: 4.1, w: 0.4, h: 0.4 });
    slide.addText("Phase 2", { x: 4.9, y: 4.1, w: 1.8, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.textMuted });
    slide.addText("Web全栈应用", { x: 4.4, y: 4.5, w: 2.2, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.textDark, bold: true });
    slide.addText("讯飞星火 · 高德地图\n社区论坛 · 云端存储", { x: 4.4, y: 4.85, w: 2.2, h: 0.4, fontSize: 10, fontFace: "Calibri", color: C.textMuted });

    // Arrow
    slide.addImage({ data: iconArrow, x: 7.1, y: 4.4, w: 0.4, h: 0.4 });

    // Phase 3 - Deployed
    slide.addShape(pres.shapes.RECTANGLE, { x: 7.7, y: 4.0, w: 2.0, h: 1.3, fill: { color: C.primary }, shadow: makeCardShadow() });
    slide.addImage({ data: iconRocketTeal, x: 7.95, y: 4.1, w: 0.4, h: 0.4 });
    slide.addText("已上线", { x: 7.95, y: 4.5, w: 1.5, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.bgWhite, bold: true });
    slide.addText("footmarks.world\nVercel部署", { x: 7.95, y: 4.85, w: 1.5, h: 0.4, fontSize: 10, fontFace: "Calibri", color: C.accentLight });
  }

  // ==================== SLIDE 4: 前期工作回顾 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("02", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("前期工作回顾", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });
    slide.addText("微信小程序「灵犀旅伴」中期成果", { x: 1.3, y: 0.8, w: 6, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textMuted, italic: true });

    const features = [
      { icon: iconComments, title: "智能交互", desc: "基于Qwen3-4B大语言模型\n实现旅行咨询与景点推荐\nAIGC文字回复" },
      { icon: iconRoute, title: "路径规划", desc: "集成腾讯地图API\n单景点导航与多景点路径\n一键导航功能" },
      { icon: iconImage, title: "多模态输入", desc: "图像上传识别景点\nAI自动分析图片内容\n地图可视化定位" },
      { icon: iconCamera, title: "AR模式", desc: "摄像头实时景点识别\n知名景点识别能力强\n视觉叠加显示" },
    ];

    features.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 4.7;
      const y = 1.4 + row * 2.0;

      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 4.3, h: 1.7, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 0.06, h: 1.7, fill: { color: C.primary } });
      slide.addImage({ data: f.icon, x: x + 0.3, y: y + 0.2, w: 0.4, h: 0.4 });
      slide.addText(f.title, { x: x + 0.85, y: y + 0.15, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(f.desc, { x: x + 0.3, y: y + 0.7, w: 3.7, h: 0.9, fontSize: 11, fontFace: "Calibri", color: C.textDark });
    });
  }

  // ==================== SLIDE 5: Web版架构设计 - 技术选型 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("03", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("Web版架构设计", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Frontend card
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 4.3, h: 3.8, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 4.3, h: 0.5, fill: { color: C.primary } });
    slide.addImage({ data: iconCodeWhite, x: 0.7, y: 1.28, w: 0.35, h: 0.35 });
    slide.addText("前端技术栈", { x: 1.15, y: 1.25, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.bgWhite, bold: true });

    const feItems = [
      { name: "Vue 3", desc: "Composition API 组件化开发" },
      { name: "Vite 7", desc: "快速构建与热更新" },
      { name: "Vue Router", desc: "SPA路由与页面导航" },
      { name: "高德地图 SDK", desc: "地图可视化与地理编码" },
      { name: "讯飞星火 API", desc: "大模型推理服务" },
    ];
    feItems.forEach((item, i) => {
      const y = 1.9 + i * 0.55;
      slide.addImage({ data: iconCheck, x: 0.8, y: y + 0.03, w: 0.3, h: 0.3 });
      slide.addText(item.name, { x: 1.2, y: y, w: 1.8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(item.desc, { x: 3.0, y: y, w: 1.6, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.textMuted });
    });

    // Backend card
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.3, h: 3.8, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.3, h: 0.5, fill: { color: C.secondary } });
    slide.addImage({ data: iconServer, x: 5.4, y: 1.28, w: 0.35, h: 0.35 });
    slide.addText("后端与云服务", { x: 5.85, y: 1.25, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.bgWhite, bold: true });

    const beItems = [
      { name: "腾讯云 CloudBase", desc: "BaaS后端即服务" },
      { name: "CloudBase NoSQL", desc: "文档数据库存储" },
      { name: "云函数", desc: "Serverless逻辑处理" },
      { name: "Vercel", desc: "前端部署与CDN加速" },
      { name: "Vite Proxy", desc: "API代理与密钥保护" },
    ];
    beItems.forEach((item, i) => {
      const y = 1.9 + i * 0.55;
      slide.addImage({ data: iconCheck, x: 5.5, y: y + 0.03, w: 0.3, h: 0.3 });
      slide.addText(item.name, { x: 5.9, y: y, w: 1.8, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(item.desc, { x: 7.7, y: y, w: 1.6, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.textMuted });
    });

    // Bottom architecture note
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.15, w: 9.0, h: 0.35, fill: { color: C.primary } });
    slide.addText("架构特点：前后端分离  |  Serverless  |  云端数据持久化  |  API代理转发  |  响应式SPA", { x: 0.5, y: 5.15, w: 9.0, h: 0.35, fontSize: 11, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
  }

  // ==================== SLIDE 6: 系统架构图 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("03", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("系统架构图", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // User layer
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.1, w: 9.0, h: 0.7, fill: { color: "E0F2FE" }, shadow: makeShadow() });
    slide.addText("用户层", { x: 0.6, y: 1.15, w: 0.8, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.primary, bold: true });
    slide.addText("浏览器  ·  移动端浏览器  ·  平板", { x: 0.6, y: 1.4, w: 8.5, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.textDark, align: "center" });

    // Arrow down
    slide.addShape(pres.shapes.LINE, { x: 5.0, y: 1.85, w: 0, h: 0.25, line: { color: C.accent, width: 2 } });

    // Frontend layer
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.15, w: 9.0, h: 1.0, fill: { color: C.bgLight }, shadow: makeShadow() });
    slide.addText("前端应用层 (Vue 3 + Vite)", { x: 0.6, y: 2.2, w: 3.5, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.primary, bold: true });
    const feModules = ["首页", "探索", "足迹(社区)", "旅行规划", "个人主页"];
    feModules.forEach((mod, i) => {
      const x = 0.7 + i * 1.78;
      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 2.55, w: 1.58, h: 0.45, fill: { color: C.accent } });
      slide.addText(mod, { x: x, y: 2.55, w: 1.58, h: 0.45, fontSize: 10, fontFace: "Calibri", color: C.bgWhite, align: "center", valign: "middle", bold: true });
    });

    // Arrow down
    slide.addShape(pres.shapes.LINE, { x: 5.0, y: 3.2, w: 0, h: 0.25, line: { color: C.accent, width: 2 } });

    // API / Service layer
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.5, w: 9.0, h: 0.7, fill: { color: "FEF3C7" }, shadow: makeShadow() });
    slide.addText("API / 服务层", { x: 0.6, y: 3.55, w: 2, h: 0.3, fontSize: 11, fontFace: "Calibri", color: "92400E", bold: true });
    slide.addText("Vite代理 → 讯飞星火API  |  高德地图REST API  |  CloudBase云函数 (auth / forum / travel-plans / upload)", { x: 0.6, y: 3.8, w: 8.5, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.textDark, align: "center" });

    // Arrow down
    slide.addShape(pres.shapes.LINE, { x: 5.0, y: 4.25, w: 0, h: 0.25, line: { color: C.accent, width: 2 } });

    // Data layer
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.55, w: 9.0, h: 0.7, fill: { color: "F0FDF4" }, shadow: makeShadow() });
    slide.addText("数据层", { x: 0.6, y: 4.6, w: 1, h: 0.3, fontSize: 11, fontFace: "Calibri", color: "166534", bold: true });
    slide.addText("CloudBase NoSQL数据库  ·  LocalStorage  ·  API缓存  ·  云存储(图片)", { x: 0.6, y: 4.85, w: 8.5, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.textDark, align: "center" });
  }

  // ==================== SLIDE 7: 核心功能 - AI旅行规划 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("04", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("核心功能：AI旅行规划", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Flow steps
    const steps = [
      { num: "1", title: "输入需求", desc: "用户输入旅行目的地\n天数、偏好等" },
      { num: "2", title: "AI生成计划", desc: "讯飞星火API生成\n详细每日行程" },
      { num: "3", title: "地点提取", desc: "自动提取地点名称\n地理编码定位" },
      { num: "4", title: "智能优化", desc: "筛选验证地点\n重新生成路线" },
      { num: "5", title: "地图展示", desc: "高德地图可视化\n路线与标记" },
    ];

    steps.forEach((s, i) => {
      const x = 0.3 + i * 1.9;
      slide.addShape(pres.shapes.OVAL, { x: x + 0.45, y: 1.1, w: 0.6, h: 0.6, fill: { color: C.primary } });
      slide.addText(s.num, { x: x + 0.45, y: 1.1, w: 0.6, h: 0.6, fontSize: 20, fontFace: "Arial Black", color: C.bgWhite, align: "center", valign: "middle", bold: true });
      if (i < steps.length - 1) {
        slide.addImage({ data: iconArrowWhite, x: x + 1.25, y: 1.25, w: 0.3, h: 0.3 });
      }
      slide.addText(s.title, { x: x, y: 1.85, w: 1.5, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.primary, bold: true, align: "center" });
      slide.addText(s.desc, { x: x, y: 2.15, w: 1.5, h: 0.6, fontSize: 9, fontFace: "Calibri", color: C.textMuted, align: "center" });
    });

    // Screenshot from footmarks.world
    if (imgTravelPlan) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.0, w: 9.0, h: 2.3, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.0, w: 9.0, h: 0.4, fill: { color: C.primary } });
      slide.addText("footmarks.world 旅行规划页面", { x: 0.5, y: 3.0, w: 9.0, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgTravelPlan, x: 0.7, y: 3.5, w: 8.6, h: 1.7, sizing: { type: "contain", w: 8.6, h: 1.7 } });
    }
  }

  // ==================== SLIDE 8: 核心功能 - 地图与交互 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("04", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("核心功能：地图可视化与交互", { x: 1.3, y: 0.3, w: 6, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Left: Map features
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 4.3, h: 1.7, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 0.06, h: 1.7, fill: { color: C.primary } });
    slide.addImage({ data: iconMapTeal, x: 0.75, y: 1.3, w: 0.35, h: 0.35 });
    slide.addText("地图核心能力", { x: 1.2, y: 1.3, w: 3, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.primary, bold: true });
    slide.addText([
      { text: "高德地图SDK集成", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "地理编码与反编码", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "可拖拽路线规划", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "地点标记与信息展示", options: { bullet: true, fontSize: 11, color: C.textDark } },
    ], { x: 0.75, y: 1.7, w: 3.8, h: 1.1, fontFace: "Calibri" });

    // Right: Interaction features
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.3, h: 1.7, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 0.06, h: 1.7, fill: { color: C.accent } });
    slide.addImage({ data: iconComments, x: 5.45, y: 1.3, w: 0.35, h: 0.35 });
    slide.addText("智能交互设计", { x: 5.9, y: 1.3, w: 3, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.accent, bold: true });
    slide.addText([
      { text: "AI对话式旅行咨询", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "Prompt工程优化结果", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "地点提取与验证闭环", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "实时重新生成计划", options: { bullet: true, fontSize: 11, color: C.textDark } },
    ], { x: 5.45, y: 1.7, w: 3.8, h: 1.1, fontFace: "Calibri" });

    // Screenshot
    if (imgTravelPlan) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.2, w: 9.0, h: 2.1, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.2, w: 9.0, h: 0.4, fill: { color: C.primary } });
      slide.addText("footmarks.world 地图路线展示", { x: 0.5, y: 3.2, w: 9.0, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgTravelPlan, x: 0.7, y: 3.7, w: 8.6, h: 1.5, sizing: { type: "contain", w: 8.6, h: 1.5 } });
    }
  }

  // ==================== SLIDE 9: 核心功能 - 社区与用户系统 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("04", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("核心功能：社区论坛与用户系统", { x: 1.3, y: 0.3, w: 7, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Community Forum
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 4.3, h: 2.2, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 4.3, h: 0.45, fill: { color: C.primary } });
    slide.addImage({ data: iconCommentsWhite, x: 0.7, y: 1.27, w: 0.3, h: 0.3 });
    slide.addText("足迹社区（论坛系统）", { x: 1.1, y: 1.25, w: 3.5, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.bgWhite, bold: true });
    slide.addText([
      { text: "发帖分享旅行经历与攻略", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "支持标签、位置、天数、预算", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "图片上传与展示", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "路线地点数组可视化", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "搜索与分页浏览", options: { bullet: true, fontSize: 11, color: C.textDark } },
    ], { x: 0.75, y: 1.75, w: 3.8, h: 1.5, fontFace: "Calibri" });

    // User System
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.3, h: 2.2, fill: { color: C.bgLight }, shadow: makeCardShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 4.3, h: 0.45, fill: { color: C.secondary } });
    slide.addImage({ data: iconDatabaseWhite, x: 5.4, y: 1.27, w: 0.3, h: 0.3 });
    slide.addText("用户系统与数据管理", { x: 5.8, y: 1.25, w: 3.5, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.bgWhite, bold: true });
    slide.addText([
      { text: "注册/登录（CloudBase认证）", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "AI生成个性化头像", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "个人主页管理旅行计划", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "旅行计划保存/复现/删除", options: { bullet: true, breakLine: true, fontSize: 11, color: C.textDark } },
      { text: "LocalStorage + CloudBase双存储", options: { bullet: true, fontSize: 11, color: C.textDark } },
    ], { x: 5.45, y: 1.75, w: 3.8, h: 1.5, fontFace: "Calibri" });

    // Screenshots side by side
    if (imgCommunity) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.7, w: 4.3, h: 1.6, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.7, w: 4.3, h: 0.35, fill: { color: C.primary } });
      slide.addText("社区论坛页面", { x: 0.5, y: 3.7, w: 4.3, h: 0.35, fontSize: 10, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgCommunity, x: 0.6, y: 4.1, w: 4.1, h: 1.1, sizing: { type: "contain", w: 4.1, h: 1.1 } });
    }
    if (imgProfile) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 3.7, w: 4.3, h: 1.6, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 3.7, w: 4.3, h: 0.35, fill: { color: C.secondary } });
      slide.addText("个人主页", { x: 5.2, y: 3.7, w: 4.3, h: 0.35, fontSize: 10, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgProfile, x: 5.3, y: 4.1, w: 4.1, h: 1.1, sizing: { type: "contain", w: 4.1, h: 1.1 } });
    }
  }

  // ==================== SLIDE 10: 核心功能 - 探索页面 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("04", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("核心功能：智能探索", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    const exploreFeatures = [
      { icon: iconSearch, title: "智能搜索", desc: "基于AI的目的地搜索\n支持URL参数直达" },
      { icon: iconStar, title: "热门推荐", desc: "精选热门景点卡片\nAI生成景点图片" },
      { icon: iconRobotTeal, title: "AI导游", desc: "对话式景点介绍\n专业旅行规划师" },
    ];

    exploreFeatures.forEach((f, i) => {
      const x = 0.5 + i * 3.1;
      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 1.2, w: 2.8, h: 1.5, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addImage({ data: f.icon, x: x + 0.2, y: 1.3, w: 0.35, h: 0.35 });
      slide.addText(f.title, { x: x + 0.65, y: 1.3, w: 1.9, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(f.desc, { x: x + 0.2, y: 1.75, w: 2.4, h: 0.8, fontSize: 11, fontFace: "Calibri", color: C.textDark });
    });

    // Screenshot
    if (imgExplore) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.0, w: 9.0, h: 2.3, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.0, w: 9.0, h: 0.4, fill: { color: C.primary } });
      slide.addText("footmarks.world 探索页面", { x: 0.5, y: 3.0, w: 9.0, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgExplore, x: 0.7, y: 3.5, w: 8.6, h: 1.7, sizing: { type: "contain", w: 8.6, h: 1.7 } });
    }
  }

  // ==================== SLIDE 11: 云函数与后端 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("04", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("后端实现：云函数与云服务", { x: 1.3, y: 0.3, w: 6, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    const cfData = [
      [
        { text: "云函数", options: { fill: { color: C.primary }, color: C.bgWhite, bold: true, fontSize: 11 } },
        { text: "功能", options: { fill: { color: C.primary }, color: C.bgWhite, bold: true, fontSize: 11 } },
        { text: "核心技术", options: { fill: { color: C.primary }, color: C.bgWhite, bold: true, fontSize: 11 } },
      ],
      [
        { text: "auth", options: { fontSize: 11, color: C.textDark } },
        { text: "用户注册/登录/认证", options: { fontSize: 11, color: C.textDark } },
        { text: "CloudBase Auth + 密码加密", options: { fontSize: 11, color: C.textMuted } },
      ],
      [
        { text: "forum", options: { fontSize: 11, color: C.textDark } },
        { text: "社区帖子CRUD", options: { fontSize: 11, color: C.textDark } },
        { text: "NoSQL数据库 + 分页查询", options: { fontSize: 11, color: C.textMuted } },
      ],
      [
        { text: "travel-plans", options: { fontSize: 11, color: C.textDark } },
        { text: "旅行计划存储管理", options: { fontSize: 11, color: C.textDark } },
        { text: "NoSQL + 用户关联", options: { fontSize: 11, color: C.textMuted } },
      ],
      [
        { text: "upload-image", options: { fontSize: 11, color: C.textDark } },
        { text: "图片上传与存储", options: { fontSize: 11, color: C.textDark } },
        { text: "云存储 + CDN", options: { fontSize: 11, color: C.textMuted } },
      ],
    ];
    slide.addTable(cfData, {
      x: 0.5, y: 1.2, w: 9.0,
      colW: [2.0, 3.0, 4.0],
      border: { pt: 0.5, color: C.border },
      rowH: [0.4, 0.4, 0.4, 0.4, 0.4],
    });

    slide.addText("关键技术实现", { x: 0.5, y: 3.5, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.primary, bold: true });

    const techFeatures = [
      { icon: iconShield, title: "安全认证", desc: "CloudBase Auth + 密码加密\n+ 权限控制" },
      { icon: iconDatabase, title: "数据持久化", desc: "NoSQL文档数据库 +\nAPI缓存策略" },
      { icon: iconCode, title: "API代理", desc: "Vite Proxy转发，\n隐藏API密钥" },
    ];

    techFeatures.forEach((f, i) => {
      const x = 0.5 + i * 3.1;
      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 4.0, w: 2.8, h: 1.3, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addImage({ data: f.icon, x: x + 0.2, y: 4.1, w: 0.35, h: 0.35 });
      slide.addText(f.title, { x: x + 0.65, y: 4.1, w: 1.9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(f.desc, { x: x + 0.2, y: 4.55, w: 2.4, h: 0.6, fontSize: 10, fontFace: "Calibri", color: C.textDark });
    });
  }

  // ==================== SLIDE 12: 部署上线 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("05", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("部署上线", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Deployment URL card
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 9.0, h: 1.2, fill: { color: C.primary }, shadow: makeCardShadow() });
    slide.addImage({ data: iconRocket, x: 0.8, y: 1.35, w: 0.8, h: 0.8 });
    slide.addText([
      { text: "网站已上线", options: { fontSize: 20, color: C.bgWhite, bold: true, breakLine: true } },
      { text: "https://footmarks.world", options: { fontSize: 28, color: C.accentLight, bold: true } },
    ], { x: 1.8, y: 1.3, w: 7, h: 1.0, fontFace: "Arial Black" });

    // Deployment details
    const deployItems = [
      { icon: iconCloud, title: "Vercel部署", desc: "前端SPA部署于Vercel\n全球CDN加速，自动HTTPS" },
      { icon: iconServer, title: "CloudBase云函数", desc: "4个Serverless云函数\n弹性扩缩，零运维成本" },
      { icon: iconDatabase, title: "CloudBase数据库", desc: "NoSQL文档数据库\n云端持久化存储" },
    ];

    deployItems.forEach((item, i) => {
      const x = 0.5 + i * 3.1;
      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 2.7, w: 2.8, h: 1.5, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addImage({ data: item.icon, x: x + 0.2, y: 2.8, w: 0.4, h: 0.4 });
      slide.addText(item.title, { x: x + 0.7, y: 2.8, w: 1.9, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(item.desc, { x: x + 0.2, y: 3.3, w: 2.4, h: 0.8, fontSize: 11, fontFace: "Calibri", color: C.textDark });
    });

    // Home page screenshot
    if (imgHome) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 9.0, h: 1.0, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 9.0, h: 0.3, fill: { color: C.secondary } });
      slide.addText("footmarks.world 首页", { x: 0.5, y: 4.4, w: 9.0, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgHome, x: 0.6, y: 4.75, w: 8.8, h: 0.6, sizing: { type: "contain", w: 8.8, h: 0.6 } });
    }
  }

  // ==================== SLIDE 13: 成果展示 - 首页与规划 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("05", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("成果展示：首页与规划", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    // Two side-by-side screenshots
    if (imgHome) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.1, w: 4.3, h: 4.1, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.1, w: 4.3, h: 0.45, fill: { color: C.primary } });
      slide.addText("首页 - footmarks.world", { x: 0.5, y: 1.1, w: 4.3, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgHome, x: 0.6, y: 1.65, w: 4.1, h: 3.4, sizing: { type: "contain", w: 4.1, h: 3.4 } });
    }
    if (imgTravelPlan) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.3, h: 4.1, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.3, h: 0.45, fill: { color: C.secondary } });
      slide.addText("旅行规划", { x: 5.2, y: 1.1, w: 4.3, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgTravelPlan, x: 5.3, y: 1.65, w: 4.1, h: 3.4, sizing: { type: "contain", w: 4.1, h: 3.4 } });
    }
  }

  // ==================== SLIDE 14: 成果展示 - 探索与社区 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("05", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("成果展示：探索与社区", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    if (imgExplore) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.1, w: 4.3, h: 4.1, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.1, w: 4.3, h: 0.45, fill: { color: C.accent } });
      slide.addText("探索页面", { x: 0.5, y: 1.1, w: 4.3, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgExplore, x: 0.6, y: 1.65, w: 4.1, h: 3.4, sizing: { type: "contain", w: 4.1, h: 3.4 } });
    }
    if (imgCommunity) {
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.3, h: 4.1, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.3, h: 0.45, fill: { color: C.gold } });
      slide.addText("足迹社区", { x: 5.2, y: 1.1, w: 4.3, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.bgWhite, align: "center", bold: true });
      slide.addImage({ data: imgCommunity, x: 5.3, y: 1.65, w: 4.1, h: 3.4, sizing: { type: "contain", w: 4.1, h: 3.4 } });
    }
  }

  // ==================== SLIDE 15: 创新点 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("06", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("项目创新点", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    const innovations = [
      { num: "1", title: "AI闭环规划", desc: "「生成→提取→验证→优化→再生成」的智能闭环，\n确保旅行路线合理可行，克服LLM幻觉问题" },
      { num: "2", title: "多端演进架构", desc: "从小程序到Web全栈的架构演进，\n保留核心AI能力的同时拓展社交与社区功能" },
      { num: "3", title: "地图+AI深度融合", desc: "高德地图SDK与LLM的深度集成，\n实现地点自动提取、地理编码、路线可视化一体化" },
      { num: "4", title: "Serverless全栈上线", desc: "基于CloudBase + Vercel的Serverless架构，\n零运维成本，已成功部署至 footmarks.world" },
    ];

    innovations.forEach((item, i) => {
      const y = 1.2 + i * 1.05;
      slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: y, w: 9.0, h: 0.85, fill: { color: C.bgLight }, shadow: makeShadow() });
      slide.addShape(pres.shapes.OVAL, { x: 0.7, y: y + 0.15, w: 0.55, h: 0.55, fill: { color: C.primary } });
      slide.addText(item.num, { x: 0.7, y: y + 0.15, w: 0.55, h: 0.55, fontSize: 20, fontFace: "Arial Black", color: C.bgWhite, align: "center", valign: "middle", bold: true });
      slide.addText(item.title, { x: 1.5, y: y + 0.05, w: 3, h: 0.35, fontSize: 15, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(item.desc, { x: 1.5, y: y + 0.38, w: 7.5, h: 0.45, fontSize: 11, fontFace: "Calibri", color: C.textDark });
    });
  }

  // ==================== SLIDE 16: 对比与改进 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("06", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("小程序 vs Web版 对比", { x: 1.3, y: 0.3, w: 6, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    const compData = [
      [
        { text: "对比维度", options: { fill: { color: C.primary }, color: C.bgWhite, bold: true, fontSize: 12 } },
        { text: "微信小程序版", options: { fill: { color: C.primary }, color: C.bgWhite, bold: true, fontSize: 12 } },
        { text: "Web全栈版", options: { fill: { color: C.primary }, color: C.bgWhite, bold: true, fontSize: 12 } },
      ],
      [
        { text: "AI模型", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "Qwen3-4B (本地部署)", options: { fontSize: 11, color: C.textDark } },
        { text: "讯飞星火API (云端)", options: { fontSize: 11, color: C.textDark } },
      ],
      [
        { text: "地图服务", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "腾讯地图", options: { fontSize: 11, color: C.textDark } },
        { text: "高德地图 + 路线规划", options: { fontSize: 11, color: C.textDark } },
      ],
      [
        { text: "多模态输入", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "图片上传 + AR识别", options: { fontSize: 11, color: C.textDark } },
        { text: "AI对话 + 智能搜索", options: { fontSize: 11, color: C.textDark } },
      ],
      [
        { text: "社区功能", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "无", options: { fontSize: 11, color: C.textMuted, italic: true } },
        { text: "论坛 + 评论 + 分享", options: { fontSize: 11, color: C.accent, bold: true } },
      ],
      [
        { text: "数据存储", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "本地存储", options: { fontSize: 11, color: C.textDark } },
        { text: "CloudBase NoSQL + 云函数", options: { fontSize: 11, color: C.textDark } },
      ],
      [
        { text: "用户系统", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "微信登录", options: { fontSize: 11, color: C.textDark } },
        { text: "注册/登录 + 个人主页", options: { fontSize: 11, color: C.textDark } },
      ],
      [
        { text: "部署状态", options: { bold: true, fontSize: 11, color: C.textDark } },
        { text: "本地运行", options: { fontSize: 11, color: C.textMuted, italic: true } },
        { text: "已上线 footmarks.world", options: { fontSize: 11, color: C.accent, bold: true } },
      ],
    ];
    slide.addTable(compData, {
      x: 0.5, y: 1.1, w: 9.0,
      colW: [2.0, 3.5, 3.5],
      border: { pt: 0.5, color: C.border },
      rowH: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
    });

    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.8, w: 9.0, h: 0.55, fill: { color: C.bgLight }, shadow: makeShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.8, w: 0.06, h: 0.55, fill: { color: C.accent } });
    slide.addText("核心升级：从单机工具 → 云端全栈社交平台，从AI对话 → AI+地图+社区三位一体，已成功上线", { x: 0.75, y: 4.8, w: 8.5, h: 0.55, fontSize: 12, fontFace: "Calibri", color: C.primary, bold: true, valign: "middle" });
  }

  // ==================== SLIDE 17: 未来展望 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bgWhite };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.primary } });
    slide.addText("06", { x: 0.5, y: 0.3, w: 0.8, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.accent, bold: true });
    slide.addText("未来展望", { x: 1.3, y: 0.3, w: 5, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: C.textDark, bold: true });

    const outlooks = [
      { icon: iconBrain, title: "多模态输出增强", desc: "AIGC自动生成图片与视频等多媒体内容，\n丰富AI导游的回答形式" },
      { icon: iconGlobe, title: "多端协同", desc: "小程序与Web数据互通，\n统一用户体系与旅行计划同步" },
      { icon: iconChart, title: "智能推荐引擎", desc: "基于用户偏好的个性化推荐，\n协同过滤 + AI推荐" },
      { icon: iconShield, title: "商业化探索", desc: "旅行产品推荐与预订，\n社交生态构建" },
    ];

    outlooks.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 4.7;
      const y = 1.2 + row * 2.0;

      slide.addShape(pres.shapes.RECTANGLE, { x: x, y: y, w: 4.3, h: 1.7, fill: { color: C.bgLight }, shadow: makeCardShadow() });
      slide.addImage({ data: item.icon, x: x + 0.3, y: y + 0.2, w: 0.4, h: 0.4 });
      slide.addText(item.title, { x: x + 0.85, y: y + 0.15, w: 3, h: 0.4, fontSize: 15, fontFace: "Calibri", color: C.primary, bold: true });
      slide.addText(item.desc, { x: x + 0.3, y: y + 0.7, w: 3.7, h: 0.8, fontSize: 11, fontFace: "Calibri", color: C.textDark });
    });
  }

  // ==================== SLIDE 18: 总结 ====================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.dark };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.accent } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.545, w: 10, h: 0.08, fill: { color: C.accent } });

    slide.addImage({ data: iconGlobeWhite, x: 4.5, y: 0.5, w: 1.0, h: 1.0 });
    slide.addText("感谢聆听", { x: 0.5, y: 1.6, w: 9, h: 0.8, fontSize: 40, fontFace: "Arial Black", color: C.bgWhite, align: "center", bold: true });

    const summaryPoints = [
      "构建了AI驱动的智能旅行助手，从微信小程序演进为Web全栈应用",
      "实现了AI规划 + 地图可视化 + 社区论坛的核心功能闭环",
      "基于Serverless架构，零运维成本，弹性可扩展",
      "已成功部署上线，访问 footmarks.world 即可体验",
    ];

    summaryPoints.forEach((point, i) => {
      const y = 2.7 + i * 0.5;
      slide.addImage({ data: iconCheckWhite, x: 1.2, y: y + 0.03, w: 0.3, h: 0.3 });
      slide.addText(point, { x: 1.7, y: y, w: 7.0, h: 0.4, fontSize: 13, fontFace: "Calibri", color: C.accentLight });
    });

    slide.addShape(pres.shapes.LINE, { x: 3.0, y: 4.8, w: 4.0, h: 0, line: { color: C.accent, width: 1, dashType: "dash" } });

    slide.addText([
      { text: "灵犀旅伴 · FDUROP结项报告", options: { breakLine: true, fontSize: 14, color: C.textLight } },
      { text: "负责人：丁弈诚  |  成员：张洗镔、陶天宇  |  指导老师：冯辉", options: { fontSize: 11, color: C.textMuted } },
    ], { x: 0.5, y: 4.9, w: 9, h: 0.5, fontFace: "Calibri", align: "center" });
  }

  // Write file
  const outputPath = "C:\\Users\\丁弈诚\\Desktop\\灵犀旅伴文档代码\\2025SJ01-FDUROP结项报告-丁弈诚-v2.pptx";
  await pres.writeFile({ fileName: outputPath });
  console.log("PPT generated: " + outputPath);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
