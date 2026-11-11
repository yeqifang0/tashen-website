/* ==========================================================
   在线下单与支付流程（演示模式）
   ----------------------------------------------------------
   说明：
   1. 当前为纯前端演示：订单保存在浏览器 localStorage，
      支付二维码为占位图，"模拟支付成功"仅用于演示流程。
   2. 正式上线时需要接入真实支付，接入点已在本文件中
      以【接入点】注释标出：
      - 微信支付 Native（扫码支付）：后端调用微信支付 v3 API
        生成 code_url，前端将 code_url 转成二维码展示；
      - 支付宝当面付：后端调用 alipay.trade.precreate 生成 qr_code；
      - 对公转账：保留人工确认收款流程即可。
      建议增加一个简单后端（Node/Java/PHP 均可）负责：
      创建订单、生成支付二维码、接收支付回调、更新订单状态。
   3. 申请微信支付/支付宝商户号需要：营业执照、法人身份证、
      已完成 ICP 备案的网站域名。
   ========================================================== */

var PLANS = {
  standard:   { name: '标准版',     desc: '适合中小型技术团队',           price: 1980, unit: '元/年',  period: '1年授权' },
  professional: { name: '专业版',   desc: '适合中大型业务系统',           price: 5980, unit: '元/年',  period: '1年授权' },
  enterprise: { name: '企业版',     desc: '不限节点 · 支持私有化部署',    price: 6980, unit: '元/年起', period: '1年授权' },
  service:    { name: '专家代测服务', desc: '专家团队按次提供压测服务',     price: 6000,  unit: '元/次起', period: '按项目评估' }
};

var ORDER_KEY = 'tashen_orders';

(function () {
  var page = document.getElementById('order-page');
  if (!page) return; // 非 order.html 页面不初始化

  var state = {
    step: 1,
    plan: 'standard',
    payment: 'wxpay',
    order: null
  };

  // 从 URL 参数读取预选套餐（pricing.html 的"立即购买"跳转）
  var param = new URLSearchParams(location.search).get('plan');
  if (param && PLANS[param]) state.plan = param;

  var $ = function (sel) { return document.querySelector(sel); };

  function render() {
    // 步骤指示器
    [1, 2, 3].forEach(function (n) {
      var el = document.getElementById('ostep-' + n);
      if (!el) return;
      el.classList.toggle('active', state.step === n);
      el.classList.toggle('done', state.step > n);
      var ind = el.querySelector('.o-ind');
      if (state.step > n) ind.textContent = '✓'; else ind.textContent = String(n);
    });

    $('#panel-1').style.display = state.step === 1 ? '' : 'none';
    $('#panel-2').style.display = state.step === 2 ? '' : 'none';
    $('#panel-3').style.display = state.step === 3 ? '' : 'none';
    $('#panel-result').style.display = state.step === 4 ? '' : 'none';
    $('#order-steps').style.display = state.step === 4 ? 'none' : '';

    // 步骤1：套餐选中态
    document.querySelectorAll('.plan-option').forEach(function (el) {
      el.classList.toggle('selected', el.dataset.plan === state.plan);
    });

    // 步骤3：支付方式与摘要
    document.querySelectorAll('.pay-option').forEach(function (el) {
      el.classList.toggle('selected', el.dataset.pay === state.payment);
    });
    renderPayDetail();
    renderSummary();
  }

  function renderPayDetail() {
    var box = $('#pay-detail');
    if (!box) return;
    if (state.step !== 3) { box.style.display = 'none'; return; }
    box.style.display = '';
    if (state.payment === 'bank') {
      box.innerHTML = '' +
        '<div class="bank-info">' +
        '  <dl>' +
        '    <dt>收款名称</dt><dd>上海塔伸科技有限公司</dd>' +
        '    <dt>开户银行</dt><dd>××银行上海××支行（正式上线前请替换为实际开户行）</dd>' +
        '    <dt>银行账号</dt><dd>×××× ×××× ×××× ××××（请替换为实际账号）</dd>' +
        '    <dt>转账备注</dt><dd>请备注订单号，方便财务对账确认</dd>' +
        '  </dl>' +
        '</div>' +
        '<div class="notice">对公转账后，请将转账凭证发送至 1562779519@qq.com，' +
        '或联系商务顾问确认。财务确认到账后（一般 1 个工作日内）订单状态将更新为"已支付"。</div>';
    } else {
      var name = state.payment === 'wxpay' ? '微信支付' : '支付宝';
      var tip = state.payment === 'wxpay' ? '请使用微信"扫一扫"完成支付' : '请使用支付宝"扫一扫"完成支付';
      box.innerHTML = '' +
        '<div class="qr-box">' +
        '  <div class="qr-placeholder"></div>' +
        '  <div class="qr-tip"><b>' + tip + '</b></div>' +
        '  <div class="qr-tip" style="margin-top:8px;color:#7a8494;">【演示模式】此处为二维码占位图。正式上线后，' +
        '提交订单时后端会调用' + name + '接口生成真实支付二维码，支付结果由支付平台异步回调自动更新。</div>' +
        '</div>';
    }
  }

  function renderSummary() {
    var plan = PLANS[state.plan];
    var s = $('#summary-plan');
    if (!s) return;
    s.textContent = plan.name + '（' + plan.desc + '）';
    $('#summary-amount').textContent = '¥ ' + plan.price.toLocaleString() + ' ' + plan.unit;
    var payName = { wxpay: '微信支付', alipay: '支付宝', bank: '对公转账' }[state.payment];
    if ($('#summary-pay')) $('#summary-pay').textContent = state.step >= 3 ? payName : '—';
  }

  // 步骤1：选择套餐
  document.querySelectorAll('.plan-option').forEach(function (el) {
    el.addEventListener('click', function () {
      state.plan = el.dataset.plan;
      render();
    });
  });
  $('#next-1').addEventListener('click', function () {
    state.step = 2;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 步骤2：信息校验
  $('#next-2').addEventListener('click', function () {
    if (validateForm()) {
      state.step = 3;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  $('#back-2').addEventListener('click', function () { state.step = 1; render(); });

  function validateForm() {
    var ok = true;
    var rules = [
      { id: 'f-company', test: function (v) { return v.trim().length >= 2; }, msg: '请填写公司名称' },
      { id: 'f-name', test: function (v) { return v.trim().length >= 2; }, msg: '请填写联系人姓名' },
      { id: 'f-phone', test: function (v) { return /^1[3-9]\d{9}$/.test(v.trim()); }, msg: '请填写正确的 11 位手机号' },
      { id: 'f-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: '请填写正确的邮箱地址' }
    ];
    rules.forEach(function (r) {
      var input = document.getElementById(r.id);
      var field = input.closest('.form-field');
      var err = field.querySelector('.err');
      if (!r.test(input.value)) {
        ok = false;
        field.classList.add('invalid');
        err.textContent = r.msg;
      } else {
        field.classList.remove('invalid');
      }
    });
    return ok;
  }

  // 步骤3：支付方式
  document.querySelectorAll('.pay-option').forEach(function (el) {
    el.addEventListener('click', function () {
      state.payment = el.dataset.pay;
      render();
    });
  });
  $('#back-3').addEventListener('click', function () { state.step = 2; render(); });

  // 提交订单
  // 【接入点】正式上线：此处应改为调用后端创建订单接口（POST /api/orders），
  // 由后端返回真实订单号与支付二维码链接；当前为演示，本地生成订单号。
  $('#submit-order').addEventListener('click', function () {
    var plan = PLANS[state.plan];
    var orderNo = 'TS' + nowStamp() + '-' + rand4();
    state.order = {
      orderNo: orderNo,
      plan: state.plan,
      planName: plan.name,
      amount: plan.price,
      unit: plan.unit,
      payment: state.payment,
      payName: { wxpay: '微信支付', alipay: '支付宝', bank: '对公转账' }[state.payment],
      company: val('f-company'),
      contact: val('f-name'),
      phone: val('f-phone'),
      email: val('f-email'),
      note: val('f-note'),
      status: '待支付',
      demo: true,
      createdAt: new Date().toISOString()
    };
    saveOrder(state.order);
    showResult();
    state.step = 4;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function showResult() {
    var o = state.order;
    var payArea = o.payment === 'bank' ? 'bank' : 'qr';
    var html = '' +
      '<div class="result-panel form-card">' +
      '  <div class="result-icon pending" id="result-icon">⏳</div>' +
      '  <h2>订单提交成功，等待支付</h2>' +
      '  <div class="status-tag pending" id="result-status">状态：待支付</div>' +
      '  <div class="order-summary" style="text-align:left;margin-top:8px;">' +
      '    <dl>' +
      '      <dt>订单编号</dt><dd id="r-no"></dd>' +
      '      <dt>订购套餐</dt><dd id="r-plan"></dd>' +
      '      <dt>订单金额</dt><dd id="r-amount"></dd>' +
      '      <dt>支付方式</dt><dd id="r-pay"></dd>' +
      '      <dt>联系信息</dt><dd id="r-contact"></dd>' +
      '    </dl>' +
      '  </div>';
    if (payArea === 'qr') {
      html += '' +
        '  <div class="qr-box" style="margin-top:22px;">' +
        '    <div class="qr-placeholder"></div>' +
        '    <div class="qr-tip">请使用' + o.payName + '扫码完成支付（演示环境二维码不可用）</div>' +
        '  </div>' +
        '  <button class="btn btn-primary" id="mock-pay" style="margin-top:18px;">模拟支付成功（仅演示）</button>';
    } else {
      html += '' +
        '  <div class="notice" style="text-align:left;">已选择对公转账：请向"上海塔伸科技有限公司"账户转账并备注订单号，' +
        '财务确认到账后订单自动转为"已支付"。（开户行与账号信息请在上一步查看，正式上线前请替换）</div>' +
        '  <button class="btn btn-primary" id="mock-pay" style="margin-top:18px;">模拟财务确认到账（仅演示）</button>';
    }
    html += '' +
      '  <div class="notice blue" style="text-align:left;">' +
      '    <b>商务咨询：</b>下单后我们的商务顾问将在 1 个工作日内与您电话联系，确认合同、发票与交付事宜。' +
      '    演示提示：当前网站为纯前端演示环境，订单数据仅保存在您的浏览器本地。' +
      '  </div>' +
      '  <p style="margin-top:16px;"><a href="index.html">返回首页</a> · <a href="pricing.html">查看其他套餐</a></p>' +
      '</div>';

    var wrap = $('#panel-result');
    wrap.innerHTML = html;
    $('#r-no').textContent = o.orderNo;
    $('#r-plan').textContent = o.planName + '（' + PLANS[o.plan].desc + '）';
    $('#r-amount').textContent = '¥ ' + o.amount.toLocaleString() + ' ' + o.unit;
    $('#r-pay').textContent = o.payName;
    $('#r-contact').textContent = o.company + ' · ' + o.contact + ' · ' + o.phone;

    $('#mock-pay').addEventListener('click', function () {
      // 【接入点】正式上线：真实支付由支付平台异步回调后端更新状态，
      // 前端轮询订单接口刷新状态；此处仅为演示按钮。
      o.status = '已支付';
      saveOrder(o);
      var icon = $('#result-icon');
      icon.className = 'result-icon';
      icon.textContent = '✓';
      $('h2') && null;
      $('#result-status').className = 'status-tag paid';
      $('#result-status').textContent = '状态：已支付（演示）';
      $('#mock-pay').disabled = true;
      $('#mock-pay').textContent = '支付已完成';
      // 标题仅提示一次
      var h = wrap.querySelector('h2');
      if (h) h.textContent = '支付成功，感谢订购！';
    });
  }

  // 订单查询（演示）
  var queryBtn = $('#order-query-btn');
  if (queryBtn) {
    queryBtn.addEventListener('click', function () {
      var no = $('#order-query-input').value.trim();
      var box = $('#order-query-result');
      var orders = loadOrders();
      var found = orders.filter(function (o) { return o.orderNo === no; })[0];
      if (!found) {
        box.innerHTML = '<div class="notice" style="margin-top:16px;">未找到该订单。请确认订单编号是否正确' +
          '（演示环境的订单仅保存在当前浏览器中）。</div>';
        return;
      }
      box.innerHTML = '<div class="order-summary" style="margin-top:16px;text-align:left;">' +
        '<dl><dt>订单编号</dt><dd>' + found.orderNo + '</dd>' +
        '<dt>订购套餐</dt><dd>' + found.planName + '</dd>' +
        '<dt>订单金额</dt><dd>¥ ' + found.amount.toLocaleString() + ' ' + found.unit + '</dd>' +
        '<dt>支付方式</dt><dd>' + found.payName + '</dd>' +
        '<dt>订单状态</dt><dd>' + found.status + '</dd>' +
        '<dt>下单时间</dt><dd>' + new Date(found.createdAt).toLocaleString('zh-CN', { hour12: false }) + '</dd></dl></div>';
    });
  }

  // ---------- 工具函数 ----------
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function nowStamp() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes());
  }
  function rand4() { return Math.floor(1000 + Math.random() * 9000); }
  function loadOrders() {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || []; } catch (e) { return []; }
  }
  function saveOrder(order) {
    var orders = loadOrders().filter(function (o) { return o.orderNo !== order.orderNo; });
    orders.unshift(order);
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }

  render();
})();
