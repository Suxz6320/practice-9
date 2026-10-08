/* Three.js 三维场景：校园建筑模型（普通脚本，使用全局 THREE，兼容 file:// 协议） */
(function () {
  'use strict';

  // 检查 Three.js 是否加载
  if (typeof THREE === 'undefined') {
    console.error('Three.js 未加载，三维场景无法初始化');
    var loadingEl = document.getElementById('three-loading');
    if (loadingEl) {
      loadingEl.textContent = 'Three.js 未加载，请检查网络连接';
    }
    return;
  }

  var container = document.getElementById('three-container');
  var loadingEl = document.getElementById('three-loading');
  if (!container) return;

  var scene, camera, renderer, animationId;
  // 鼠标拖拽状态
  var isDragging = false;
  var prevMouseX = 0, prevMouseY = 0;
  // 相机环绕角度
  var azimuth = 0.6;   // 水平角
  var elevation = 0.5; // 俯仰角
  var cameraDistance = 28;

  function init() {
    // 场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, 100);

    // 相机
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    updateCameraPosition();

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 光照
    var ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    // 地面
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshLambertMaterial({ color: 0x3a7d3a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 道路（十字）
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var road1 = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.01;
    scene.add(road1);
    var road2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 60), roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.01;
    scene.add(road2);

    // 建筑配置：[x, z, width, depth, height, color]
    var buildings = [
      [0, -8, 6, 5, 7, 0xe74c3c],   // 图书馆（红色）
      [-12, -4, 5, 4, 6, 0x2c5f8d],  // 教学楼A（蓝色）
      [12, -4, 5, 4, 6, 0x2c5f8d],   // 教学楼B（蓝色）
      [-12, 8, 4, 4, 5, 0x9b59b6],   // 实验楼C（紫色）
      [12, 8, 4, 4, 5, 0x16a085],    // 信息楼D（青色）
      [0, 14, 7, 5, 4, 0x27ae60]     // 食堂（绿色）
    ];

    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      // 主体
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(b[2], b[4], b[3]),
        new THREE.MeshLambertMaterial({ color: b[5] })
      );
      mesh.position.set(b[0], b[4] / 2, b[1]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // 屋顶
      var roof = new THREE.Mesh(
        new THREE.BoxGeometry(b[2] + 0.4, 0.4, b[3] + 0.4),
        new THREE.MeshLambertMaterial({ color: 0x2c3e50 })
      );
      roof.position.set(b[0], b[4] + 0.2, b[1]);
      roof.castShadow = true;
      scene.add(roof);

      // 窗户（正面贴片）
      var windowMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
      var rows = Math.floor(b[4] / 1.8);
      var cols = Math.floor(b[2] / 1.5);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.05), windowMat);
          win.position.set(
            b[0] - b[2] / 2 + 0.75 + c * 1.5,
            1 + r * 1.8,
            b[1] + b[3] / 2 + 0.03
          );
          scene.add(win);
        }
      }
    }

    // 树木装饰
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    var leafMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71 });
    var treePositions = [
      [-6, -12], [6, -12], [-18, 0], [18, 0],
      [-6, 12], [6, 12], [-18, -10], [18, -10]
    ];
    for (var t = 0; t < treePositions.length; t++) {
      var tp = treePositions[t];
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8), trunkMat
      );
      trunk.position.set(tp[0], 0.75, tp[1]);
      trunk.castShadow = true;
      scene.add(trunk);
      var leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8), leafMat
      );
      leaves.position.set(tp[0], 2.2, tp[1]);
      leaves.castShadow = true;
      scene.add(leaves);
    }

    // 绑定鼠标拖拽
    bindMouseControls();

    // 隐藏加载提示
    if (loadingEl) loadingEl.style.display = 'none';
  }

  // 根据极坐标角度更新相机位置
  function updateCameraPosition() {
    var x = cameraDistance * Math.cos(elevation) * Math.sin(azimuth);
    var y = cameraDistance * Math.sin(elevation);
    var z = cameraDistance * Math.cos(elevation) * Math.cos(azimuth);
    camera.position.set(x, y, z);
    camera.lookAt(0, 2, 0);
  }

  // 鼠标拖拽旋转 + 滚轮缩放（手动实现，无需 OrbitControls）
  function bindMouseControls() {
    var canvas = renderer.domElement;

    // 鼠标按下
    canvas.addEventListener('mousedown', function (e) {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    // 鼠标移动
    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - prevMouseX;
      var dy = e.clientY - prevMouseY;
      azimuth -= dx * 0.01;
      elevation = Math.max(-0.3, Math.min(1.4, elevation + dy * 0.01));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      updateCameraPosition();
    });

    // 鼠标抬起
    window.addEventListener('mouseup', function () {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    // 滚轮缩放
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      cameraDistance = Math.max(10, Math.min(60, cameraDistance + e.deltaY * 0.02));
      updateCameraPosition();
    }, { passive: false });

    // 触摸支持
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    });
    canvas.addEventListener('touchmove', function (e) {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      var dx = e.touches[0].clientX - prevMouseX;
      var dy = e.touches[0].clientY - prevMouseY;
      azimuth -= dx * 0.01;
      elevation = Math.max(-0.3, Math.min(1.4, elevation + dy * 0.01));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
      updateCameraPosition();
    }, { passive: false });
    canvas.addEventListener('touchend', function () { isDragging = false; });

    canvas.style.cursor = 'grab';
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    // 无拖拽时缓慢自转
    if (!isDragging) {
      azimuth += 0.002;
      updateCameraPosition();
    }
    renderer.render(scene, camera);
  }

  function onResize() {
    if (!container || !camera || !renderer) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // 页面隐藏时停止渲染，节省资源
  function onVisibilityChange() {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  }

  try {
    init();
    animate();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
  } catch (e) {
    console.error('Three.js 初始化失败:', e);
    if (loadingEl) {
      loadingEl.textContent = '三维场景加载失败：' + e.message;
    }
    if (window.showToast) {
      window.showToast('三维场景加载失败：' + e.message, 'danger', 4000);
    }
  }
})();
