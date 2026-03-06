(function () {
  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderList(items) {
    var box = document.getElementById('articleResultsList');
    if (!box) return;
    if (!items.length) {
      box.innerHTML = '<div class="article-empty">没有匹配文章，换个关键词试试。</div>';
      return;
    }

    box.innerHTML = items.map(function (a) {
      var tags = (a.tags || []).map(function (tag) {
        return '<span class="article-tag">' + esc(tag) + '</span>';
      }).join('');

      return '<a class="article-card" target="_blank" href="' + esc(a.url) + '">' +
        '<h4>' + esc(a.title) + '</h4>' +
        '<p>' + esc(a.summary || '') + '</p>' +
        '<div class="article-tags">' + tags + '</div>' +
        '</a>';
    }).join('');
  }

  function normalizeText(v) {
    return String(v || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[\-_.，。、《》：:；;（）()【】\[\]"'“”‘’]/g, '');
  }

  function doSearch(keyword) {
    var all = window.C4_ARTICLES || [];
    var raw = (keyword || '').trim();
    var q = normalizeText(raw);

    if (!q) {
      renderList(all);
      return;
    }

    var result = all.filter(function (a) {
      var text = normalizeText([a.title, a.summary, (a.tags || []).join(' ')].join(' '));
      return text.indexOf(q) > -1;
    });

    renderList(result);
  }

  function bindThemeToggle() {
    var btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    var root = document.documentElement;
    var current = localStorage.getItem('c4_theme') || 'dark';

    function apply(theme) {
      if (theme === 'light') {
        root.classList.add('theme-light');
        btn.textContent = '☀️';
      } else {
        root.classList.remove('theme-light');
        btn.textContent = '🌙';
      }
      localStorage.setItem('c4_theme', theme);
    }

    apply(current);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      apply(root.classList.contains('theme-light') ? 'dark' : 'light');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('articleSearchInput');
    var btn = document.getElementById('articleSearchBtn');
    var tags = document.querySelectorAll('.search-tag');

    renderList(window.C4_ARTICLES || []);
    bindThemeToggle();

    if (btn && input) {
      btn.addEventListener('click', function () { doSearch(input.value); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearch(input.value);
        }
      });
    }

    tags.forEach(function (tagEl) {
      tagEl.addEventListener('click', function () {
        var t = tagEl.getAttribute('data-tag') || '';
        if (input) input.value = t;
        doSearch(t);
      });
    });
  });
})();
