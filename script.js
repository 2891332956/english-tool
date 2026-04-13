// 全局变量
let words = [];
let currentFilter = 'all';
let audioMarkers = [];
let currentTranscript = '';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页切换
    initTabs();
    
    // 初始化单词本功能
    initVocabulary();
    
    // 初始化听力功能
    initListening();
    
    // 初始化听力原文功能
    initTranscript();
});

// 标签页切换功能
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 切换按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 切换内容
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// 单词本功能
function initVocabulary() {
    // 加载本地存储的单词
    loadWords();
    
    // 绑定添加单词表单提交事件
    document.getElementById('add-word-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addWord();
    });
    
    // 绑定分类标签筛选事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setFilter(filter);
        });
    });
}

// 加载单词数据
function loadWords() {
    const storedWords = localStorage.getItem('englishWords');
    if (storedWords) {
        words = JSON.parse(storedWords);
    }
    renderWords();
}

// 保存单词数据
function saveWords() {
    localStorage.setItem('englishWords', JSON.stringify(words));
}

// 添加单词
function addWord() {
    const wordInput = document.getElementById('word');
    const phoneticInput = document.getElementById('phonetic');
    const meaningInput = document.getElementById('meaning');
    const partOfSpeechInput = document.getElementById('part-of-speech');
    const tagInput = document.getElementById('tag');
    
    const word = wordInput.value.trim();
    const phonetic = phoneticInput.value.trim();
    const meaning = meaningInput.value.trim();
    const partOfSpeech = partOfSpeechInput.value.trim();
    const tag = tagInput.value;
    
    // 验证输入
    if (!word) {
        showMessage('请输入有效的英文单词', 'error');
        return;
    }
    
    if (!meaning) {
        showMessage('请输入中文释义', 'error');
        return;
    }
    
    // 检查是否为英文单词
    if (!/^[a-zA-Z\s]+$/.test(word)) {
        showMessage('请输入有效的英文单词', 'error');
        return;
    }
    
    // 创建新单词对象
    const newWord = {
        id: Date.now(),
        word: word,
        phonetic: phonetic,
        meaning: meaning,
        partOfSpeech: partOfSpeech,
        tag: tag
    };
    
    // 添加到单词列表
    words.push(newWord);
    
    // 保存到本地存储
    saveWords();
    
    // 清空表单
    wordInput.value = '';
    phoneticInput.value = '';
    meaningInput.value = '';
    partOfSpeechInput.value = '';
    tagInput.value = '未分类';
    
    // 重新渲染单词列表
    renderWords();
    
    // 显示成功消息
    showMessage('单词添加成功', 'success');
}

// 设置筛选条件
function setFilter(filter) {
    currentFilter = filter;
    
    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    
    // 重新渲染单词列表
    renderWords();
}

// 渲染单词列表
function renderWords() {
    const wordList = document.getElementById('word-list');
    const filterCount = document.getElementById('filter-count');
    
    // 筛选单词
    let filteredWords = words;
    if (currentFilter !== 'all') {
        filteredWords = words.filter(word => word.tag === currentFilter);
    }
    
    // 更新筛选计数
    filterCount.textContent = `共 ${filteredWords.length} 个单词`;
    
    // 清空列表
    wordList.innerHTML = '';
    
    // 渲染单词
    filteredWords.forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="word-info">
                <span class="word">${word.word}</span>
                <span class="phonetic">${word.phonetic || ''}</span>
                <span class="part-of-speech">${word.partOfSpeech || ''}</span>
                <div class="meaning">${word.meaning}</div>
            </div>
            <div class="word-actions">
                <button class="play-btn" onclick="playWord('${word.word}')">发音</button>
                <button class="delete-btn" onclick="deleteWord(${word.id})">删除</button>
            </div>
        `;
        wordList.appendChild(li);
    });
}

// 删除单词
function deleteWord(id) {
    if (confirm('确定删除该单词？')) {
        words = words.filter(word => word.id !== id);
        saveWords();
        renderWords();
        showMessage('单词删除成功', 'success');
    }
}

// 播放单词发音
function playWord(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    } else {
        showMessage('浏览器不支持语音合成', 'error');
    }
}

// 听力功能
function initListening() {
    const audioElement = document.getElementById('audio-element');
    const audioUpload = document.getElementById('audio-upload');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const totalTimeDisplay = document.getElementById('total-time');
    const playbackSpeed = document.getElementById('playback-speed');
    const currentSpeedDisplay = document.getElementById('current-speed');
    const loopBtn = document.getElementById('loop-btn');
    
    // 音频上传
    audioUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const audioURL = URL.createObjectURL(file);
            audioElement.src = audioURL;
            
            // 显示音频信息
            document.getElementById('audio-info').innerHTML = `
                <p>文件名：${file.name}</p>
                <p>文件大小：${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            `;
            
            // 重置标记
            audioMarkers = [];
            renderMarkers();
            
            showMessage('音频上传成功', 'success');
        }
    });
    
    // 播放/暂停按钮
    playBtn.addEventListener('click', function() {
        if (audioElement.paused) {
            audioElement.play();
            playBtn.textContent = '暂停';
        } else {
            audioElement.pause();
            playBtn.textContent = '播放';
        }
    });
    
    // 停止按钮
    stopBtn.addEventListener('click', function() {
        audioElement.pause();
        audioElement.currentTime = 0;
        playBtn.textContent = '播放';
    });
    
    // 进度条更新
    audioElement.addEventListener('timeupdate', function() {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.style.width = `${progress}%`;
        
        // 更新时间显示
        currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
        if (audioElement.duration) {
            totalTimeDisplay.textContent = formatTime(audioElement.duration);
        }
    });
    
    // 音频加载完成
    audioElement.addEventListener('loadedmetadata', function() {
        totalTimeDisplay.textContent = formatTime(audioElement.duration);
    });
    
    // 音频播放完毕
    audioElement.addEventListener('ended', function() {
        playBtn.textContent = '播放';
        showMessage('播放完毕', 'success');
    });
    
    // 进度条点击事件
    progressContainer.addEventListener('click', function(e) {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const progress = (clickX / width) * 100;
        const time = (progress / 100) * audioElement.duration;
        
        audioElement.currentTime = time;
    });
    
    // 倍速控制
    playbackSpeed.addEventListener('change', function() {
        const speed = parseFloat(this.value);
        audioElement.playbackRate = speed;
        currentSpeedDisplay.textContent = `当前倍速：${speed}x`;
        showMessage(`倍速已调整为 ${speed}x`, 'success');
    });
    
    // 循环模式
    let isLooping = false;
    loopBtn.addEventListener('click', function() {
        isLooping = !isLooping;
        audioElement.loop = isLooping;
        this.classList.toggle('active');
        showMessage(isLooping ? '循环模式已开启' : '循环模式已关闭', 'success');
    });
    
    // 进度打点
    progressContainer.addEventListener('dblclick', function(e) {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const progress = (clickX / width) * 100;
        const time = (progress / 100) * audioElement.duration;
        
        // 添加标记
        audioMarkers.push({
            id: Date.now(),
            time: time,
            position: progress
        });
        
        renderMarkers();
        showMessage('标记添加成功', 'success');
    });
}

// 渲染音频标记
function renderMarkers() {
    const markersContainer = document.getElementById('progress-markers');
    markersContainer.innerHTML = '';
    
    audioMarkers.forEach(marker => {
        const markerElement = document.createElement('div');
        markerElement.className = 'progress-marker';
        markerElement.style.left = `${marker.position}%`;
        markerElement.title = formatTime(marker.time);
        
        // 点击标记跳转到对应时间
        markerElement.addEventListener('click', function() {
            const audioElement = document.getElementById('audio-element');
            audioElement.currentTime = marker.time;
            audioElement.play();
            document.getElementById('play-btn').textContent = '暂停';
        });
        
        // 右键删除标记
        markerElement.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (confirm('确定删除该标记？')) {
                audioMarkers = audioMarkers.filter(m => m.id !== marker.id);
                renderMarkers();
                showMessage('标记删除成功', 'success');
            }
        });
        
        markersContainer.appendChild(markerElement);
    });
}

// 听力原文功能
function initTranscript() {
    const transcriptInput = document.getElementById('transcript-input');
    const saveTranscriptBtn = document.getElementById('save-transcript-btn');
    const showTranscriptBtn = document.getElementById('show-transcript-btn');
    const transcriptContent = document.getElementById('transcript-content');
    
    // 保存原文
    saveTranscriptBtn.addEventListener('click', function() {
        const transcript = transcriptInput.value.trim();
        if (transcript) {
            currentTranscript = transcript;
            showMessage('原文保存成功', 'success');
        } else {
            showMessage('请输入听力原文', 'error');
        }
    });
    
    // 查看原文
    showTranscriptBtn.addEventListener('click', function() {
        if (currentTranscript) {
            transcriptContent.textContent = currentTranscript;
            transcriptContent.style.display = 'block';
            showMessage('原文已显示', 'success');
        } else {
            showMessage('请先保存听力原文', 'error');
        }
    });
}

// 格式化时间
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 显示消息提示
function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = type;
    
    setTimeout(() => {
        messageElement.className = '';
    }, 3000);
}