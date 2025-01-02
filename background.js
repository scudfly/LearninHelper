// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setTabMute') {
    chrome.tabs.update(sender.tab.id, { muted: request.muted })
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道打开以进行异步响应
  }
}); 