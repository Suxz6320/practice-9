/* 自习室管理：搜索、筛选、增删改查 */
(function () {
  'use strict';

  window.highlightNav('rooms');

  const STORAGE_KEY = 'campus_study_rooms_v1';
  let rooms = [];          // 当前数据
  let editingId = null;    // 正在编辑的 id

  // 从 localStorage 读取，若无则加载 JSON
  function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        rooms = JSON.parse(saved);
        initFilters();
        render();
        return;
      } catch (e) {
        console.warn('本地缓存解析失败，重新加载 JSON', e);
      }
    }
    window.loadJSON('data/study-rooms.json')
      .then(function (data) {
        rooms = data.slice();
        saveToLocal();
        initFilters();
        render();
      })
      .catch(function (err) {
        console.error(err);
        window.showToast('自习室数据加载失败：' + err.message, 'danger', 4000);
        window.renderError('#room-list', '无法加载自习室数据，请检查网络或本地服务器。');
      });
  }

  function saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.warn('保存到 localStorage 失败', e);
    }
  }

  // 初始化筛选项（楼栋、楼层）
  function initFilters() {
    const buildings = [...new Set(rooms.map(function (r) { return r.building; }))].sort();
    const $b = $('#filter-building');
    $b.find('option:not(:first)').remove();
    buildings.forEach(function (b) {
      $b.append('<option value="' + b + '">' + b + '</option>');
    });

    const floors = [...new Set(rooms.map(function (r) { return r.floor; }))].sort(function (a, b) { return a - b; });
    const $f = $('#filter-floor');
    $f.find('option:not(:first)').remove();
    floors.forEach(function (f) {
      $f.append('<option value="' + f + '">' + f + ' 楼</option>');
    });
  }

  // 筛选并渲染
  function render() {
    const keyword = $('#search-input').val().trim().toLowerCase();
    const building = $('#filter-building').val();
    const status = $('#filter-status').val();
    const floor = $('#filter-floor').val();

    const filtered = rooms.filter(function (r) {
      if (keyword && r.name.toLowerCase().indexOf(keyword) === -1) return false;
      if (building && r.building !== building) return false;
      if (status && r.status !== status) return false;
      if (floor && String(r.floor) !== floor) return false;
      return true;
    });

    $('#result-count').text('共 ' + filtered.length + ' 间自习室');

    const $list = $('#room-list').empty();
    if (filtered.length === 0) {
      window.renderEmpty('#room-list', '没有符合条件的自习室，请调整筛选条件。');
      return;
    }

    filtered.forEach(function (r) {
      $list.append(buildCard(r));
    });
  }

  // 构建单个自习室卡片 HTML
  function buildCard(r) {
    const pct = window.occupancyPercent(r.occupied, r.capacity);
    let level = 'low';
    if (pct >= 80) level = 'high';
    else if (pct >= 50) level = 'mid';

    const statusClass = r.status === '开放' ? 'status-open' : (r.status === '满座' ? 'status-full' : 'status-maintain');
    const statusBadge = r.status === '开放' ? 'ok' : (r.status === '满座' ? 'warn' : '');

    let tags = '';
    if (r.hasPower) tags += '<span class="badge-tag ok">⚡ 电源</span>';
    if (r.hasWifi) tags += '<span class="badge-tag ok">📶 WiFi</span>';
    if (r.quiet) tags += '<span class="badge-tag">🤫 静音</span>';

    return '<div class="col-sm-6 col-lg-4">' +
      '<div class="room-card ' + statusClass + '">' +
        '<div class="d-flex justify-content-between align-items-start">' +
          '<div class="room-name">' + escapeHtml(r.name) + '</div>' +
          '<span class="badge-tag ' + statusBadge + '">' + escapeHtml(r.status) + '</span>' +
        '</div>' +
        '<div class="room-meta">📍 ' + escapeHtml(r.building) + ' · ' + r.floor + ' 楼</div>' +
        '<div class="room-meta">🕐 ' + escapeHtml(r.openTime || '未设置') + '</div>' +
        '<div class="room-meta mt-2">座位：' + r.occupied + ' / ' + r.capacity + '（' + pct + '%）</div>' +
        '<div class="occupancy-bar"><div class="fill ' + level + '" style="width:' + pct + '%"></div></div>' +
        '<div class="mt-2">' + tags + '</div>' +
        '<div class="mt-3 d-flex gap-2">' +
          '<button class="btn btn-sm btn-outline-primary flex-fill btn-edit" data-id="' + r.id + '">✏️ 修改</button>' +
          '<button class="btn btn-sm btn-outline-danger flex-fill btn-del" data-id="' + r.id + '">🗑️ 删除</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 打开添加模态框
  function openAddModal() {
    editingId = null;
    $('#modal-title').text('添加自习室');
    $('#room-form')[0].reset();
    $('#room-floor').val(1);
    $('#room-capacity').val(50);
    $('#room-occupied').val(0);
    $('#room-power').prop('checked', true);
    $('#room-wifi').prop('checked', true);
    $('#room-quiet').prop('checked', true);
    $('#room-status').val('开放');
  }

  // 打开编辑模态框
  function openEditModal(id) {
    const r = rooms.find(function (x) { return x.id === id; });
    if (!r) return;
    editingId = id;
    $('#modal-title').text('修改自习室');
    $('#room-id').val(r.id);
    $('#room-name').val(r.name);
    $('#room-building').val(r.building);
    $('#room-floor').val(r.floor);
    $('#room-time').val(r.openTime);
    $('#room-capacity').val(r.capacity);
    $('#room-occupied').val(r.occupied);
    $('#room-status').val(r.status);
    $('#room-power').prop('checked', !!r.hasPower);
    $('#room-wifi').prop('checked', !!r.hasWifi);
    $('#room-quiet').prop('checked', !!r.quiet);
  }

  // 保存（添加或修改）
  function saveRoom() {
    const name = $('#room-name').val().trim();
    const building = $('#room-building').val().trim();
    if (!name) { window.showToast('请输入自习室名称', 'warning'); return; }
    if (!building) { window.showToast('请输入所属楼栋', 'warning'); return; }

    const capacity = parseInt($('#room-capacity').val(), 10) || 0;
    let occupied = parseInt($('#room-occupied').val(), 10) || 0;
    if (occupied > capacity) {
      window.showToast('已占用座位数不能超过总座位数，已自动修正', 'warning');
      occupied = capacity;
    }

    const data = {
      name: name,
      building: building,
      floor: parseInt($('#room-floor').val(), 10) || 1,
      openTime: $('#room-time').val().trim() || '未设置',
      capacity: capacity,
      occupied: occupied,
      status: $('#room-status').val(),
      hasPower: $('#room-power').is(':checked'),
      hasWifi: $('#room-wifi').is(':checked'),
      quiet: $('#room-quiet').is(':checked')
    };

    if (editingId) {
      const idx = rooms.findIndex(function (x) { return x.id === editingId; });
      if (idx >= 0) {
        rooms[idx] = Object.assign({}, rooms[idx], data);
        window.showToast('修改成功', 'success');
      }
    } else {
      const newId = rooms.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
      rooms.push(Object.assign({ id: newId }, data));
      window.showToast('添加成功', 'success');
    }

    saveToLocal();
    initFilters();
    render();
    const modalEl = document.getElementById('room-modal');
    bootstrap.Modal.getInstance(modalEl).hide();
  }

  // 删除
  function deleteRoom(id) {
    const r = rooms.find(function (x) { return x.id === id; });
    if (!r) return;
    if (!confirm('确定要删除「' + r.name + '」吗？此操作不可撤销。')) return;
    rooms = rooms.filter(function (x) { return x.id !== id; });
    saveToLocal();
    initFilters();
    render();
    window.showToast('删除成功', 'success');
  }

  // 绑定事件
  function bindEvents() {
    // 搜索实时过滤
    $('#search-input').on('input', render);
    $('#filter-building, #filter-status, #filter-floor').on('change', render);

    // 添加按钮
    $('#btn-add').on('click', function () {
      openAddModal();
      const modalEl = document.getElementById('room-modal');
      new bootstrap.Modal(modalEl).show();
    });

    // 保存按钮
    $('#btn-save').on('click', saveRoom);

    // 回车提交表单
    $('#room-form').on('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); saveRoom(); }
    });

    // 事件委托：修改 / 删除
    $('#room-list').on('click', '.btn-edit', function () {
      openEditModal(parseInt($(this).data('id'), 10));
      new bootstrap.Modal(document.getElementById('room-modal')).show();
    });
    $('#room-list').on('click', '.btn-del', function () {
      deleteRoom(parseInt($(this).data('id'), 10));
    });
  }

  // 启动
  bindEvents();
  loadData();
})();
