// 页面加载时读取保存的设置
document.addEventListener('DOMContentLoaded', async () => {
  const { 
    autoClose = false, 
    defaultQuality = 'high', 
    defaultSpeed = '1', 
    autoPlay = false,
    autoNext = false,
    removeWatermark = false,
    timeMultiplier = '1',
    autoMute = false 
  } = await chrome.storage.sync.get([
    'autoClose', 
    'defaultQuality', 
    'defaultSpeed', 
    'autoPlay',
    'autoNext',
    'removeWatermark',
    'timeMultiplier',
    'autoMute'
  ]);
  
  document.getElementById('autoClose').checked = autoClose;
  document.getElementById('autoPlay').checked = autoPlay;
  document.getElementById('autoNext').checked = autoNext;
  document.getElementById('defaultQuality').value = defaultQuality;
  document.getElementById('defaultSpeed').value = defaultSpeed;
  document.getElementById('removeWatermark').checked = removeWatermark;
  document.getElementById('timeMultiplier').value = timeMultiplier;
  document.getElementById('autoMute').checked = autoMute;
});

// 监听 switch 变化
document.getElementById('autoClose').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ autoClose: e.target.checked });
  updateContentScript();
});

// 监听清晰度选择变化
document.getElementById('defaultQuality').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ defaultQuality: e.target.value });
  updateContentScript();
});

// 监听速度选择变化
document.getElementById('defaultSpeed').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ defaultSpeed: e.target.value });
  updateContentScript();
});

// 添加自动播放开关的监听
document.getElementById('autoPlay').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ autoPlay: e.target.checked });
  updateContentScript();
});

// 添加自动播放下一节开关的监听
document.getElementById('autoNext').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ autoNext: e.target.checked });
  updateContentScript();
});

// 添加水印移除开关的监听
document.getElementById('removeWatermark').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ removeWatermark: e.target.checked });
  updateContentScript();
});

// 添加静音选项的保存逻辑
document.getElementById('autoMute').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ autoMute: e.target.checked });
});

// 添加学习时长倍数选择的监听
document.getElementById('timeMultiplier').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ timeMultiplier: e.target.value });
  updateContentScript();
});

// 更新 content script 设置的函数
async function updateContentScript() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes('learnin.com.cn')) {
    const settings = await chrome.storage.sync.get([
      'autoClose', 
      'defaultQuality', 
      'defaultSpeed',
      'autoPlay',
      'autoNext'
    ]);
    chrome.tabs.sendMessage(tab.id, { 
      action: "updateSettings", 
      ...settings
    });
  }
} 