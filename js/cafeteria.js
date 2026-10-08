/* 食堂信息：卡片展示 + 筛选排序 + 图表 */
(function () {
  'use strict';

  window.highlightNav('cafeteria');

  let cafeterias = [];

  function loadData() {
    window.loadJSON('data/cafeteria.json')
      .then(function (data) {
        cafeterias = data.slice();
        initLocationFilter();
        render();
        try { renderRatingChart(cafeterias); } catch (e) { console.error('renderRatingChart:', e); }
        try { renderWeeklyChart(cafeterias); } catch (e) { console.error('renderWeeklyChart:', e); }
      })
      .catch(function (err) {
        console.error(err);
        window.showToast('食堂数据加载失败：' + err.message, 'danger', 4000);
        window.renderError('#cafeteria-list', '无法加载食堂数据，请检查网络或本地服务器。');
      });
  }

  function initLocationFilter() {
    const locations = [...new Set(cafeterias.map(function (c) { return c.location; }))].sort();
    const $s = $('#filter-location');
    $s.find('option:not(:first)').remove();
    locations.forEach(function (l) {
      $s.append('<option value="' + l + '">' + l + '</option>');
    });
  }

  function getFilteredSorted() {
    const loc = $('#filter-location').val();
    const sort = $('#filter-sort').val();
    let list = cafeterias.filter(function (c) {
      return !loc || c.location === loc;
    });
    list = list.slice().sort(function (a, b) {
      switch (sort) {
        case 'rating-desc': return b.rating - a.rating;
        case 'rating-asc': return a.rating - b.rating;
        case 'seats-desc': return b.seats - a.seats;
        case 'name-asc': return a.name.localeCompare(b.name, 'zh');
        default: return 0;
      }
    });
    return list;
  }

  function render() {
    const list = getFilteredSorted();
    const $box = $('#cafeteria-list').empty();
    if (list.length === 0) {
      window.renderEmpty('#cafeteria-list', '该区域暂无食堂信息。');
      return;
    }
    list.forEach(function (c) {
      $box.append(buildCard(c));
    });
  }

  function buildCard(c) {
    const pct = window.occupancyPercent(c.occupied, c.seats);
    let level = 'low';
    if (pct >= 80) level = 'high';
    else if (pct >= 50) level = 'mid';

    const stars = renderStars(c.rating);
    const price = '¥'.repeat(c.priceLevel);
    const dishes = (c.popularDishes || []).map(function (d) {
      return '<span class="badge-tag">' + escapeHtml(d) + '</span>';
    }).join('');

    return '<div class="col-md-6 col-lg-4">' +
      '<div class="cafeteria-card">' +
        '<div class="d-flex justify-content-between align-items-start">' +
          '<h5 class="mb-1">' + escapeHtml(c.name) + '</h5>' +
          '<span class="badge-tag">' + escapeHtml(c.location) + '</span>' +
        '</div>' +
        '<div class="stars mb-2">' + stars + ' <small class="text-muted">' + c.rating.toFixed(1) + '</small></div>' +
        '<div class="room-meta">🕐 ' + escapeHtml(c.openTime) + ' &nbsp;·&nbsp; ' + price + '</div>' +
        '<div class="room-meta">楼层：' + c.floors + ' 层 &nbsp;·&nbsp; 座位：' + c.seats + ' 个</div>' +
        '<div class="room-meta mt-2">客流：' + c.occupied + ' / ' + c.seats + '（' + pct + '%）</div>' +
        '<div class="occupancy-bar"><div class="fill ' + level + '" style="width:' + pct + '%"></div></div>' +
        '<div class="mt-2"><small class="text-muted">热门菜品：</small><br/>' + dishes + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let s = '';
    for (let i = 0; i < full; i++) s += '★';
    if (half) s += '☆';
    return s;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ECharts：各食堂评分柱状图
  let ratingChart = null;
  function renderRatingChart(list) {
    const dom = document.getElementById('chart-rating');
    if (!dom || typeof echarts === 'undefined') return;
    if (ratingChart) ratingChart.dispose();
    ratingChart = echarts.init(dom);
    ratingChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: list.map(function (c) { return c.name; }),
        axisLabel: { rotate: 20, fontSize: 11 }
      },
      yAxis: { type: 'value', min: 3, max: 5, name: '评分' },
      series: [{
        name: '评分',
        type: 'bar',
        data: list.map(function (c) { return c.rating; }),
        itemStyle: {
          color: function (params) {
            const colors = ['#e67e22', '#27ae60', '#2c5f8d', '#9b59b6', '#16a085'];
            return colors[params.dataIndex % colors.length];
          }
        },
        label: { show: true, position: 'top' },
        barWidth: '40%'
      }]
    });
    window.addEventListener('resize', function () { ratingChart.resize(); });
  }

  // Chart.js：本周各食堂客流折线图（多系列）
  let weeklyChart = null;
  function renderWeeklyChart(list) {
    const ctx = document.getElementById('chart-weekly');
    if (!ctx || typeof Chart === 'undefined') return;
    if (weeklyChart) weeklyChart.destroy();
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const colors = ['#e67e22', '#27ae60', '#2c5f8d', '#9b59b6', '#16a085'];
    const datasets = list.map(function (c, i) {
      return {
        label: c.name,
        data: c.weeklyTraffic,
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length] + '33',
        tension: 0.3,
        fill: false
      };
    });
    weeklyChart = new Chart(ctx, {
      type: 'line',
      data: { labels: days, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '客流量（人次）' } } }
      }
    });
  }

  function bindEvents() {
    $('#filter-location, #filter-sort').on('change', render);
    $('#btn-refresh').on('click', function () {
      window.showToast('数据已刷新', 'success');
      render();
    });
  }

  bindEvents();
  loadData();
})();
