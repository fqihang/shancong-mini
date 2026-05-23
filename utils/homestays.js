const homestays = [
  {
    id: "hs001",
    name: "竹隐溪山度假小院",
    tagline: "独栋院落、私汤泡池、溪谷步道",
    city: "杭州",
    area: "余杭径山",
    address: "浙江省杭州市余杭区径山镇双溪村",
    type: "山野",
    price: 1280,
    rating: 4.9,
    reviews: 218,
    capacity: 6,
    beds: "2张大床 + 1间榻榻米",
    rooms: "三室两厅一院",
    cover: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80"
    ],
    tags: ["亲子友好", "私汤", "可做饭"],
    amenities: ["独立庭院", "投影", "地暖", "厨房", "烧烤", "停车位"],
    highlights: [
      "步行 6 分钟到溪谷步道，适合周末轻徒步",
      "整院独享，适合家庭聚会和小团队团建",
      "管家可协助安排早餐、茶席和周边路线"
    ],
    policies: ["14:00 后入住", "12:00 前退房", "入住需登记有效身份信息"],
    host: {
      name: "阿青",
      phone: "13800138000",
      response: "通常 10 分钟内回复"
    }
  },
  {
    id: "hs002",
    name: "海岬白房子",
    tagline: "海景露台、落日餐桌、步行到沙滩",
    city: "厦门",
    area: "曾厝垵",
    address: "福建省厦门市思明区环岛南路",
    type: "海边",
    price: 980,
    rating: 4.8,
    reviews: 164,
    capacity: 4,
    beds: "1张大床 + 1张沙发床",
    rooms: "两室一厅一露台",
    cover: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80"
    ],
    tags: ["海景", "情侣", "露台"],
    amenities: ["观景露台", "浴缸", "洗烘一体", "咖啡机", "蓝牙音箱"],
    highlights: [
      "露台正对海岸线，适合看日落和轻餐饮",
      "步行 8 分钟到沙滩，周边餐饮密集",
      "卧室配遮光帘，夜间安静度较高"
    ],
    policies: ["15:00 后入住", "11:00 前退房", "不可携带大型宠物"],
    host: {
      name: "林夏",
      phone: "13800138001",
      response: "通常 15 分钟内回复"
    }
  },
  {
    id: "hs003",
    name: "古城青瓦院",
    tagline: "老城肌理、茶室书房、步行逛古巷",
    city: "大理",
    area: "大理古城",
    address: "云南省大理白族自治州大理镇人民路",
    type: "古城",
    price: 760,
    rating: 4.7,
    reviews: 132,
    capacity: 5,
    beds: "2张大床 + 1张单人床",
    rooms: "两室一厅一茶室",
    cover: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80"
    ],
    tags: ["古城", "茶室", "长住优惠"],
    amenities: ["茶室", "书房", "洗衣机", "厨房", "儿童餐椅"],
    highlights: [
      "在古城生活圈内，步行可到主街和菜市场",
      "院内保留青瓦木作，公共区适合阅读和会客",
      "连续入住 7 晚可联系管家申请长住价"
    ],
    policies: ["14:00 后入住", "12:00 前退房", "22:00 后请降低室外音量"],
    host: {
      name: "段青",
      phone: "13800138002",
      response: "通常 20 分钟内回复"
    }
  },
  {
    id: "hs004",
    name: "雪岭壁炉木屋",
    tagline: "壁炉客厅、雪山景观、滑雪场接驳",
    city: "张家口",
    area: "崇礼",
    address: "河北省张家口市崇礼区太子城片区",
    type: "雪山",
    price: 1560,
    rating: 4.9,
    reviews: 96,
    capacity: 8,
    beds: "3张大床 + 2张单人床",
    rooms: "四室两厅",
    cover: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
    ],
    tags: ["滑雪", "壁炉", "团建"],
    amenities: ["壁炉", "雪具柜", "地暖", "厨房", "接驳预约", "影音室"],
    highlights: [
      "距离雪场车程约 12 分钟，可预约定点接驳",
      "客厅壁炉适合冬季家庭和朋友聚会",
      "地下室影音空间可容纳 8 人观影"
    ],
    policies: ["15:00 后入住", "11:00 前退房", "壁炉需由管家协助首次点火"],
    host: {
      name: "周野",
      phone: "13800138003",
      response: "通常 10 分钟内回复"
    }
  }
];

function getHomestays() {
  return homestays;
}

function getHomestayById(id) {
  return homestays.find((item) => item.id === id);
}

function getCities() {
  return ["全部"].concat(Array.from(new Set(homestays.map((item) => item.city))));
}

function getTypes() {
  return ["全部"].concat(Array.from(new Set(homestays.map((item) => item.type))));
}

module.exports = {
  getCities,
  getHomestayById,
  getHomestays,
  getTypes
};
