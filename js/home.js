/* 首页逻辑：统计卡片 + ECharts 三类图表（原生 DOM，不依赖 jQuery/Chart.js） */
(function () {
  'use strict';

  window.highlightNav('home');

  window.loadJSON('data/stats.json')
    .then(function (stats) {
      try { renderStats(stats.overview); } catch (e) { console.error('renderStats:', e); }
      try { renderBuildingChart(stats.occupancyByBuilding); } catch (e) { console.error('renderBuildingChart:', e); }
      try { renderPieChart(stats.seatDistribution); } catch (e) { console.error('renderPieChart:', e); }
      try { renderTrafficChart(stats.weeklyTraffic); } catch (e) { console.error('renderTrafficChart:', e); }
    })
    .catch(function (err) {
      console.error('首页数据加载失败:', err);
      ['chart-building','chart-pie','chart-traffic'].forEach(function (id) {
        window.renderError('#' + id, '无法加载数据：' + err.message);
      });
    });

  // 清空容器的"正在加载…"文字，返回 DOM 元素
  function getChartDom(id) {
    var dom = document.getElementById(id);
    if (!dom) { console.error('容器不存在:', id); return null; }
    dom.innerHTML = ''; // 清空"正在加载…"
    return dom;
  }

  // 检查 ECharts 是否加载
  function checkEcharts(dom) {
    if (typeof echarts === 'undefined') {
      window.renderError(dom, 'ECharts 库未加载，请检查网络连接。');
      return null;
    }
    return echarts.init(dom);
  }

  function renderStats(ov) {
    var set = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('stat-rooms', ov.studyRooms);
    set('stat-seats', ov.totalSeats);
    set('stat-occupied', ov.occupiedSeats);
    set('stat-cafeteria', ov.cafeterias);
  }

  // ECharts 柱状图：各教学楼座位占用
  function renderBuildingChart(data) {
    var dom = getChartDom('chart-building');
    if (!dom) return;
    var chart = checkEcharts(dom);
    if (!chart) return;
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['已占用', '空闲'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.map(function (d) { return d.building; }) },
      yAxis: { type: 'value', name: '座位数' },
      series: [
        { name: '已占用', type: 'bar', stack: 'total', data: data.map(function (d) { return d.occupied; }), itemStyle: { color: '#e67e22' } },
        { name: '空闲', type: 'bar', stack: 'total', data: data.map(function (d) { return Math.max(0, d.seats - d.occupied); }), itemStyle: { color: '#27ae60' } }
      ]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  // ECharts 饼图：座位分布占比（原来用 Chart.js，改用 ECharts 避免 canvas 问题）
  function renderPieChart(data) {
    var dom = getChartDom('chart-pie');
    if (!dom) return;
    var chart = checkEcharts(dom);
    if (!chart) return;
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 座 ({d}%)' },
      legend: { bottom: 0, labels: { font: { size: 11 } } },
      series: [{
        name: '座位分布',
        type: 'pie',
        radius: ['40%', '70%'],   // 环形图
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: data.map(function (d, i) {
          var colors = ['#2c5f8d', '#4a8bc2', '#e67e22', '#27ae60', '#9b59b6'];
          return { value: d.value, name: d.name, itemStyle: { color: colors[i % colors.length] } };
        })
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  // ECharts 折线图：本周食堂客流（自包含，带内联兜底数据）
  function renderTrafficChart(data) {
    var dom = document.getElementById('chart-traffic');
    if (!dom) { console.error('chart-traffic 容器不存在'); return; }
    // 如果传入数据为空，用内联兜底
    if (!data || !data.length) {
      data = [
        { day: '周一', traffic: 1330 }, { day: '周二', traffic: 1540 },
        { day: '周三', traffic: 1435 }, { day: '周四', traffic: 1630 },
        { day: '周五', traffic: 1730 }, { day: '周六', traffic: 1140 },
        { day: '周日', traffic: 740 }
      ];
    }
    dom.innerHTML = '';
    dom.style.height = '320px';
    if (typeof echarts === 'undefined') {
      dom.innerHTML = '<div style="color:#e74c3c;padding:20px;">ECharts 库未加载</div>';
      return;
    }
    var chart = echarts.init(dom);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(function (d) { return d.day; })
      },
      yAxis: { type: 'value', name: '人次' },
      series: [{
        name: '客流量',
        type: 'line',
        smooth: true,
        data: data.map(function (d) { return d.traffic; }),
        itemStyle: { color: '#2c5f8d' },
        areaStyle: { color: 'rgba(44,95,141,0.15)' }
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }
})();
