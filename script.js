        // Global variables
        let vocabulary = [];
        let currentCard = 0;
        let isFlipped = false;
        let mode = 'learn'; // 'learn' or 'test'
        let testScore = 0;
        let testTotal = 0;
        let mistakes = [];
        let testDirection = 'both'; // 'both' | 'en_to_vi' | 'vi_to_en'
        let lastQuestionWasEnglish = true;
        
        // Load data from memory (since we can't use localStorage)
        let userData = {
            totalSessions: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            wordDifficulty: {}
        };

        // Tab management
        function showTab(buttonEl, tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active from all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            if (buttonEl) {
                buttonEl.classList.add('active');
            }
            
            if (tabName === 'stats') {
                updateStats();
            }
        }

        // File upload handling
        document.getElementById('fileInput').addEventListener('change', handleFileUpload);
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleDrop);

        function handleDragOver(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        }

        function handleDrop(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFile(files[0]);
            }
        }

        function handleFileUpload(e) {
            const file = e.target.files[0];
            if (file) {
                processFile(file);
            }
        }

        function processFile(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                parseVocabulary(content);
                displayUploadedWords();
                updateStats();
                
                document.getElementById('uploadStatus').innerHTML = 
                    `<div style="color: green; margin-top: 20px;">
                        ✅ Đã tải lên thành công ${vocabulary.length} từ vựng!
                    </div>`;
            };
            reader.readAsText(file, 'utf-8');
        }

        function parseVocabulary(content) {
            const lines = content.split('\n');
            vocabulary = [];
            
            lines.forEach(line => {
                line = line.trim();
                if (line) {
                    const parts = line.split('    '); // 4 spaces
                    if (parts.length >= 2) {
                        const word = {
                            english: parts[0].trim(),
                            vietnamese: parts.slice(1).join('    ').trim(),
                            difficulty: userData.wordDifficulty[parts[0].trim()] || 'medium',
                            attempts: 0,
                            correct: 0
                        };
                        vocabulary.push(word);
                    }
                }
            });
        }

        function displayUploadedWords() {
            const container = document.getElementById('uploadedWords');
            container.style.display = 'block';
            container.innerHTML = '<h3>Từ vựng đã tải lên:</h3>';
            
            vocabulary.forEach((word, index) => {
                const wordItem = document.createElement('div');
                wordItem.className = 'word-item';
                wordItem.innerHTML = `
                    <div>
                        <strong>${word.english}</strong> - ${word.vietnamese}
                    </div>
                    <div class="difficulty-indicator ${word.difficulty}"></div>
                `;
                container.appendChild(wordItem);
            });
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', performSearch);

        function performSearch() {
            const query = document.getElementById('searchInput').value.toLowerCase().trim();
            const results = document.getElementById('searchResults');
            
            if (query === '') {
                results.innerHTML = '';
                return;
            }
            
            const matches = vocabulary.filter(word => 
                word.english.toLowerCase().includes(query) || 
                word.vietnamese.toLowerCase().includes(query)
            );
            
            if (matches.length === 0) {
                results.innerHTML = '<div class="search-result">Không tìm thấy từ nào phù hợp.</div>';
                return;
            }
            
            results.innerHTML = matches.map(word => `
                <div class="search-result">
                    <h3>${word.english}</h3>
                    <p>${word.vietnamese}</p>
                    <small>Độ khó: <span class="difficulty-indicator ${word.difficulty}" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: 5px;"></span></small>
                </div>
            `).join('');
        }

        // Learning mode
        function startLearning() {
            if (vocabulary.length === 0) {
                alert('Vui lòng tải lên file từ vựng trước!');
                return;
            }
            
            mode = 'learn';
            currentCard = 0;
            shuffleCards();
            document.getElementById('learnCard').style.display = 'block';
            document.getElementById('learnControls').style.display = 'block';
            showCard();
            userData.totalSessions++;
        }

        function shuffleCards() {
            // Prioritize difficult words
            const difficultWords = vocabulary.filter(w => w.difficulty === 'hard');
            const mediumWords = vocabulary.filter(w => w.difficulty === 'medium');
            const easyWords = vocabulary.filter(w => w.difficulty === 'easy');
            
            // Shuffle each group
            shuffle(difficultWords);
            shuffle(mediumWords);
            shuffle(easyWords);
            
            // Combine with priority to difficult words
            vocabulary = [...difficultWords, ...mediumWords, ...easyWords];
        }

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function showCard() {
            if (currentCard >= vocabulary.length) {
                endLearningSession();
                return;
            }
            
            const word = vocabulary[currentCard];
            document.getElementById('learnFront').textContent = word.english;
            document.getElementById('learnBack').textContent = word.vietnamese;
            
            // Reset flip state
            const card = document.getElementById('learnCard');
            card.classList.remove('flipped');
            isFlipped = false;
            
            updateProgress('learn');
        }

        function endLearningSession() {
            const learnCardEl = document.getElementById('learnCard');
            const learnControlsEl = document.getElementById('learnControls');
            if (learnCardEl) learnCardEl.style.display = 'none';
            if (learnControlsEl) learnControlsEl.style.display = 'none';
            const learnResultEl = document.getElementById('learnResult');
            if (learnResultEl) {
                learnResultEl.innerHTML = '🎉 Bạn đã hoàn thành phiên học. Hãy bấm "Bắt đầu học" để học lại hoặc chuyển tab khác.';
            }
            currentCard = 0;
            isFlipped = false;
            updateProgress('learn');
        }

        function flipCard(cardId) {
            const card = document.getElementById(cardId);
            card.classList.toggle('flipped');
            isFlipped = card.classList.contains('flipped');
        }

        function markDifficulty(level) {
            const word = vocabulary[currentCard];
            word.difficulty = level;
            userData.wordDifficulty[word.english] = level;
            nextCard();
        }

        function markEasy() { markDifficulty('easy'); }
        function markMedium() { markDifficulty('medium'); }
        function markDifficult() { markDifficulty('hard'); }

        function nextCard() {
            const card = document.getElementById('learnCard');
            if (card) card.classList.remove('flipped');
            isFlipped = false;
            currentCard++;
            showCard();
        }

        // Test mode
        function startTest() {
            if (vocabulary.length === 0) {
                alert('Vui lòng tải lên file từ vựng trước!');
                return;
            }
            
            mode = 'test';
            currentCard = 0;
            testScore = 0;
            testTotal = 0;
            mistakes = [];
            shuffleCards();
            document.getElementById('testCard').style.display = 'block';
            document.getElementById('testControls').style.display = 'block';
            // Ensure card is not flipped before first question
            const card = document.getElementById('testCard');
            if (card) card.classList.remove('flipped');
            isFlipped = false;
            showTestCard();
        }

        function showTestCard() {
            if (currentCard >= vocabulary.length) {
                showTestResults();
                return;
            }
            
            const word = vocabulary[currentCard];
            // Determine direction
            let isEnglishToVietnamese = true;
            if (testDirection === 'both') {
                isEnglishToVietnamese = Math.random() > 0.5;
            } else if (testDirection === 'en_to_vi') {
                isEnglishToVietnamese = true;
            } else if (testDirection === 'vi_to_en') {
                isEnglishToVietnamese = false;
            }
            lastQuestionWasEnglish = isEnglishToVietnamese;
            
            if (isEnglishToVietnamese) {
                document.getElementById('testQuestion').textContent = word.english;
                document.getElementById('testAnswer').textContent = word.vietnamese;
            } else {
                document.getElementById('testQuestion').textContent = word.vietnamese;
                document.getElementById('testAnswer').textContent = word.english;
            }
            
            document.getElementById('userAnswer').value = '';
            document.getElementById('testResult').innerHTML = '';
            
            // Reset card state
            const card = document.getElementById('testCard');
            card.classList.remove('flipped');
            isFlipped = false;
            
            updateProgress('test');
        }

        function checkAnswer() {
            const userAnswerRaw = document.getElementById('userAnswer').value.trim();
            const userAnswer = userAnswerRaw.toLowerCase();
            const correctAnswer = document.getElementById('testAnswer').textContent.toLowerCase();
            const word = vocabulary[currentCard];
            
            word.attempts++;
            testTotal++;
            userData.totalAnswers++;
            
            // Avoid empty input being counted as correct
            let isCorrect = false;
            if (userAnswer.length > 0) {
                // Normalize multiple possible answers by splitting on ';' or ','
                const correctParts = correctAnswer.split(/[,;]/).map(s => s.trim());
                isCorrect = correctParts.some(part => part === userAnswer || part.includes(userAnswer) || userAnswer.includes(part));
            }
            
            if (isCorrect) {
                word.correct++;
                testScore++;
                userData.correctAnswers++;
                document.getElementById('testResult').innerHTML = 
                    '<div style="color: green;">Correct!</div>';
                playFeedbackTone(true);
            } else {
                mistakes.push(word);
                document.getElementById('testResult').innerHTML = 
                    `<div style="color: red;">Wrong! The correct answer is: <strong>${document.getElementById('testAnswer').textContent}</strong></div>`;
                playFeedbackTone(false);
            }
        }

        function showAnswer() {
            const card = document.getElementById('testCard');
            // Only flip if not already flipped
            if (card && !card.classList.contains('flipped')) {
                card.classList.add('flipped');
                isFlipped = true;
            }
        }

        function nextTestCard() {
            const card = document.getElementById('testCard');
            if (card && card.classList.contains('flipped')) {
                card.classList.remove('flipped');
            }
            isFlipped = false;
            currentCard++;
            showTestCard();
        }

        function showTestResults() {
            const percentage = testTotal > 0 ? Math.round((testScore / testTotal) * 100) : 0;
            const summary = `Kết quả kiểm tra: Đúng ${testScore}/${testTotal} (${percentage}%). Có ${mistakes.length} từ cần ôn lại.`;
            const resultEl = document.getElementById('testResult');
            if (resultEl) {
                resultEl.innerHTML = `<div style="margin-top:10px;">${summary}</div>`;
            }
            document.getElementById('testCard').style.display = 'none';
            document.getElementById('testControls').style.display = 'none';
            updateStats();
            if (resultEl) {
                const actions = document.createElement('div');
                actions.style.marginTop = '10px';
                actions.innerHTML = `
                    <button class="control-btn btn-primary" onclick="startTest()">Làm lại bài kiểm tra</button>
                    <button class="control-btn btn-secondary" onclick="reviewMistakes()">Ôn lại lỗi</button>
                `;
                resultEl.appendChild(actions);
            }
            currentCard = 0;
            isFlipped = false;
        }

        function reviewMistakes() {
            if (mistakes.length === 0) {
                alert('Không có từ nào cần ôn lại!');
                return;
            }
            
            vocabulary = [...mistakes];
            startLearning();
        }

        // Pronunciation (Text-to-Speech)
        function playPronunciation() {
            if (!('speechSynthesis' in window)) {
                alert('Trình duyệt không hỗ trợ đọc văn bản (TTS).');
                return;
            }
            if (vocabulary.length === 0) return;
            if (currentCard < 0 || currentCard >= vocabulary.length) return;
            const englishText = vocabulary[currentCard].english;
            if (!englishText) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(englishText);
            utterance.lang = 'en-US';
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            // Prefer a native English voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('google'))
                || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
            if (preferred) utterance.voice = preferred;
            window.speechSynthesis.speak(utterance);
        }

        // Feedback tone for correct/incorrect
        function playFeedbackTone(isCorrect) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();

                const master = ctx.createGain();
                master.gain.value = 0.35; // increased overall volume
                master.connect(ctx.destination);

                function playNote(frequency, startTime, duration, type) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(frequency, startTime);
                    // Simple pluck envelope (louder peak)
                    gain.gain.setValueAtTime(0.0001, startTime);
                    gain.gain.exponentialRampToValueAtTime(1.5, startTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                    osc.connect(gain).connect(master);
                    osc.start(startTime);
                    osc.stop(startTime + duration + 0.02);
                }

                const now = ctx.currentTime;
                if (isCorrect) {
                    // Pleasant ascending arpeggio (E5, G#5, B5)
                    playNote(659.25, now + 0.00, 0.12, 'triangle');
                    playNote(830.61, now + 0.12, 0.12, 'triangle');
                    playNote(987.77, now + 0.24, 0.20, 'triangle');
                } else {
                    // Soft descending buzzer (G4 -> E4 -> C4)
                    playNote(392.00, now + 0.00, 0.15, 'square');
                    playNote(329.63, now + 0.12, 0.15, 'square');
                    playNote(261.63, now + 0.24, 0.18, 'square');
                }

                // Close context a bit later to free resources
                setTimeout(() => { try { ctx.close(); } catch (_) {} }, 600);
            } catch (e) {
                // ignore sound errors
            }
        }

        // Set test direction from UI
        function setTestDirection(value) {
            if (value === 'both' || value === 'en_to_vi' || value === 'vi_to_en') {
                testDirection = value;
            }
        }

        // Progress tracking
        function updateProgress(mode) {
            const progressBar = document.getElementById(mode + 'Progress');
            const progress = ((currentCard + 1) / vocabulary.length) * 100;
            progressBar.style.width = progress + '%';
        }

        // Statistics
        function updateStats() {
            document.getElementById('totalWords').textContent = vocabulary.length;
            document.getElementById('learnedWords').textContent = 
                vocabulary.filter(w => w.attempts > 0).length;
            
            const correctRate = userData.totalAnswers > 0 ? 
                Math.round((userData.correctAnswers / userData.totalAnswers) * 100) : 0;
            document.getElementById('correctRate').textContent = correctRate + '%';
            document.getElementById('studySessions').textContent = userData.totalSessions;
            
            updateWordsByDifficulty();
        }

        function updateWordsByDifficulty() {
            const container = document.getElementById('wordsByDifficulty');
            container.innerHTML = '';
            
            const groups = {
                hard: vocabulary.filter(w => w.difficulty === 'hard'),
                medium: vocabulary.filter(w => w.difficulty === 'medium'),
                easy: vocabulary.filter(w => w.difficulty === 'easy')
            };
            
            Object.entries(groups).forEach(([difficulty, words]) => {
                if (words.length > 0) {
                    const header = document.createElement('h4');
                    header.textContent = `${difficulty === 'hard' ? 'Khó' : difficulty === 'medium' ? 'Trung bình' : 'Dễ'} (${words.length} từ)`;
                    header.style.margin = '20px 0 10px 0';
                    container.appendChild(header);
                    
                    words.forEach(word => {
                        const item = document.createElement('div');
                        item.className = 'word-item';
                        item.innerHTML = `
                            <div>
                                <strong>${word.english}</strong> - ${word.vietnamese}
                                ${word.attempts > 0 ? `<small>(${word.correct}/${word.attempts})</small>` : ''}
                            </div>
                            <div class="difficulty-indicator ${word.difficulty}"></div>
                        `;
                        container.appendChild(item);
                    });
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            updateStats();
        });
