// Breeze & Bite Cafe - 主應用程式邏輯
// 包含事件過濾委派 (Event Delegation & Filtering)、sessionStorage 生命週期、
// 規格彈窗、拋物線飛入動畫、購物車與多次加點歷史紀錄

(function () {
  'use strict';

  // ==========================================
  // 1. 狀態管理 (State) 與 sessionStorage 同步
  // ==========================================
  const STORAGE_KEYS = {
    CART: 'breeze_cart',
    ORDERS: 'breeze_orders',
    TABLE: 'breeze_table'
  };

  // 從網址參數讀取桌號 (如 ?table=A-02)，若無則從 sessionStorage 讀取或使用預設
  const urlParams = new URLSearchParams(window.location.search);
  const initialTable = urlParams.get('table') || sessionStorage.getItem(STORAGE_KEYS.TABLE) || RESTAURANT_INFO.defaultTable;

  const appState = {
    currentTable: initialTable,
    cart: loadFromSession(STORAGE_KEYS.CART, []), // 購物車陣列
    orders: loadFromSession(STORAGE_KEYS.ORDERS, []), // 歷史送單批次陣列
    activeCategoryId: RESTAURANT_INFO.categories[0].id,
    currentSpecItem: null, // 當前在規格彈窗中選擇的商品
    currentSpecQuantity: 1,
    currentSpecSelections: {}, // 當前規格彈窗已選的選項
    searchQuery: '',
    isAnimating: false // 防連點節流鎖定
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
    // Toast
    toastMsg: document.getElementById('toastMsg'),
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

    renderCategoryNav();
    renderMenuItems();
    updateCartUI();
    updateHistoryBadge();
    bindEvents();
    setupScrollSpy();
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
    return `
      <div class="dish-card" data-action="open-spec-modal" data-dish-id="${dish.id}">
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
            <div class="dish-price"><small>NT$</small>${dish.price}</div>
            <button class="btn-add-spec" data-action="open-spec-modal" data-dish-id="${dish.id}">
              <i class="bi bi-plus-lg"></i>
              <span>選規格</span>
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

    // 規格彈窗內選項異動（radio / checkbox change）
    DOM.specOptionsContainer.addEventListener('change', handleSpecOptionChange);

    // 確認加入購物車
    DOM.btnConfirmAddToCart.addEventListener('click', handleConfirmAddToCart);
  }

  // 事件過濾分發器 (Event Filter Dispatcher)
  function handleAppClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return; // 點擊其他非動作區域，直接過濾拋棄

    const action = actionEl.dataset.action;

    switch (action) {
      case 'open-spec-modal': {
        const dishId = actionEl.dataset.dishId;
        openSpecModal(dishId, actionEl);
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
      default:
        break;
    }

    // 分類導航 Chip 點擊
    const catChip = event.target.closest('.cat-chip');
    if (catChip) {
      const catId = catChip.dataset.catId;
      selectCategory(catId);
    }

    // 桌號選擇按鈕點擊
    const tableBtn = event.target.closest('.table-choice-btn');
    if (tableBtn) {
      const newTable = tableBtn.dataset.table;
      switchTable(newTable);
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
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  // 6. 規格客製化彈窗 (Customization Modal)
  // ==========================================
  function openSpecModal(dishId, sourceEl) {
    const dish = MENU_ITEMS.find(d => d.id === dishId);
    if (!dish) return;

    appState.currentSpecItem = dish;
    appState.currentSpecQuantity = 1;
    appState.currentSpecSelections = {};

    DOM.specDishName.textContent = dish.name;
    DOM.specDishEnName.textContent = dish.enName;
    DOM.specQtyDisplay.textContent = '1';

    // 渲染規格群組
    DOM.specOptionsContainer.innerHTML = dish.optionGroups.map(group => {
      // 預設選中
      if (group.type === 'radio') {
        const defaultOption = group.options.find(o => o.default) || group.options[0];
        appState.currentSpecSelections[group.id] = [defaultOption];
      } else {
        appState.currentSpecSelections[group.id] = [];
      }

      return `
        <div class="option-group" data-group-id="${group.id}" data-group-type="${group.type}">
          <div class="group-title-row">
            <span class="group-title">${group.name}</span>
            <span class="group-badge">${group.type === 'radio' ? '單選' : '可複選'}</span>
          </div>
          <div class="option-pill-grid">
            ${group.options.map((opt, optIdx) => {
              const isChecked = (group.type === 'radio' && opt.default);
              return `
                <label class="option-label ${isChecked ? 'checked' : ''}">
                  <div style="display: flex; align-items: center;">
                    <input type="${group.type}" 
                           name="spec_grp_${group.id}" 
                           value="${optIdx}" 
                           ${isChecked ? 'checked' : ''} />
                    <span>${opt.name}</span>
                  </div>
                  ${opt.price > 0 ? `<span class="option-price-diff">+NT$ ${opt.price}</span>` : ''}
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('') + `
      <div style="margin-top: 18px;">
        <div class="group-title" style="margin-bottom: 8px;">單品備註（如不要蔥、醬少等）</div>
        <textarea class="note-textarea" id="itemCustomNote" placeholder="若有特殊客製化需求，請在此填寫..."></textarea>
      </div>
    `;

    updateSpecPriceDisplay();
    openModal(DOM.specModal);
  }

  function handleSpecOptionChange(e) {
    const label = e.target.closest('.option-label');
    const groupEl = e.target.closest('.option-group');
    if (!groupEl || !label) return;

    const groupId = groupEl.dataset.groupId;
    const groupType = groupEl.dataset.groupType;
    const group = appState.currentSpecItem.optionGroups.find(g => g.id === groupId);

    if (groupType === 'radio') {
      // 單選：取消該組其他標籤的 checked 樣式
      groupEl.querySelectorAll('.option-label').forEach(lbl => lbl.classList.remove('checked'));
      label.classList.add('checked');
      const optIdx = parseInt(e.target.value, 10);
      appState.currentSpecSelections[groupId] = [group.options[optIdx]];
    } else {
      // 複選
      label.classList.toggle('checked', e.target.checked);
      const checkedInputs = groupEl.querySelectorAll('input[type="checkbox"]:checked');
      appState.currentSpecSelections[groupId] = Array.from(checkedInputs).map(inp => {
        return group.options[parseInt(inp.value, 10)];
      });
    }

    updateSpecPriceDisplay();
  }

  function calculateCurrentSpecUnitPrice() {
    if (!appState.currentSpecItem) return 0;
    let unitPrice = appState.currentSpecItem.price;

    Object.values(appState.currentSpecSelections).forEach(selectedOpts => {
      selectedOpts.forEach(opt => {
        if (opt.price) unitPrice += opt.price;
      });
    });

    return unitPrice;
  }

  function updateSpecPriceDisplay() {
    const unitPrice = calculateCurrentSpecUnitPrice();
    const totalPrice = unitPrice * appState.currentSpecQuantity;
    DOM.specAddBtnText.textContent = `加入購物車 NT$ ${totalPrice}`;
  }

  // ==========================================
  // 7. 加入購物車與拋物線飛入動畫 (Fly-to-Cart)
  // ==========================================
  function handleConfirmAddToCart(e) {
    if (appState.isAnimating) return; // 正在動畫中防重複觸發
    appState.isAnimating = true;

    const dish = appState.currentSpecItem;
    const unitPrice = calculateCurrentSpecUnitPrice();
    const customNote = document.getElementById('itemCustomNote')?.value.trim() || '';

    // 彙整選擇的規格字串
    const selectedSpecs = [];
    Object.values(appState.currentSpecSelections).forEach(opts => {
      opts.forEach(opt => {
        selectedSpecs.push(opt.name + (opt.price ? ` (+NT$${opt.price})` : ''));
      });
    });

    // 建立購物車項目物件
    const cartItem = {
      cartId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      dishId: dish.id,
      name: dish.name,
      image: dish.image,
      unitPrice: unitPrice,
      quantity: appState.currentSpecQuantity,
      specs: selectedSpecs,
      note: customNote
    };

    appState.cart.push(cartItem);
    saveToSession(STORAGE_KEYS.CART, appState.cart);

    // 啟動拋物線飛入動畫
    const startRect = DOM.btnConfirmAddToCart.getBoundingClientRect();
    const targetRect = DOM.floatingCartBar.getBoundingClientRect();

    closeModal(DOM.specModal);
    playFlyToCartAnimation(startRect, targetRect, () => {
      updateCartUI();
      triggerCartBounce();
      showToast(`已加入「${dish.name}」x${cartItem.quantity}`);
      appState.isAnimating = false;
    });
  }

  function playFlyToCartAnimation(startRect, targetRect, onComplete) {
    const flyer = document.createElement('div');
    flyer.className = 'flyer-dot';
    flyer.innerHTML = '<i class="bi bi-bag"></i>';
    document.body.appendChild(flyer);

    const startX = startRect.left + startRect.width / 2 - 11;
    const startY = startRect.top + startRect.height / 2 - 11;
    const endX = targetRect.left + 35;
    const endY = targetRect.top + 20;

    flyer.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;

    // 下一偵觸發飛行動畫
    requestAnimationFrame(() => {
      flyer.style.transform = `translate3d(${endX}px, ${endY}px, 0) scale(0.6)`;
      flyer.style.opacity = '0.5';
    });

    flyer.addEventListener('transitionend', () => {
      flyer.remove();
      if (onComplete) onComplete();
    }, { once: true });
  }

  function triggerCartBounce() {
    DOM.cartItemCount.classList.remove('bounce');
    void DOM.cartItemCount.offsetWidth; // 觸發重繪
    DOM.cartItemCount.classList.add('bounce');
  }

  // ==========================================
  // 8. 購物車界面與操作 (Cart Drawer)
  // ==========================================
  function updateCartUI() {
    const totalCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = appState.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    DOM.cartItemCount.textContent = totalCount;
    DOM.cartTotalPrice.textContent = `NT$ ${totalPrice.toLocaleString()}`;
    DOM.cartModalTotalPrice.textContent = `NT$ ${totalPrice.toLocaleString()}`;

    if (totalCount > 0) {
      DOM.floatingCartBar.classList.add('visible');
      DOM.cartCountDesc.textContent = `已選購 ${totalCount} 樣美味餐點`;
    } else {
      DOM.floatingCartBar.classList.remove('visible');
    }
  }

  function openCartModal() {
    if (appState.cart.length === 0) {
      showToast('購物車目前是空的，快去挑選餐點吧！');
      return;
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
          <div class="cart-item-price">NT$ ${item.unitPrice * item.quantity}</div>
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
  }

  function removeCartItem(index) {
    appState.cart.splice(index, 1);
    saveToSession(STORAGE_KEYS.CART, appState.cart);
    updateCartUI();
    renderCartItems();
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
          <p style="font-size: 15px; font-weight: 700;">目前尚無點單紀錄</p>
          <p style="font-size: 12px; margin-top: 4px;">挑選餐點放入購物車並送出後，紀錄將即時顯示在此處。</p>
        </div>
      `;
      return;
    }

    let cumulativeTotal = 0;
    const batchesHTML = appState.orders.map((batch, idx) => {
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
  function showToast(msg) {
    clearTimeout(toastTimer);
    DOM.toastText.textContent = msg;
    DOM.toastMsg.classList.add('show');
    toastTimer = setTimeout(() => {
      DOM.toastMsg.classList.remove('show');
    }, 2400);
  }

  // 啟動應用程式
  init();

})();
