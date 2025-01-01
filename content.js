// 初始化时获取设置
chrome.storage.sync.get(['autoClose', 'defaultQuality', 'defaultSpeed', 'autoPlay', 'autoNext', 'removeWatermark'], (result) => {
  // 添加全局变量声明
  let playCheckInterval = null;
  let lastPlayTime = '';
  
  const settings = {
    autoClose: result.autoClose || false,
    defaultQuality: result.defaultQuality || 'high',
    defaultSpeed: result.defaultSpeed || '1',
    autoPlay: result.autoPlay || false,
    autoNext: result.autoNext || false,
    removeWatermark: result.removeWatermark || false
  };

  // 添加一个变量来记录上次执行时间
  let lastAutoPlayTime = 0;

  // 设置视频清晰度
  function setVideoQuality() {
    // 获取所有选项容器
    const optionContainers = document.querySelectorAll('.pv-control-wrap-style-content');
    
    // 找到包含清晰度选项的容器（通过检查内容文本）
    const qualityContainer = Array.from(optionContainers).find(container => {
      const options = container.querySelectorAll('.pv-select-option');
      return Array.from(options).some(option => 
        option.textContent.trim() === '高清' || option.textContent.trim() === '标清'
      );
    });

    if (qualityContainer) {
      const qualityOptions = qualityContainer.querySelectorAll('.pv-select-option');
      const highQualityOption = Array.from(qualityOptions)
        .find(option => option.textContent.trim() === '高清');
      const standardQualityOption = Array.from(qualityOptions)
        .find(option => option.textContent.trim() === '标清');

      if (highQualityOption && standardQualityOption) {
        // 检查是否已经是目标清晰度（通过active类判断）
        const isCurrentlyHigh = highQualityOption.classList.contains('pv-select-option-active');
        const shouldBeHigh = settings.defaultQuality === 'high';
        
        // 如果当前清晰度不是目标清晰度，则点击切换
        if (isCurrentlyHigh !== shouldBeHigh) {
          console.log(`设置${shouldBeHigh ? '高清' : '标清'}画质`);
          (shouldBeHigh ? highQualityOption : standardQualityOption).click();
        }
      }
    }
  }

  // 设置视频播放速度
  function setVideoSpeed() {
    // 获取所有选项容器
    const optionContainers = document.querySelectorAll('.pv-control-wrap-style-content');
    
    // 找到包含速度选项的容器（通过检查 data-rate 属性）
    const speedContainer = Array.from(optionContainers).find(container => {
      const options = container.querySelectorAll('.pv-select-option');
      return Array.from(options).some(option => option.hasAttribute('data-rate'));
    });

    if (speedContainer) {
      const speedOptions = speedContainer.querySelectorAll('.pv-select-option');
      const targetSpeedOption = Array.from(speedOptions)
        .find(option => option.getAttribute('data-rate') === settings.defaultSpeed);

      if (targetSpeedOption && !targetSpeedOption.classList.contains('pv-select-option-active')) {
        console.log(`设置播放速度为 ${settings.defaultSpeed}x`);
        targetSpeedOption.click();
      }
    }
  }

  // 修改判断视频是否加载完成的函数
  function isVideoLoaded() {
    const videoElement = document.querySelector('.pv-video-wrap #vjs_video_3');
    const durationElement = document.querySelector('.pv-time-duration');
    const duration = durationElement?.textContent.trim();

    // 检查三个条件：
    // 1. 视频元素存在
    // 2. 视频处于暂停状态
    // 3. 视频总时长存在且不为 00:00
    return videoElement && 
           videoElement.classList.contains('vjs-paused') && 
           duration && 
           duration !== '00:00';
  }

  // 修改自动播放功能
  function autoPlayVideo() {
    const currentTime = Date.now();
    // 检查是否距离上次执行超过3秒
    if (currentTime - lastAutoPlayTime < 3000) {
      console.log('距离上次自动播放不足3秒，跳过本次执行');
      return false;
    }

    const playButton = document.querySelector('.pv-controls-left button.pv-iconfont');
    const videoElement = document.querySelector('.pv-video-wrap #vjs_video_3');
    const durationElement = document.querySelector('.pv-time-duration');
    const duration = durationElement?.textContent.trim();
    
    if (playButton && videoElement && 
        videoElement.classList.contains('vjs-paused') && 
        duration && duration !== '00:00') {
      console.log('视频已加载完成且处于暂停状态，总时长为:', duration);
      if (settings.autoPlay) {
        playButton.click();
        console.log('已点击播放按钮');
        // 更新最后执行时间
        lastAutoPlayTime = currentTime;
        startPlayCheck();
      } else {
        console.log('自动播放已禁用');
      }
      return true;
    }
    
    if (playButton) {
      console.log('播放按钮已出现但视频尚未完全准备好');
    }
    return false;
  }

  // 修改播放监控功能
  function startPlayCheck() {
    // 清除可能存在的旧定时器
    if (playCheckInterval) {
      clearInterval(playCheckInterval);
    }

    // 创建新的定时器
    playCheckInterval = setInterval(() => {
      const videoElement = document.querySelector('.pv-video-wrap #vjs_video_3');
      
      if (videoElement) {
        // 通过类名判断视频是否暂停
        if (videoElement.classList.contains('vjs-paused')) {
          console.log('检测到视频暂停，尝试恢复播放');
          const playButton = document.querySelector('.pv-controls-left button.pv-iconfont');
          if (playButton) {
            playButton.click();
          }
        }
      }
    }, 1000);
  }

  // 添加检查是否是最后一节的函数
  function isLastChapter() {
    const nextButton = document.querySelector('.next-chapter button');
    return nextButton && nextButton.hasAttribute('disabled');
  }

  // 修改自动跳转下一节的函数
  function skipToNextChapter() {
    // 如果是最后一节，停止所有操作
    if (isLastChapter()) {
      console.log('已到达课程末尾，停止所有操作');
      // 清除所有定时器
      if (completionCheckInterval) {
        clearInterval(completionCheckInterval);
      }
      if (playCheckInterval) {
        clearInterval(playCheckInterval);
      }
      // 断开观察器
      videoObserver.disconnect();
      return;
    }

    console.log('当前章节无视频，准备跳转下一节');
    const nextButton = document.querySelector('.next-chapter button');
    if (nextButton) {
      nextButton.click();
      console.log('已点击下一节按钮');
      
      // 清除现有定时器
      if (completionCheckInterval) {
        clearInterval(completionCheckInterval);
      }
      if (playCheckInterval) {
        clearInterval(playCheckInterval);
      }
      
      // 重新启动观察器来处理新页面
      videoObserver.disconnect();
      videoObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // 重置播放时间记录
      lastPlayTime = '';
    }
  }

  // 添加视频完成监控功能
  let completionCheckInterval = null;

  function startCompletionCheck() {
    // 如果没有启用自动播放下一节，不启动监控
    if (!settings.autoNext) {
      return;
    }

    // 清除可能存在的旧定时器
    if (completionCheckInterval) {
      clearInterval(completionCheckInterval);
    }

    // 创建新的定时器，每3秒检查一次
    completionCheckInterval = setInterval(() => {
      const hintElement = document.querySelector('.video-hint');
      if (hintElement) {
        const timeSpans = hintElement.querySelectorAll('span');
        if (timeSpans.length >= 3) {
          const targetTime = timeSpans[1].textContent;
          const currentTime = timeSpans[2].textContent;
          
          const targetSeconds = convertTimeToSeconds(targetTime);
          const currentSeconds = convertTimeToSeconds(currentTime);
          
          if (currentSeconds >= targetSeconds) {
            // 如果是最后一节，停止所有操作
            if (isLastChapter()) {
              console.log('已到达课程末尾，停止所有操作');
              // 清除所有定时器
              clearInterval(completionCheckInterval);
              if (playCheckInterval) {
                clearInterval(playCheckInterval);
              }
              // 断开观察器
              videoObserver.disconnect();
              return;
            }

            console.log('视频观看时长已达标，准备进入下一节');
            const nextButton = document.querySelector('.next-chapter button');
            if (nextButton) {
              nextButton.click();
              console.log('已点击下一节按钮');
              
              // 清除现有定时器
              clearInterval(completionCheckInterval);
              if (playCheckInterval) {
                clearInterval(playCheckInterval);
              }
              
              // 重新启动观察器来处理新页面
              videoObserver.disconnect();
              videoObserver.observe(document.body, {
                childList: true,
                subtree: true
              });
              
              // 重置播放时间记录
              lastPlayTime = '';
            }
          }
        }
      }
    }, 3000);
  }

  // 辅助函数：将时间字符串转换为秒数
  function convertTimeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // 添加检查是否有视频的函数
  function hasVideo() {
    return !!document.querySelector('.student-learn-video-slot');
  }

  // 添加水印移除功能
  function addWatermarkRemover() {
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
      .pv-video-wrap > *:last-child {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // 使用 MutationObserver 监视水印元素的添加
    const watermarkObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.parentElement && node.parentElement.classList.contains('pv-video-wrap')) {
            // 确保是视频容器的直接子元素
            const children = node.parentElement.children;
            if (children[children.length - 1] === node) {
              node.style.display = 'none';
            }
          }
        });
      });
    });

    // 观察视频容器
    const videoWrap = document.querySelector('.pv-video-wrap');
    if (videoWrap) {
      watermarkObserver.observe(videoWrap, {
        childList: true
      });
    }

    return watermarkObserver;
  }

  let watermarkObserver = null;

  // 修改 videoObserver
  const videoObserver = new MutationObserver((mutations, obs) => {
    // 首先检查签到图标，这个功能独立于视频
    findAndClickIcon();

    // 然后检查是否有视频，如果没有且启用了自动下一节，则跳过
    if (!hasVideo()) {
      if (settings.autoNext) {
        skipToNextChapter();
      }
      return;
    }

    // 检查视频控件
    const qualityContainer = Array.from(document.querySelectorAll('.pv-control-wrap-style-content'))
      .find(container => 
        Array.from(container.querySelectorAll('.pv-select-option'))
          .some(option => option.textContent.trim() === '高清' || option.textContent.trim() === '标清')
      );

    const speedContainer = Array.from(document.querySelectorAll('.pv-control-wrap-style-content'))
      .find(container => 
        Array.from(container.querySelectorAll('.pv-select-option'))
          .some(option => option.hasAttribute('data-rate'))
      );
    
    // 检查并自动播放视频
    if (isVideoLoaded()) {
      autoPlayVideo();
      // 独立启动自动下一节监控
      if (settings.autoNext) {
        startCompletionCheck();
      }
    }

    // 如果视频控件都加载完成，设置清晰度和速度
    if (qualityContainer && speedContainer) {
      setVideoQuality();
      setVideoSpeed();
      
      // 只有在所有功能都不需要时才断开观察器
      if (isVideoLoaded() && !settings.autoPlay && !settings.autoNext && !settings.removeWatermark) {
        obs.disconnect();
        // 清理定时器
        if (playCheckInterval) {
          clearInterval(playCheckInterval);
        }
        if (completionCheckInterval) {
          clearInterval(completionCheckInterval);
        }
      }
    }

    // 处理水印移除
    if (settings.removeWatermark) {
      if (!watermarkObserver) {
        watermarkObserver = addWatermarkRemover();
      }
    } else if (watermarkObserver) {
      watermarkObserver.disconnect();
      watermarkObserver = null;
      // 移除样式
      const style = document.querySelector('style');
      if (style && style.textContent.includes('ujxx')) {
        style.remove();
      }
    }
  });

  // 开始观察 DOM 变化
  videoObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 查找并点击签到图标
  function findAndClickIcon() {
    const targetIcon = document.querySelector('.student-course-sign-dialog-content i');
    if (targetIcon) {
      console.log('找到签到图标，准备点击');
      if (settings.autoClose) {
        targetIcon.click();
      } else {
        console.log('自动关闭已禁用，不执行点击');
      }
      return true;
    }
    return false;
  }
}); 