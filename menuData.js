// 餐廳菜單資料與品項規格資料庫
const RESTAURANT_INFO = {
  name: "(練習用)Breeze & Bite 晨光輕食咖啡所",
  subtitle: "Brunch & Specialty Coffee",
  announcement: "🌿 今日低消每人一杯飲品或餐點・用餐時間 90 分鐘",
  defaultTable: "內用 A-05",
  categories: [
    { id: "popular", name: "🔥 人氣主打", icon: "bi-fire" },
    { id: "brunch", name: "🍳 晨光早午餐", icon: "bi-egg-fried" },
    { id: "burger", name: "🍔 手打厚牛漢堡", icon: "bi-circle" },
    { id: "salad", name: "🥗 輕食溫沙拉", icon: "bi-flower1" },
    { id: "coffee", name: "☕ 義式與特調咖啡", icon: "bi-cup-hot" },
    { id: "dessert", name: "🥞 手作厚鬆餅甜品", icon: "bi-cake2" }
  ]
};

const MENU_ITEMS = [
  {
    id: "b1",
    categoryId: "brunch",
    name: "經典挪威煙燻鮭魚班尼迪克蛋",
    enName: "Classic Smoked Salmon Eggs Benedict",
    description: "自製英式瑪芬、低溫煙燻鮭魚、水波流心有機蛋佐主廚特製檸檬荷蘭醬，附黑松露炒薯塊。",
    price: 360,
    isPopular: true,
    tags: ["招牌必點", "有機蛋使用"],
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
        name: "蛋黃熟度",
        type: "radio",
        required: true,
        options: [
          { name: "半熟流心 (推薦最佳口感)", price: 0, default: true },
          { name: "全熟", price: 0 }
        ]
      },
      {
        id: "addon",
        name: "升級加購 (可複選)",
        type: "checkbox",
        required: false,
        options: [
          { name: "增量煙燻鮭魚 (+3片)", price: 80 },
          { name: "炙燒切達起司熔岩", price: 35 },
          { name: "香煎德式香腸", price: 45 }
        ]
      }
    ]
  },
  {
    id: "b2",
    categoryId: "brunch",
    name: "黑松露野菇舒芙蕾歐姆蛋盤",
    enName: "Truffle Wild Mushroom Souffle Omelette",
    description: "如雲朵般蓬鬆綿密的法式舒芙蕾蛋，包裹香炒綜合野菇與義大利特級黑松露醬，奶香濃郁。",
    price: 340,
    isPopular: true,
    tags: ["蛋奶素可食", "人氣王"],
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "bread",
        name: "附餐麵包",
        type: "radio",
        required: true,
        options: [
          { name: "香蒜法棍切片", price: 0, default: true },
          { name: "奶油可頌", price: 25 },
          { name: "無麵包（換雙份生菜沙拉）", price: 0 }
        ]
      },
      {
        id: "addon",
        name: "主廚加料推薦",
        type: "checkbox",
        required: false,
        options: [
          { name: "雙倍特級黑松露醬", price: 50 },
          { name: "厚切培根一片", price: 40 }
        ]
      }
    ]
  },
  {
    id: "bg1",
    categoryId: "burger",
    name: "招牌手打安格斯黑牛芝士堡",
    enName: "Signature Angus Cheeseburger",
    description: "每日現絞 180g 安格斯純牛肉排，大火鐵板煎出焦脆酥皮，搭配濃郁切達起司、焦糖洋蔥與特調煙燻漢堡醬。",
    price: 320,
    isPopular: true,
    tags: ["肉汁爆漿", "嚴選安格斯"],
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "doneness",
        name: "牛肉排熟度",
        type: "radio",
        required: true,
        options: [
          { name: "七分熟 (粉嫩肉汁推薦)", price: 0, default: true },
          { name: "全熟", price: 0 }
        ]
      },
      {
        id: "bun",
        name: "漢堡包選擇",
        type: "radio",
        required: true,
        options: [
          { name: "法式奶油布里歐堡", price: 0, default: true },
          { name: "低碳燕麥無麩質堡", price: 30 }
        ]
      },
      {
        id: "addon",
        name: "極致肉食升級",
        type: "checkbox",
        required: false,
        options: [
          { name: "加一片 180g 純牛漢堡排", price: 95 },
          { name: "香煎太陽蛋", price: 25 },
          { name: "酥炸培根雙重脆", price: 35 },
          { name: "墨西哥醃漬辣椒片 (辣口增香)", price: 20 }
        ]
      }
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
    tags: ["健康高蛋白", "健身首選"],
    image: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "spicy",
        name: "風味調整",
        type: "radio",
        required: true,
        options: [
          { name: "原味經典優格醬", price: 0, default: true },
          { name: "微辣是拉差美乃滋", price: 0 }
        ]
      },
      {
        id: "addon",
        name: "美味加配",
        type: "checkbox",
        required: false,
        options: [
          { name: "加量半顆熟成酪梨", price: 50 },
          { name: "香濃融化瑞士起司", price: 25 }
        ]
      }
    ]
  },
  {
    id: "s1",
    categoryId: "salad",
    name: "炙烤蜂蜜芥末舒肥嫩雞溫沙拉",
    enName: "Sous-vide Chicken Warm Salad",
    description: "低溫慢煮鮮嫩雞胸肉、小農綜合水耕生菜、烤甜椒、小番茄、綜合堅果碎與自製法式第戎蜂蜜芥末醬。",
    price: 260,
    isPopular: false,
    tags: ["減醣輕盈", "豐富堅果"],
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "dressing",
        name: "沙拉醬汁 (分開盛裝)",
        type: "radio",
        required: true,
        options: [
          { name: "法式蜂蜜芥末醬", price: 0, default: true },
          { name: "義大利陳年巴薩米克油醋", price: 0 },
          { name: "胡麻焙煎醬", price: 0 }
        ]
      },
      {
        id: "addon",
        name: "沙拉配料加購",
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
    tags: ["超涮嘴", "下酒必點"],
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    optionGroups: [
      {
        id: "dip",
        name: "附贈沾醬",
        type: "radio",
        required: true,
        options: [
          { name: "特製松露蒜味蛋黃醬", price: 0, default: true },
          { name: "經典美式番茄醬", price: 0 }
        ]
      }
    ]
  },
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
        name: "冰量選擇",
        type: "radio",
        required: true,
        options: [
          { name: "正常碎冰 (推薦最佳沁涼)", price: 0, default: true },
          { name: "微冰", price: 0 },
          { name: "去冰", price: 0 }
        ]
      },
      {
        id: "sweetness",
        name: "甜度選擇",
        type: "radio",
        required: true,
        options: [
          { name: "微糖 (自熬蔗糖提香)", price: 0, default: true },
          { name: "半糖", price: 0 },
          { name: "無糖 (極酸爽風味)", price: 0 }
        ]
      },
      {
        id: "addon",
        name: "咖啡加濃",
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
        name: "冷熱溫度",
        type: "radio",
        required: true,
        options: [
          { name: "冰飲 (綿密微冰)", price: 0, default: true },
          { name: "熱飲 (細緻奶泡 65°C)", price: 0 }
        ]
      },
      {
        id: "sweetness",
        name: "甜度調整",
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
        name: "附贈手工冰淇淋口味",
        type: "radio",
        required: true,
        options: [
          { name: "特級小農香草鮮奶", price: 0, default: true },
          { name: "70% 法芙娜黑巧", price: 20 },
          { name: "更換為手工綜合莓果醬 (不加冰淇淋)", price: 0 }
        ]
      }
    ]
  }
];
