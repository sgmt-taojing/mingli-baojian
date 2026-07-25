(function(){
      // 自动填充当前年份
      let now = new Date();
      let targetInput = document.getElementById('af-target');
      if (targetInput && !targetInput.value) targetInput.value = now.getFullYear();
      // 如果是跨年期，自动提示
      if (typeof AnnualFortune !== 'undefined' && AnnualFortune.isYearTransitionPeriod && AnnualFortune.isYearTransitionPeriod()) {
        let out = document.getElementById('annualFortuneOutput');
        if (out) {
          out.innerHTML = '<div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:16px;text-align:center"><p style="color:var(--gold);font-size:14px;letter-spacing:2px;margin:0">🎊 当前正值跨年祈福期，建议生成次年度祈福参拜指南</p></div>';
        }
      }
    })();
    function runAnnualFortune() {
      let y = parseInt(document.getElementById('af-year').value);
      let m = parseInt(document.getElementById('af-month').value);
      let d = parseInt(document.getElementById('af-day').value);
      let h = parseInt(document.getElementById('af-hour').value);
      let s = document.getElementById('af-sex').value;
      let t = parseInt(document.getElementById('af-target').value) || new Date().getFullYear();
      if (!y || !m || !d) { showToast('请填写出生年月日'); return; }
      try {
        let report = AnnualFortune.generateAnnualReport({year:y, month:m, day:d, hour:h||12, sex:s}, t);
        document.getElementById('annualFortuneOutput').innerHTML = report;
      } catch(e) {
        document.getElementById('annualFortuneOutput').innerHTML = '<div style="color:var(--cinn2);padding:16px">生成失败：' + e.message + '</div>';
      }
    }
    function runWorshipGuide() {
      let y = parseInt(document.getElementById('af-year').value);
      let m = parseInt(document.getElementById('af-month').value);
      let d = parseInt(document.getElementById('af-day').value);
      let h = parseInt(document.getElementById('af-hour').value);
      let s = document.getElementById('af-sex').value;
      let t = parseInt(document.getElementById('af-target').value) || new Date().getFullYear();
      if (!y || !m || !d) { showToast('请填写出生年月日'); return; }
      try {
        let guide = AnnualFortune.generateWorshipGuide({year:y, month:m, day:d, hour:h||12, sex:s}, t);
        document.getElementById('annualFortuneOutput').innerHTML = guide;
      } catch(e) {
        document.getElementById('annualFortuneOutput').innerHTML = '<div style="color:var(--cinn2);padding:16px">生成失败：' + e.message + '</div>';
      }
    }