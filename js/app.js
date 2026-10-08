/* 公共逻辑：数据加载、错误提示、导航高亮 */
(function () {
  'use strict';

  // ===== 兜底数据直接内联（消除对 fallback-data.js 的依赖）=====
  var ROOMS_FALLBACK = [
    {"id":1,"name":"图书馆一楼自习室A","building":"图书馆","floor":1,"capacity":80,"occupied":45,"openTime":"06:00-22:30","hasPower":true,"hasWifi":true,"quiet":true,"status":"开放"},
    {"id":2,"name":"图书馆一楼自习室B","building":"图书馆","floor":1,"capacity":60,"occupied":60,"openTime":"06:00-22:30","hasPower":true,"hasWifi":true,"quiet":true,"status":"满座"},
    {"id":3,"name":"图书馆二楼研讨间1","building":"图书馆","floor":2,"capacity":12,"occupied":8,"openTime":"08:00-22:00","hasPower":true,"hasWifi":true,"quiet":false,"status":"开放"},
    {"id":4,"name":"图书馆三楼静音区","building":"图书馆","floor":3,"capacity":120,"occupied":70,"openTime":"06:00-23:00","hasPower":true,"hasWifi":true,"quiet":true,"status":"开放"},
    {"id":5,"name":"教学楼A101自习室","building":"教学楼A","floor":1,"capacity":100,"occupied":30,"openTime":"07:00-22:00","hasPower":false,"hasWifi":true,"quiet":true,"status":"开放"},
    {"id":6,"name":"教学楼A305自习室","building":"教学楼A","floor":3,"capacity":80,"occupied":25,"openTime":"07:00-22:00","hasPower":true,"hasWifi":true,"quiet":true,"status":"开放"},
    {"id":7,"name":"教学楼B201自习室","building":"教学楼B","floor":2,"capacity":90,"occupied":50,"openTime":"07:00-22:00","hasPower":true,"hasWifi":false,"quiet":true,"status":"开放"},
    {"id":8,"name":"教学楼B402自习室","building":"教学楼B","floor":4,"capacity":70,"occupied":70,"openTime":"07:00-22:00","hasPower":false,"hasWifi":true,"quiet":false,"status":"满座"},
    {"id":9,"name":"实验楼C201通宵自习室","building":"实验楼C","floor":2,"capacity":50,"occupied":20,"openTime":"全天开放","hasPower":true,"hasWifi":true,"quiet":true,"status":"开放"},
    {"id":10,"name":"实验楼C301自习室","building":"实验楼C","floor":3,"capacity":60,"occupied":0,"openTime":"08:00-21:00","hasPower":true,"hasWifi":true,"quiet":true,"status":"维护中"},
    {"id":11,"name":"信息楼D501自习室","building":"信息楼D","floor":5,"capacity":40,"occupied":15,"openTime":"08:30-21:30","hasPower":true,"hasWifi":true,"quiet":true,"status":"开放"},
    {"id":12,"name":"信息楼D502研讨室","building":"信息楼D","floor":5,"capacity":16,"occupied":10,"openTime":"08:30-21:30","hasPower":true,"hasWifi":true,"quiet":false,"status":"开放"}
  ];

  var CAFETERIA_FALLBACK = [
    {"id":1,"name":"第一食堂","location":"东区","floors":3,"seats":600,"occupied":420,"rating":4.3,"priceLevel":2,"popularDishes":["红烧肉套餐","清蒸鲈鱼","番茄炒蛋"],"openTime":"06:30-20:00","weeklyTraffic":[320,380,350,400,420,280,180]},
    {"id":2,"name":"第二食堂","location":"西区","floors":2,"seats":400,"occupied":300,"rating":4.1,"priceLevel":1,"popularDishes":["黄焖鸡米饭","兰州拉面","沙县小吃"],"openTime":"06:30-21:00","weeklyTraffic":[280,320,300,340,360,240,150]},
    {"id":3,"name":"第三食堂（清真）","location":"南区","floors":1,"seats":200,"occupied":120,"rating":4.5,"priceLevel":2,"popularDishes":["新疆大盘鸡","兰州牛肉面","手抓饭"],"openTime":"07:00-20:30","weeklyTraffic":[180,210,195,220,230,160,100]},
    {"id":4,"name":"教工食堂","location":"北区","floors":2,"seats":300,"occupied":150,"rating":4.6,"priceLevel":3,"popularDishes":["小炒黄牛肉","清蒸武昌鱼","蒜蓉西兰花"],"openTime":"07:00-19:30","weeklyTraffic":[150,180,170,190,200,80,50]},
    {"id":5,"name":"美食广场","location":"中心区","floors":1,"seats":500,"occupied":450,"rating":4.2,"priceLevel":2,"popularDishes":["麻辣香锅","韩式炸鸡","日式寿司"],"openTime":"10:00-22:00","weeklyTraffic":[400,450,420,480,520,380,260]}
  ];

  var STATS_FALLBACK = {
    "overview":{"studyRooms":12,"totalSeats":778,"occupiedSeats":403,"cafeterias":5,"cafeteriaSeats":2000,"activeStudents":4030},
    "occupancyByBuilding":[
      {"building":"图书馆","seats":272,"occupied":183},
      {"building":"教学楼A","seats":180,"occupied":55},
      {"building":"教学楼B","seats":160,"occupied":120},
      {"building":"实验楼C","seats":110,"occupied":20},
      {"building":"信息楼D","seats":56,"occupied":25}
    ],
    "cafeteriaRating":[
      {"name":"第一食堂","rating":4.3},
      {"name":"第二食堂","rating":4.1},
      {"name":"第三食堂","rating":4.5},
      {"name":"教工食堂","rating":4.6},
      {"name":"美食广场","rating":4.2}
    ],
    "weeklyTraffic":[
      {"day":"周一","traffic":1330},
      {"day":"周二","traffic":1540},
      {"day":"周三","traffic":1435},
      {"day":"周四","traffic":1630},
      {"day":"周五","traffic":1730},
      {"day":"周六","traffic":1140},
      {"day":"周日","traffic":740}
    ],
    "seatDistribution":[
      {"name":"图书馆","value":272},
      {"name":"教学楼A","value":180},
      {"name":"教学楼B","value":160},
      {"name":"实验楼C","value":110},
      {"name":"信息楼D","value":56}
    ]
  };

  var FALLBACK = {
    'data/study-rooms.json': ROOMS_FALLBACK,
    'data/cafeteria.json': CAFETERIA_FALLBACK,
    'data/stats.json': STATS_FALLBACK
  };

  // ===== 数据加载 =====
  window.loadJSON = function (url) {
    // file:// 协议下 fetch 不可靠，直接用兜底数据
    if (window.location.protocol === 'file:') {
      console.warn('[loadJSON] file:// 协议，直接使用兜底数据:', url);
      var data = FALLBACK[url];
      if (data === undefined) {
        return Promise.reject(new Error('无兜底数据: ' + url));
      }
      return Promise.resolve(JSON.parse(JSON.stringify(data)));
    }
    // 正常 http(s) 协议
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.warn('[loadJSON] fetch 失败，使用兜底数据:', url, err.message);
        var fb = FALLBACK[url];
        if (fb === undefined) throw new Error('数据加载失败：' + url);
        return JSON.parse(JSON.stringify(fb));
      });
  };

  // ===== 提示 / 错误 / 空状态 =====
  window.showToast = function (message, type, duration) {
    type = type || 'info';
    duration = duration === undefined ? 2500 : duration;
    var colors = { success:'#27ae60', warning:'#f39c12', danger:'#e74c3c', info:'#2c5f8d' };
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;top:80px;right:20px;background:' +
      (colors[type]||colors.info) + ';color:#fff;padding:10px 20px;border-radius:6px;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;font-size:14px;opacity:0;' +
      'transition:opacity 0.3s,transform 0.3s;transform:translateY(-10px);';
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

  window.renderError = function (container, message) {
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    el.innerHTML = '<div style="background:#fdecea;border-left:4px solid #e74c3c;color:#922b21;' +
      'border-radius:0.5rem;padding:0.75rem 1rem;"><strong>出错：</strong>' + message + '</div>';
  };

  window.renderEmpty = function (container, message) {
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:#95a5a6;">' +
      '<p>' + (message || '暂无数据') + '</p></div>';
  };

  window.highlightNav = function (pageId) {
    var links = document.querySelectorAll('.navbar-nav .nav-link');
    for (var i = 0; i < links.length; i++) {
      if (links[i].dataset.page === pageId) {
        links[i].classList.add('active');
      } else {
        links[i].classList.remove('active');
      }
    }
  };

  window.occupancyPercent = function (occupied, capacity) {
    if (!capacity || capacity <= 0) return 0;
    return Math.round((occupied / capacity) * 100);
  };

  // ===== 诊断：检查库是否加载（控制台输出）=====
  console.log('[诊断] jQuery:', typeof $ !== 'undefined' ? 'OK' : '未加载');
  console.log('[诊断] ECharts:', typeof echarts !== 'undefined' ? 'OK' : '未加载');
  console.log('[诊断] Chart.js:', typeof Chart !== 'undefined' ? 'OK' : '未加载');
  console.log('[诊断] Three.js:', typeof THREE !== 'undefined' ? 'OK' : '未加载');
  console.log('[诊断] 协议:', window.location.protocol);
})();
