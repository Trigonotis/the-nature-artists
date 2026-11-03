(() => {
  'use strict';
  const data = window.NATURE_DATA;
  const $ = id => document.getElementById(id);
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const url = value => { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? esc(u.href) : '#'; } catch { return '#'; } };
  const readStorage = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const saveStorage = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Browsing works with storage disabled. */ } };
  let language = readStorage('nature-language', data.settings.defaultLanguage) === 'zh' ? 'zh' : 'en';
  let topic = 'all', artist = '', limit = 6, activeWork = '', lastFocus = null;
  const t = (en, zh) => language === 'zh' ? zh : en;
  const artistFor = work => data.artists.find(a => a.id === work.artist_id);
  const fact = (work, key) => data.localization[work.id]?.[`${key}_${language}`] || work[key];
  const topicFor = work => data.settings.topics.find(t => t.works.includes(work.id));
  const name = (obj, prefix) => obj[`${prefix}_${language}`] || obj[`${prefix}_en`];
  const imagesFor = work => (work.image_ids || []).map(id => data.images.find(i => i.id === id)).filter(Boolean);
  const shortYear = work => work.year.match(/\d{4}(?:[–-]\d{4})?/)?.[0] || work.year;
  const shortTitle = work => ({'tree-mountain': t('Tree Mountain', '树山'), '7000-oaks': t('7000 Oaks', '7000棵橡树'), midway: t('Midway', '中途岛系列'), 'touch-sanitation': t('Touch Sanitation', '触摸环卫')}[work.id] || name(work, 'title'));
  const alts = {
    'wheatfield-01': 'A golden wheatfield beside Manhattan’s skyline.', 'wheatfield-02': 'Wheat growing on the Battery Park landfill, New York.',
    'tree-mountain-01': 'Tree Mountain, shown in a three-part studio composition of landscape and planting diagram.',
    '7000-oaks-01': 'A mature tree and basalt marker from Joseph Beuys’s 7000 Oaks project.',
    'revival-field-01': 'The circular Revival Field planting experiment on contaminated land.',
    'touch-sanitation-01': 'Mierle Laderman Ukeles greets a New York sanitation worker.',
    'ice-watch-01': 'Visitors gather around glacial ice in London, 2018.',
    'what-is-missing-01': 'The Listening Cone, a physical component of What Is Missing?',
    'ghost-forest-01': 'Dead Atlantic white cedars among living trees in a New York park.',
    'midway-01': 'A dead albatross fledgling with plastic fragments visible in its body.',
    'plastikophobia-01': 'A staged installation photograph of a diver figure in a glowing cave of plastic cups.',
    'plastikophobia-02': 'A figure beside a glowing sphere in a cave made of used plastic cups.',
    'fair-park-lagoon-01': 'Curving sculptural paths and plants in Fair Park Lagoon.',
    'beijing-besieged-01': 'A waste-covered landscape from promotional material for Beijing Besieged by Waste.',
    'beijing-besieged-02': 'Cattle on a waste-covered site in a film still.'
  };
  const media = (work, { hero = false, detail = false, index = 0 } = {}) => {
    const image = imagesFor(work)[index];
    if (!image) return `<div class="image-placeholder"><span>${esc(shortYear(work))}</span><small>${t('Image available at the source ↗', '前往来源查看图片 ↗')}</small></div>`;
    const photo = `<img src="${esc(image.src)}" alt="${esc(language === 'zh' ? image.alt_zh : alts[image.id] || work.title_en)}" width="${image.width}" height="${image.height}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${detail ? 'class="detail-photo"' : ''}>`;
    const badge = image.public_site_ready === true ? '' : `<span class="image-rights">${t('Image rights · pending review', '图片授权 · 待核实')}</span>`;
    return detail ? `<div class="detail-media">${photo}${badge}</div>` : photo + badge;
  };
  const themeDefinitions = [
    { topic: 'restoration', image: 'fair-park-lagoon', title: ['The art of repair.', '修复的艺术。'], text: ['When an artwork becomes a habitat, a forest, or a field of possibility.', '当艺术成为栖息地、森林，或一片孕育可能的土地。'] },
    { topic: 'climate', image: 'ice-watch', title: ['Making change tangible.', '让变化可被感知。'], text: ['Encounter a changing climate through ice, trees, and embodied experience.', '通过冰、树木与身体经验，感知正在变化的气候。'] },
    { topic: 'materials', image: 'plastikophobia', title: ['What we leave behind.', '我们留下了什么。'], text: ['Following the traces of consumption, from disposable objects to distant shores.', '从一次性物品到遥远海岸，追寻消费留下的痕迹。'] }
  ];

  function renderStatic() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.textContent = el.dataset[language]; });
    $('language').innerHTML = `${t('中文', 'EN')} <span aria-hidden="true">↗</span>`;
    $('language').setAttribute('aria-label', t('Switch to Chinese', 'Switch to English / 切换为英文'));
    $('search').placeholder = t('Search works, artists, ideas…', '搜索作品、艺术家、生态议题…');
    $('search').setAttribute('aria-label', t('Search works, artists, or ideas', '搜索作品、艺术家或议题'));
    $('navigation').setAttribute('aria-label', t('Main navigation', '主导航'));
    $('filters').setAttribute('aria-label', t('Filter by topic', '按主题筛选'));
    $('sort').setAttribute('aria-label', t('Sort artworks', '作品排序'));
    $('view-grid').setAttribute('aria-label', t('Grid view', '网格视图'));
    $('view-list').setAttribute('aria-label', t('List view', '列表视图'));
    $('menu').setAttribute('aria-label', t('Toggle navigation', '展开或收起导航'));
    document.querySelectorAll('.dialog-close').forEach(el => el.setAttribute('aria-label', t('Close dialog', '关闭弹窗')));
    document.title = t('The Nature Artists — Art for a living world', 'The Nature Artists — 为生命世界而艺术');
    $('archive-stats').innerHTML = `<span><b>${data.works.length.toString().padStart(2,'0')}</b>${t('works', '件／组作品')}</span><span><b>${data.artists.length}</b>${t('artists', '位艺术家')}</span><span><b>${data.settings.topics.length.toString().padStart(2,'0')}</b>${t('perspectives', '个主题')}</span>`;
    const feature = data.works.find(w => w.id === data.settings.featuredWork) || data.works[0];
    $('hero-image').innerHTML = media(feature, { hero: true });
    document.querySelector('.hero-work').innerHTML = `${esc(artistFor(feature).name_en)}<span>${esc(shortTitle(feature))}, ${esc(shortYear(feature))} ↗</span>`;
    document.querySelector('.hero-work').dataset.work = feature.id;
    $('updated').textContent = `${t('Collection updated', '档案更新')} · ${data.settings.updated}`;
    $('preview-note').textContent = data.testPreview ? t('PUBLIC TEST PREVIEW · Image permissions are pending review. Artwork and photography © their respective rights holders. Credits and source links are provided. No affiliation with the artists or institutions is implied.', '公开测试版 · 图片公开使用许可待核实。作品与摄影版权归相应权利人，已保留署名和来源链接。本站不代表相关艺术家或机构。') : data.preview ? t('LOCAL PREVIEW · Reference images are shown for review. Public reproduction permissions have not been confirmed. No affiliation with the artists or institutions is implied.', '本地预览 · 参考图片仅供审阅，公开使用许可尚未确认。本站不代表相关艺术家或机构。') : t('An independent, growing selection. Original artwork and photography © their respective rights holders.', '独立且持续扩充的作品选集。作品与摄影版权归相应权利人。');
    renderThemes(); renderArtists(); renderSources();
  }

  function renderFilters() {
    $('filters').innerHTML = [{ id: 'all', en: 'All works', zh: '全部作品', works: data.works.map(w => w.id) }, ...data.settings.topics].map(item => `<button class="filter ${topic === item.id ? 'active' : ''}" data-topic="${esc(item.id)}" aria-pressed="${topic === item.id}">${esc(item[language])}<span>${item.works.filter(id => data.works.some(w => w.id === id)).length.toString().padStart(2, '0')}</span></button>`).join('');
  }

  function filteredWorks() {
    const query = $('search').value.trim().toLocaleLowerCase();
    let works = data.works.filter(work => {
      const a = artistFor(work);
      const bucket = data.settings.topics.find(t => t.id === topic);
      const haystack = [work.title_en, work.title_zh, work.summary_en, work.summary_zh, a.name_en, a.name_zh, work.category, work.location, ...work.tags].join(' ').toLocaleLowerCase();
      return (!query || haystack.includes(query)) && (!bucket || bucket.works.includes(work.id)) && (!artist || work.artist_id === artist);
    });
    const order = $('sort').value;
    works.sort((a,b) => order === 'title' ? a.title_en.localeCompare(b.title_en) : order === 'newest' ? parseInt(shortYear(b)) - parseInt(shortYear(a)) : order === 'oldest' ? parseInt(shortYear(a)) - parseInt(shortYear(b)) : data.settings.order.indexOf(a.id) - data.settings.order.indexOf(b.id));
    return works;
  }

  function renderWorks() {
    const works = filteredWorks();
    const subset = works.slice(0, limit);
    $('works').innerHTML = subset.map((work, index) => {
      const a = artistFor(work), theme = topicFor(work);
      return `<article class="work-card"><button class="work-cover" data-work="${esc(work.id)}" aria-label="${esc(t('View ', '查看：') + shortTitle(work))}">${media(work)}<span class="cover-label">${esc(theme?.[language] || work.category)}</span><span class="work-arrow" aria-hidden="true">↗</span></button><div class="card-info"><div class="work-meta"><span>${esc(shortYear(work))}</span><span>NO. ${String(data.settings.order.indexOf(work.id) + 1).padStart(3, '0')}</span></div><h3><button class="work-title" data-work="${esc(work.id)}">${esc(shortTitle(work))}</button></h3><p class="work-by">${esc(name(a,'name'))}</p><p class="work-summary">${esc(name(work,'summary'))}</p><p class="work-location">${esc(fact(work,'location'))}</p></div></article>`;
    }).join('');
    const activeArtist = data.artists.find(a => a.id === artist);
    $('results').textContent = t(`${subset.length} of ${works.length} works${activeArtist ? ' · ' + activeArtist.name_en : ''}`, `显示 ${subset.length} / ${works.length} 件／组作品${activeArtist ? ' · ' + activeArtist.name_zh : ''}`);
    $('empty').hidden = works.length > 0;
    $('load-more').hidden = limit >= works.length;
    $('clear').hidden = topic === 'all' && !artist && !$('search').value;
    renderFilters();
  }

  function renderThemes() {
    $('theme-grid').innerHTML = themeDefinitions.map((theme, index) => {
      const work = data.works.find(w => w.id === theme.image), count = data.settings.topics.find(t => t.id === theme.topic).works.length;
      return `<button class="theme" data-explore="${theme.topic}" aria-label="${esc(t('Explore: ', '探索：') + t(...theme.title))}">${media(work)}<span class="theme-number">${t('PERSPECTIVE','主题')} / 0${index + 1}</span><h3>${esc(t(...theme.title))}</h3><p>${esc(t(...theme.text))}</p><div class="theme-bottom"><span>${count} ${t('works to explore', '件／组作品')}</span><span aria-hidden="true">↗</span></div></button>`;
    }).join('');
  }

  function renderArtists() {
    $('artist-directory').innerHTML = data.artists.map((a, index) => `<button class="artist-row" data-artist="${esc(a.id)}"><span class="artist-number">${String(index+1).padStart(2,'0')}</span><span class="artist-name">${esc(name(a,'name'))}<small>${esc(name(a,'bio'))}</small></span><span class="arrow" aria-hidden="true">↗</span></button>`).join('');
  }

  function renderSources() {
    $('source-list').innerHTML = data.sources.map(source => `<div class="source-row"><a href="${url(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><small>${esc(source.publisher)} · ${t('Accessed', '访问日期')} ${esc(source.accessed_at)}</small></div>`).join('') + `<h3>${t('Image credits', '图片署名')}</h3>` + data.images.map(image => `<div class="source-row"><p>${esc(image.credit)}</p><a href="${url(image.source_page)}" target="_blank" rel="noopener noreferrer">${t('Image source', '图片来源')} ↗</a><small>${t('Permission status', '授权状态')}: ${image.license_status === 'permission_not_verified' ? t('Public reproduction not verified', '公开使用许可尚未确认') : esc(image.license_status)}</small></div>`).join('');
  }

  function openDialog(dialog) {
    lastFocus = document.activeElement;
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('.dialog-close').focus();
  }

  function renderDetail(work) {
    const a = artistFor(work), images = imagesFor(work), theme = topicFor(work), sourceIds = work.source_ids || [];
    const sources = sourceIds.map(id => data.sources.find(s => s.id === id)).filter(Boolean);
    const image = images[0];
    const cc = image ? `<div class="detail-credit">${esc(image.credit)} <a href="${url(image.source_page)}" target="_blank" rel="noopener noreferrer">${t('Image source', '图片来源')} ↗</a>${image.license_url ? ` · <a href="${url(image.license_url)}" target="_blank" rel="noopener noreferrer">${t('Usage terms', '使用条款')} ↗</a>` : ''}</div>` : '';
    $('detail-content').innerHTML = `${media(work, { detail:true })}${cc}<div class="detail-body"><p class="eyebrow">${esc(theme?.[language] || '')} / ${esc(shortYear(work))}</p><h2 id="detail-title">${esc(name(work,'title'))}</h2><p class="detail-by">${esc(name(a,'name'))}</p><p class="detail-summary">${esc(name(work,'summary'))}</p><dl class="detail-facts"><div><dt>${t('Date / duration', '创作年份 / 持续时间')}</dt><dd>${esc(fact(work,'year'))}</dd></div><div><dt>${t('Location', '地点')}</dt><dd>${esc(fact(work,'location'))}</dd></div><div><dt>${t('Medium', '媒介')}</dt><dd>${esc(language === 'en' ? work.medium.split(' / ').slice(1).join(' / ') || work.medium : work.medium.split(' / ')[0])}</dd></div><div><dt>${t('Artist practice', '艺术家实践')}</dt><dd>${esc(name(a,'bio'))}</dd></div>${work.collaborators?.length ? `<div><dt>${t('Collaborators · Original credit', '合作者 · 原始署名')}</dt><dd>${esc(fact(work,'collaborators').join(' · '))}</dd></div>` : ''}</dl><p class="eyebrow">${t('Further reading / Primary sources', '延伸阅读 / 原始来源')}</p><div class="source-links">${sources.map(s => `<a href="${url(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} ↗</a>`).join('')}</div>${fact(work,'notes') || work.notes_zh ? `<p class="detail-note">${esc(fact(work,'notes') || work.notes_zh)}</p>` : ''}${images.length > 1 ? `<div class="detail-gallery">${images.slice(1).map((image,index) => `<figure>${media(work, { index:index+1 })}<figcaption>${esc(image.credit)} <a href="${url(image.source_page)}" target="_blank" rel="noopener noreferrer">${t('Source', '来源')} ↗</a></figcaption></figure>`).join('')}</div>` : ''}<div class="detail-tags">${work.tags.map(tag => `<span>#${esc(tag)}</span>`).join('')}</div><p class="detail-note">${t('A source-based description, not a claim of measured ecological outcomes. Artwork and photography remain the property of their respective rights holders.', '以上内容是基于来源的作品介绍，不代表经监测验证的生态成效。作品与摄影的权利归相应权利人。')}${data.preview ? ' ' + t('Reference images are included in this local preview only; public reproduction requires permission review.', '参考图仅用于本地预览；公开展示前需核对授权。') : ''}</p></div>`;
  }

  function openWork(id) {
    const work = data.works.find(w => w.id === id);
    if (!work) return;
    activeWork = id; renderDetail(work); openDialog($('detail'));
    history.replaceState(null, '', '#work=' + encodeURIComponent(id));
  }

  function reset() { topic = 'all'; artist = ''; limit = 6; $('search').value = ''; $('sort').value = 'curated'; renderWorks(); }
  function explore(id) { topic = id; artist = ''; limit = 6; $('search').value = ''; renderWorks(); $('archive').scrollIntoView({ behavior: 'smooth' }); }

  $('language').addEventListener('click', () => {
    language = language === 'en' ? 'zh' : 'en'; saveStorage('nature-language', language);
    renderStatic(); renderWorks();
    if ($('detail').open && activeWork) renderDetail(data.works.find(w => w.id === activeWork));
  });
  $('search').addEventListener('input', () => { limit = 6; renderWorks(); });
  $('sort').addEventListener('change', renderWorks);
  $('load-more').addEventListener('click', () => { limit += 6; renderWorks(); });
  $('clear').addEventListener('click', reset); $('reset').addEventListener('click', reset);
  $('view-grid').addEventListener('click', () => setView(false));
  $('view-list').addEventListener('click', () => setView(true));
  function setView(list) { $('works').classList.toggle('list-view', list); ['view-grid','view-list'].forEach((id,index) => { const selected = index === Number(list); $(id).classList.toggle('active', selected); $(id).setAttribute('aria-pressed', String(selected)); }); }
  $('menu').addEventListener('click', () => { const open = $('navigation').classList.toggle('open'); $('menu').setAttribute('aria-expanded', String(open)); });
  $('navigation').addEventListener('click', () => { $('navigation').classList.remove('open'); $('menu').setAttribute('aria-expanded', 'false'); });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-work],[data-topic],[data-explore],[data-artist]');
    if (!button) return;
    if (button.dataset.work) openWork(button.dataset.work);
    else if (button.dataset.topic) { topic = button.dataset.topic; limit = 6; renderWorks(); }
    else if (button.dataset.explore) explore(button.dataset.explore);
    else if (button.dataset.artist) { reset(); artist = button.dataset.artist; renderWorks(); $('archive').scrollIntoView({ behavior: 'smooth' }); }
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
    dialog.addEventListener('close', () => { if (dialog.id === 'detail') { activeWork = ''; history.replaceState(null, '', '#archive'); } if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true }); });
  });
  $('sources-button').addEventListener('click', () => openDialog($('sources-dialog')));
  $('suggest').addEventListener('click', () => { $('suggest-status').textContent = ''; openDialog($('suggest-dialog')); });
  $('suggest-form').addEventListener('submit', event => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const submission = { type: 'nature-artists-suggestion', schema_version: 1, ...fields, created_at: new Date().toISOString(), image_permission: 'not_reviewed' };
    const link = document.createElement('a'), blobUrl = URL.createObjectURL(new Blob([JSON.stringify(submission, null, 2)], { type: 'application/json' }));
    link.href = blobUrl; link.download = 'nature-artists-suggestion.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    $('suggest-status').textContent = t('Suggestion file prepared. It has not been uploaded or sent.', '推荐文件已生成；没有上传或发送任何信息。');
  });
  document.addEventListener('keydown', event => { if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) { event.preventDefault(); $('search').focus(); } });
  renderStatic(); renderWorks();
  if (location.hash.startsWith('#work=')) { try { openWork(decodeURIComponent(location.hash.slice(6))); } catch { /* Invalid fragment does not prevent browsing. */ } }
})();
