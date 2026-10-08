/* 公共逻辑：数据加载、错误提示、导航高亮 */
(function () {
  'use strict';

  // 内嵌兜底数据（当 file:// 协议下 fetch 失败时使用）
  const FALLBACK = {
    'data/study-rooms.json': window.__ROOMS_FALLBACK__,
    'data/cafeteria.json': window.__CAFETERIA_FALLBACK__,
    'data/stats.json': window.__STATS_FALLBACK__
  };

  /**
   * 加载 JSON 数据。
   * - file:// 协议下直接使用内嵌兜底数据（fetch 会因 CORS 失败或挂起）
   * - http(s):// 下优先 fetch，失败时回退到兜底数据
   * @param {string} url - JSON 文件路径
   * @returns {Promise<any>} 解析后的数据
   */
  window.loadJSON = function (url) {
    // file:// 协议下 fetch 不可靠，直接用兜底数据
    if (window.location.protocol === 'file:') {
      console.warn('[loadJSON] file:// 协议，直接使用兜底数据:', url);
      const data = FALLBACK[url];
      if (data === undefined) {
        return Promise.reject(new Error('数据加载失败：' + url + '（file:// 协议无兜底数据）'));
      }
      return Promise.resolve(data);
    }
    // 正常 http(s) 协议，使用 fetch
    return fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .catch(function (err) {
        console.warn('[loadJSON] fetch 失败，使用内嵌兜底数据:', url, err.message);
        const data = FALLBACK[url];
        if (data === undefined) {
          throw new Error('数据加载失败：' + url + '，且无兜底数据。');
        }
        return data;
      });
  };

  /**
   * 显示提示信息（成功 / 警告 / 危险）
   * @param {string} message
   * @param {string} type - success | warning | danger | info
   * @param {number} duration - 自动关闭毫秒数，0 表示不自动关闭
   */
  window.showToast = function (message, type, duration) {
    type = type || 'info';
    duration = duration === undefined ? 2500 : duration;
    const colors = {
      success: '#27ae60',
      warning: '#f39c12',
      danger: '#e74c3c',
      info: '#2c5f8d'
    };
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: colors[type] || colors.info,
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      fontSize: '14px',
      opacity: '0',
      transition: 'opacity 0.3s, transform 0.3s',
      transform: 'translateY(-10px)'
    });
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    if (duration > 0) {
      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(function () { toast.remove(); }, 300);
      }, duration);
    }
    return toast;
  };

  /**
   * 在指定容器内渲染错误提示
   */
  window.renderError = function (container, message) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    el.innerHTML = '<div class="alert-box" style="background:#fdecea;border-left:4px solid #e74c3c;color:#922b21;">' +
      '<strong>加载出错：</strong>' + message +
      '</div>';
  };

  /**
   * 渲染空状态
   */
  window.renderEmpty = function (container, message) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><p>' + (message || '暂无数据') + '</p></div>';
  };

  /**
   * 高亮当前导航项
   */
  window.highlightNav = function (pageId) {
    document.querySelectorAll('.navbar-nav .nav-link').forEach(function (link) {
      if (link.dataset.page === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  /**
   * 计算座位占用率百分比
   */
  window.occupancyPercent = function (occupied, capacity) {
    if (!capacity || capacity <= 0) return 0;
    return Math.round((occupied / capacity) * 100);
  };
})();
