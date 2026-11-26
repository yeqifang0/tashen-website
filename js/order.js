/* ==========================================================
   在线下单与支付流程
   ----------------------------------------------------------
   收款方式（真实收款，2026-11 起）：
   1. 扫码支付：展示上海塔伸科技有限公司「收钱吧」聚合商户
      收款码（assets/pay-qr.png）。微信、支付宝、云闪付等均可扫，
      用户扫码后自行输入订单金额。静态码无支付回调，订单状态
      由商务确认到账后人工跟进（页面提示用户保留支付凭证）。
   2. 对公转账：建设银行对公账户（收款名称：上海塔伸科技有限公司；
      开户银行：中国建设银行股份有限公司上海川沙支行；
      账号：31050161413600006018；转账备注订单号）。
   ----------------------------------------------------------
   订单数据说明：网站当前无后端，订单保存在用户浏览器
   localStorage，同一浏览器可通过"订单查询"查看；换设备时
   页面引导用户联系商务热线人工核对。
   ----------------------------------------------------------
   后续升级（自动确认收款，可选）：接入收钱吧开放平台或
   微信支付 Native v3 / 支付宝当面付 API（需营业执照 + 已
   备案域名），由后端生成带订单金额的动态收款码、接收支付
   回调并自动更新订单状态。展示层改造点以【接入点】注释标出。
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
    payment: 'qr',
    order: null
  };

  var PAY_NAMES = { qr: '扫码支付（微信/支付宝等）', bank: '对公转账' };

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
    var plan = PLANS[state.plan];
    if (state.payment === 'bank') {
      box.innerHTML = '' +
        '<div class="bank-info">' +
        '  <dl>' +
        '    <dt>收款名称</dt><dd>上海塔伸科技有限公司</dd>' +
        '    <dt>开户银行</dt><dd>中国建设银行股份有限公司上海川沙支行</dd>' +
        '    <dt>银行账号</dt><dd>31050161413600006018</dd>' +
        '    <dt>转账备注</dt><dd>请备注订单号，方便财务对账确认</dd>' +
        '  </dl>' +
        '</div>' +
        '<div class="notice">对公转账后，请将转账凭证发送至 1562779519@qq.com 或致电商务顾问 18501750936 确认。' +
        '财务确认到账后（一般 1 个工作日内）订单状态将更新为"已支付"。</div>';
    } else {
      box.innerHTML = '' +
        '<div class="qr-box">' +
        '  <img class="qr-real" src="assets/pay-qr.png" alt="上海塔伸科技有限公司收款二维码">' +
        '  <div class="qr-tip"><b>请使用微信、支付宝或云闪付"扫一扫"完成支付</b></div>' +
        '  <div class="qr-tip" style="margin-top:8px;color:#7a8494;">收款方：上海塔伸科技有限公司。' +
        '扫码后请在支付页面输入订单金额 <b style="color:var(--accent);">¥ ' + plan.price.toLocaleString() + '</b>，' +
        '支付完成请保留支付凭证。</div>' +
        '</div>';
    }
  }

  function renderSummary() {
    var plan = PLANS[state.plan];
    var s = $('#summary-plan');
    if (!s) return;
    s.textContent = plan.name + '（' + plan.desc + '）';
    $('#summary-amount').textContent = '¥ ' + plan.price.toLocaleString() + ' ' + plan.unit;
    var payName = PAY_NAMES[state.payment];
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
  // 【接入点】接入收钱吧/微信/支付宝 API 时：此处应改为调用后端创建订单接口
  // （POST /api/orders），由后端返回订单号并生成带金额的动态收款码；
  // 当前为静态收款码模式，订单号在浏览器本地生成。
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
      payName: PAY_NAMES[state.payment],
      company: val('f-company'),
      contact: val('f-name'),
      phone: val('f-phone'),
      email: val('f-email'),
      note: val('f-note'),
      status: '待支付',
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
    var isBank = o.payment === 'bank';
    var html = '' +
      '<div class="result-panel form-card">' +
      '  <div class="result-icon pending">⏳</div>' +
      '  <h2>订单提交成功！</h2>' +
      '  <div class="status-tag pending">状态：待支付</div>' +
      '  <div class="order-summary" style="text-align:left;margin-top:8px;">' +
      '    <dl>' +
      '      <dt>订单编号</dt><dd id="r-no"></dd>' +
      '      <dt>订购套餐</dt><dd id="r-plan"></dd>' +
      '      <dt>订单金额</dt><dd id="r-amount"></dd>' +
      '      <dt>支付方式</dt><dd id="r-pay"></dd>' +
      '      <dt>联系信息</dt><dd id="r-contact"></dd>' +
      '    </dl>' +
      '  </div>';
    if (!isBank) {
      html += '' +
        '  <div class="qr-box" style="margin-top:22px;">' +
        '    <img class="qr-real" src="assets/pay-qr.png" alt="上海塔伸科技有限公司收款二维码">' +
        '    <div class="qr-tip"><b>请使用微信、支付宝或云闪付扫码完成支付</b></div>' +
        '    <div class="qr-tip" style="margin-top:6px;color:#7a8494;">扫码后请在支付页面输入订单金额 ¥ ' + o.amount.toLocaleString() + '，' +
        '支付完成请保留支付凭证，方便商务核对。</div>' +
        '  </div>';
    } else {
      html += '' +
        '  <div class="bank-info" style="margin-top:22px;text-align:left;">' +
        '    <dl>' +
        '      <dt>收款名称</dt><dd>上海塔伸科技有限公司</dd>' +
        '      <dt>开户银行</dt><dd>中国建设银行股份有限公司上海川沙支行</dd>' +
        '      <dt>银行账号</dt><dd>31050161413600006018</dd>' +
        '      <dt>转账备注</dt><dd>请备注订单号：' + o.orderNo + '</dd>' +
        '    </dl>' +
        '  </div>' +
        '  <div class="notice" style="text-align:left;margin-top:16px;">已选择对公转账：请向上述账户转账并备注订单号。' +
        '转账后请将凭证发送至 1562779519@qq.com 或致电 18501750936，财务确认到账后订单转为"已支付"。</div>';
    }
    html += '' +
      '  <div class="notice blue" style="text-align:left;">' +
      '    <b>下一步：</b>支付完成后，我们的商务将在 1 个工作日内与您电话联系，确认合同、发票与交付事宜。' +
      '    订单信息保存在本机浏览器中，如需人工查询订单请联系商务热线 18501750936。' +
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
          '（订单信息保存在下单时所用的浏览器中），或致电商务热线 18501750936 人工查询。</div>';
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
