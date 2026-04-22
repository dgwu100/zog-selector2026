/**
 * 赛马Group选择器 - 主逻辑（数据从 merged.json 外部加载）
 */

// 数据将在 loadData() 中加载
let horsesData = [];

let currentFilter = 'all';
let isAnimating = false;

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

// ==================== 初始化 ====================
async function init() {
  await loadData();
  updateStats();
  updateHorseCount();
  console.log('已加载 ' + horsesData.length + ' 匹马的数据');

  // 绑定事件
  motherInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') queryMother();
  });
  queryBtn.addEventListener('click', queryMother);

  if (selectBtn) {
    selectBtn.addEventListener('click', selectRandomHorse);
  }
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
        count: 1, 
        mother: h.mother 
      });
    } else {
      motherSet.get(h.mother).count++;
    }
  });
  
  // 只有一个母马时显示梗图
  const motherCount = motherSet.size;
  let memeHtml = '';

  // 先判断是否是骆驼精选马，如果是则强制显示骆驼图片
  let imageName = null;
  if (motherCount === 1) {
    const recommendType = getRecommendType(matches[0].mother);
    if (recommendType === '骆驼精选') {
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
        // 精选类型不一致，不显示精选标志
        allMothersAreRecommend = false;
      }
    } else {
      // 有一个母马不是精选马
      allMothersAreRecommend = false;
    }
    
    html += '<div class="mother-result-item">' +
      '<div class="mother-main">' +
        '<div class="mother-info">' +
          '<span class="mother-name">母马名：' + info.mother + '</span>' +
          fatherText +
        '</div>' +
        '<span class="mother-group ' + groupClass + '">Group ' + info.group + '</span>' +
      '</div>' +
      '<div class="mother-detail">' +
        '<span class="mother-reason">理由: ' + info.reason + '</span>' +
      '</div>' +
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
}

// ==================== 梗图显示 ====================
// 规则 → 图片数组的映射
const ruleImages = {
  'G1-1': ['G1-1.jpg'],
  'G1-2': ['G1-2.jpg', 'G1-2(1).jpg', 'G1-2(2).jpg'],
  'G1-5': ['G1-5.jpg', 'G1-5(1).jpg'],
  'G2-1': ['G2-1.jpg', 'G2-1(1).jpg'],
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
  
  resultCard.innerHTML = '<div class="horse-info">' +
    '<div class="horse-name">' + horse.horseId + '</div>' +
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
