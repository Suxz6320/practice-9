/* 首页逻辑：统计卡片 + ECharts + Chart.js 图表（原生 DOM，不依赖 jQuery） */
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
      window.showToast('数据加载失败：' + err.message, 'danger', 4000);
      ['chart-building','chart-pie','chart-traffic'].forEach(function (id) {
        window.renderError('#' + id, '无法加载数据：' + err.message);
      });
    });

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

  function renderBuildingChart(data) {
    var dom = document.getElementById('chart-building');
    if (!dom) { console.error('chart-building 容器不存在'); return; }
    if (typeof echarts === 'undefined') {
      window.renderError(dom, 'ECharts 库未加载，请检查网络连接或使用本地服务器。');
      return;
    }
    var chart = echarts.init(dom);
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

  function renderPieChart(data) {
    var ctx = document.getElementById('chart-pie');
    if (!ctx) { console.error('chart-pie 容器不存在'); return; }
    if (typeof Chart === 'undefined') {
      window.renderError(ctx, 'Chart.js 库未加载，请检查网络连接或使用本地服务器。');
      return;
    }
    var colors = ['#2c5f8d', '#4a8bc2', '#e67e22', '#27ae60', '#9b59b6'];
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(function (d) { return d.name; }),
        datasets: [{
          data: data.map(function (d) { return d.value; }),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function (c) {
                var total = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = ((c.parsed / total) * 100).toFixed(1);
                return c.label + ': ' + c.parsed + ' 座 (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  function renderTrafficChart(data) {
    var dom = document.getElementById('chart-traffic');
    if (!dom) { console.error('chart-traffic 容器不存在'); return; }
    if (typeof echarts === 'undefined') {
      window.renderError(dom, 'ECharts 库未加载，请检查网络连接或使用本地服务器。');
      return;
    }
    var chart = echarts.init(dom);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.map(function (d) { return d.day; }), boundaryGap: false },
      yAxis: { type: 'value', name: '客流量（人次）' },
      series: [{
        name: '客流量',
        type: 'line',
        smooth: true,
        data: data.map(function (d) { return d.traffic; }),
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 3, color: '#2c5f8d' },
        itemStyle: { color: '#2c5f8d' },
        symbol: 'circle',
        symbolSize: 8
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }
})();
