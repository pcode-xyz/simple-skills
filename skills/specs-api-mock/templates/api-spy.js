/* api-spy.js — demo-mock 接口流量侦查（供 demo-review.html 嵌入预览时使用）
 *
 * 加载顺序：api-mock.js → api-spy.js → app-mock.js
 *   （api-mock 先定义 window.api；spy 把它包装成「发请求 → 收响应」双向上报；
 *     app-mock 后加载，消费到的永远是被包装的 api，所有数据访问都被记录。）
 *
 * 激活条件：仅当本页被 iframe 嵌入时（window.self !== window.top）才包装上报；
 *           独立打开 demo-mock 页面时本脚本为 no-op，不影响原产物行为。
 *
 * 事件协议（postMessage → window.parent，message.data = { source:'api-spy', page, kind, phase, event }）：
 *   kind: 'ready'  —— spy 已接入（外层用来确认链路）
 *   event.dir:
 *     'req'  { id, t, service, op, caller, args }          请求发出
 *     'res'  { id, t, dur, service, op, resp }             响应返回
 *     'err'  { id, t, dur, service, op, error }            请求失败
 *     'sub'  { id, t, service, op, caller, args }          流式订阅建立
 *     'push' { id, t, idx, service, op, event }            流式推送事件（oneof 结构）
 *     'unsub'{ id, t, service, op }                        退订
 *   phase: 'open'（首屏 boot/preload + 首条流推送，直到首次用户手势）| 'interact'（手势之后）
 */
(function () {
  'use strict';

  if (window.self === window.top) return;          // 独立打开 → 不激活
  var api = window.api;
  if (!api) return;

  var seq = 0;

  /* ---------- 相位：首屏 vs 交互（iframe 内首次用户手势切换） ---------- */
  var interact = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) {
    try { window.addEventListener(t, function () { interact = true; }, true); } catch (e) {}
  });
  function phase() { return interact ? 'interact' : 'open'; }

  /* ---------- 上报 ---------- */
  function emit(ev) {
    try {
      window.parent.postMessage({
        source: 'api-spy',
        page: (location.pathname.split('/').pop() || 'frame'),
        phase: phase(),
        event: ev,
      }, '*');
    } catch (e) { /* 序列化/串口异常忽略，不影响页面 */ }
  }
  try {
    window.parent.postMessage({ source: 'api-spy', kind: 'ready', page: (location.pathname.split('/').pop() || 'frame') }, '*');
  } catch (e) {}

  /* ---------- 工具 ---------- */
  function cloneForPost(x) {
    try { return JSON.parse(JSON.stringify(x)); }
    catch (e) { return { __unserializable__: String(x) }; }
  }
  // 调用点定位：取栈里第一个非 api-spy 的帧（如 saveEdit@app-mock.js:2181）
  function callerHint() {
    try {
      var lines = (new Error().stack || '').split('\n');
      for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('api-spy.js') !== -1) continue;
        var m = line.match(/at\s+(.+)/);
        if (!m) continue;
        var frame = m[1].trim().replace(/^async\s+/, '');
        if (!frame || frame.indexOf('new Error') !== -1) continue;
        var paren = frame.lastIndexOf('(');
        var name = paren > -1 ? frame.slice(0, paren).trim() : '';
        var loc = paren > -1 ? frame.slice(paren + 1, -1) : frame;
        loc = loc.replace(/^file:\/\/.*\/([^/]+?)(:\d+)(?::\d+)?$/, '$1$2');
        if (loc.indexOf('native') !== -1 || loc.indexOf('extensions') !== -1) continue;
        var fn = /^[A-Za-z_$][\w$]*$/.test(name) ? name : '';
        return (fn ? fn + '@' : '') + loc;
      }
    } catch (e) {}
    return '';
  }

  /* ---------- 包装 ---------- */
  function wrapService(svcName, svcObj) {
    Object.keys(svcObj).forEach(function (op) {
      var orig = svcObj[op];
      if (typeof orig !== 'function') return;

      var wrappedFn = function (req) {
        var t0 = performance.now();
        var rid = ++seq;
        emit({ id: rid, dir: 'req', t: t0, service: svcName, op: op, caller: callerHint(), args: cloneForPost(req) });
        return Promise.resolve(orig.apply(this, arguments)).then(function (resp) {
          emit({ id: rid, dir: 'res', t: performance.now(), dur: Math.round(performance.now() - t0), service: svcName, op: op, resp: cloneForPost(resp) });
          return resp;
        }, function (err) {
          emit({ id: rid, dir: 'err', t: performance.now(), dur: Math.round(performance.now() - t0), service: svcName, op: op, error: String(err && err.message || err) });
          throw err;
        });
      };

      // 保留扩展属性（流式 .subscribe、simulateError 等）
      Object.keys(orig).forEach(function (k) { wrappedFn[k] = orig[k]; });

      if (typeof orig.subscribe === 'function') {
        var origSub = orig.subscribe;
        wrappedFn.subscribe = function (pushCb, req) {
          var sid = ++seq;
          var t0 = performance.now();
          emit({ id: sid, dir: 'sub', t: t0, service: svcName, op: op, caller: callerHint(), args: cloneForPost(req) });
          var idx = 0;
          var cb = function (evt) {
            emit({ id: sid, dir: 'push', t: performance.now(), service: svcName, op: op, idx: idx++, event: cloneForPost(evt) });
            return pushCb.call(this, evt);
          };
          var unsub = origSub.call(this, cb, req);
          return function () {
            emit({ id: sid, dir: 'unsub', t: performance.now(), service: svcName, op: op });
            if (unsub && typeof unsub === 'function') return unsub.call(this);
          };
        };
      }

      svcObj[op] = wrappedFn;
    });
  }

  Object.keys(api).forEach(function (svc) {
    if (svc === '_reset' || svc === '_dump') return;
    if (api[svc] && typeof api[svc] === 'object') wrapService(svc, api[svc]);
  });

  /* ---------- 高亮联动：父面板 highlight 命令 → 命中 data-rpc 区域加 .rpc-hot ----------
   * 页面内容区带 data-rpc="<service.op>"（空格分隔多值）标记出处；面板点击 trace 条目
   * 发 {source:'demo-review', cmd:'highlight', op} 过来，这里命中变色 + 滚到视野，
   * 回执 {source:'api-spy', kind:'highlighted', op, count} 供面板显示命中数。 */
  var hlStyle = document.createElement('style');
  hlStyle.textContent = '.rpc-hot{outline:2px solid #4a9eff!important;outline-offset:-2px;' +
    'background:rgba(74,158,255,.14)!important;border-radius:6px;transition:background .2s}' +
    '@keyframes rpc-pulse{0%{box-shadow:0 0 0 0 rgba(74,158,255,.45)}100%{box-shadow:0 0 0 14px rgba(74,158,255,0)}}' +
    '.rpc-hot{animation:rpc-pulse .9s ease-out}';
  document.head.appendChild(hlStyle);

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || d.source !== 'demo-review') return;
    var prev = document.querySelectorAll('.rpc-hot');
    for (var i = 0; i < prev.length; i++) prev[i].classList.remove('rpc-hot');
    if (d.cmd === 'highlight') {
      var els = document.querySelectorAll('[data-rpc~="' + d.op + '"]');
      for (var j = 0; j < els.length; j++) els[j].classList.add('rpc-hot');
      if (els.length) {
        // 仅当目标在视口外才滚动（block:nearest 最小位移）——居中底部小元素会把
        // overflow:hidden 容器滚乱、把屏幕外的弹层带进视口；已在视口内则不动。
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var r0 = els[0].getBoundingClientRect();
        var inView = r0.top >= 0 && r0.bottom <= vh;
        if (!inView && els[0].scrollIntoView) {
          try { els[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { try { els[0].scrollIntoView(true); } catch (e2) {} }
        }
      }
      window.parent.postMessage({ source: 'api-spy', kind: 'highlighted', op: d.op, count: els.length }, '*');
    } else if (d.cmd === 'clear-highlight') {
      window.parent.postMessage({ source: 'api-spy', kind: 'highlighted', op: '', count: 0 }, '*');
    }
  }, false);
})();
