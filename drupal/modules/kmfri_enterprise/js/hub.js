/**
 * @file
 * KMFRI Enterprise Services Hub behaviours.
 *
 * Every page works without JavaScript (links, GET filters, full-page tabs);
 * these behaviours add the dropdowns, drawer, search dialog, hero slider,
 * live filtering, in-place laboratory tabs and the quotation estimate.
 */
((Drupal, once) => {
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusable = (root) =>
    [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.closest('[hidden]'));

  /* ------------------------------------------------------------------ *
   * Search matching — the same rules as Catalogue::searchTokens()/matches():
   * every word must occur (any order), question words ("price", "how much")
   * are ignored, plural -s and -ing are trimmed ("feeds" → "feed").
   * ------------------------------------------------------------------ */
  const STOPWORDS = new Set(['a', 'an', 'and', 'the', 'of', 'for', 'in', 'on', 'to', 'at', 'by', 'with', 'my', 'i', 'is', 'how', 'much', 'what', 'where', 'do', 'you', 'kmfri', 'price', 'prices', 'pricing', 'cost', 'costs', 'fee', 'fees', 'tariff', 'tariffs', 'charge', 'charges', 'rate', 'rates', 'service', 'services', 'ksh', 'kes']);
  const stem = (w) => {
    if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  };
  /** Query → tokens. A query of question words only ("prices") keeps them. */
  const kmfriTokens = (query) => {
    const words = query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const kept = words.filter((w) => !STOPWORDS.has(w));
    return (kept.length ? kept : words).map(stem);
  };
  /** 0 = no match; higher = better (words in the title, title starting with the first word). */
  const kmfriScore = (title, text, tokens) => {
    if (!tokens.every((t) => text.includes(t))) return 0;
    return 1 + tokens.filter((t) => title.includes(t)).length * 2 + (tokens.length && title.startsWith(tokens[0]) ? 1 : 0);
  };

  /* ------------------------------------------------------------------ *
   * Header: collapsing strip, dropdown menus, mobile drawer
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriHeader = {
    attach(context) {
      once('kmfri-header', '[data-kmfri-header]', context).forEach((wrap) => {
        const onScroll = () => wrap.classList.toggle('is-scrolled', window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        const items = [...wrap.querySelectorAll('[data-kmfri-menu]')];
        let timer;
        const setOpen = (item, open) => {
          item.classList.toggle('is-open', open);
          item.querySelector('.k-nav__toggle')?.setAttribute('aria-expanded', String(open));
        };
        const closeAll = (except) => items.forEach((i) => i !== except && setOpen(i, false));

        items.forEach((item) => {
          const toggle = item.querySelector('.k-nav__toggle');
          const links = () => [...item.querySelectorAll('.k-dropdown a')];
          item.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            closeAll(item);
            setOpen(item, true);
          });
          item.addEventListener('mouseleave', () => {
            clearTimeout(timer);
            timer = setTimeout(() => setOpen(item, false), 160);
          });
          toggle.addEventListener('click', () => {
            const open = !item.classList.contains('is-open');
            closeAll(item);
            setOpen(item, open);
          });
          item.addEventListener('focusout', (e) => {
            if (!item.contains(e.relatedTarget)) setOpen(item, false);
          });
          item.addEventListener('keydown', (e) => {
            const list = links();
            const idx = list.indexOf(document.activeElement);
            if (e.key === 'Escape') {
              setOpen(item, false);
              toggle.focus();
            }
            else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(item, true);
              requestAnimationFrame(() => list[Math.min(idx + 1, list.length - 1)]?.focus());
            }
            else if (e.key === 'ArrowUp' && idx > -1) {
              e.preventDefault();
              (idx === 0 ? toggle : list[idx - 1]).focus();
            }
          });
        });
        document.addEventListener('mousedown', (e) => {
          if (!wrap.contains(e.target)) closeAll();
        });

        // Drawer
        const drawer = document.querySelector('[data-kmfri-drawer]');
        const overlay = document.querySelector('[data-kmfri-drawer-overlay]');
        const opener = wrap.querySelector('[data-kmfri-drawer-open]');
        if (!drawer || !opener) return;
        let prevOverflow = '';
        const setDrawer = (open) => {
          drawer.classList.toggle('is-open', open);
          overlay.classList.toggle('is-open', open);
          drawer.setAttribute('aria-hidden', String(!open));
          drawer.toggleAttribute('inert', !open);
          opener.setAttribute('aria-expanded', String(open));
          if (open) {
            prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            setTimeout(() => drawer.querySelector('[data-kmfri-drawer-close]')?.focus(), 50);
          }
          else {
            document.body.style.overflow = prevOverflow;
            opener.focus();
          }
        };
        opener.addEventListener('click', () => setDrawer(true));
        overlay.addEventListener('click', () => setDrawer(false));
        drawer.querySelector('[data-kmfri-drawer-close]')?.addEventListener('click', () => setDrawer(false));
        drawer.addEventListener('keydown', (e) => e.key === 'Escape' && setDrawer(false));
        drawer.querySelectorAll('[data-kmfri-drawer-section]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const sub = document.getElementById(btn.getAttribute('aria-controls'));
            const open = btn.getAttribute('aria-expanded') !== 'true';
            btn.setAttribute('aria-expanded', String(open));
            btn.querySelector('svg')?.classList.toggle('rotate-180', open);
            sub.hidden = !open;
          });
        });
        // Opening search from the drawer closes it first.
        drawer.querySelectorAll('[data-kmfri-search-open]').forEach((b) => b.addEventListener('click', () => setDrawer(false)));
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Search dialog (Ctrl/⌘ + K)
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriSearch = {
    attach(context) {
      once('kmfri-search', '[data-kmfri-search]', context).forEach((dialog) => {
        const input = dialog.querySelector('[data-kmfri-search-input]');
        const clear = dialog.querySelector('[data-kmfri-search-clear]');
        const status = dialog.querySelector('[data-kmfri-search-status]');
        const empty = dialog.querySelector('[data-kmfri-search-empty]');
        const term = dialog.querySelector('[data-kmfri-search-term]');
        const filters = [...dialog.querySelectorAll('[data-kmfri-search-filter]')];
        const items = [...dialog.querySelectorAll('[data-kmfri-search-item]')];
        const groups = [...dialog.querySelectorAll('[data-kmfri-search-group]')];
        let filter = 'all';
        let highlight = 0;
        let opener = null;
        let prevOverflow = '';

        items.forEach((li, i) => { li.dataset.order = i; });
        // Results are re-ordered by relevance, so walk the DOM rather than `items`.
        const visible = () => [...dialog.querySelectorAll('[data-kmfri-search-item]:not([hidden])')];
        const paint = () => {
          visible().forEach((li, i) => {
            const a = li.querySelector('a');
            const on = i === highlight;
            a.classList.toggle('bg-navy-50', on);
            a.classList.toggle('border-[#cfdcef]', on);
            if (on) a.scrollIntoView({ block: 'nearest' });
          });
        };
        const update = () => {
          const raw = input.value.trim();
          const q = raw.toLowerCase();
          const tokens = kmfriTokens(raw);
          clear.hidden = !q;
          const scores = new Map();
          items.forEach((li) => {
            const score = q ? kmfriScore(li.dataset.title || '', li.dataset.text, tokens) : 0;
            let show = q ? score > 0 : li.dataset.default === '1';
            if (q && filter === 'services') show &&= li.dataset.type === 'services';
            if (q && filter === 'labs') show &&= li.dataset.type === 'labs';
            if (q && filter === 'stations') show &&= li.dataset.type === 'stations';
            if (q && filter === 'education') show &&= li.dataset.education === '1';
            li.hidden = !show;
            scores.set(li, score);
            li.querySelector('a').classList.remove('bg-navy-50', 'border-[#cfdcef]');
          });
          let shownGroups = 0;
          let total = 0;
          groups.forEach((g) => {
            // Best matches first; data-limit caps long groups (the "see all" link lists every match).
            const list = g.querySelector('ul');
            const shown = [...list.children]
              .filter((li) => !li.hidden)
              .sort((a, b) => scores.get(b) - scores.get(a) || a.dataset.order - b.dataset.order);
            shown.forEach((li) => list.append(li));
            const limit = Number(g.dataset.limit) || Infinity;
            shown.slice(limit).forEach((li) => { li.hidden = true; });
            const n = shown.length;
            total += n;
            const more = g.querySelector('[data-kmfri-search-more]');
            if (more) {
              more.hidden = !q || n <= limit;
              const url = new URL(more.getAttribute('href'), location.href);
              url.searchParams.set('q', raw);
              more.href = url.toString();
              more.textContent = more.dataset.label.replace('@count', n);
            }
            g.hidden = n === 0;
            g.querySelector('[data-kmfri-search-count]').textContent = n;
            g.classList.toggle('mt-4', shownGroups > 0);
            g.classList.toggle('pt-4', shownGroups > 0);
            g.classList.toggle('border-t', shownGroups > 0);
            if (n) shownGroups++;
          });
          empty.hidden = total > 0;
          term.textContent = input.value;
          status.textContent = q ? Drupal.t('@count matches', { '@count': total }) : Drupal.t('Suggested Searches');
          highlight = 0;
          paint();
        };
        const open = () => {
          opener = document.activeElement;
          dialog.hidden = false;
          prevOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          update();
          setTimeout(() => input.focus(), 60);
        };
        const close = () => {
          dialog.hidden = true;
          input.value = '';
          document.body.style.overflow = prevOverflow;
          opener?.focus?.();
        };

        document.addEventListener('click', (e) => {
          if (e.target.closest('[data-kmfri-search-open]')) {
            e.preventDefault();
            open();
          }
        });
        document.addEventListener('keydown', (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            dialog.hidden ? open() : input.focus();
          }
        });
        dialog.addEventListener('click', (e) => e.target === dialog && close());
        dialog.querySelector('[data-kmfri-search-close]').addEventListener('click', close);
        clear.addEventListener('click', () => {
          input.value = '';
          update();
          input.focus();
        });
        filters.forEach((b) => b.addEventListener('click', () => {
          filter = b.dataset.kmfriSearchFilter;
          filters.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          update();
        }));
        input.addEventListener('input', update);
        dialog.addEventListener('keydown', (e) => {
          const list = visible();
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowDown' && list.length) {
            e.preventDefault();
            highlight = (highlight + 1) % list.length;
            paint();
          }
          else if (e.key === 'ArrowUp' && list.length) {
            e.preventDefault();
            highlight = (highlight - 1 + list.length) % list.length;
            paint();
          }
          else if (e.key === 'Enter' && e.target === input && list.length) {
            e.preventDefault();
            list[highlight].querySelector('a').click();
          }
          else if (e.key === 'Tab') {
            const f = focusable(dialog);
            if (e.shiftKey && document.activeElement === f[0]) {
              e.preventDefault();
              f[f.length - 1].focus();
            }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
              e.preventDefault();
              f[0].focus();
            }
          }
        });
        items.forEach((li) => li.addEventListener('mouseenter', () => {
          highlight = visible().indexOf(li);
          paint();
        }));
        // Same-page anchors (tariff sections, "see all" on the current page) still close the dialog.
        [...items.map((li) => li.querySelector('a')), ...dialog.querySelectorAll('[data-kmfri-search-more]')].forEach((a) => a.addEventListener('click', () => {
          dialog.hidden = true;
          document.body.style.overflow = prevOverflow;
        }));
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Accessibility help popover
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriA11y = {
    attach(context) {
      once('kmfri-a11y', '[data-kmfri-a11y]', context).forEach((root) => {
        const panel = root.querySelector('#a11y-panel');
        const toggle = root.querySelector('[data-kmfri-a11y-toggle]');
        const set = (open) => {
          panel.hidden = !open;
          toggle.setAttribute('aria-expanded', String(open));
        };
        toggle.addEventListener('click', () => set(panel.hidden));
        root.querySelector('[data-kmfri-a11y-close]').addEventListener('click', () => set(false));
        document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
        document.addEventListener('mousedown', (e) => !root.contains(e.target) && set(false));
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Hero slider: autoplay, tabs (arrow keys / Home / End), pause, swipe
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriHero = {
    attach(context) {
      once('kmfri-hero', '[data-kmfri-hero]', context).forEach((hero) => {
        const slides = [...hero.querySelectorAll('.k-hero__slide')];
        const tabs = [...hero.querySelectorAll('.k-hero__tab')];
        const counter = hero.querySelector('[data-kmfri-hero-counter]');
        const pauseBtn = hero.querySelector('[data-kmfri-hero-pause]');
        const count = slides.length;
        const pad = (n) => String(n).padStart(2, '0');
        let active = 0;
        let paused = reduceMotion();
        let hover = false;
        let timer;

        const render = () => {
          slides.forEach((s, i) => {
            const on = i === active;
            s.classList.toggle('is-active', on);
            s.setAttribute('aria-hidden', String(!on));
            s.toggleAttribute('inert', !on);
          });
          tabs.forEach((t, i) => {
            t.setAttribute('aria-selected', String(i === active));
            t.tabIndex = i === active ? 0 : -1;
          });
          counter.textContent = `${pad(active + 1)} / ${pad(count)}`;
          hero.classList.toggle('is-paused', paused || hover);
          pauseBtn.setAttribute('aria-pressed', String(paused));
          pauseBtn.setAttribute('aria-label', paused ? Drupal.t('Play slideshow') : Drupal.t('Pause slideshow'));
          pauseBtn.querySelector('[data-icon-pause]').hidden = paused;
          pauseBtn.querySelector('[data-icon-play]').hidden = !paused;
          clearTimeout(timer);
          if (!paused && !hover) timer = setTimeout(() => goTo(active + 1), 7000);
        };
        const goTo = (i) => {
          active = ((i % count) + count) % count;
          render();
        };

        hero.querySelector('[data-kmfri-hero-prev]').addEventListener('click', () => goTo(active - 1));
        hero.querySelector('[data-kmfri-hero-next]').addEventListener('click', () => goTo(active + 1));
        pauseBtn.addEventListener('click', () => {
          paused = !paused;
          render();
        });
        tabs.forEach((t, i) => t.addEventListener('click', () => goTo(i)));
        hero.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
          const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 }[e.key];
          if (next === undefined) return;
          e.preventDefault();
          goTo(next);
          tabs[active].focus();
        });
        hero.addEventListener('mouseenter', () => {
          hover = true;
          render();
        });
        hero.addEventListener('mouseleave', () => {
          hover = false;
          render();
        });
        let touchX = null;
        hero.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
        hero.addEventListener('touchend', (e) => {
          if (touchX === null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 50) goTo(active + (dx < 0 ? 1 : -1));
          touchX = null;
        });
        render();
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Service catalogue: live search and availability filter.
   * The GET form (?q=, ?channel=) is the no-JS fallback; the URL stays shareable.
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriCatalogue = {
    attach(context) {
      once('kmfri-catalogue', '[data-kmfri-catalogue]', context).forEach((root) => {
        const form = root.querySelector('form[role="search"]');
        const q = root.querySelector('[data-kmfri-catalogue-q]');
        const channelInput = root.querySelector('[data-kmfri-catalogue-channel]');
        const filterButtons = [...root.querySelectorAll('[data-kmfri-catalogue-filter]')];
        const sectionsWrap = root.querySelector('[data-kmfri-catalogue-sections]');
        const sections = [...root.querySelectorAll('[data-kmfri-catalogue-section]')];
        const overview = root.querySelector('[data-kmfri-catalogue-overview]');
        const count = root.querySelector('[data-kmfri-catalogue-count]');
        const empty = root.querySelector('[data-kmfri-catalogue-empty]');
        const resets = [...root.querySelectorAll('[data-kmfri-catalogue-reset]')];
        // On the overview, groups are listed only while searching or filtering.
        const isOverview = !!overview;
        const total = count.textContent;

        const apply = () => {
          const query = q.value.toLowerCase().trim();
          const tokens = kmfriTokens(query);
          const channel = channelInput.value;
          const filtering = !!query || channel !== 'all';
          let shown = 0;
          sections.forEach((section) => {
            let visible = 0;
            section.querySelectorAll('[data-kmfri-catalogue-item]').forEach((row) => {
              const show = (!query || kmfriScore('', row.dataset.text, tokens) > 0)
                && (channel === 'all' || (channel === 'online' ? row.dataset.online === '1' : row.dataset.priced === '1'));
              row.hidden = !show;
              if (show) visible++;
            });
            section.hidden = visible === 0;
            section.querySelector('[data-kmfri-catalogue-section-count]').textContent = `${visible} ${visible === 1 ? 'service' : 'services'}`;
            shown += visible;
          });
          if (overview) overview.hidden = filtering;
          sectionsWrap.hidden = isOverview && !filtering;
          empty.hidden = shown > 0 || (isOverview && !filtering);
          count.textContent = isOverview && !filtering ? total : shown;
          filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kmfriCatalogueFilter === channel)));
          resets[0].hidden = !filtering;
          const params = new URLSearchParams();
          if (query) params.set('q', q.value.trim());
          if (channel !== 'all') params.set('channel', channel);
          history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}`);
        };

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          apply();
        });
        filterButtons.forEach((b) => b.addEventListener('click', (e) => {
          e.preventDefault();
          channelInput.value = b.dataset.kmfriCatalogueFilter;
          apply();
          if (!form.contains(b)) form.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
        }));
        q.addEventListener('input', apply);
        resets.forEach((r) => r.addEventListener('click', (e) => {
          e.preventDefault();
          q.value = '';
          channelInput.value = 'all';
          apply();
        }));
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Tariffs & Charter: live search of the tariff schedule.
   * The GET form (?q=) is the no-JS fallback; the URL stays shareable.
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriTariffs = {
    attach(context) {
      once('kmfri-tariffs', '[data-kmfri-tariffs]', context).forEach((root) => {
        const form = root.querySelector('form[role="search"]');
        const q = root.querySelector('[data-kmfri-tariffs-q]');
        const count = root.querySelector('[data-kmfri-tariffs-count]');
        const empty = root.querySelector('[data-kmfri-tariffs-empty]');
        const reset = root.querySelector('[data-kmfri-tariffs-reset]');
        const sections = [...root.querySelectorAll('[data-kmfri-tariffs-section]')];
        const jumps = [...root.querySelectorAll('[data-kmfri-tariffs-jump]')];

        const apply = () => {
          const query = q.value.trim();
          const tokens = kmfriTokens(query);
          let shown = 0;
          sections.forEach((section) => {
            let visible = 0;
            section.querySelectorAll('[data-kmfri-tariffs-rates]').forEach((block) => { block.hidden = false; });
            section.querySelectorAll('[data-kmfri-tariff-row]').forEach((row) => {
              const show = !query || kmfriScore('', row.dataset.text, tokens) > 0;
              row.hidden = !show;
              if (show) visible++;
            });
            // Hide rate tables with no matching rows.
            section.querySelectorAll('[data-kmfri-tariffs-rates]').forEach((block) => {
              block.hidden = !block.querySelector('[data-kmfri-tariff-row]:not([hidden])');
            });
            section.querySelectorAll('table').forEach((table) => {
              if (!table.closest('[data-kmfri-tariffs-rates]')) table.closest('.k-table-wrap').hidden = !table.querySelector('[data-kmfri-tariff-row]:not([hidden])');
            });
            section.hidden = visible === 0;
            shown += visible;
          });
          jumps.forEach((a) => { a.closest('li').hidden = document.getElementById(a.dataset.kmfriTariffsJump)?.hidden ?? false; });
          count.textContent = shown;
          empty.hidden = shown > 0;
          reset.hidden = !query;
          const url = new URL(location.href);
          if (query) url.searchParams.set('q', query);
          else url.searchParams.delete('q');
          history.replaceState(null, '', url.pathname + url.search + url.hash);
        };

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          apply();
        });
        q.addEventListener('input', apply);
        reset.addEventListener('click', (e) => {
          e.preventDefault();
          q.value = '';
          apply();
          q.focus();
        });
        if (q.value) apply();
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Dashboard catalogue: filter the tariff table (search + selects on data-*).
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriAdminFilter = {
    attach(context) {
      once('kmfri-admin-filter', '[data-kmfri-admin-filter]', context).forEach((root) => {
        const q = root.querySelector('[data-kmfri-admin-filter-q]');
        const selects = [...root.querySelectorAll('[data-kmfri-admin-filter-select]')];
        const rows = [...root.querySelectorAll('[data-kmfri-admin-filter-row]')];
        const count = root.querySelector('[data-kmfri-admin-filter-count]');
        const empty = root.querySelector('[data-kmfri-admin-filter-empty]');
        const apply = () => {
          const tokens = kmfriTokens(q.value.trim());
          let shown = 0;
          rows.forEach((row) => {
            let show = !q.value.trim() || kmfriScore('', row.dataset.text, tokens) > 0;
            selects.forEach((s) => {
              const field = s.dataset.kmfriAdminFilterSelect;
              if (s.value) show &&= (row.dataset[field] || '').split(' ').includes(s.value);
            });
            row.hidden = !show;
            if (show) shown++;
          });
          count.textContent = shown;
          empty.hidden = shown > 0;
        };
        q.addEventListener('input', apply);
        selects.forEach((s) => s.addEventListener('change', apply));
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Laboratory networks: in-place tabs (each tab is also a real link)
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriLabTabs = {
    attach(context) {
      once('kmfri-lab-tabs', '[data-kmfri-lab-tabs]', context).forEach((root) => {
        const tabs = [...root.querySelectorAll('[role="tab"]')];
        const select = (tab, focus) => {
          tabs.forEach((t) => {
            const on = t === tab;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
          });
          history.replaceState(null, '', tab.getAttribute('href').split('#')[0]);
          if (focus) tab.focus();
        };
        tabs.forEach((t, i) => {
          t.addEventListener('click', (e) => {
            e.preventDefault();
            select(t);
          });
          t.addEventListener('keydown', (e) => {
            const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
            if (next === undefined) return;
            e.preventDefault();
            select(tabs[(next + tabs.length) % tabs.length], true);
          });
        });
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Quotation form: live indicative tariff (tier cost × quantity)
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriEstimate = {
    attach(context) {
      once('kmfri-estimate', '[data-kmfri-estimate]', context).forEach((box) => {
        const tier = box.querySelector('[data-kmfri-tiers]');
        const qty = box.querySelector('[data-kmfri-quantity]');
        const total = box.querySelector('[data-kmfri-estimate-total]');
        const qtyLabel = qty && box.querySelector(`label[for="${qty.id}"]`);
        if (!tier || !qty || !total) return;
        const tiers = JSON.parse(tier.dataset.kmfriTiers);
        const update = () => {
          const t = tiers.find((x) => x.id === tier.value) ?? tiers[0];
          const n = Math.max(1, parseInt(qty.value, 10) || 1);
          total.textContent = `KES ${(t.cost * n).toLocaleString('en-KE')}`;
          if (qtyLabel) qtyLabel.firstChild.textContent = Drupal.t('Estimated Quantity (@unit)', { '@unit': t.unit });
        };
        tier.addEventListener('change', update);
        qty.addEventListener('input', update);
        update();
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Administration dashboard: sidebar drawer / collapse, user menu, "/" to search
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriDashboard = {
    attach(context) {
      once('kmfri-dashboard', '[data-kmfri-dashboard]', context).forEach((app) => {
        const sidebar = app.querySelector('[data-kd-sidebar]');
        const scrim = app.querySelector('[data-kd-scrim]');
        const opener = app.querySelector('[data-kd-sidebar-open]');
        const collapse = app.querySelector('[data-kd-collapse]');
        const KEY = 'kmfri.dashboard.collapsed';

        // Mobile / tablet drawer.
        const setOpen = (open) => {
          sidebar.classList.toggle('is-open', open);
          scrim.hidden = !open;
          opener?.setAttribute('aria-expanded', String(open));
          document.body.style.overflow = open ? 'hidden' : '';
          if (open) sidebar.querySelector('[data-kd-sidebar-close]')?.focus();
          else opener?.focus();
        };
        opener?.addEventListener('click', () => setOpen(true));
        scrim.addEventListener('click', () => setOpen(false));
        sidebar.querySelector('[data-kd-sidebar-close]')?.addEventListener('click', () => setOpen(false));
        sidebar.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setOpen(false);
        });
        window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
          if (e.matches && sidebar.classList.contains('is-open')) setOpen(false);
        });

        // Desktop collapse, remembered per browser.
        const setCollapsed = (on) => {
          app.classList.toggle('is-collapsed', on);
          collapse?.setAttribute('aria-pressed', String(on));
          collapse?.setAttribute('aria-label', on ? Drupal.t('Expand sidebar') : Drupal.t('Collapse sidebar'));
        };
        try {
          setCollapsed(localStorage.getItem(KEY) === '1');
        }
        catch (e) {
          // Storage unavailable: keep the default expanded sidebar.
        }
        collapse?.addEventListener('click', () => {
          const on = !app.classList.contains('is-collapsed');
          setCollapsed(on);
          try {
            localStorage.setItem(KEY, on ? '1' : '0');
          }
          catch (e) {
            // Ignore.
          }
        });

        // User menu.
        app.querySelectorAll('[data-kd-menu]').forEach((wrap) => {
          const toggle = wrap.querySelector('[data-kd-menu-toggle]');
          const menu = wrap.querySelector('.kd-menu');
          const set = (open, focusToggle) => {
            menu.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            if (open) menu.querySelector('a')?.focus();
            else if (focusToggle) toggle.focus();
          };
          toggle.addEventListener('click', () => set(menu.hidden));
          wrap.addEventListener('keydown', (e) => {
            const items = [...menu.querySelectorAll('a')];
            const i = items.indexOf(document.activeElement);
            if (e.key === 'Escape' && !menu.hidden) set(false, true);
            else if (e.key === 'ArrowDown' && !menu.hidden) {
              e.preventDefault();
              items[(i + 1) % items.length].focus();
            }
            else if (e.key === 'ArrowUp' && !menu.hidden) {
              e.preventDefault();
              items[(i - 1 + items.length) % items.length].focus();
            }
          });
          document.addEventListener('mousedown', (e) => !wrap.contains(e.target) && set(false));
          wrap.addEventListener('focusout', (e) => !wrap.contains(e.relatedTarget) && set(false));
        });

        // "/" focuses the search box (unless typing in a field).
        const search = app.querySelector('[data-kd-search]');
        document.addEventListener('keydown', (e) => {
          if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.target.closest('input, textarea, select, [contenteditable]')) return;
          e.preventDefault();
          search?.focus();
        });
      });
    },
  };

  /* ------------------------------------------------------------------ *
   * Print buttons (service specs, receipts)
   * ------------------------------------------------------------------ */
  Drupal.behaviors.kmfriPrint = {
    attach(context) {
      once('kmfri-print', '[data-kmfri-print]', context).forEach((b) => b.addEventListener('click', () => window.print()));
    },
  };
})(Drupal, once);
