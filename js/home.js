/* 首页逻辑：统计卡片 + ECharts + Chart.js 图表 */
(function () {
  'use strict';

  // 高亮导航
  window.highlightNav('home');

  // 加载统计数据并渲染
  window.loadJSON('data/stats.json')
    .then(function (stats) {
      renderStats(stats.overview);
      renderBuildingChart(stats.occupancyByBuilding);
      renderPieChart(stats.seatDistribution);
      renderTrafficChart(stats.weeklyTraffic);
    })
    .catch(function (err) {
      console.error(err);
      window.showToast('数据加载失败：' + err.message, 'danger', 4000);
      window.renderError('#chart-building', '无法加载统计数据，请检查网络或本地服务器。');
    });

  // 渲染统计卡片
  function renderStats(ov) {
    $('#stat-rooms').text(ov.studyRooms);
    $('#stat-seats').text(ov.totalSeats);
    $('#stat-occupied').text(ov.occupiedSeats);
    $('#stat-cafeteria').text(ov.cafeterias);
  }

  // ECharts：各教学楼自习座位占用情况（堆叠柱状图）
  function renderBuildingChart(data) {
    const dom = document.getElementById('chart-building');
    if (!dom || typeof echarts === 'undefined') return;
    const chart = echarts.init(dom);
    const names = data.map(function (d) { return d.building; });
    const occupied = data.map(function (d) { return d.occupied; });
    const free = data.map(function (d) { return Math.max(0, d.seats - d.occupied); });

    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['已占用', '空闲'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: names },
      yAxis: { type: 'value', name: '座位数' },
      series: [
        {
          name: '已占用',
          type: 'bar',
          stack: 'total',
          data: occupied,
          itemStyle: { color: '#e67e22' }
        },
        {
          name: '空闲',
          type: 'bar',
          stack: 'total',
          data: free,
          itemStyle: { color: '#27ae60' }
        }
      ]
    });

    window.addEventListener('resize', function () { chart.resize(); });
  }

  // Chart.js：座位分布占比（环形图）
  function renderPieChart(data) {
    const ctx = document.getElementById('chart-pie');
    if (!ctx || typeof Chart === 'undefined') return;
    const colors = ['#2c5f8d', '#4a8bc2', '#e67e22', '#27ae60', '#9b59b6'];
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
              label: function (ctx) {
                const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ctx.label + ': ' + ctx.parsed + ' 座 (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  // ECharts：本周食堂客流趋势（折线图）
  function renderTrafficChart(data) {
    const dom = document.getElementById('chart-traffic');
    if (!dom || typeof echarts === 'undefined') return;
    const chart = echarts.init(dom);
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
