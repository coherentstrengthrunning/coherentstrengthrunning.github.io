// ---------- INTERACTIVE BODY MODEL (Three.js) ----------
(function(){
  var MOVES = {
    running: {
      title:'Running',
      primaryLabel:'Calves, quadriceps, hip flexors',
      secondaryLabel:'Glutes, hamstrings, core stabilizers',
      joint:'High-impact — ankle & knee, roughly 2–3× bodyweight per stride',
      recovery:'24–48h after easy runs · 48–72h after hard or long efforts',
      evidence:'Ground-reaction forces during running are well documented at roughly 2–3× bodyweight per stride, concentrated at the ankle and knee.',
      primary:['calfL','calfR','thighL','thighR'],
      secondary:['pelvis','torso']
    },
    squat: {
      title:'Squat',
      primaryLabel:'Quadriceps, glutes',
      secondaryLabel:'Hamstrings, adductors, spinal erectors',
      joint:'High — compressive knee & hip load, greatest near full depth',
      recovery:'48–72h before repeating a similarly heavy session',
      evidence:"Wilson et al.'s 2012 meta-analysis found concurrent training's interference was strongest for power output — a key reason lower-body strength work is sequenced deliberately around running.",
      primary:['thighL','thighR','pelvis'],
      secondary:['calfL','calfR','torso']
    },
    pushup: {
      title:'Push-up',
      primaryLabel:'Pectoralis major, triceps, anterior deltoid',
      secondaryLabel:'Core (anti-extension), serratus anterior',
      joint:'Low–moderate — shoulder & wrist, no impact loading',
      recovery:'24–48h typical for muscular recovery',
      evidence:'Upper-body pressing carries little of the interference effect seen in lower-body concurrent training — a low-cost addition alongside a running block.',
      primary:['torso','upperArmL','upperArmR'],
      secondary:['lowerArmL','lowerArmR','pelvis']
    },
    mobility: {
      title:'Mobility',
      primaryLabel:'Full-body — muscle-tendon length, joint capsule range',
      secondaryLabel:'Nervous system — proprioception, stretch tolerance',
      joint:'Low — minimal external load, range-of-motion stress only',
      recovery:'Minimal — safe to repeat daily',
      evidence:'Mobility work supports joint range of motion and, paired with load-bearing training, is associated with better movement quality over time.',
      primary:[], secondary:[], isMobility:true
    }
  };

  var titleEl = document.getElementById('bl-title');
  var primaryEl = document.getElementById('bl-primary');
  var secondaryEl = document.getElementById('bl-secondary');
  var jointEl = document.getElementById('bl-joint');
  var recoveryEl = document.getElementById('bl-recovery');
  var evidenceEl = document.getElementById('bl-evidence');
  var tabs = document.querySelectorAll('.bl-tab');

  var parts = {};
  var current = 'running';
  var ready = false;
  var mobilityRAF = null;

  function applyInfo(key){
    var m = MOVES[key];
    titleEl.textContent = m.title;
    primaryEl.textContent = m.primaryLabel;
    secondaryEl.textContent = m.secondaryLabel;
    jointEl.textContent = m.joint;
    recoveryEl.textContent = m.recovery;
    evidenceEl.textContent = m.evidence;
  }

  function applyHighlight(key){
    if(!ready || typeof THREE === 'undefined') return;
    var m = MOVES[key];

    Object.keys(parts).forEach(function(k){
      var mesh = parts[k];
      mesh.material.color.setHex(0x2b2a27);
      mesh.material.emissive.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
    });
    if(mobilityRAF){ cancelAnimationFrame(mobilityRAF); mobilityRAF = null; }

    if(m.isMobility){
      var startT = performance.now();
      var keys = Object.keys(parts);
      var loop = function(now){
        var t = (now-startT)/1000;
        keys.forEach(function(k, i){
          var mesh = parts[k];
          var phase = t*1.6 + i*0.5;
          var pulse = (Math.sin(phase)+1)/2;
          mesh.material.emissive.setHex(pulse > 0.5 ? 0xA6FF2E : 0x21E8D8);
          mesh.material.emissiveIntensity = 0.16 + pulse*0.22;
        });
        mobilityRAF = requestAnimationFrame(loop);
      };
      mobilityRAF = requestAnimationFrame(loop);
      return;
    }

    m.primary.forEach(function(k){
      if(parts[k]){
        parts[k].material.emissive.setHex(0xA6FF2E);
        parts[k].material.emissiveIntensity = 0.55;
        parts[k].material.color.setHex(0x3a3a30);
      }
    });
    m.secondary.forEach(function(k){
      if(parts[k]){
        parts[k].material.emissive.setHex(0x21E8D8);
        parts[k].material.emissiveIntensity = 0.4;
        parts[k].material.color.setHex(0x2f3a38);
      }
    });
  }

  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      current = tab.getAttribute('data-move');
      applyInfo(current);
      applyHighlight(current);
    });
  });

  applyInfo(current);

  var initedScene = false;
  function initScene(){
    if(initedScene) return;
    initedScene = true;

    var canvas = document.getElementById('body-canvas');
    var wrapEl = canvas.parentElement;
    var fallback = document.getElementById('body-fallback');

    if(typeof THREE === 'undefined'){
      fallback.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    }

    try{
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(35, wrapEl.clientWidth/wrapEl.clientHeight, 0.1, 100);
      camera.position.set(0, 1.15, 3.1);

      var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
      renderer.setSize(wrapEl.clientWidth, wrapEl.clientHeight);

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      var key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(2,4,3); scene.add(key);
      var rimLime = new THREE.PointLight(0xA6FF2E, 0.35, 8); rimLime.position.set(-2.2,2,-1.6); scene.add(rimLime);
      var rimCyan = new THREE.PointLight(0x21E8D8, 0.3, 8); rimCyan.position.set(2.2,0.4,-1.8); scene.add(rimCyan);

      var human = new THREE.Group();
      function seg(rt, rb, h, x, y, rotZ){
        var geo = new THREE.CylinderGeometry(rt, rb, h, 14);
        var mat = new THREE.MeshStandardMaterial({ color:0x2b2a27, roughness:0.55, metalness:0.12, emissive:0x000000 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        if(rotZ) mesh.rotation.z = rotZ;
        human.add(mesh);
        return mesh;
      }
      function sph(r, x, y){
        var geo = new THREE.SphereGeometry(r, 18, 14);
        var mat = new THREE.MeshStandardMaterial({ color:0x2b2a27, roughness:0.55, metalness:0.12, emissive:0x000000 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        human.add(mesh);
        return mesh;
      }

      parts.calfL  = seg(0.075,0.06,0.44, -0.11,0.28);
      parts.calfR  = seg(0.075,0.06,0.44,  0.11,0.28);
      parts.thighL = seg(0.10,0.085,0.44, -0.12,0.72);
      parts.thighR = seg(0.10,0.085,0.44,  0.12,0.72);
      parts.pelvis = seg(0.17,0.15,0.16,   0,1.02);
      parts.torso  = seg(0.20,0.16,0.40,   0,1.30);
      parts.neck   = seg(0.07,0.08,0.06,   0,1.53);
      parts.head   = sph(0.11, 0,1.65);
      parts.upperArmL = seg(0.055,0.065,0.30, -0.24,1.315, 0.15);
      parts.upperArmR = seg(0.055,0.065,0.30,  0.24,1.315,-0.15);
      parts.lowerArmL = seg(0.045,0.055,0.26, -0.27,1.05, 0.12);
      parts.lowerArmR = seg(0.045,0.055,0.26,  0.27,1.05,-0.12);

      human.position.y = -0.95;
      scene.add(human);

      var controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.35, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI*0.28;
      controls.maxPolarAngle = Math.PI*0.62;
      controls.autoRotate = !reducedMotion;
      controls.autoRotateSpeed = 1.1;
      controls.update();

      ready = true;
      applyHighlight(current);

      function resize(){
        var w = wrapEl.clientWidth, h = wrapEl.clientHeight;
        if(!w || !h) return;
        camera.aspect = w/h; camera.updateProjectionMatrix();
        renderer.setSize(w,h);
      }
      window.addEventListener('resize', resize);

      function animate(){
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      animate();

    } catch(err){
      fallback.style.display = 'flex';
      canvas.style.display = 'none';
    }
  }

  var section = document.getElementById('bodylab');
  if('IntersectionObserver' in window){
    var secIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          initScene();
          secIO.unobserve(entry.target);
        }
      });
    }, { threshold:0.15 });
    secIO.observe(section);
  } else {
    initScene();
  }
})();
