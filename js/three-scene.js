/* Three.js 三维场景：校园建筑模型 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  'use strict';

  const container = document.getElementById('three-container');
  const loadingEl = document.getElementById('three-loading');
  if (!container) return;

  let scene, camera, renderer, controls, animationId;

  function init() {
    // 场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 80);

    // 相机
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(18, 14, 18);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 控制器：鼠标拖拽旋转、滚轮缩放
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.1;

    // 光照
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    // 地面
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a7d3a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 道路（十字）
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.01;
    scene.add(road1);
    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 60), roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.01;
    scene.add(road2);

    // 建筑配置：[x, z, width, depth, height, color, name]
    const buildings = [
      // 图书馆（红色，中央）
      [0, -8, 6, 5, 7, 0xe74c3c, '图书馆'],
      // 教学楼A（蓝色）
      [-12, -4, 5, 4, 6, 0x2c5f8d, '教学楼A'],
      // 教学楼B（蓝色）
      [12, -4, 5, 4, 6, 0x2c5f8d, '教学楼B'],
      // 实验楼C（紫色）
      [-12, 8, 4, 4, 5, 0x9b59b6, '实验楼C'],
      // 信息楼D（青色）
      [12, 8, 4, 4, 5, 0x16a085, '信息楼D'],
      // 食堂（绿色，远处）
      [0, 14, 7, 5, 4, 0x27ae60, '食堂']
    ];

    buildings.forEach(function (b) {
      const geo = new THREE.BoxGeometry(b[2], b[4], b[3]);
      const mat = new THREE.MeshLambertMaterial({ color: b[5] });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b[0], b[4] / 2, b[1]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // 屋顶
      const roofGeo = new THREE.BoxGeometry(b[2] + 0.4, 0.4, b[3] + 0.4);
      const roofMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(b[0], b[4] + 0.2, b[1]);
      roof.castShadow = true;
      scene.add(roof);

      // 窗户纹理（用小方块模拟）
      const windowMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
      const rows = Math.floor(b[4] / 1.8);
      const cols = Math.floor(b[2] / 1.5);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.05), windowMat);
          win.position.set(
            b[0] - b[2] / 2 + 0.75 + c * 1.5,
            1 + r * 1.8,
            b[1] + b[3] / 2 + 0.03
          );
          scene.add(win);
        }
      }
    });

    // 树木装饰
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71 });
    const treePositions = [
      [-6, -12], [6, -12], [-18, 0], [18, 0],
      [-6, 12], [6, 12], [-18, -10], [18, -10]
    ];
    treePositions.forEach(function (p) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8), trunkMat);
      trunk.position.set(p[0], 0.75, p[1]);
      trunk.castShadow = true;
      scene.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), leafMat);
      leaves.position.set(p[0], 2.2, p[1]);
      leaves.castShadow = true;
      scene.add(leaves);
    });

    // 隐藏加载提示
    if (loadingEl) loadingEl.style.display = 'none';
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // 响应窗口尺寸变化
  function onResize() {
    if (!container || !camera || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
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
