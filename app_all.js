/**
 * 赛马Group选择器 - 主逻辑（数据从 merged.json 外部加载）
 */

// 数据将在 loadData() 中加载
let horsesData = [];
let sireFeeData = [];  // 种马配种费数据
let overseasSires = [];  // 海外种马名单

let currentFilter = 'all';
let isAnimating = false;

// ==================== 2.0版本：选择列表 ====================
const STORAGE_KEY = 'zog2026_selections';
let selectedHorses = [];  // 当前选择的马匹

// 特例母马（不能触发500万规则）
const EXCLUDED_MOTHERS = [
  'ベルアリュールII', 'リリサイド', 'チェッキーノ', 'ロカ', 'イナーアージ', 'スタセリタ'
];

// DOM元素
const selectionList = document.getElementById('selection-list');
const selectionCount = document.getElementById('selection-count');
const validationResult = document.getElementById('validation-result');
const validateBtn = document.getElementById('validate-btn');
const clearBtn = document.getElementById('clear-btn');

// DOM 元素（可能不存在的元素加空值检查）
const selectBtn = document.getElementById('select-btn') || null;
const resultCard = document.getElementById('result-card') || null;
const horseCount = document.getElementById('horse-count') || null;
const statG1 = document.getElementById('stat-g1');
const statG2 = document.getElementById('stat-g2');
const statG3 = document.getElementById('stat-g3');
const memeModal = document.getElementById('meme-modal') || null;
const memeImage = document.getElementById('meme-image') || null;
const memeRecommendLabel = document.getElementById('meme-recommend-label') || null;
const memeText = document.getElementById('meme-text') || null;
const memeClose = document.getElementById('meme-close') || null;
const filterBtns = document.querySelectorAll('.filter-btn');
const motherInput = document.getElementById('mother-input');
const queryBtn = document.getElementById('query-btn');
const queryResult = document.getElementById('query-result');

// ==================== 精选配置 ====================
// 五种精选母马名单
const recommendMothers = {
  "御医精选": ["アオイテソーロ", "ウィキウィキ", "ディヴィナプレシオーサ", "ペブルガーデン"],
  "🦌老师精选": ["インファルターメ", "グローバルビューティ", "シタディリオ", "ジョイエピフォラ", "ジョイネヴァーランド", "タングリトナ", "ベッラガンバ"],
  "骆驼精选": ["イスパニダ", "ウナアラバレーラ", "カルタエンブルハーダ", "ジョイニキータ", "ジョイニデラ", "セレスタ", "ソブラドラインク", "ドナブルーハ", "ナスティア", "ブルーストライプ", "ラリズ", "イタペルーナ", "オリンダドイグアス", "イナダマス", "ソラリア", "カレンブーケドール", "サトノレイナス", "ダノンファンタジー", "マルケッサ", "レシステンシア"],
  "工口作家精选": ["ワイルズドリームス"],
  "花亲王精选":["ヒアトゥウィン"]
};

// 骆驼精选梗图（交替使用）
const camelMemes = [
  { image: './images/骆驼.jpg', text: '骆驼帮精选！慧眼识珠！' }
];

// 梗图交替状态
let camelMemeToggle = false;

// 检查是否为精选马，返回精选类型或null
function getRecommendType(mother) {
  if (!mother) return null;
  for (const [type, mothers] of Object.entries(recommendMothers)) {
    if (mothers.includes(mother)) {
      return type;
    }
  }
  return null;
}

// ==================== 梗图配置 ====================
const memes = {
  1: [
    { image: './images/G1-1.jpg', text: '北方牧场产出' },
    { image: './images/G1-2.jpg', text: '精选/Mix高价马' },
    { image: './images/G1-3.jpg', text: '社台俱乐部募集' },
    { image: './images/G1-5.jpg', text: '种马马主关联' },
    { image: './images/G1-6.jpg', text: '高身价拍卖' }
  ],
  2: [
    { image: './images/G2-1.jpg', text: '普通俱乐部募集' },
    { image: './images/G2-2.jpg', text: '拍卖中等价位' },
    { image: './images/G2-3.jpg', text: '其他高价马' }
  ],
  3: [
    { image: './images/G3.jpg', text: '普通马' }
  ]
};

// ==================== 初始化 ====================
// ==================== 数据加载 ====================
async function loadData() {
  try {
    const response = await fetch('merged.json');
    horsesData = await response.json();
    console.log('已加载 ' + horsesData.length + ' 匹马的数据');
  } catch (error) {
    console.error('加载数据失败:', error);
    document.body.innerHTML = '<div style="text-align:center;padding:50px;color:red;">数据加载失败，请刷新页面</div>';
  }
}

async function loadSireFeeData() {
  try {
    const response = await fetch('zhongfei2023.json');
    sireFeeData = await response.json();
    console.log('已加载 ' + sireFeeData.length + ' 条种马数据');
  } catch (error) {
    console.error('加载种马数据失败:', error);
  }
}

async function loadOverseasSires() {
  try {
    const response = await fetch('overseas_sires_names.json');
    overseasSires = await response.json();
    console.log('已加载 ' + overseasSires.length + ' 个海外种马');
  } catch (error) {
    console.error('加载海外种马名单失败:', error);
    // 如果加载失败，使用旧列表作为后备
    overseasSires = [
      'Flightline', 'American Pharoah', 'Gun Runner', 'Justify', 'Curlin',
      'Frankel', 'Sea The Stars', 'Dubawi', 'Kingman', 'Siyouni', 'Wootton Bassett'
    ];
  }
}

// ==================== 初始化 ====================
async function init() {
  // 显示加载状态
  showLoading();
  
  await loadData();
  await loadSireFeeData();
  await loadOverseasSires();
  
  // 确保加载动画至少显示 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 隐藏加载状态
  hideLoading();
  
  updateHorseCount();
  console.log('已加载 ' + horsesData.length + ' 匹马的数据');

  // 加载保存的选择
  loadSelections();

  // 绑定事件
  motherInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') queryMother();
  });
  queryBtn.addEventListener('click', queryMother);

  // 清空查询
  const clearQueryBtn = document.getElementById('clear-query-btn');
  if (clearQueryBtn) {
    clearQueryBtn.addEventListener('click', () => {
      motherInput.value = '';
      queryResult.innerHTML = '';
      motherInput.focus();
    });
  }

  if (selectBtn) {
    selectBtn.addEventListener('click', selectRandomHorse);
  }

  // 2.0版本事件绑定
  validateBtn.addEventListener('click', validateSelections);
  clearBtn.addEventListener('click', clearSelections);

  // Toast 提示
  const toast = document.createElement('div');
  toast.id = 'toast';
  document.body.appendChild(toast);
}

// 显示 Toast 提示
// 显示/隐藏加载状态
function showLoading() {
  const loading = document.getElementById('loading-container');
  if (loading) loading.classList.remove('hidden');
}

function hideLoading() {
  const loading = document.getElementById('loading-container');
  if (loading) loading.classList.add('hidden');
}

// 显示 Toast 提示
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 1500);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// ==================== 母亲查询 ====================
function queryMother() {
  const motherName = motherInput.value.trim();
  
  if (!motherName) {
    queryResult.innerHTML = '<span class="error">请输入母马名</span>';
    return;
  }
  
  // 匹配逻辑：精确匹配 + 模糊匹配
  const nameLower = motherName.toLowerCase();
  
  // 第一步：精确匹配（支持日文、中文、英文，英文忽略大小写）
  let matches = horsesData.filter(h =>
    h.mother === motherName ||
    h.motherCh === motherName ||
    (h.motherEn && h.motherEn.toLowerCase() === nameLower)
  );
  
  // 第二步：如果精确匹配没有结果，尝试模糊匹配
  if (matches.length === 0) {
    matches = horsesData.filter(h =>
      (h.mother && h.mother.includes(motherName)) ||
      (h.motherCh && h.motherCh.includes(motherName)) ||
      (h.motherEn && h.motherEn.toLowerCase().includes(nameLower))
    );
  }
  
  if (matches.length === 0) {
    queryResult.innerHTML = '<span class="error">未找到"' + motherName + '"，小傻蛋，看看你是不是写错了？👀</span>';
    return;
  }
  
  // 获取唯一的母亲信息
  const motherSet = new Map();
  matches.forEach(h => {
    if (!motherSet.has(h.mother)) {
      motherSet.set(h.mother, {
        group: h.group,
        rule: h.rule,
        reason: h.reason,
        father: h.father || '',
        sex: h.sex || '',
        count: 1,
        mother: h.mother,
        horseId: h.horseId,
        horse: h
      });
    } else {
      motherSet.get(h.mother).count++;
    }
  });

  // 只有一个母马时显示梗图
  const motherCount = motherSet.size;
  let memeHtml = '';

  // 先判断是否是精选马，如果是则强制显示骆驼图片
  let imageName = null;
  if (motherCount === 1) {
    const recommendType = getRecommendType(matches[0].mother);
    if (recommendType === '骆驼精选' || recommendType === '工口作家精选' || recommendType === '花亲王精选' || recommendType === '御医精选' || recommendType === '🦌老师精选') {
      imageName = getRandomImageForRule('骆驼');
    }
  }

  // 如果不是骆驼精选，按正常逻辑选择
  if (!imageName) {
    const memeRule = motherCount === 1 ? matches[0].rule : '未匹配';
    const rules = memeRule.split('+');
    const selectedRule = rules[Math.floor(Math.random() * rules.length)];
    imageName = getRandomImageForRule(selectedRule);
  }

  if (imageName) {
    memeHtml = `<img src="./images/${imageName}" class="result-meme" alt="梗图">`;
  } else {
    memeHtml = '<div class="result-meme-text">梗图募集中</div>';
  }

  // 显示结果
  let html = '';
  let firstRecommendType = null;
  let allMothersAreRecommend = true;
  let firstMotherRecommend = null;

  motherSet.forEach(info => {
    const groupClass = 'g' + info.group;
    const fatherText = info.father ? '<div class="mother-father">' + info.father + '产驹</div>' : '';
    const recommendType = getRecommendType(info.mother);

    // 检查是否所有母马都是精选马
    if (recommendType) {
      if (!firstMotherRecommend) {
        firstMotherRecommend = recommendType;
      } else if (firstMotherRecommend !== recommendType) {
        allMothersAreRecommend = false;
      }
    } else {
      allMothersAreRecommend = false;
    }

    // 性别图标
    const sexIcon = info.sex === 'male' ? '<span class="sex-icon male">♂</span>'
                  : info.sex === 'female' ? '<span class="sex-icon female">♀</span>'
                  : '';

    // 检查标签
    const tags = getHorseTags(info.horse);
    let tagsHtml = '';
    tags.forEach(tag => {
      tagsHtml += `<span class="horse-tag ${tag.type}">${tag.label}</span>`;
    });

    html += '<div class="mother-result-item">' +
      '<div class="mother-content">' +
        '<div class="mother-main">' +
          '<div class="mother-info-row">' +
            '<div class="sex-wrapper">' + sexIcon + '</div>' +
            '<div class="mother-info">' +
              '<span class="mother-name">母马名：' + info.mother + '</span>' +
              fatherText +
            '</div>' +
            tagsHtml +
            '<span class="mother-group ' + groupClass + '">Group ' + info.group + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="mother-detail">' +
          '<span class="mother-reason">理由: ' + info.reason + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="add-to-selection-btn" data-horse-id="' + info.horseId + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg></button>' +
    '</div>';
  });

  // 只有当所有匹配的母马都是精选马时，才显示精选标签
  const showRecommend = allMothersAreRecommend && firstMotherRecommend !== null;
  const recommendLabelHtml = showRecommend
    ? '<div class="result-recommend-label"><div class="recommend-title">🎉 恭喜你选到了 🎉</div><div class="recommend-text">🐫 ' + firstMotherRecommend + '</div></div>'
    : '';

  // 根据是否为精选马决定是否触发烟花
  if (showRecommend) {
    triggerFirework(true);
  } else {
    stopFirework();
  }

  queryResult.innerHTML = memeHtml + recommendLabelHtml + html;

  // 绑定添加按钮事件
  document.querySelectorAll('.add-to-selection-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const horseId = e.currentTarget.dataset.horseId;
      addToSelection(horseId);
    });
  });
}

// ==================== 梗图显示 ====================
// 规则 → 图片数组的映射
const ruleImages = {
  'G1-1': ['G1-1.jpg'],
  'G1-2': ['G1-2.jpg', 'G1-2(1).jpg', 'G1-2(2).jpg'],
  'G1-5': ['G1-5.jpg', 'G1-5(1).jpg'],
  'G2-1': ['G2-1.jpg', 'G2-1(1).jpg', 'G2-1(2).jpg'],
  'G2-2': ['G2-2.jpg'],
  'G2-3': ['G2-3.jpg'],
  'G3': ['G3.jpg', 'G3(1).jpg', 'G3(2).jpg'],
  '骆驼': ['骆驼.jpg', '骆驼1.jpg', '骆驼2.jpg', '骆驼3.jpg'],
  '未匹配': ['未匹配.jpg']
};

// 随机获取某规则的一张图片
function getRandomImageForRule(rule) {
  const images = ruleImages[rule];
  if (!images || images.length === 0) return null;
  return images[Math.floor(Math.random() * images.length)];
}

function showRuleMeme(rule) {
  if (!memeModal) return;

  // 从多个规则中随机选择一个，再从该规则的多张图片中随机选一张
  const rules = rule.split('+');
  const selectedRule = rules[Math.floor(Math.random() * rules.length)];
  const imageName = getRandomImageForRule(selectedRule);

  if (imageName) {
    // 显示图片
    if (memeImage) {
      memeImage.style.display = 'block';
      memeImage.onerror = function() {
        this.style.display = 'none';
      };
      memeImage.src = './images/' + imageName;
    }
    if (memeText) memeText.textContent = '';
  } else {
    // 图片缺失，显示"梗图募集中"
    if (memeImage) {
      memeImage.style.display = 'none';
    }
    if (memeText) memeText.textContent = '梗图募集中';
  }

  memeModal.classList.add('show');
}

// ==================== 统计更新 ====================
function updateStats() {
  console.log('updateStats called, horsesData length:', horsesData.length);
  if (horsesData.length > 0) {
    console.log('sample horse:', horsesData[0]);
  }
  
  const stats = { 1: 0, 2: 0, 3: 0 };
  horsesData.forEach(h => {
    const g = Number(h.group);
    if (g >= 1 && g <= 3) stats[g]++;
  });
  
  console.log('stats:', stats);
  if (statG1) statG1.textContent = stats[1];
  if (statG2) statG2.textContent = stats[2];
  if (statG3) statG3.textContent = stats[3];
}

function updateHorseCount() {
  if (!horseCount) return;
  const filtered = getFilteredHorses();
  horseCount.textContent = filtered.length;
}

// ==================== 筛选逻辑 ====================
function getFilteredHorses() {
  if (currentFilter === 'all') {
    return horsesData;
  }
  return horsesData.filter(h => h.group === parseInt(currentFilter));
}

// ==================== 筛选按钮事件 ====================
if (filterBtns.length > 0) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      updateHorseCount();
    });
  });
}

// ==================== 随机选择逻辑 ====================

async function selectRandomHorse() {
  if (isAnimating) return;
  
  const filtered = getFilteredHorses();
  if (filtered.length === 0) {
    alert('当前筛选条件下没有马匹！');
    return;
  }
  
  // 开始动画
  isAnimating = true;
  if (selectBtn) selectBtn.classList.add('animating');
  
  // 随机选择（带动画延迟）
  const randomIndex = Math.floor(Math.random() * filtered.length);
  const selectedHorse = filtered[randomIndex];
  
  await animateSelection();
  
  // 显示结果
  displayHorse(selectedHorse);
  
  // 显示梗图
  const recommendType = getRecommendType(selectedHorse.mother);
  setTimeout(() => {
    showMeme(selectedHorse.group, !!recommendType, recommendType);
  }, 500);
  
  isAnimating = false;
  if (selectBtn) selectBtn.classList.remove('animating');
}

function animateSelection() {
  return new Promise(resolve => {
    if (!resultCard) return resolve();
    let count = 0;
    const maxCount = 10;
    const interval = setInterval(() => {
      const randomHorse = horsesData[Math.floor(Math.random() * horsesData.length)];
      resultCard.innerHTML = '<div class="horse-info"><div class="horse-name" style="opacity: 0.5">' + randomHorse.horseId + '</div></div>';
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        resolve();
      }
    }, 80);
  });
}

// ==================== 显示马匹信息 ====================
function displayHorse(horse) {
  if (!resultCard) return;
  
  // 格式化价格
  let priceInfo = '无价格信息';
  if (horse.salePrice) {
    const price = Math.round(horse.salePrice / 1.1); // 税前价格
    priceInfo = (horse.saleName || '拍卖会') + ': ¥' + price.toLocaleString() + '万';
  } else if (horse.bosyuPrice) {
    priceInfo = (horse.bosyuUnit || '募集') + ': ¥' + parseInt(horse.bosyuPrice).toLocaleString() + '万';
  }
  
  // 获取标签
  const tags = getHorseTags(horse);
  let tagsHtml = '';
  tags.forEach(tag => {
    tagsHtml += `<span class="horse-tag ${tag.type}">${tag.label}</span>`;
  });
  
  resultCard.innerHTML = '<div class="horse-info">' +
    '<div class="horse-name">' + horse.horseId + '</div>' +
    tagsHtml +
    '<div class="horse-details">' +
      '<div class="detail-item"><div class="detail-label">母马</div><div class="detail-value">' + (horse.mother || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">生产牧场</div><div class="detail-value">' + (horse.breederName || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">俱乐部</div><div class="detail-value">' + (horse.club || '-') + '</div></div>' +
      '<div class="detail-item"><div class="detail-label">价格</div><div class="detail-value">' + priceInfo + '</div></div>' +
    '</div>' +
    '<div class="group-badge g' + horse.group + '">Group ' + horse.group + '</div>' +
    '<div class="rule-applied">规则: ' + horse.rule + '</div>' +
    '<div class="rule-reason">' + horse.reason + '</div>' +
  '</div>';
  
  resultCard.classList.remove('show');
  void resultCard.offsetWidth;
  resultCard.classList.add('show');
}

// ==================== 梗图弹窗 ====================
function showMeme(group, isRecommend, recommendType) {
  if (!memeModal) return;
  
  // 精选标签（显示在梗图下方）
  const recommendLabelText = isRecommend ? (recommendType || '精选') : '';
  
  // 精选马且有骆驼梗图时，交替使用骆驼梗图
  if (isRecommend && camelMemes.length > 0) {
    camelMemeToggle = !camelMemeToggle; // 切换状态
    
    if (camelMemeToggle) {
      // 显示骆驼梗图
      const camelMeme = camelMemes[0];
      if (memeImage) {
        memeImage.onerror = function() {
          this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f59e0b" width="400" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="72">🐫</text><text x="50%" y="65%" text-anchor="middle" fill="white" font-size="24">骆驼帮精选</text></svg>');
        };
        memeImage.src = camelMeme.image;
      }
      if (memeRecommendLabel) {
        memeRecommendLabel.textContent = recommendLabelText;
        if (recommendLabelText) {
          memeRecommendLabel.classList.add('show');
        } else {
          memeRecommendLabel.classList.remove('show');
        }
      }
      if (memeText) memeText.textContent = camelMeme.text;
      memeModal.classList.add('show');
      return;
    }
  }
  
  // 显示普通梗图
  const groupMemes = memes[group];
  if (!groupMemes || groupMemes.length === 0) return;
  
  const meme = groupMemes[Math.floor(Math.random() * groupMemes.length)];
  
  if (memeImage) {
    memeImage.onerror = function() {
      this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#667eea" width="400" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="48">🎉</text><text x="50%" y="60%" text-anchor="middle" fill="white" font-size="24">Group ' + group + '</text></svg>');
    };
    memeImage.src = meme.image;
  }
  if (memeRecommendLabel) {
    memeRecommendLabel.textContent = recommendLabelText;
    if (recommendLabelText) {
      memeRecommendLabel.classList.add('show');
    } else {
      memeRecommendLabel.classList.remove('show');
    }
  }
  if (memeText) memeText.textContent = meme.text;
  memeModal.classList.add('show');
}

if (memeClose) {
  memeClose.addEventListener('click', () => {
    if (memeModal) memeModal.classList.remove('show');
    if (memeRecommendLabel) memeRecommendLabel.textContent = '';
  });
}

if (memeModal) {
  memeModal.addEventListener('click', (e) => {
    if (e.target === memeModal) {
      memeModal.classList.remove('show');
      if (memeRecommendLabel) memeRecommendLabel.textContent = '';
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && memeModal && memeModal.classList.contains('show')) {
    memeModal.classList.remove('show');
    if (memeRecommendLabel) memeRecommendLabel.textContent = '';
  }
});

// ==================== 全屏烟花效果 ====================
let fireworkInterval = null;
let fireworkOverlay = null;

function triggerFirework(loop = false) {
  // 创建烟花容器
  if (!fireworkOverlay) {
    fireworkOverlay = document.createElement('div');
    fireworkOverlay.id = 'firework-overlay';
    fireworkOverlay.className = 'firework-overlay';
    document.body.appendChild(fireworkOverlay);
  }
  
  // 烟花颜色
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3', '#feca57', '#ff9f43', '#ee5a24'];
  
  if (loop) {
    // 持续播放烟花
    if (!fireworkInterval) {
      // 先播放一组
      launchFireworkSet(colors);
      // 然后每2秒继续播放
      fireworkInterval = setInterval(() => {
        launchFireworkSet(colors);
      }, 2000);
    }
  } else {
    // 单次播放
    launchFireworkSet(colors);
    setTimeout(() => {
      if (fireworkOverlay) {
        fireworkOverlay.innerHTML = '';
      }
    }, 3000);
  }
}

function launchFireworkSet(colors) {
  if (!fireworkOverlay) return;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      createSingleFirework(fireworkOverlay, colors);
    }, i * 400);
  }
}

function stopFirework() {
  // 停止循环
  if (fireworkInterval) {
    clearInterval(fireworkInterval);
    fireworkInterval = null;
  }
  // 清除烟花
  if (fireworkOverlay) {
    fireworkOverlay.innerHTML = '';
  }
}

function createSingleFirework(container, colors) {
  const centerX = Math.random() * window.innerWidth;
  const centerY = 100 + Math.random() * (window.innerHeight * 0.25);
  const particleCount = 35;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework-particle';
    
    const angle = (i / particleCount) * Math.PI * 2;
    const velocity = 70 + Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    particle.style.left = centerX + 'px';
    particle.style.top = centerY + 'px';
    particle.style.backgroundColor = color;
    particle.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;
    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');
    
    container.appendChild(particle);
    
    // 动画结束后删除粒子
    setTimeout(() => {
      particle.remove();
    }, 1500);
  }
}

// ==================== 2.0版本：选择列表功能 ====================

// 获取马的标签信息
function getHorseTags(horse) {
  const tags = [];
  if (!horse || !horse.father) return tags;

  // 海外种马（独立检查，不需要 sireFeeData）
  if (isOverseasSire(horse.father)) {
    tags.push({ type: 'overseas', label: '🌍 海外种马' });
  }

  // 查找种马数据（用于新种马和种费标签）
  const sireInfo = sireFeeData.find(s => s['種牡馬名'] === horse.father);

  // 如果找到种马数据，添加新种马和种费标签
  if (sireInfo) {
    // 新种马（供用年数1年目，精确匹配1，不能是11年目、21年目）
    if (sireInfo['供用年数'] && sireInfo['供用年数'] === '1年目') {
      tags.push({ type: 'new', label: '🆕 新种马' });
    }

    // 种费低于500万
    if (sireInfo['種付け料']) {
      const feeMatch = sireInfo['種付け料'].replace(/,/g, '').match(/[\d]+/);
      if (feeMatch && parseInt(feeMatch[0]) < 500) {
        // 检查母马是否在排除列表中
        if (!EXCLUDED_MOTHERS.includes(horse.mother)) {
          tags.push({ type: 'lowfee', label: '💰 种费<500万' });
        }
      }
    }
  }

  return tags;
}

// 判断是否为海外种马（根据名称判断）
function isOverseasSire(fatherName) {
  if (!fatherName) return false;
  return overseasSires.includes(fatherName);
}

// 添加到选择列表
function addToSelection(horseId) {
  const horse = horsesData.find(h => h.horseId === horseId);
  if (!horse) return;

  // 检查是否已满10条
  if (selectedHorses.length >= 10) {
    alert('已选择10条，无法继续添加！');
    return;
  }

  // 检查是否已选择
  if (selectedHorses.some(h => h.horseId === horseId)) {
    alert('该马已在选择列表中！');
    return;
  }

  selectedHorses.push(horse);
  saveSelections();
  renderSelections();
  showToast('已添加');
}

// 从选择列表移除
function removeFromSelection(horseId) {
  selectedHorses = selectedHorses.filter(h => h.horseId !== horseId);
  validationResult.innerHTML = '';
  saveSelections();
  renderSelections();
  showToast('已删除');
}

// 清空选择列表
function clearSelections() {
  if (selectedHorses.length === 0) return;
  if (confirm('确定要清空选择列表吗？')) {
    selectedHorses = [];
    validationResult.innerHTML = '';
    saveSelections();
    renderSelections();
  }
}

// 渲染选择列表
function renderSelections() {
  selectionCount.textContent = `(${selectedHorses.length}/10)`;

  // 更新验证按钮状态
  validateBtn.disabled = selectedHorses.length !== 10;

  if (selectedHorses.length === 0) {
    selectionList.innerHTML = '<div class="selection-empty">搜索母马后，点击「添加到选择」按钮添加到这里</div>';
    return;
  }

  let html = '';
  selectedHorses.forEach((horse, index) => {
    const groupClass = 'g' + horse.group;
    const tags = getHorseTags(horse);

    // 生成标签HTML
    let tagsHtml = '';
    tags.forEach(tag => {
      tagsHtml += `<span class="horse-tag ${tag.type}">${tag.label}</span>`;
    });

    // 性别图标
    const sexIcon = horse.sex === 'male' ? '♂' : horse.sex === 'female' ? '♀' : '';

    html += `<div class="selection-item" data-index="${index}">
      <span class="drag-handle" draggable="true">☰</span>
      <span class="selection-index">${index + 1}.</span>
      <span class="selection-info">
        <span class="selection-mother">母名：${horse.mother}</span>
        <span class="selection-father">父名：${horse.father}</span>
      </span>
      ${tagsHtml}
      <span class="selection-group ${groupClass}">G${horse.group}</span>
      <span class="selection-sex">${sexIcon}</span>
      <button class="remove-btn" data-horse-id="${horse.horseId}">
        <svg viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>`;
  });

  selectionList.innerHTML = html;

  // 绑定删除按钮事件
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeFromSelection(e.currentTarget.dataset.horseId);
    });
  });

  // 绑定拖拽排序事件
  initDragSort();
}

// 拖拽排序
let draggedIndex = null;
let touchStartY = 0;
let isTouchDragging = false;
let draggedElement = null;
let insertBeforeFlag = null;  // 记录插入位置

function initDragSort() {
  const items = document.querySelectorAll('.selection-item');
  const handles = document.querySelectorAll('.drag-handle');

  // 桌面端拖拽 - 只允许通过手柄拖动
  handles.forEach(handle => {
    handle.addEventListener('dragstart', (e) => {
      const item = handle.closest('.selection-item');
      draggedIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      document.body.classList.add('dragging-active'); // 标记拖动状态
      e.dataTransfer.effectAllowed = 'move';
      // 设置拖拽图像为整个 item
      e.dataTransfer.setDragImage(item, 20, item.offsetHeight / 2);
    });

    handle.addEventListener('dragend', () => {
      items.forEach(i => i.classList.remove('dragging'));
      document.body.classList.remove('dragging-active');
      draggedIndex = null;
    });
  });

  // 桌面端放置和移动端触摸 - 在整个 item 上监听
  items.forEach(item => {
    // 桌面端 dragover
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex === null) return;
      if (parseInt(item.dataset.index) === draggedIndex) return;

      const rect = item.getBoundingClientRect();
      const insertBefore = e.clientY < rect.top + rect.height / 2;
      let targetIdx = parseInt(item.dataset.index);
      if (!insertBefore) targetIdx++;
      if (draggedIndex < targetIdx) targetIdx--;
      insertBeforeFlag = targetIdx;
      
      // 添加视觉指示
      item.style.borderTop = insertBefore ? '2px solid #4a90e2' : '';
      item.style.borderBottom = insertBefore ? '' : '2px solid #4a90e2';
    });

    item.addEventListener('dragleave', (e) => {
      // 鼠标离开时清除指示
      item.style.borderTop = '';
      item.style.borderBottom = '';
    });

    // 桌面端 drop
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedIndex !== null && insertBeforeFlag !== null && draggedIndex !== insertBeforeFlag) {
        const [moved] = selectedHorses.splice(draggedIndex, 1);
        selectedHorses.splice(insertBeforeFlag, 0, moved);
        saveSelections();
        renderSelections();
      }
      insertBeforeFlag = null;
    });

    // 移动端 touchmove
    item.addEventListener('touchmove', (e) => {
      if (!draggedElement) return;
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY;

      if (Math.abs(diff) > 30 && !isTouchDragging) {
        isTouchDragging = true;
      }

      if (isTouchDragging) {
        e.preventDefault();
        
        // 更新被拖动项目的视觉反馈
        draggedElement.style.transform = `translateY(${diff}px)`;
        draggedElement.classList.add('touch-dragging');
        
        // 清除之前的插入指示器
        items.forEach(i => {
          i.classList.remove('insert-before', 'insert-after');
        });
        
        // 计算当前触摸位置在哪个项目上方
        const allItems = Array.from(document.querySelectorAll('.selection-item'));
        for (let i = 0; i < allItems.length; i++) {
          const rect = allItems[i].getBoundingClientRect();
          const itemMiddle = rect.top + rect.height / 2;
          
          // 跳过自己
          if (allItems[i] === draggedElement) continue;
          
          // 判断插入位置
          if (touchY < itemMiddle) {
            allItems[i].classList.add('insert-before');
            break;
          } else if (i === allItems.length - 1 || touchY < allItems[i + 1].getBoundingClientRect().top + allItems[i + 1].offsetHeight / 2) {
            allItems[i].classList.add('insert-after');
            break;
          }
        }
      }
    }, { passive: false });

    // 移动端 touchend
    item.addEventListener('touchend', (e) => {
      if (!draggedElement) return;

      if (isTouchDragging && draggedIndex !== null) {
        // 找到插入指示器的位置
        const allItems = Array.from(document.querySelectorAll('.selection-item'));
        let targetIdx = draggedIndex;
        
        for (let i = 0; i < allItems.length; i++) {
          if (allItems[i].classList.contains('insert-before')) {
            targetIdx = i;
            break;
          } else if (allItems[i].classList.contains('insert-after')) {
            targetIdx = i + 1;
            if (targetIdx > draggedIndex) targetIdx--;
            break;
          }
        }

        if (draggedIndex !== targetIdx) {
          const [moved] = selectedHorses.splice(draggedIndex, 1);
          selectedHorses.splice(targetIdx, 0, moved);
          saveSelections();
          renderSelections();
        }
      }

      // 清除所有视觉反馈
      items.forEach(i => {
        i.classList.remove('dragging', 'touch-dragging', 'insert-before', 'insert-after');
        i.style.transform = '';
      });
      if (draggedElement) {
        draggedElement.classList.remove('touch-dragging');
        draggedElement.style.transform = '';
      }
      draggedIndex = null;
      isTouchDragging = false;
      draggedElement = null;
    });
  });

  // 移动端 touchstart - 只允许通过手柄触发
  handles.forEach(handle => {
    handle.addEventListener('touchstart', (e) => {
      const item = handle.closest('.selection-item');
      touchStartY = e.touches[0].clientY;
      draggedElement = item;
      draggedIndex = parseInt(item.dataset.index);
      // 添加视觉反馈 - 标记为触摸拖动状态
      item.classList.add('touch-dragging');
    }, { passive: false });  // 改为非passive以便后续preventDefault
  });
}

// 保存选择到localStorage
function saveSelections() {
  try {
    const data = selectedHorses.map(h => h.horseId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存失败:', e);
  }
}

// 从localStorage加载选择
function loadSelections() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const horseIds = JSON.parse(data);
      selectedHorses = horseIds
        .map(id => horsesData.find(h => h.horseId === id))
        .filter(h => h); // 过滤掉找不到的
      renderSelections();
    }
  } catch (e) {
    console.error('加载失败:', e);
  }
}

// 检查马匹是否为种费<500万的种马产驹
function isLowFeeHorse(horse) {
  if (!horse || !horse.father) return false;
  const sireInfo = sireFeeData.find(s => s['種牡馬名'] === horse.father);
  if (!sireInfo || !sireInfo['種付け料']) return false;
  const feeMatch = sireInfo['種付け料'].replace(/,/g, '').match(/[\d]+/);
  if (feeMatch && parseInt(feeMatch[0]) < 500) {
    // 检查母马是否在排除列表中
    if (!EXCLUDED_MOTHERS.includes(horse.mother)) {
      return true;
    }
  }
  return false;
}

// 验证选择列表
function validateSelections() {
  const errors = [];

  // 规则2：性别比例
  const maleCount = selectedHorses.filter(h => h.sex === 'male').length;
  const femaleCount = selectedHorses.filter(h => h.sex === 'female').length;
  const validSexRatios = [
    [5, 5], [4, 6], [6, 4]
  ];
  const isValidSexRatio = validSexRatios.some(([m, f]) => m === maleCount && f === femaleCount);
  if (!isValidSexRatio) {
    if (maleCount > femaleCount) {
      errors.push('⚡️看来你是男生宿舍管理员');
    } else {
      errors.push('🚨你也想当女生宿舍管理员吗');
    }
  }

  // Group基础数据
  const g1Count = selectedHorses.filter(h => h.group === 1).length;
  const g2Count = selectedHorses.filter(h => h.group === 2).length;
  const g3Count = selectedHorses.filter(h => h.group === 3).length;

  // 计算种费<500万的G1数量（用于特殊规则检查）
  const lowFeeG1Count = selectedHorses.filter(h => h.group === 1 && isLowFeeHorse(h)).length;

  // 特殊规则1：同父限制扩展（通过检测同父超标数量来触发）
  // 用户通过超标行为"质押"G1上限，这个限制不可逆
  const fatherCounts = {};
  selectedHorses.forEach(h => {
    fatherCounts[h.father] = (fatherCounts[h.father] || 0) + 1;
  });

  // 计算需要放弃多少G1上限（每超标1条同父马，G1上限-1）
  const overLimitFathers = Object.entries(fatherCounts)
    .filter(([, count]) => count > 2)
    .map(([father, count]) => ({ father, count, needed: count - 2 }));

  const neededExtensions = overLimitFathers.reduce((sum, f) => sum + f.needed, 0);
  const rule1Penalty = Math.min(neededExtensions, 2); // 特殊规则1最多触发2次

  // 特殊规则2：种费500万以下名额扩展
  // 触发条件：≥2条低种费G1，G1上限+1
  const rule2Bonus = lowFeeG1Count >= 2 ? 1 : 0;

  // 计算G1上限：基础5条 - 特殊规则1惩罚 + 特殊规则2奖励
  const maxG1Allowed = 5 - rule1Penalty + rule2Bonus;

  // 验证特殊规则1触发次数
  if (neededExtensions > 2) {
    overLimitFathers.forEach(({ father }) => {
      errors.push(`🐎 ${father} 产驹超标太多了，特殊规则1最多触发2次哦`);
    });
  }

  // 验证G1数量
  if (g1Count > maxG1Allowed) {
    if (rule1Penalty > 0) {
      errors.push('🔨 同种马上限规则只能触发两次啊喂');
    } else {
      errors.push('😧 不是哥们，连吃带拿啊？这么多G1');
    }
  }
  // G2上限（固定为2）
  if (g2Count > 2) {
    errors.push('😰 G2是不是太多了');
  }
  // G3无需检查：总数固定10条，G1和G2合法后G3数量自然确定

  // 规则5：供用年数1年目要求
  const hasNewSire = selectedHorses.some(h => {
    const tags = getHorseTags(h);
    return tags.some(t => t.type === 'new');
  });
  if (!hasNewSire) {
    errors.push('💦 怎么都是老面孔，新种马呢');
  }

  // 规则6：海外种马要求
  const hasOverseas = selectedHorses.some(h => {
    const tags = getHorseTags(h);
    return tags.some(t => t.type === 'overseas');
  });
  if (!hasOverseas) {
    errors.push('🌸 哥们你战樱啊，来条海外种马产驹呗');
  }

  // 附加规则：海外种马和新种马必须是不同选项
  const newSireHorses = selectedHorses.filter(h => {
    const tags = getHorseTags(h);
    return tags.some(t => t.type === 'new');
  });
  const overseasHorses = selectedHorses.filter(h => {
    const tags = getHorseTags(h);
    return tags.some(t => t.type === 'overseas');
  });
  if (hasNewSire && hasOverseas && newSireHorses.length + overseasHorses.length < 2) {
    errors.push('🤔 嗯？怎么还有人想钻空子的，老老实实选一条新种马一条海外种马吧');
  }

  // 显示结果
  if (errors.length === 0) {
    validationResult.innerHTML = `<div class="validation-pass">
      <div class="validation-title">👀 目测符合规则</div>
    </div>`;
  } else {
    const errorsHtml = errors.map(e => `<div class="validation-reason">${e}</div>`).join('');
    validationResult.innerHTML = `<div class="validation-fail">
      <div class="validation-title">❌ 不符合规则</div>
      ${errorsHtml}
    </div>`;
  }
}
