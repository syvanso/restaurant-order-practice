// Breeze & Bite Cafe - 主應用程式邏輯
// 包含事件過濾委派 (Event Delegation & Filtering)、sessionStorage 生命週期、
// 雙人/超值套餐複選上限鎖定、必選漏選紅框導引、單點動態展開升級套餐、
// 購物車重新編輯規格、未送單溫馨提醒、拋物線飛入動畫與多次加點歷史紀錄

(function () {
  'use strict';

  // ==========================================
  // 1. 狀態管理 (State) 與 sessionStorage 同步
  // ==========================================
  const STORAGE_KEYS = {
    CART: 'breeze_cart',
    ORDERS: 'breeze_orders',
    TABLE: 'breeze_table',
    FONT_MODE: 'breeze_font_mode'
  };

  // 從網址參數讀取桌號 (如 ?table=A-02)，若無則從 sessionStorage 讀取或使用預設
  const urlParams = new URLSearchParams(window.location.search);
  const initialTable = urlParams.get('table') || sessionStorage.getItem(STORAGE_KEYS.TABLE) || RESTAURANT_INFO.defaultTable;

  const appState = {
    currentTable: initialTable,
    isLargeFont: loadFromSession(STORAGE_KEYS.FONT_MODE, false), // 是否啟用放大字體模式
    cart: loadFromSession(STORAGE_KEYS.CART, []), // 購物車陣列
    orders: loadFromSession(STORAGE_KEYS.ORDERS, []), // 歷史送單批次陣列
    activeCategoryId: RESTAURANT_INFO.categories[0].id,
    currentSpecItem: null, // 當前在規格彈窗中選擇的商品
    currentSpecQuantity: 1,
    currentSpecSelections: {}, // { groupId: [optIndex1, optIndex2, ...] } 儲存選中的 option index 陣列
    editingCartIndex: null, // 若不為 null，代表正在修改購物車內第 N 個品項的規格
    searchQuery: '',
    isAnimating: false, // 防連點節流鎖定
    unsubmittedTimer: null // 忘記送出訂單提醒計時器
  };

  function loadFromSession(key, defaultValue) {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('讀取 sessionStorage 失敗，使用預設值', e);
      return defaultValue;
    }
  }

  function saveToSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('儲存至 sessionStorage 失敗', e);
    }
  }

  // ==========================================
  // 2. DOM 元素快取
  // ==========================================
  const DOM = {
    app: document.getElementById('app'),
    currentTableDisplay: document.getElementById('currentTableDisplay'),
    cartTableHint: document.getElementById('cartTableHint'),
    orderBatchBadge: document.getElementById('orderBatchBadge'),
    menuSearchInput: document.getElementById('menuSearchInput'),
    categoryNav: document.getElementById('categoryNav'),
    menuScrollContainer: document.getElementById('menuScrollContainer'),
    floatingCartBar: document.getElementById('floatingCartBar'),
    unsubmittedReminderBubble: document.getElementById('unsubmittedReminderBubble'),
    cartItemCount: document.getElementById('cartItemCount'),
    cartTotalPrice: document.getElementById('cartTotalPrice'),
    cartCountDesc: document.getElementById('cartCountDesc'),
    // 規格彈窗
    specModal: document.getElementById('specModal'),
    specDishName: document.getElementById('specDishName'),
    specDishEnName: document.getElementById('specDishEnName'),
    specOptionsContainer: document.getElementById('specOptionsContainer'),
    specQtyMinus: document.getElementById('specQtyMinus'),
    specQtyPlus: document.getElementById('specQtyPlus'),
    specQtyDisplay: document.getElementById('specQtyDisplay'),
    specAddBtnIcon: document.getElementById('specAddBtnIcon'),
    specAddBtnText: document.getElementById('specAddBtnText'),
    btnConfirmAddToCart: document.getElementById('btnConfirmAddToCart'),
    // 購物車彈窗
    cartModal: document.getElementById('cartModal'),
    cartItemsList: document.getElementById('cartItemsList'),
    cartModalTotalPrice: document.getElementById('cartModalTotalPrice'),
    orderGeneralNote: document.getElementById('orderGeneralNote'),
    btnSubmitOrder: document.getElementById('btnSubmitOrder'),
    // 歷史紀錄彈窗
    historyModal: document.getElementById('historyModal'),
    historyOrdersContent: document.getElementById('historyOrdersContent'),
    // 桌號彈窗
    tableModal: document.getElementById('tableModal'),
    tableGrid: document.getElementById('tableGrid'),
    // 練習指南彈窗與字體切換
    guideModal: document.getElementById('guideModal'),
    fontToggleBtn: document.getElementById('fontToggleBtn'),
    fontToggleIcon: document.getElementById('fontToggleIcon'),
    fontToggleText: document.getElementById('fontToggleText'),
    // Toast
    toastMsg: document.getElementById('toastMsg'),
    toastIcon: document.getElementById('toastIcon'),
    toastText: document.getElementById('toastText')
  };

  // ==========================================
  // 3. 初始化渲染 (Initialization)
  // ==========================================
  function init() {
    DOM.currentTableDisplay.textContent = appState.currentTable;
    DOM.cartTableHint.textContent = `目前桌號：${appState.currentTable}`;

    const titleEl = document.getElementById('restaurantTitleDisplay');
    if (titleEl && RESTAURANT_INFO.name) {
      titleEl.textContent = RESTAURANT_INFO.name;
    }
    const announceEl = document.getElementById('announcementDisplay');
    if (announceEl && RESTAURANT_INFO.announcement) {
      announceEl.textContent = RESTAURANT_INFO.announcement;
    }

    applyFontSizeMode();
    renderCategoryNav();
    renderMenuItems();
    updateCartUI();
    updateHistoryBadge();
    bindEvents();
    setupScrollSpy();
    resetUnsubmittedReminderTimer();
  }

  function applyFontSizeMode() {
    DOM.app.classList.toggle('large-font-mode', appState.isLargeFont);
    if (DOM.fontToggleBtn) {
      DOM.fontToggleBtn.classList.toggle('active', appState.isLargeFont);
    }
    if (DOM.fontToggleIcon) {
      DOM.fontToggleIcon.className = appState.isLargeFont ? 'bi bi-zoom-out' : 'bi bi-zoom-in';
    }
    if (DOM.fontToggleText) {
      DOM.fontToggleText.textContent = appState.isLargeFont ? '標準字' : '大字版';
    }
  }

  function toggleFontSizeMode() {
    appState.isLargeFont = !appState.isLargeFont;
    saveToSession(STORAGE_KEYS.FONT_MODE, appState.isLargeFont);
    applyFontSizeMode();
    if (appState.isLargeFont) {
      showToast('🔍 已切換為「清晰大字版」！再點一次可切回標準字體');
    } else {
      showToast('📱 已切換為「市面餐廳標準字體」！');
    }
  }

  // 渲染置頂橫向分類標籤
  function renderCategoryNav() {
    DOM.categoryNav.innerHTML = RESTAURANT_INFO.categories.map((cat, idx) => `
      <button class="cat-chip ${idx === 0 ? 'active' : ''}" data-cat-id="${cat.id}">
        ${cat.name}
      </button>
    `).join('');
  }

  // 渲染所有餐點 (支援即時關鍵字搜尋過濾)
  function renderMenuItems() {
    const query = appState.searchQuery.trim().toLowerCase();
    let html = '';

    RESTAURANT_INFO.categories.forEach(cat => {
      // 過濾出屬於該分類且符合搜尋條件的餐點
      const items = MENU_ITEMS.filter(item => {
        const matchCategory = (cat.id === 'popular') ? item.isPopular : (item.categoryId === cat.id);
        if (!matchCategory) return false;
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          item.enName.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(t => t.toLowerCase().includes(query))
        );
      });

      if (items.length === 0) return;

      html += `
        <div class="category-section" id="cat-section-${cat.id}">
          <div class="category-header">
            <span>${cat.name}</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">(${items.length})</span>
          </div>
          <div class="dish-grid">
            ${items.map(dish => createDishCardHTML(dish)).join('')}
          </div>
        </div>
      `;
    });

    if (!html) {
      DOM.menuScrollContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <i class="bi bi-search" style="font-size: 36px; color: var(--border-light); margin-bottom: 12px; display: inline-block;"></i>
          <p style="font-size: 15px; font-weight: 700;">找不到符合「${query}」的餐點</p>
          <p style="font-size: 12px; margin-top: 4px;">換個關鍵字或點擊上方分類看看吧！</p>
        </div>
      `;
    } else {
      DOM.menuScrollContainer.innerHTML = html;
    }
  }

  function createDishCardHTML(dish) {
    const isCombo = dish.categoryId === 'combo';
    return `
      <div class="dish-card" data-action="open-spec-modal" data-dish-id="${dish.id}" ${isCombo ? 'style="border: 1.5px solid rgba(194, 94, 46, 0.25); background: #fffdf9;"' : ''}>
        <div class="dish-img-box">
          <img class="dish-img" src="${dish.image}" alt="${dish.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'" />
        </div>
        <div class="dish-info">
          <div>
            <div class="dish-name">${dish.name}</div>
            <div class="dish-desc">${dish.description}</div>
            <div class="dish-tags">
              ${dish.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
            </div>
          </div>
          <div class="dish-bottom">
            <div class="dish-price"><small>NT$</small>${dish.price}<small style="font-size: 11px; color: var(--text-muted); font-weight: 500;"> 起</small></div>
            <button class="btn-add-spec" data-action="open-spec-modal" data-dish-id="${dish.id}">
              <i class="bi bi-plus-lg"></i>
              <span>${isCombo ? '選套餐內容' : '選規格'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 4. 事件過濾 (eventFilter) 與事件委派架構
  // ==========================================
  function bindEvents() {
    // 核心事件過濾委派：掛在最外層 #app 容器，過濾出目標動作
    DOM.app.addEventListener('click', handleAppClick);

    // 搜尋即時過濾（帶防抖 debounce）
    let searchDebounceTimer = null;
    DOM.menuSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        appState.searchQuery = e.target.value;
        renderMenuItems();
      }, 250);
    });

    // 規格數量增減
    DOM.specQtyMinus.addEventListener('click', () => {
      if (appState.currentSpecQuantity > 1) {
        appState.currentSpecQuantity--;
        DOM.specQtyDisplay.textContent = appState.currentSpecQuantity;
        updateSpecPriceDisplay();
      }
    });

    DOM.specQtyPlus.addEventListener('click', () => {
      appState.currentSpecQuantity++;
      DOM.specQtyDisplay.textContent = appState.currentSpecQuantity;
      updateSpecPriceDisplay();
    });

    // 規格彈窗內攔截「已達複選上限」的反灰選項點擊，跳出友善教學提示
    DOM.specOptionsContainer.addEventListener('click', (e) => {
      const lockedLabel = e.target.closest('.option-label.disabled-limit');
      if (lockedLabel) {
        e.preventDefault();
        e.stopPropagation();
        const groupEl = lockedLabel.closest('.option-group');
        const groupId = groupEl?.dataset.groupId;
        const group = appState.currentSpecItem?.optionGroups.find(g => g.id === groupId);
        const max = group?.maxSelect || 2;
        showToast(`⚠️ 此區最多只能選 ${max} 項！請先點一下「已打勾的項目」取消，才能改選其他餐點喔！`, 'warn');
      }
    });

    // 規格彈窗內選項異動（radio / checkbox change）
    DOM.specOptionsContainer.addEventListener('change', handleSpecOptionChange);

    // 確認加入購物車 / 更新規格
    DOM.btnConfirmAddToCart.addEventListener('click', handleConfirmAddToCart);
  }

  // 事件過濾分發器 (Event Filter Dispatcher)
  function handleAppClick(event) {
    // 1. 優先攔截分類標籤點擊 (.cat-chip)
    const catChip = event.target.closest('.cat-chip');
    if (catChip) {
      const catId = catChip.dataset.catId;
      selectCategory(catId);
      return;
    }

    // 2. 優先攔截桌號切換按鈕點擊 (.table-choice-btn)
    const tableBtn = event.target.closest('.table-choice-btn');
    if (tableBtn) {
      const newTable = tableBtn.dataset.table;
      switchTable(newTable);
      return;
    }

    // 3. 攔截具有 data-action 的動作按鈕
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    switch (action) {
      case 'open-spec-modal': {
        const dishId = actionEl.dataset.dishId;
        openSpecModal(dishId, null);
        break;
      }
      case 'close-spec-modal':
        closeModal(DOM.specModal);
        break;
      case 'open-cart':
        openCartModal();
        break;
      case 'close-cart-modal':
        closeModal(DOM.cartModal);
        break;
      case 'open-history':
        openHistoryModal();
        break;
      case 'close-history-modal':
        closeModal(DOM.historyModal);
        break;
      case 'open-table-picker':
        openModal(DOM.tableModal);
        break;
      case 'close-table-modal':
        closeModal(DOM.tableModal);
        break;
      case 'open-guide':
        openModal(DOM.guideModal);
        break;
      case 'close-guide-modal':
        closeModal(DOM.guideModal);
        break;
      case 'toggle-font-size':
        toggleFontSizeMode();
        break;
      case 'quick-practice': {
        const dishId = actionEl.dataset.dishId;
        closeModal(DOM.guideModal);
        setTimeout(() => {
          openSpecModal(dishId, null);
        }, 220);
        break;
      }
      case 'submit-order':
        submitOrder();
        break;
      case 'reset-session':
        confirmResetSession();
        break;
      case 'cart-plus': {
        const cartIndex = parseInt(actionEl.dataset.index, 10);
        changeCartItemQty(cartIndex, 1);
        break;
      }
      case 'cart-minus': {
        const cartIndex = parseInt(actionEl.dataset.index, 10);
        changeCartItemQty(cartIndex, -1);
        break;
      }
      case 'cart-delete': {
        const cartIndex = parseInt(actionEl.dataset.index, 10);
        removeCartItem(cartIndex);
        break;
      }
      case 'cart-edit': {
        const cartIndex = parseInt(actionEl.dataset.index, 10);
        closeModal(DOM.cartModal);
        setTimeout(() => {
          const item = appState.cart[cartIndex];
          if (item) {
            openSpecModal(item.dishId, cartIndex);
          }
        }, 200);
        break;
      }
      default:
        break;
    }
  }

  // ==========================================
  // 5. 分類 ScrollSpy 與標籤聯動
  // ==========================================
  function selectCategory(catId) {
    appState.activeCategoryId = catId;
    document.querySelectorAll('.cat-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.catId === catId);
    });

    const targetSection = document.getElementById(`cat-section-${catId}`);
    if (targetSection && DOM.menuScrollContainer) {
      const containerRect = DOM.menuScrollContainer.getBoundingClientRect();
      const sectionRect = targetSection.getBoundingClientRect();
      const scrollOffset = sectionRect.top - containerRect.top + DOM.menuScrollContainer.scrollTop - 8;

      DOM.menuScrollContainer.scrollTo({
        top: Math.max(0, scrollOffset),
        behavior: 'smooth'
      });
    }
  }

  function setupScrollSpy() {
    let scrollThrottle = false;
    DOM.menuScrollContainer.addEventListener('scroll', () => {
      if (scrollThrottle) return;
      scrollThrottle = true;
      requestAnimationFrame(() => {
        updateActiveCategoryOnScroll();
        scrollThrottle = false;
      });
    });
  }

  function updateActiveCategoryOnScroll() {
    const containerTop = DOM.menuScrollContainer.getBoundingClientRect().top;
    const sections = document.querySelectorAll('.category-section');
    let currentId = null;

    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top - containerTop <= 80) {
        currentId = sec.id.replace('cat-section-', '');
      }
    });

    if (currentId && currentId !== appState.activeCategoryId) {
      appState.activeCategoryId = currentId;
      document.querySelectorAll('.cat-chip').forEach(chip => {
        const isActive = (chip.dataset.catId === currentId);
        chip.classList.toggle('active', isActive);
        if (isActive) {
          chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }
  }

  // ==========================================
  // 6. 規格客製化彈窗 (支援複選上限、無預設必選、動態展開與修改規格)
  // ==========================================
  function isGroupVisible(group) {
    if (!group.showIf) return true;
    const parentGroupId = group.showIf.groupId;
    const parentGroup = appState.currentSpecItem?.optionGroups.find(g => g.id === parentGroupId);
    if (!parentGroup) return true;

    const selectedIndices = appState.currentSpecSelections[parentGroupId] || [];
    return selectedIndices.some(idx => {
      const opt = parentGroup.options[idx];
      return opt && group.showIf.optionIds.includes(opt.id);
    });
  }

  function getGroupBadgeInfo(group, selectedIndices) {
    const count = selectedIndices.length;
    if (group.type === 'radio') {
      if (group.required) {
        if (count === 0) {
          return { text: '必選 1 項 (未選擇)', cls: 'badge-required-pending' };
        }
        return { text: '✓ 已完成必選', cls: 'badge-completed' };
      }
      return { text: '單選', cls: 'badge-optional' };
    } else {
      // checkbox
      const min = group.minSelect || 0;
      const max = group.maxSelect || null;
      if (group.required && min > 0) {
        if (count < min) {
          return { text: `必選 ${min} 項 (已選 ${count}/${min})`, cls: 'badge-required-pending' };
        }
        return { text: `✓ 已選滿 ${count}/${max || min} 項`, cls: 'badge-completed' };
      }
      if (max) {
        return { text: `可複選 (最多 ${max} 項・已選 ${count})`, cls: 'badge-optional' };
      }
      return { text: count > 0 ? `可複選 (已選 ${count} 項)` : '可複選 (選填)', cls: 'badge-optional' };
    }
  }

  function openSpecModal(dishId, editingCartIndex = null) {
    const dish = MENU_ITEMS.find(d => d.id === dishId);
    if (!dish) return;

    appState.currentSpecItem = dish;
    appState.editingCartIndex = editingCartIndex;
    appState.currentSpecSelections = {};

    const editingItem = (editingCartIndex !== null && appState.cart[editingCartIndex]) ? appState.cart[editingCartIndex] : null;
    appState.currentSpecQuantity = editingItem ? editingItem.quantity : 1;

    DOM.specDishName.textContent = editingItem ? `✏️ 修改：${dish.name}` : dish.name;
    DOM.specDishEnName.textContent = dish.enName;
    DOM.specQtyDisplay.textContent = String(appState.currentSpecQuantity);

    // 初始化每個規格群組的預設選項或還原購物車選項
    dish.optionGroups.forEach(group => {
      if (editingItem && editingItem.rawSelections && Array.isArray(editingItem.rawSelections[group.id])) {
        appState.currentSpecSelections[group.id] = [...editingItem.rawSelections[group.id]];
      } else if (group.type === 'radio') {
        // 只有明確標註 default: true 的選項才會預選，模擬真實點餐「必選卻無預設值」的情境
        const defaultIdx = group.options.findIndex(o => o.default === true);
        appState.currentSpecSelections[group.id] = (defaultIdx !== -1) ? [defaultIdx] : [];
      } else {
        const defaultIndices = [];
        group.options.forEach((o, idx) => {
          if (o.default === true) defaultIndices.push(idx);
        });
        appState.currentSpecSelections[group.id] = defaultIndices;
      }
    });

    renderSpecGroupsHTML(editingItem ? editingItem.note : '');
    updateSpecPriceDisplay();
    openModal(DOM.specModal);
    DOM.specOptionsContainer.scrollTop = 0;
  }

  function renderSpecGroupsHTML(initialNote = '') {
    const dish = appState.currentSpecItem;
    if (!dish) return;

    DOM.specOptionsContainer.innerHTML = dish.optionGroups.map(group => {
      const visible = isGroupVisible(group);
      const selectedIndices = appState.currentSpecSelections[group.id] || [];
      const badge = getGroupBadgeInfo(group, selectedIndices);
      const isMaxReached = (group.type === 'checkbox' && group.maxSelect && selectedIndices.length >= group.maxSelect);

      return `
        <div class="option-group ${visible ? '' : 'hidden-conditional'}" 
             id="spec-group-box-${group.id}"
             data-group-id="${group.id}" 
             data-group-type="${group.type}">
          <div class="group-title-row">
            <span class="group-title">${group.name}</span>
            <span class="group-badge ${badge.cls}" id="spec-badge-${group.id}">${badge.text}</span>
          </div>
          ${group.hint ? `<div class="group-hint">${group.hint}</div>` : ''}
          <div class="option-pill-grid">
            ${group.options.map((opt, optIdx) => {
        const isChecked = selectedIndices.includes(optIdx);
        const isLocked = (!isChecked && isMaxReached);
        return `
                <label class="option-label ${isChecked ? 'checked' : ''} ${isLocked ? 'disabled-limit' : ''}" data-opt-idx="${optIdx}">
                  <div style="display: flex; align-items: center; flex-wrap: wrap;">
                    <input type="${group.type}" 
                           name="spec_grp_${group.id}" 
                           value="${optIdx}" 
                           ${isChecked ? 'checked' : ''} />
                    <span>${opt.name}</span>
                    ${isLocked ? `<span class="limit-lock-tag">已滿上限</span>` : ''}
                  </div>
                  ${opt.price > 0 ? `<span class="option-price-diff">+NT$ ${opt.price}</span>` : `<span style="font-size: 11.5px; color: var(--text-light);">+$0</span>`}
                </label>
              `;
      }).join('')}
          </div>
          <div class="validation-error-container" id="spec-err-${group.id}"></div>
        </div>
      `;
    }).join('') + `
      <div style="margin-top: 18px;">
        <div class="group-title" style="margin-bottom: 8px;">單品特別備註（選填）</div>
        <textarea class="note-textarea" id="itemCustomNote" placeholder="若有其他客製化需求（如：某杯飲料去冰、漢堡對切等），請在此填寫...">${initialNote}</textarea>
      </div>
    `;
  }

  function handleSpecOptionChange(e) {
    const label = e.target.closest('.option-label');
    const groupEl = e.target.closest('.option-group');
    if (!groupEl || !label) return;

    const groupId = groupEl.dataset.groupId;
    const groupType = groupEl.dataset.groupType;
    const group = appState.currentSpecItem.optionGroups.find(g => g.id === groupId);
    if (!group) return;

    const optIdx = parseInt(e.target.value, 10);

    if (groupType === 'radio') {
      appState.currentSpecSelections[groupId] = [optIdx];
    } else {
      let currentList = appState.currentSpecSelections[groupId] || [];
      if (e.target.checked) {
        // 檢查複選上限
        if (group.maxSelect && currentList.length >= group.maxSelect) {
          e.target.checked = false;
          showToast(`⚠️ 此區最多只能選 ${group.maxSelect} 項！請先取消勾選其他項目再更換`, 'warn');
          return;
        }
        if (!currentList.includes(optIdx)) {
          currentList.push(optIdx);
        }
      } else {
        currentList = currentList.filter(i => i !== optIdx);
      }
      appState.currentSpecSelections[groupId] = currentList;
    }

    // 清除該群組的錯誤紅框狀態
    groupEl.classList.remove('validation-error');
    const errBox = document.getElementById(`spec-err-${groupId}`);
    if (errBox) errBox.innerHTML = '';

    // 同步更新該群組與任何受條件連動 (showIf) 影響的群組 UI
    syncSpecGroupUI(groupId);
    updateSpecPriceDisplay();
  }

  function syncSpecGroupUI(changedGroupId) {
    const dish = appState.currentSpecItem;
    if (!dish) return;

    let newlyRevealedCount = 0;

    dish.optionGroups.forEach(group => {
      const groupEl = document.getElementById(`spec-group-box-${group.id}`);
      if (!groupEl) return;

      // 1. 檢查動態條件展開 (showIf)
      const wasHidden = groupEl.classList.contains('hidden-conditional');
      const nowVisible = isGroupVisible(group);

      if (nowVisible && wasHidden) {
        groupEl.classList.remove('hidden-conditional');
        groupEl.classList.add('conditional-revealed');
        newlyRevealedCount++;
      } else if (!nowVisible && !wasHidden) {
        groupEl.classList.add('hidden-conditional');
        groupEl.classList.remove('conditional-revealed', 'validation-error');
      }

      // 2. 更新選項勾選樣式與複選上限鎖定狀態
      const selectedIndices = appState.currentSpecSelections[group.id] || [];
      const isMaxReached = (group.type === 'checkbox' && group.maxSelect && selectedIndices.length >= group.maxSelect);

      groupEl.querySelectorAll('.option-label').forEach(lbl => {
        const idx = parseInt(lbl.dataset.optIdx, 10);
        const inp = lbl.querySelector('input');
        const isChecked = selectedIndices.includes(idx);
        const isLocked = (!isChecked && isMaxReached);

        if (inp) inp.checked = isChecked;
        lbl.classList.toggle('checked', isChecked);
        lbl.classList.toggle('disabled-limit', isLocked);

        // 動態維護「已滿上限」小標籤
        const existingLockTag = lbl.querySelector('.limit-lock-tag');
        if (isLocked && !existingLockTag) {
          const wrapDiv = lbl.querySelector('div');
          if (wrapDiv) {
            const tag = document.createElement('span');
            tag.className = 'limit-lock-tag';
            tag.textContent = '已滿上限';
            wrapDiv.appendChild(tag);
          }
        } else if (!isLocked && existingLockTag) {
          existingLockTag.remove();
        }
      });

      // 3. 更新群組右上角狀態徽章
      const badgeEl = document.getElementById(`spec-badge-${group.id}`);
      if (badgeEl) {
        const badge = getGroupBadgeInfo(group, selectedIndices);
        badgeEl.className = `group-badge ${badge.cls}`;
        badgeEl.textContent = badge.text;
      }
    });

    if (changedGroupId === 'combo_upgrade' && newlyRevealedCount > 0) {
      showToast('✨ 已為您展開下方「套餐附餐與飲品」必選項目，請往下滑動挑選！');
    }
  }

  function calculateCurrentSpecUnitPrice() {
    if (!appState.currentSpecItem) return 0;
    let unitPrice = appState.currentSpecItem.price;

    appState.currentSpecItem.optionGroups.forEach(group => {
      if (!isGroupVisible(group)) return; // 隱藏的條件群組不計價
      const selectedIndices = appState.currentSpecSelections[group.id] || [];
      selectedIndices.forEach(idx => {
        const opt = group.options[idx];
        if (opt && opt.price) {
          unitPrice += opt.price;
        }
      });
    });

    return unitPrice;
  }

  function updateSpecPriceDisplay() {
    const unitPrice = calculateCurrentSpecUnitPrice();
    const totalPrice = unitPrice * appState.currentSpecQuantity;
    if (appState.editingCartIndex !== null) {
      DOM.specAddBtnIcon.className = 'bi bi-check2-circle';
      DOM.specAddBtnText.textContent = `確認更新規格 NT$ ${totalPrice}`;
    } else {
      DOM.specAddBtnIcon.className = 'bi bi-cart-plus';
      DOM.specAddBtnText.textContent = `加入購物車 NT$ ${totalPrice}`;
    }
  }

  // 驗證所有可見的必選群組是否已完成
  function validateSpecSelections() {
    const dish = appState.currentSpecItem;
    if (!dish) return false;

    let firstIncompleteEl = null;
    let firstIncompleteName = '';

    dish.optionGroups.forEach(group => {
      const groupEl = document.getElementById(`spec-group-box-${group.id}`);
      const errBox = document.getElementById(`spec-err-${group.id}`);
      if (!groupEl || !isGroupVisible(group)) return;

      const selectedIndices = appState.currentSpecSelections[group.id] || [];
      let isIncomplete = false;
      let errMsg = '';

      if (group.required) {
        if (group.type === 'radio' && selectedIndices.length === 0) {
          isIncomplete = true;
          errMsg = '此為必選項目，請點選其中 1 項！';
        } else if (group.type === 'checkbox') {
          const min = group.minSelect || 1;
          if (selectedIndices.length < min) {
            const diff = min - selectedIndices.length;
            isIncomplete = true;
            errMsg = `此區需選滿 ${min} 項，您目前已選 ${selectedIndices.length} 項（還差 ${diff} 項）！`;
          }
        }
      }

      if (isIncomplete) {
        groupEl.classList.remove('validation-error');
        void groupEl.offsetWidth; // 觸發重繪以重播 shake 動畫
        groupEl.classList.add('validation-error');
        if (errBox) {
          errBox.innerHTML = `<div class="validation-error-msg"><i class="bi bi-exclamation-triangle-fill"></i><span>${errMsg}</span></div>`;
        }
        if (!firstIncompleteEl) {
          firstIncompleteEl = groupEl;
          firstIncompleteName = group.name;
        }
      } else {
        groupEl.classList.remove('validation-error');
        if (errBox) errBox.innerHTML = '';
      }
    });

    if (firstIncompleteEl) {
      // 自動平滑捲動至第一個漏選的欄位
      firstIncompleteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`⚠️ 尚未完成必選項目：「${firstIncompleteName}」`, 'warn');
      return false;
    }

    return true;
  }

  // ==========================================
  // 7. 加入購物車 / 更新規格與拋物線飛入動畫 (Fly-to-Cart)
  // ==========================================
  function handleConfirmAddToCart() {
    if (appState.isAnimating) return;

    // 先執行必選規格驗證（若有漏選會自動捲動並紅框提示）
    if (!validateSpecSelections()) {
      return;
    }

    const dish = appState.currentSpecItem;
    const unitPrice = calculateCurrentSpecUnitPrice();
    const customNote = document.getElementById('itemCustomNote')?.value.trim() || '';

    // 彙整可見群組所選擇的規格字串與原始選項索引
    const selectedSpecs = [];
    const savedRawSelections = {};

    dish.optionGroups.forEach(group => {
      const selectedIndices = appState.currentSpecSelections[group.id] || [];
      savedRawSelections[group.id] = [...selectedIndices];

      if (!isGroupVisible(group)) return;
      selectedIndices.forEach(idx => {
        const opt = group.options[idx];
        if (opt) {
          selectedSpecs.push(opt.name + (opt.price ? ` (+NT$${opt.price})` : ''));
        }
      });
    });

    // 情境 A：正在編輯購物車內既有品項
    if (appState.editingCartIndex !== null && appState.cart[appState.editingCartIndex]) {
      const targetItem = appState.cart[appState.editingCartIndex];
      targetItem.unitPrice = unitPrice;
      targetItem.quantity = appState.currentSpecQuantity;
      targetItem.specs = selectedSpecs;
      targetItem.rawSelections = savedRawSelections;
      targetItem.note = customNote;

      saveToSession(STORAGE_KEYS.CART, appState.cart);
      updateCartUI();
      closeModal(DOM.specModal);
      showToast(`✅ 已更新「${dish.name}」的規格設定！`);
      setTimeout(() => {
        openCartModal();
      }, 220);
      return;
    }

    // 情境 B：新增品項至購物車
    appState.isAnimating = true;

    const cartItem = {
      cartId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      dishId: dish.id,
      name: dish.name,
      image: dish.image,
      unitPrice: unitPrice,
      quantity: appState.currentSpecQuantity,
      specs: selectedSpecs,
      rawSelections: savedRawSelections,
      note: customNote
    };

    appState.cart.push(cartItem);
    saveToSession(STORAGE_KEYS.CART, appState.cart);

    updateCartUI();
    resetUnsubmittedReminderTimer();

    const startRect = DOM.btnConfirmAddToCart.getBoundingClientRect();
    closeModal(DOM.specModal);

    playFlyToCartAnimation(startRect, () => {
      triggerCartBounce();
      showToast(`已加入購物車「${dish.name}」x${cartItem.quantity}`);
      appState.isAnimating = false;
    });
  }

  function playFlyToCartAnimation(startRect, onComplete) {
    const flyer = document.createElement('div');
    flyer.className = 'flyer-dot';
    flyer.innerHTML = '<i class="bi bi-cart-fill"></i>';
    document.body.appendChild(flyer);

    const startX = startRect.left + (startRect.width / 2) - 17;
    const startY = startRect.top + (startRect.height / 2) - 17;

    const targetEl = DOM.cartItemCount || DOM.floatingCartBar;
    const targetRect = targetEl.getBoundingClientRect();
    let endX = targetRect.left + (targetRect.width / 2) - 17;
    let endY = targetRect.top + (targetRect.height / 2) - 17;

    if (endY <= 0 || endY > window.innerHeight) {
      endX = window.innerWidth / 2 - 17;
      endY = window.innerHeight - 55;
    }

    const duration = 520;
    const startTime = performance.now();

    function animateFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentX = startX + (endX - startX) * progress;
      const arcHeight = Math.sin(progress * Math.PI) * -120;
      const currentY = startY + (endY - startY) * (progress * progress) + arcHeight;
      const currentScale = 1.3 - (0.55 * progress);

      flyer.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`;

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        flyer.remove();
        if (onComplete) onComplete();
      }
    }

    requestAnimationFrame(animateFrame);
  }

  function triggerCartBounce() {
    DOM.cartItemCount.classList.remove('bounce');
    void DOM.cartItemCount.offsetWidth;
    DOM.cartItemCount.classList.add('bounce');
  }

  // ==========================================
  // 8. 購物車界面、修改規格與未送單提醒 (Cart Drawer)
  // ==========================================
  function resetUnsubmittedReminderTimer() {
    clearTimeout(appState.unsubmittedTimer);
    if (DOM.unsubmittedReminderBubble) {
      DOM.unsubmittedReminderBubble.classList.remove('show');
    }

    if (appState.cart.length > 0) {
      // 若購物車內有商品且超過 22 秒尚未送出點單，跳出溫馨氣泡提醒
      appState.unsubmittedTimer = setTimeout(() => {
        if (appState.cart.length > 0 && DOM.unsubmittedReminderBubble) {
          DOM.unsubmittedReminderBubble.classList.add('show');
        }
      }, 22000);
    }
  }

  function updateCartUI() {
    const totalCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = appState.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    DOM.cartItemCount.textContent = totalCount;
    DOM.cartTotalPrice.textContent = `NT$ ${totalPrice.toLocaleString()}`;
    DOM.cartModalTotalPrice.textContent = `NT$ ${totalPrice.toLocaleString()}`;

    if (totalCount > 0) {
      DOM.floatingCartBar.classList.add('visible');
      DOM.cartCountDesc.textContent = `已選 ${totalCount} 樣餐點・尚未送出訂單`;
    } else {
      DOM.floatingCartBar.classList.remove('visible');
      if (DOM.unsubmittedReminderBubble) {
        DOM.unsubmittedReminderBubble.classList.remove('show');
      }
    }
  }

  function openCartModal() {
    if (appState.cart.length === 0) {
      showToast('購物車目前是空的，快去挑選餐點吧！');
      return;
    }

    if (DOM.unsubmittedReminderBubble) {
      DOM.unsubmittedReminderBubble.classList.remove('show');
    }
    renderCartItems();
    openModal(DOM.cartModal);
  }

  function renderCartItems() {
    if (appState.cart.length === 0) {
      DOM.cartItemsList.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
          <i class="bi bi-cart-x" style="font-size: 36px; margin-bottom: 8px; display: inline-block;"></i>
          <p>購物車空空如也</p>
        </div>
      `;
      closeModal(DOM.cartModal);
      return;
    }

    DOM.cartItemsList.innerHTML = appState.cart.map((item, idx) => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${item.specs.length > 0 ? `<div class="cart-item-specs">${item.specs.join(' / ')}</div>` : ''}
          ${item.note ? `<div class="cart-item-specs" style="color: var(--primary);">備註: ${item.note}</div>` : ''}
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px;">
            <span class="cart-item-price" style="margin-top: 0;">NT$ ${item.unitPrice * item.quantity}</span>
            <button class="btn-edit-spec" data-action="cart-edit" data-index="${idx}" title="重新修改此餐點的內容與規格">
              <i class="bi bi-pencil-square"></i>
              <span>修改規格</span>
            </button>
          </div>
        </div>
        <div class="cart-item-action">
          <button style="background: none; border: none; color: var(--text-light); cursor: pointer; padding: 2px;" 
                  data-action="cart-delete" data-index="${idx}" title="刪除品項">
            <i class="bi bi-trash3"></i>
          </button>
          <div class="qty-control" style="margin-top: 6px;">
            <button class="qty-btn" data-action="cart-minus" data-index="${idx}"><i class="bi bi-dash"></i></button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" data-action="cart-plus" data-index="${idx}"><i class="bi bi-plus"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function changeCartItemQty(index, delta) {
    if (!appState.cart[index]) return;
    appState.cart[index].quantity += delta;
    if (appState.cart[index].quantity <= 0) {
      appState.cart.splice(index, 1);
    }
    saveToSession(STORAGE_KEYS.CART, appState.cart);
    updateCartUI();
    renderCartItems();
    resetUnsubmittedReminderTimer();
  }

  function removeCartItem(index) {
    appState.cart.splice(index, 1);
    saveToSession(STORAGE_KEYS.CART, appState.cart);
    updateCartUI();
    renderCartItems();
    resetUnsubmittedReminderTimer();
    showToast('已移除餐點');
  }

  // ==========================================
  // 9. 送出點單與多次加點紀錄 (Order History)
  // ==========================================
  function submitOrder() {
    if (appState.cart.length === 0) return;

    const generalNote = DOM.orderGeneralNote.value.trim();
    const batchNumber = appState.orders.length + 1;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const batchSubtotal = appState.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    const orderBatch = {
      batchId: `batch_${Date.now()}`,
      batchTitle: (batchNumber === 1) ? '第 1 次送單' : `第 ${batchNumber} 次加點`,
      time: timeStr,
      table: appState.currentTable,
      status: '廚房製作中',
      note: generalNote,
      subtotal: batchSubtotal,
      items: JSON.parse(JSON.stringify(appState.cart))
    };

    appState.orders.push(orderBatch);
    saveToSession(STORAGE_KEYS.ORDERS, appState.orders);

    // 清空當前購物車與備註
    appState.cart = [];
    saveToSession(STORAGE_KEYS.CART, appState.cart);
    DOM.orderGeneralNote.value = '';

    updateCartUI();
    updateHistoryBadge();
    resetUnsubmittedReminderTimer();
    closeModal(DOM.cartModal);

    showToast('🎉 點單已成功送達廚房製作！');
    setTimeout(() => {
      openHistoryModal();
    }, 400);
  }

  function updateHistoryBadge() {
    const totalBatches = appState.orders.length;
    if (totalBatches > 0) {
      DOM.orderBatchBadge.style.display = 'block';
      DOM.orderBatchBadge.textContent = totalBatches;
    } else {
      DOM.orderBatchBadge.style.display = 'none';
    }
  }

  function openHistoryModal() {
    renderHistoryOrders();
    openModal(DOM.historyModal);
  }

  function renderHistoryOrders() {
    if (appState.orders.length === 0) {
      DOM.historyOrdersContent.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <i class="bi bi-receipt-cutoff" style="font-size: 42px; margin-bottom: 12px; display: inline-block; color: var(--border-light);"></i>
          <p style="font-size: 15px; font-weight: 700;">目前尚無已送出的點單紀錄</p>
          <p style="font-size: 12px; margin-top: 4px;">將餐點放入購物車後，記得點擊下方「去結帳 → 確認送出點單」，紀錄才會顯示在此處喔！</p>
        </div>
      `;
      return;
    }

    let cumulativeTotal = 0;
    const batchesHTML = appState.orders.map(batch => {
      cumulativeTotal += batch.subtotal;
      return `
        <div class="order-history-batch">
          <div class="batch-header">
            <div>
              <span class="batch-title">${batch.batchTitle}</span>
              <span style="font-size: 12px; color: var(--text-muted); margin-left: 6px;">[${batch.table}]</span>
            </div>
            <span class="status-badge cooking">👨‍🍳 ${batch.status}</span>
          </div>
          <div class="batch-time">下單時間：${batch.time}</div>
          ${batch.items.map(item => `
            <div class="batch-item-line">
              <span>${item.name} × ${item.quantity}</span>
              <span>NT$ ${item.unitPrice * item.quantity}</span>
            </div>
            ${item.specs.length > 0 ? `<div class="batch-item-subspecs">${item.specs.join(' / ')}</div>` : ''}
            ${item.note ? `<div class="batch-item-subspecs" style="color: var(--primary);">備註: ${item.note}</div>` : ''}
          `).join('')}
          ${batch.note ? `<div class="batch-item-subspecs" style="color: var(--secondary); margin-top: 4px;">整單特別需求: ${batch.note}</div>` : ''}
          <div class="batch-total-row">此批小計：NT$ ${batch.subtotal.toLocaleString()}</div>
        </div>
      `;
    }).join('');

    DOM.historyOrdersContent.innerHTML = `
      ${batchesHTML}
      <div class="history-summary-box">
        <div>
          <div style="font-size: 12px; color: var(--text-muted);">本次用餐累計消費</div>
          <div style="font-size: 11px; color: var(--primary); font-weight: 600;">共 ${appState.orders.length} 次送單批次</div>
        </div>
        <div style="font-size: 20px; font-weight: 800; color: var(--primary);">
          NT$ ${cumulativeTotal.toLocaleString()}
        </div>
      </div>
    `;
  }

  // ==========================================
  // 10. 桌號切換與重置生命週期
  // ==========================================
  function switchTable(newTable) {
    appState.currentTable = newTable;
    sessionStorage.setItem(STORAGE_KEYS.TABLE, newTable);
    DOM.currentTableDisplay.textContent = newTable;
    DOM.cartTableHint.textContent = `目前桌號：${newTable}`;

    document.querySelectorAll('.table-choice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.table === newTable);
    });

    closeModal(DOM.tableModal);
    showToast(`已切換為「${newTable}」`);
  }

  function confirmResetSession() {
    if (confirm('確定要模擬顧客離席並清空整桌紀錄嗎？\n此動作將清除所有購物車與歷史點單！')) {
      sessionStorage.clear();
      appState.cart = [];
      appState.orders = [];
      updateCartUI();
      updateHistoryBadge();
      resetUnsubmittedReminderTimer();
      closeModal(DOM.historyModal);
      showToast('✨ 已重置為全新開桌狀態！');
    }
  }

  // ==========================================
  // 11. 通用彈窗輔助函式與 Toast
  // ==========================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('open');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('open');
  }

  let toastTimer = null;
  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer);
    DOM.toastText.textContent = msg;
    if (DOM.toastIcon) {
      if (type === 'warn') {
        DOM.toastIcon.className = 'bi bi-exclamation-triangle-fill';
        DOM.toastIcon.style.color = '#fbbf24';
      } else {
        DOM.toastIcon.className = 'bi bi-check-circle-fill';
        DOM.toastIcon.style.color = '#4ade80';
      }
    }
    DOM.toastMsg.classList.add('show');
    toastTimer = setTimeout(() => {
      DOM.toastMsg.classList.remove('show');
    }, 3000);
  }

  // 啟動應用程式
  init();

})();
