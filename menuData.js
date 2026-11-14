// 餐廳菜單資料與品項規格資料庫
const RESTAURANT_INFO = {
  name: "(練習用)Breeze & Bite 晨光輕食咖啡所",
  subtitle: "Brunch & Specialty Coffee",
  announcement: "🌿 今日低消每人一杯飲品或餐點・可點右上角「💡練習指南」查看常見點餐情境",
  defaultTable: "內用 A-05",
  categories: [
    { id: "popular", name: "🔥 人氣主打", icon: "bi-fire" },
    { id: "combo", name: "🎁 超值與雙人套餐", icon: "bi-gift" },
    { id: "brunch", name: "🍳 晨光早午餐", icon: "bi-egg-fried" },
    { id: "burger", name: "🍔 手打厚牛漢堡", icon: "bi-circle" },
    { id: "salad", name: "🥗 輕食溫沙拉", icon: "bi-flower1" },
    { id: "coffee", name: "☕ 義式與特調飲品", icon: "bi-cup-hot" },
    { id: "dessert", name: "🥞 手作甜點鬆餅", icon: "bi-cake2" }
  ]
};

// 共用的「單點內直接升級套餐」與「動態展開附餐選項」產生器
function createSingleItemUpgradeGroups() {
  return [
    {
      id: "combo_upgrade",
      name: "套餐升級選擇 (必選)",
      hint: "💡 選擇「升級套餐」後，下方會自動展開附餐飲品與甜點選項喔！",
      type: "radio",
      required: true,
      options: [
        { id: "single_only", name: "僅單點主餐 (不升級套餐)", price: 0, default: true },
        { id: "upgrade_a", name: "升級 A 套餐：附帕瑪森脆薯 + 套餐飲品", price: 99 },
        { id: "upgrade_b", name: "升級 B 套餐：附手作甜點 + 套餐飲品", price: 149 }
      ]
    },
    {
      id: "upgrade_dessert",
      name: "🍰 升級 B 套餐：選擇附餐甜點 (必選)",
      hint: "部分高單價現做甜點需補差價",
      type: "radio",
      required: true,
      showIf: { groupId: "combo_upgrade", optionIds: ["upgrade_b"] },
      options: [
        { name: "焦香巴斯克乳酪蛋糕 (套餐內含)", price: 0 },
        { name: "大人味微醺提拉米蘇 (+NT$15 升級)", price: 15 },
        { name: "靜岡抹茶紅豆千層蛋糕 (+NT$35 升級)", price: 35 },
        { name: "焦糖鹽之花炙燒厚舒芙蕾鬆餅 (+NT$80 升級)", price: 80 }
      ]
    },
    {
      id: "upgrade_drink",
      name: "🥤 升級套餐：選擇附餐飲品 (必選)",
      hint: "基本款 $0，換購特調飲品享補差價優惠",
      type: "radio",
      required: true,
      showIf: { groupId: "combo_upgrade", optionIds: ["upgrade_a", "upgrade_b"] },
      options: [
        { name: "莊園級美式黑咖啡 (套餐內含)", price: 0 },
        { name: "皇家伯爵鮮奶茶 (套餐內含)", price: 0 },
        { name: "經典絲絨拿鐵咖啡 (+NT$20 升級)", price: 20 },
        { name: "西西里香檸氣泡冰咖啡 (+NT$35 升級)", price: 35 },
        { name: "小山園靜岡抹茶燕麥拿鐵 (+NT$50 升級)", price: 50 }
      ]
    },
    {
      id: "upgrade_drink_custom",
      name: "🧊 升級套餐：飲品溫度與甜度 (必選)",
      hint: "⚠️ 此為必選但未預設勾選，請手動點選一項",
      type: "radio",
      required: true,
      showIf: { groupId: "combo_upgrade", optionIds: ["upgrade_a", "upgrade_b"] },
      options: [
        { name: "冰飲・無糖", price: 0 },
        { name: "冰飲・微糖 (推薦)", price: 0 },
        { name: "去冰・無糖", price: 0 },
        { name: "去冰・微糖", price: 0 },
        { name: "熱飲・無糖", price: 0 },
        { name: "熱飲・微糖", price: 0 }
      ]
    }
  ];
}

// 共用的「免費忌口與上餐調整」複選群組
function createDietaryAdjustmentGroup() {
  return {
    id: "dietary_note",
    name: "免費忌口與上餐調整 (可複選，不加價)",
    hint: "💡 練習分辨：這裡是免費調整（$0），不需調整可跳過不勾選",
    type: "checkbox",
    required: false,
    options: [
      { name: "不要生洋蔥 / 蔥花", price: 0 },
      { name: "不要酸黃瓜", price: 0 },
      { name: "醬料另外分開裝", price: 0 },
      { name: "需要分食小盤與夾子", price: 0 },
      { name: "飲品請隨餐一起上 (預設先上)", price: 0 }
    ]
  };
}

const MENU_ITEMS = [
  // ==========================================
  // 🎁 超值與雙人套餐專區 (Combo Meals)
  // ==========================================
  {
    id: "cb1",
    categoryId: "combo",
    name: "🥂 經典雙人分享套餐 (複選勾選練習)",
    enName: "Classic Duo Sharing Set (Multi-Select Practice)",
    description: "【複選練習推薦】含 2 份主餐 + 2 份甜點 + 2 杯飲品。專門練習「複選框必選 2 項 (6選2 / 5選2)」、選滿鎖定更換與高價品項補差價！",
    price: 899,
    isPopular: true,
    tags: ["雙人首選", "練習複選 2 項", "含主餐2+甜點2+飲品2"],
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "duo_mains",
        name: "1. 雙人主餐選擇 (6 選 2)",
        hint: "👉 請在下方打勾挑選 2 份主餐。選滿 2 項後其餘會鎖定；若想換別的，請先點一下已打勾的項目取消！",
        type: "checkbox",
        required: true,
        minSelect: 2,
        maxSelect: 2,
        options: [
          { name: "加州酪梨迷迭香煎雞腿堡 (套餐內含)", price: 0 },
          { name: "炙烤蜂蜜芥末舒肥嫩雞溫沙拉 (套餐內含)", price: 0 },
          { name: "法式松露野菇牛肝菌燉飯 (套餐內含)", price: 0 },
          { name: "黑松露野菇舒芙蕾歐姆蛋盤 (+NT$20 升級)", price: 20 },
          { name: "招牌手打安格斯黑牛芝士堡 (+NT$30 升級)", price: 30 },
          { name: "經典挪威煙燻鮭魚班尼迪克蛋 (+NT$40 升級)", price: 40 }
        ]
      },
      {
        id: "duo_desserts",
        name: "2. 雙人手作甜點選擇 (4 選 2)",
        hint: "👉 請打勾挑選 2 份餐後甜點（部分現做舒芙蕾需補差價）",
        type: "checkbox",
        required: true,
        minSelect: 2,
        maxSelect: 2,
        options: [
          { name: "焦香巴斯克乳酪蛋糕 (套餐內含)", price: 0 },
          { name: "大人味微醺提拉米蘇 (套餐內含)", price: 0 },
          { name: "靜岡抹茶紅豆千層蛋糕 (+NT$30 升級)", price: 30 },
          { name: "焦糖鹽之花炙燒厚舒芙蕾鬆餅 (+NT$70 升級)", price: 70 }
        ]
      },
      {
        id: "duo_drinks",
        name: "3. 雙人套餐飲品選擇 (5 選 2)",
        hint: "👉 請打勾挑選 2 杯飲品",
        type: "checkbox",
        required: true,
        minSelect: 2,
        maxSelect: 2,
        options: [
          { name: "莊園級美式黑咖啡 (套餐內含)", price: 0 },
          { name: "皇家伯爵鮮奶茶 (套餐內含)", price: 0 },
          { name: "經典絲絨拿鐵咖啡 (+NT$20 升級)", price: 20 },
          { name: "西西里香檸氣泡冰咖啡 (+NT$30 升級)", price: 30 },
          { name: "小山園靜岡抹茶重燕麥奶拿鐵 (+NT$45 升級)", price: 45 }
        ]
      },
      {
        id: "duo_drink_ice_sweet",
        name: "4. 雙人飲品冷熱與甜度安排 (必選)",
        hint: "⚠️ 真實點餐常見長選單：滑到底部別忘了完成此必選題！",
        type: "radio",
        required: true,
        options: [
          { name: "兩杯皆：冰飲・微糖 (店長推薦)", price: 0 },
          { name: "兩杯皆：冰飲・無糖", price: 0 },
          { name: "兩杯皆：去冰・微糖", price: 0 },
          { name: "兩杯皆：熱飲・無糖", price: 0 },
          { name: "一杯冰微糖、一杯熱無糖 (或於下方備註說明)", price: 0 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },
  {
    id: "cb2",
    categoryId: "combo",
    name: "💑 豪華雙人饗宴套餐 (可選同款・單選拆分版)",
    enName: "Deluxe Duo Feast Set (Split Single-Select Practice)",
    description: "【單選拆分練習】若兩人想吃「一模一樣的主餐或飲料」怎麼辦？此套餐模擬系統拆成「主餐一、主餐二、飲品一、飲品二」的點法，另附帕瑪森脆薯 1 份！",
    price: 980,
    isPopular: true,
    tags: ["可選2份同款主餐", "附松露脆薯", "練習長選單必選"],
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "main_first",
        name: "1. 第一份主餐選擇 (必選)",
        hint: "請選擇第 1 位用餐者的主餐（未預設勾選，請點擊選擇）",
        type: "radio",
        required: true,
        options: [
          { name: "加州酪梨迷迭香煎雞腿堡", price: 0 },
          { name: "炙烤蜂蜜芥末舒肥嫩雞溫沙拉", price: 0 },
          { name: "法式松露野菇牛肝菌燉飯", price: 0 },
          { name: "黑松露野菇舒芙蕾歐姆蛋盤 (+NT$20)", price: 20 },
          { name: "招牌手打安格斯黑牛芝士堡 (+NT$30)", price: 30 },
          { name: "經典挪威煙燻鮭魚班尼迪克蛋 (+NT$40)", price: 40 }
        ]
      },
      {
        id: "main_second",
        name: "2. 第二份主餐選擇 (必選)",
        hint: "請選擇第 2 位用餐者的主餐（可與第一份選相同餐點！）",
        type: "radio",
        required: true,
        options: [
          { name: "加州酪梨迷迭香煎雞腿堡", price: 0 },
          { name: "炙烤蜂蜜芥末舒肥嫩雞溫沙拉", price: 0 },
          { name: "法式松露野菇牛肝菌燉飯", price: 0 },
          { name: "黑松露野菇舒芙蕾歐姆蛋盤 (+NT$20)", price: 20 },
          { name: "招牌手打安格斯黑牛芝士堡 (+NT$30)", price: 30 },
          { name: "經典挪威煙燻鮭魚班尼迪克蛋 (+NT$40)", price: 40 }
        ]
      },
      {
        id: "shared_side",
        name: "3. 雙人共享開胃小點沾醬 (必選)",
        hint: "本套餐固定附贈「義式黑松露帕瑪森起司脆薯」乙份",
        type: "radio",
        required: true,
        options: [
          { name: "附：特製松露蒜味蛋黃醬 (推薦)", price: 0, default: true },
          { name: "附：經典美式番茄醬", price: 0 },
          { name: "附：法式蜂蜜芥末醬", price: 0 }
        ]
      },
      {
        id: "drink_first",
        name: "4. 第一杯飲品與冰熱選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "莊園級美式黑咖啡 (冰・無糖)", price: 0 },
          { name: "莊園級美式黑咖啡 (熱・無糖)", price: 0 },
          { name: "皇家伯爵鮮奶茶 (冰・微糖)", price: 0 },
          { name: "皇家伯爵鮮奶茶 (熱・微糖)", price: 0 },
          { name: "經典絲絨拿鐵 (冰・無糖) +NT$20", price: 20 },
          { name: "經典絲絨拿鐵 (熱・無糖) +NT$20", price: 20 },
          { name: "西西里香檸氣泡冰咖啡 (微冰微糖) +NT$30", price: 30 },
          { name: "小山園靜岡抹茶燕麥拿鐵 (冰微糖) +NT$45", price: 45 }
        ]
      },
      {
        id: "drink_second",
        name: "5. 第二杯飲品與冰熱選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "莊園級美式黑咖啡 (冰・無糖)", price: 0 },
          { name: "莊園級美式黑咖啡 (熱・無糖)", price: 0 },
          { name: "皇家伯爵鮮奶茶 (冰・微糖)", price: 0 },
          { name: "皇家伯爵鮮奶茶 (熱・微糖)", price: 0 },
          { name: "經典絲絨拿鐵 (冰・無糖) +NT$20", price: 20 },
          { name: "經典絲絨拿鐵 (熱・無糖) +NT$20", price: 20 },
          { name: "西西里香檸氣泡冰咖啡 (微冰微糖) +NT$30", price: 30 },
          { name: "小山園靜岡抹茶燕麥拿鐵 (冰微糖) +NT$45", price: 45 }
        ]
      },
      {
        id: "deluxe_desserts",
        name: "6. 套餐精緻甜點 (4 選 2，複選)",
        hint: "👉 請打勾挑選 2 份甜點",
        type: "checkbox",
        required: true,
        minSelect: 2,
        maxSelect: 2,
        options: [
          { name: "焦香巴斯克乳酪蛋糕", price: 0 },
          { name: "大人味微醺提拉米蘇", price: 0 },
          { name: "靜岡抹茶紅豆千層蛋糕 (+NT$30)", price: 30 },
          { name: "焦糖鹽之花炙燒厚舒芙蕾鬆餅 (+NT$70)", price: 70 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },
  {
    id: "cb3",
    categoryId: "combo",
    name: "✨ 個人獨享超值套餐 (1主餐+1甜點+1飲料)",
    enName: "Solo Value Combo Set (1 Main + 1 Dessert + 1 Drink)",
    description: "【超值套餐練習】一人也能豐盛享受！任選 1 份主餐 + 1 份手作甜點 + 1 杯特調飲品。故意不預設勾選任何項目，練習從頭到尾完成所有必選題！",
    price: 460,
    isPopular: true,
    tags: ["一人獨享", "激省組合", "全必選無預設練習"],
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "solo_main",
        name: "1. 選擇主餐 (6 選 1，必選)",
        hint: "⚠️ 此區未預設勾選，若漏選直接按加入購物車會跳出紅框提醒喔！",
        type: "radio",
        required: true,
        options: [
          { name: "加州酪梨迷迭香煎雞腿堡 (套餐內含)", price: 0 },
          { name: "炙烤蜂蜜芥末舒肥嫩雞溫沙拉 (套餐內含)", price: 0 },
          { name: "法式松露野菇牛肝菌燉飯 (套餐內含)", price: 0 },
          { name: "黑松露野菇舒芙蕾歐姆蛋盤 (+NT$20 升級)", price: 20 },
          { name: "招牌手打安格斯黑牛芝士堡 (+NT$30 升級)", price: 30 },
          { name: "經典挪威煙燻鮭魚班尼迪克蛋 (+NT$40 升級)", price: 40 }
        ]
      },
      {
        id: "solo_dessert",
        name: "2. 選擇手作甜點 (4 選 1，必選)",
        type: "radio",
        required: true,
        options: [
          { name: "焦香巴斯克乳酪蛋糕 (套餐內含)", price: 0 },
          { name: "大人味微醺提拉米蘇 (+NT$10 升級)", price: 10 },
          { name: "靜岡抹茶紅豆千層蛋糕 (+NT$30 升級)", price: 30 },
          { name: "焦糖鹽之花炙燒厚舒芙蕾鬆餅 (+NT$70 升級)", price: 70 }
        ]
      },
      {
        id: "solo_drink",
        name: "3. 選擇套餐飲品 (5 選 1，必選)",
        type: "radio",
        required: true,
        options: [
          { name: "莊園級美式黑咖啡 (套餐內含)", price: 0 },
          { name: "皇家伯爵鮮奶茶 (套餐內含)", price: 0 },
          { name: "經典絲絨拿鐵咖啡 (+NT$20 升級)", price: 20 },
          { name: "西西里香檸氣泡冰咖啡 (+NT$30 升級)", price: 30 },
          { name: "小山園靜岡抹茶重燕麥奶拿鐵 (+NT$45 升級)", price: 45 }
        ]
      },
      {
        id: "solo_drink_temp",
        name: "4. 飲品冰塊與甜度 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "正常冰・微糖", price: 0 },
          { name: "微冰・微糖 (推薦)", price: 0 },
          { name: "去冰・無糖", price: 0 },
          { name: "熱飲・無糖", price: 0 },
          { name: "熱飲・微糖", price: 0 }
        ]
      },
      {
        id: "solo_addon",
        name: "5. 銅板加購配料 (可複選，最多選 2 項)",
        hint: "💡 選修複選題：可不選（0 項），但最多只能加購 2 項",
        type: "checkbox",
        required: false,
        minSelect: 0,
        maxSelect: 2,
        options: [
          { name: "溫泉水波蛋乙顆", price: 25 },
          { name: "香煎厚切培根", price: 35 },
          { name: "迷你帕瑪森脆薯乙份", price: 55 },
          { name: "升級雙倍黑松露沾醬", price: 40 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },

  // ==========================================
  // 🍳 晨光早午餐 (Brunch)
  // ==========================================
  {
    id: "b1",
    categoryId: "brunch",
    name: "經典挪威煙燻鮭魚班尼迪克蛋",
    enName: "Classic Smoked Salmon Eggs Benedict",
    description: "自製英式瑪芬、低溫煙燻鮭魚、水波流心有機蛋佐主廚特製檸檬荷蘭醬，附黑松露炒薯塊。",
    price: 360,
    isPopular: true,
    tags: ["招牌必點", "有機蛋使用", "可+99升級套餐"],
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "bread",
        name: "麵包基底選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "原味烘烤英式瑪芬", price: 0, default: true },
          { name: "舊金山香脆酸種麵包", price: 20 },
          { name: "特級生吐司", price: 30 }
        ]
      },
      {
        id: "egg_style",
        name: "蛋黃熟度 (必選・請手動點選)",
        hint: "⚠️ 為確保熟度符合您的喜好，此題未預設勾選",
        type: "radio",
        required: true,
        options: [
          { name: "半熟流心 (推薦最佳口感)", price: 0 },
          { name: "八分熟 (微凝固)", price: 0 },
          { name: "全熟", price: 0 }
        ]
      },
      ...createSingleItemUpgradeGroups(),
      {
        id: "addon",
        name: "單品加料升級 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "增量煙燻鮭魚 (+3片)", price: 80 },
          { name: "炙燒切達起司熔岩", price: 35 },
          { name: "香煎德式香腸", price: 45 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },
  {
    id: "b2",
    categoryId: "brunch",
    name: "黑松露野菇舒芙蕾歐姆蛋盤",
    enName: "Truffle Wild Mushroom Souffle Omelette",
    description: "如雲朵般蓬鬆綿密的法式舒芙蕾蛋，包裹香炒綜合野菇與義大利特級黑松露醬，奶香濃郁。",
    price: 340,
    isPopular: false,
    tags: ["蛋奶素可食", "人氣王", "可+99升級套餐"],
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "bread",
        name: "附餐麵包 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "香蒜法棍切片", price: 0, default: true },
          { name: "奶油可頌", price: 25 },
          { name: "無麵包（換雙份生菜沙拉）", price: 0 }
        ]
      },
      ...createSingleItemUpgradeGroups(),
      {
        id: "addon",
        name: "主廚加料推薦 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "雙倍特級黑松露醬", price: 50 },
          { name: "厚切培根一片 (葷食)", price: 40 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },
  {
    id: "b3",
    categoryId: "brunch",
    name: "法式松露野菇牛肝菌燉飯",
    enName: "French Truffle & Porcini Mushroom Risotto",
    description: "選用義大利 Carnaroli 燉飯米慢火熬煮，吸附滿滿牛肝菌高湯與帕瑪森起司香氣，放上慢煎杏鮑菇。",
    price: 330,
    isPopular: false,
    tags: ["主廚私房", "濃郁米香", "可+99升級套餐"],
    image: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "rice_texture",
        name: "米心口感選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "台灣人習慣口感 (軟硬適中)", price: 0, default: true },
          { name: "正統義式微帶米心 (Al Dente)", price: 0 },
          { name: "偏軟燉煮 (適合長輩/孩童)", price: 0 }
        ]
      },
      ...createSingleItemUpgradeGroups(),
      {
        id: "addon",
        name: "豐盛加點配料 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "加購溫泉水波蛋", price: 25 },
          { name: "加購香煎舒肥雞胸", price: 65 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },

  // ==========================================
  // 🍔 手打厚牛漢堡 (Burger)
  // ==========================================
  {
    id: "bg1",
    categoryId: "burger",
    name: "招牌手打安格斯黑牛芝士堡",
    enName: "Signature Angus Cheeseburger",
    description: "每日現絞 180g 安格斯純牛肉排，大火鐵板煎出焦脆酥皮，搭配濃郁切達起司、焦糖洋蔥與特調煙燻漢堡醬。",
    price: 320,
    isPopular: true,
    tags: ["肉汁爆漿", "嚴選安格斯", "可+99升級套餐"],
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "doneness",
        name: "牛肉排熟度 (必選・請手動點選)",
        hint: "⚠️ 此為必選題且無預設值，請點選您要的熟度",
        type: "radio",
        required: true,
        options: [
          { name: "七分熟 (粉嫩肉汁推薦)", price: 0 },
          { name: "全熟", price: 0 }
        ]
      },
      {
        id: "bun",
        name: "漢堡包選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "法式奶油布里歐堡", price: 0, default: true },
          { name: "低碳燕麥無麩質堡", price: 30 },
          { name: "鮮脆生菜包肉 (無澱粉漢堡皮)", price: 0 }
        ]
      },
      ...createSingleItemUpgradeGroups(),
      {
        id: "addon",
        name: "極致肉食升級 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "加一片 180g 純牛漢堡排", price: 95 },
          { name: "香煎太陽蛋", price: 25 },
          { name: "酥炸培根雙重脆", price: 35 },
          { name: "墨西哥醃漬辣椒片 (辣口增香)", price: 20 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },
  {
    id: "bg2",
    categoryId: "burger",
    name: "加州酪梨迷迭香煎雞腿堡",
    enName: "Avocado Rosemary Grilled Chicken Burger",
    description: "新鮮切片加州哈斯酪梨、整塊無骨迷迭香蒜香去骨雞腿排、番茄切片與水耕羅曼生菜，清爽無負擔。",
    price: 290,
    isPopular: false,
    tags: ["健康高蛋白", "健身首選", "可+99升級套餐"],
    image: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "spicy",
        name: "風味調整 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "原味經典優格醬", price: 0, default: true },
          { name: "微辣是拉差美乃滋", price: 0 }
        ]
      },
      ...createSingleItemUpgradeGroups(),
      {
        id: "addon",
        name: "美味加配 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "加量半顆熟成酪梨", price: 50 },
          { name: "香濃融化瑞士起司", price: 25 }
        ]
      },
      createDietaryAdjustmentGroup()
    ]
  },

  // ==========================================
  // 🥗 輕食溫沙拉與炸物 (Salad & Sides)
  // ==========================================
  {
    id: "s1",
    categoryId: "salad",
    name: "炙烤蜂蜜芥末舒肥嫩雞溫沙拉",
    enName: "Sous-vide Chicken Warm Salad",
    description: "低溫慢煮鮮嫩雞胸肉、小農綜合水耕生菜、烤甜椒、小番茄、綜合堅果碎與自製法式第戎蜂蜜芥末醬。",
    price: 260,
    isPopular: false,
    tags: ["減醣輕盈", "豐富堅果", "可+99升級套餐"],
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "dressing",
        name: "沙拉醬汁 (必選・分開盛裝)",
        type: "radio",
        required: true,
        options: [
          { name: "法式蜂蜜芥末醬", price: 0, default: true },
          { name: "義大利陳年巴薩米克油醋", price: 0 },
          { name: "胡麻焙煎醬", price: 0 }
        ]
      },
      ...createSingleItemUpgradeGroups(),
      {
        id: "addon",
        name: "沙拉配料加購 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "溫泉水波蛋", price: 25 },
          { name: "綜合烤南瓜切塊", price: 35 }
        ]
      }
    ]
  },
  {
    id: "s2",
    categoryId: "salad",
    name: "義式黑松露帕瑪森起司脆薯",
    enName: "Truffle Parmesan Hand-cut Fries",
    description: "嚴選美國進口馬鈴薯條，炸至金黃酥脆，均勻裹上頂級黑松露油與現刨帕米吉安諾起司絲。",
    price: 180,
    isPopular: true,
    tags: ["超涮嘴", "聚餐必點"],
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "dip",
        name: "附贈沾醬 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "特製松露蒜味蛋黃醬", price: 0, default: true },
          { name: "經典美式番茄醬", price: 0 }
        ]
      }
    ]
  },

  // ==========================================
  // ☕ 義式與特調飲品 (Coffee & Drinks)
  // ==========================================
  {
    id: "c1",
    categoryId: "coffee",
    name: "西西里香檸氣泡冰咖啡",
    enName: "Siciliano Sparkling Lemon Americano",
    description: "嚴選衣索比亞日曬耶加雪菲濃縮，佐屏東鮮榨綠檸檬汁與微氣泡礦泉水，酸甜清爽醒腦。",
    price: 160,
    isPopular: true,
    tags: ["招牌特調", "夏日熱賣"],
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "ice",
        name: "冰量選擇 (必選・未預設)",
        hint: "⚠️ 飲品冰塊與甜度常未預設勾選，請手動點擊",
        type: "radio",
        required: true,
        options: [
          { name: "正常碎冰 (推薦最佳沁涼)", price: 0 },
          { name: "微冰", price: 0 },
          { name: "去冰", price: 0 }
        ]
      },
      {
        id: "sweetness",
        name: "甜度選擇 (必選・未預設)",
        type: "radio",
        required: true,
        options: [
          { name: "微糖 (自熬蔗糖提香)", price: 0 },
          { name: "半糖", price: 0 },
          { name: "無糖 (極酸爽風味)", price: 0 }
        ]
      },
      {
        id: "addon",
        name: "咖啡加濃 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "多一份義式濃縮濃萃 (Extra Shot)", price: 30 }
        ]
      }
    ]
  },
  {
    id: "c2",
    categoryId: "coffee",
    name: "小山園靜岡抹茶重燕麥奶拿鐵",
    enName: "Matcha Oat Milk Latte",
    description: "日本宇治丸久小山園若竹抹茶現刷，搭配瑞典 Oatly 咖啡師燕麥奶，茶香悠長回甘，純素無乳糖友善。",
    price: 180,
    isPopular: false,
    tags: ["純素無乳糖", "日本抹茶"],
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "temperature",
        name: "冷熱溫度 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "冰飲 (綿密微冰)", price: 0, default: true },
          { name: "熱飲 (細緻奶泡 65°C)", price: 0 }
        ]
      },
      {
        id: "sweetness",
        name: "甜度調整 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "微糖", price: 0, default: true },
          { name: "半糖", price: 0 },
          { name: "無糖 (品嘗純粹茶香)", price: 0 }
        ]
      }
    ]
  },
  {
    id: "c3",
    categoryId: "coffee",
    name: "莊園級美式黑咖啡",
    enName: "Single Origin Estate Americano",
    description: "中淺焙哥倫比亞與衣索比亞配方豆，帶有柑橘果香與堅果尾韻，乾淨順口不苦澀。",
    price: 120,
    isPopular: false,
    tags: ["中淺果香", "百搭首選"],
    image: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "temperature",
        name: "冷熱與冰量 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "冰・正常冰", price: 0, default: true },
          { name: "冰・去冰", price: 0 },
          { name: "熱飲", price: 0 }
        ]
      }
    ]
  },
  {
    id: "c4",
    categoryId: "coffee",
    name: "經典絲絨拿鐵咖啡",
    enName: "Classic Velvet Cafe Latte",
    description: "雙份濃郁義式濃縮咖啡融合小農 A 級鮮乳，拉花奶泡綿密如絲絨般滑順。",
    price: 140,
    isPopular: false,
    tags: ["小農鮮乳", "可換燕麥奶"],
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "temperature",
        name: "冷熱選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "冰飲 (微冰)", price: 0, default: true },
          { name: "冰飲 (去冰)", price: 0 },
          { name: "熱飲", price: 0 }
        ]
      },
      {
        id: "milk_type",
        name: "乳品更換 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "使用小農鮮乳 (原味)", price: 0, default: true },
          { name: "換購 Oatly 咖啡師燕麥奶", price: 25 }
        ]
      }
    ]
  },
  {
    id: "c5",
    categoryId: "coffee",
    name: "皇家伯爵鮮奶茶",
    enName: "Royal Earl Grey Milk Tea",
    description: "無咖啡困擾的好選擇！嚴選佛手柑香氣濃郁的英國皇家伯爵紅茶，佐純鮮乳慢煮。",
    price: 130,
    isPopular: false,
    tags: ["茶香濃郁", "佛手柑清香"],
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "temperature",
        name: "冷熱溫度 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "冰飲 (微冰)", price: 0, default: true },
          { name: "冰飲 (去冰)", price: 0 },
          { name: "熱飲", price: 0 }
        ]
      },
      {
        id: "sweetness",
        name: "甜度選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "微糖 (推薦最能提引佛手柑香)", price: 0, default: true },
          { name: "無糖", price: 0 },
          { name: "半糖", price: 0 }
        ]
      }
    ]
  },

  // ==========================================
  // 🥞 手作甜點鬆餅 (Desserts)
  // ==========================================
  {
    id: "d1",
    categoryId: "dessert",
    name: "焦糖鹽之花炙燒厚舒芙蕾鬆餅",
    enName: "Salted Caramel Creme Brulee Souffle Pancake",
    description: "現點現煎 25 分鐘，口感如棉花糖般入口即化，頂層覆蓋香濃卡士達醬與脆皮焦糖，附小農鮮奶冰淇淋。",
    price: 280,
    isPopular: true,
    tags: ["現點現做", "甜點控最愛"],
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "icecream",
        name: "附贈手工冰淇淋口味 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "特級小農香草鮮奶", price: 0, default: true },
          { name: "70% 法芙娜黑巧", price: 20 },
          { name: "更換為手工綜合莓果醬 (不加冰淇淋)", price: 0 }
        ]
      }
    ]
  },
  {
    id: "d2",
    categoryId: "dessert",
    name: "焦香巴斯克乳酪蛋糕",
    enName: "Basque Burnt Cheesecake",
    description: "選用北海道十勝奶油乳酪，高溫烘烤出微焦糖香外皮，內芯呈現半熟流心般的濃郁綿滑口感。",
    price: 150,
    isPopular: false,
    tags: ["北海道乳酪", "套餐熱門"],
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "serve_time",
        name: "上餐時間選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "餐後上 (用完主餐再請店員送上)", price: 0, default: true },
          { name: "隨餐一起上", price: 0 }
        ]
      }
    ]
  },
  {
    id: "d3",
    categoryId: "dessert",
    name: "大人味微醺提拉米蘇",
    enName: "Classic Italian Tiramisu",
    description: "手指餅乾吸飽濃縮咖啡與咖啡酒香，層疊馬斯卡彭乳酪慕斯，撒上頂級法芙娜無糖可可粉。",
    price: 160,
    isPopular: false,
    tags: ["微醺酒香", "正統義式"],
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "serve_time",
        name: "上餐時間選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "餐後上", price: 0, default: true },
          { name: "隨餐一起上", price: 0 }
        ]
      }
    ]
  },
  {
    id: "d4",
    categoryId: "dessert",
    name: "靜岡抹茶紅豆千層蛋糕",
    enName: "Shizuoka Matcha & Azuki Mille Crepes",
    description: "手工煎製 22 層薄透法式餅皮，層層塗抹靜岡抹茶鮮奶油與蜜漬萬丹紅豆粒，甜而不膩。",
    price: 180,
    isPopular: false,
    tags: ["22層手作", "抹茶控必吃"],
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "serve_time",
        name: "上餐時間選擇 (必選)",
        type: "radio",
        required: true,
        options: [
          { name: "餐後上", price: 0, default: true },
          { name: "隨餐一起上", price: 0 }
        ]
      }
    ]
  }
];
