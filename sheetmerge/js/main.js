/**
 * 应用初始化入口
 */

// 等待DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
