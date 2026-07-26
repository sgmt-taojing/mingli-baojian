
  // ═══ Toast ═══
  function showToast(msg, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var el = document.createElement('div');
    el.className = 'toast-msg toast-' + type + ' show';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, 3000);
  }

  // ═══ 验证码 ═══
  var codeCountdown = 0;
  var codeTimer = null;

  function sendCode() {
    var phone = document.getElementById('phoneInput').value.trim();
    if (!phone || phone.length !== 11 || !/^1\d{10}$/.test(phone)) {
      showToast('请输入正确的11位手机号', 'warn');
      return;
    }

    // 调用后端发送验证码（模拟）
    // 实际接口: POST /api/user/send-code { phone }
    showToast('验证码已发送（模拟：1234）', 'success');

    // 开始倒计时
    codeCountdown = 60;
    var btn = document.getElementById('codeBtn');
    var btnText = document.getElementById('codeBtnText');
    btn.disabled = true;

    codeTimer = setInterval(function () {
      codeCountdown--;
      if (codeCountdown <= 0) {
        clearInterval(codeTimer);
        btnText.textContent = '重新发送';
        btn.disabled = false;
      } else {
        btnText.textContent = codeCountdown + 's';
      }
    }, 1000);
  }

  // API地址判断
  var LOGIN_API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : '';
  var HAS_LOGIN_API = !!LOGIN_API_BASE;

  // ═══ 登录 ═══
  function doLogin() {
    // GitHub Pages无后端API时，用模拟登录
    if (!HAS_LOGIN_API) {
      var phone = document.getElementById('phoneInput').value.trim();
      var roles = ['free'];
      if (phone === '13700000000') roles = ['free','super_admin'];
      else if (phone === '13700000001') roles = ['free','master'];
      else if (phone === '13700000002') roles = ['free','doctor'];
      else if (phone === '13700000003') roles = ['free','patient'];
      else if (phone === '13700000005') roles = ['free','vip'];
      var fakeToken = 'demo_' + btoa(phone + '_' + Date.now());
      RBAC.saveLogin(fakeToken, roles, {name: phone, phoneMasked: phone.slice(0,3)+'****'+phone.slice(7)});
      showToast('登录成功（演示模式），正在跳转...', 'success');
      var params = new URLSearchParams(window.location.search);
      var redirect = params.get('redirect');
      setTimeout(function() { window.location.href = redirect || RBAC.HOME_PAGE; }, 800);
      return;
    }
    var phone = document.getElementById('phoneInput').value.trim();
    var code = document.getElementById('codeInput').value.trim();

    if (!phone || phone.length !== 11 || !/^1\d{10}$/.test(phone)) {
      showToast('请输入正确的11位手机号', 'warn');
      return;
    }
    if (!code || code.length < 4) {
      showToast('请输入验证码', 'warn');
      return;
    }

    var btn = document.getElementById('loginBtn');
    var btnText = document.getElementById('loginBtnText');
    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span>登录中...';

    // 调用后端登录接口
    fetch(LOGIN_API_BASE + '/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, code: code })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      btn.disabled = false;
      btnText.textContent = '登 录';

      if (data.error) {
        showToast(data.error, 'error');
        return;
      }

      if (data.token) {
        // 保存登录信息
        var roles = (data.user && data.user.roles) || ['free'];
        var userInfo = data.user || {};
        RBAC.saveLogin(data.token, roles, userInfo);

        showToast('登录成功，正在跳转...', 'success');

        // 检查redirect参数
        var params = new URLSearchParams(window.location.search);
        var redirect = params.get('redirect');

        setTimeout(function () {
          window.location.href = redirect || RBAC.HOME_PAGE;
        }, 800);
      } else {
        showToast('登录失败，请重试', 'error');
      }
    })
    .catch(function (err) {
      btn.disabled = false;
      btnText.textContent = '登 录';
      console.error('[login error]', err);
      showToast('网络错误，请稍后重试', 'error');
    });
  }

  // ═══ 快速登录（模拟，仅开发用） ═══
  function quickLogin(type) {
    var mockData = {
      guest: { roles: ['guest'], user: { name: '访客', vipLevel: null } },
      free: { roles: ['free'], user: { name: '缘主', vipLevel: 'free' } },
      vip: { roles: ['vip', 'free'], user: { name: 'VIP会员', vipLevel: 'lifetime' } }
    };

    var mock = mockData[type];
    if (!mock) return;

    // 模拟token（payload中包含exp）
    var header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
    var payload = btoa(JSON.stringify({
      iss: 'mingli-baojian',
      uid: type === 'guest' ? 0 : Date.now(),
      roles: mock.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    })).replace(/=/g, '');
    var mockToken = header + '.' + payload + '.mock-signature';

    RBAC.saveLogin(mockToken, mock.roles, mock.user);
    showToast('已以' + (mock.user.name) + '身份登录', 'success');

    setTimeout(function () {
      window.location.href = RBAC.HOME_PAGE;
    }, 600);
  }

  // ═══ 用户协议 ═══
  function showDisclaimer() {
    showToast('命理宝鉴仅供参考娱乐，不构成专业建议', 'info');
  }

  // ═══ 键盘支持 ═══
  document.getElementById('phoneInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      document.getElementById('codeInput').focus();
    }
  });
  document.getElementById('codeInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      doLogin();
    }
  });

  // ═══ 已登录则跳转 ═══
  if (RBAC.isLoggedIn()) {
    window.location.href = RBAC.HOME_PAGE;
  }
