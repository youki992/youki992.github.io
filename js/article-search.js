(function () {
  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeCoverUrl(url) {
    var raw = String(url || '').trim();
    if (!raw) return '';

    if (/mmbiz\.qpic\.cn/i.test(raw)) {
      var noProto = raw.replace(/^https?:\/\//i, '');
      return 'https://images.weserv.nl/?url=' + encodeURIComponent(noProto);
    }

    return raw;
  }

  function getCoverUrl(article) {
    var content = String((article && article.content) || '');

    var coverMatch = content.match(/!\[\s*cover_image\s*\]\(([^)]+)\)/i);
    if (coverMatch && coverMatch[1]) return normalizeCoverUrl(coverMatch[1]);

    var firstImageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (firstImageMatch && firstImageMatch[1]) return normalizeCoverUrl(firstImageMatch[1]);

    return '';
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

      var source = esc(a.source || '公众号：C4安全');
      var date = esc(a.date || '日期待补充');
      var coverUrl = getCoverUrl(a);
      var cover = coverUrl
        ? '<div class="article-cover"><img loading="lazy" src="' + esc(coverUrl) + '" alt="' + esc(a.title || '文章封面') + '"></div>'
        : '';

      return '<a class="article-card" href="' + esc(a.url) + '">' +
        cover +
        '<h4>' + esc(a.title) + '</h4>' +
        '<p>' + esc(a.summary || '') + '</p>' +
        '<div class="article-meta">' + source + ' · ' + date + '</div>' +
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
    var icon = document.getElementById('themeIcon');
    if (!btn) return;
    var root = document.documentElement;
    var current = localStorage.getItem('c4_theme') || 'dark';

    function apply(theme) {
      if (theme === 'light') {
        root.classList.add('theme-light');
        if (icon) icon.className = 'fa fa-sun-o';
      } else {
        root.classList.remove('theme-light');
        if (icon) icon.className = 'fa fa-moon-o';
      }
      localStorage.setItem('c4_theme', theme);
    }

    apply(current);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      apply(root.classList.contains('theme-light') ? 'dark' : 'light');
    });
  }

  function initArticleSearch() {
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

    Array.prototype.forEach.call(tags, function (tagEl) {
      tagEl.addEventListener('click', function () {
        var t = tagEl.getAttribute('data-tag') || '';
        if (input) input.value = t;
        doSearch(t);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticleSearch);
  } else {
    initArticleSearch();
  }
})();
