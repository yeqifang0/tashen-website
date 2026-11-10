/* 全站公共脚本：导航交互、当前页高亮、页脚年份 */
(function () {
  // 移动端菜单展开/收起
  var burger = document.querySelector('.burger');
  var navList = document.querySelector('.nav-list');
  if (burger && navList) {
    burger.addEventListener('click', function () {
      navList.classList.toggle('open');
    });
    navList.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navList.classList.remove('open');
      });
    });
  }

  // 根据当前页面文件名高亮导航
  var file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === file || (file === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // 页脚年份
  var year = document.getElementById('footer-year');
  if (year) year.textContent = new Date().getFullYear();
})();
