
    var merit = parseInt(localStorage.getItem('qianyuan_merit') || '0');
    document.getElementById('meritNum').textContent = merit;
    
    function addMerit(n) {
      merit += n;
      localStorage.setItem('qianyuan_merit', merit);
      document.getElementById('meritNum').textContent = merit;
      showToast('功德 +' + n + '，当前功德：' + merit);
    }
  