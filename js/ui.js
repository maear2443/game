// ui.js - UI 관리 시스템

class UIManager {
    constructor(game) {
        this.game = game;

        // UI 요소 참조
        this.goldDisplay = document.getElementById('gold-display');
        this.livesDisplay = document.getElementById('lives-display');
        this.waveDisplay = document.getElementById('wave-display');
        this.zombiesDisplay = document.getElementById('zombies-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.waveAnnouncement = document.getElementById('wave-announcement');

        // 타워 버튼
        this.towerButtons = document.querySelectorAll('.tower-button');

        // 컨트롤 버튼
        this.startWaveBtn = document.getElementById('start-wave-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.speedBtn = document.getElementById('speed-btn');
        this.restartBtn = document.getElementById('restart-btn');

        // 타워 정보 패널
        this.towerInfoPanel = document.getElementById('tower-info-panel');
        this.towerInfoContent = document.getElementById('tower-info-content');
        this.upgradeBtn = document.getElementById('upgrade-btn');
        this.sellBtn = document.getElementById('sell-btn');
        this.closeInfoBtn = document.getElementById('close-info-btn');

        // 게임 오버 패널
        this.gameOverPanel = document.getElementById('game-over-panel');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.restartGameBtn = document.getElementById('restart-game-btn');

        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 타워 선택
        this.towerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.game.selectTower(type);
                this.updateTowerButtons();
            });
        });

        // 컨트롤 버튼
        this.startWaveBtn.addEventListener('click', () => this.game.startWave());
        this.pauseBtn.addEventListener('click', () => this.game.togglePause());
        this.speedBtn.addEventListener('click', () => this.game.changeSpeed());
        this.restartBtn.addEventListener('click', () => this.game.restart());

        // 타워 정보 패널
        this.upgradeBtn.addEventListener('click', () => this.game.upgradeTower());
        this.sellBtn.addEventListener('click', () => this.game.sellTower());
        this.closeInfoBtn.addEventListener('click', () => this.hideTowerInfo());

        // 게임 오버
        this.restartGameBtn.addEventListener('click', () => {
            this.hideGameOver();
            this.game.restart();
        });
    }

    /**
     * 게임 상태 업데이트
     */
    update(state) {
        this.goldDisplay.textContent = formatNumber(state.gold);
        this.livesDisplay.textContent = state.lives;
        this.waveDisplay.textContent = `${state.wave.current}/${state.wave.total}`;

        // 남은 적 수 (스폰 대기 + 활성 좀비)
        const totalEnemies = state.wave.zombiesLeft + state.activeZombies;
        this.zombiesDisplay.textContent = totalEnemies;

        this.scoreDisplay.textContent = formatNumber(state.score);

        // 웨이브 버튼 상태
        if (state.wave.inProgress) {
            this.startWaveBtn.disabled = true;
            const progress = Math.floor(state.wave.progress);
            this.startWaveBtn.textContent = `⏳ 진행중 (${progress}%)`;
        } else if (state.wave.prepComplete) {
            this.startWaveBtn.disabled = false;
            if (state.wave.current === 0) {
                this.startWaveBtn.textContent = '▶️ 게임 시작!';
            } else {
                this.startWaveBtn.textContent = `▶️ 웨이브 ${state.wave.current + 1} 시작`;
            }
        } else {
            this.startWaveBtn.disabled = true;
            const timeLeft = Math.ceil(state.wave.prepTime);
            this.startWaveBtn.textContent = `⏳ 준비중 ${timeLeft}초`;
        }

        // 일시정지 버튼
        this.pauseBtn.textContent = state.isPaused ? '▶️ 재개' : '⏸️ 일시정지';

        // 배속 버튼
        this.speedBtn.textContent = `⏩ 배속 (${state.gameSpeed}x)`;

        // 타워 버튼 업데이트
        this.updateTowerButtons();
    }

    /**
     * 타워 버튼 상태 업데이트
     */
    updateTowerButtons() {
        this.towerButtons.forEach(btn => {
            const type = btn.dataset.type;
            const cost = TOWER_DATA[type].cost;
            const canAfford = this.game.state.gold >= cost;

            btn.classList.toggle('disabled', !canAfford);
            btn.classList.toggle('selected', this.game.selectedTowerType === type);
        });
    }

    /**
     * 웨이브 시작 알림
     */
    showWaveAnnouncement(waveNum) {
        this.waveAnnouncement.textContent = `🌊 웨이브 ${waveNum}`;
        this.waveAnnouncement.classList.add('show');

        setTimeout(() => {
            this.waveAnnouncement.classList.remove('show');
        }, 2000);
    }

    /**
     * 타워 정보 표시
     */
    showTowerInfo(tower) {
        const upgradeCost = tower.getUpgradeCost();
        const sellValue = tower.getSellValue();

        let upgradeText = '';
        if (tower.level >= 3) {
            upgradeText = '<p style="color: #ffd700;">⭐ 최대 레벨</p>';
        } else {
            upgradeText = `
                <p>업그레이드 비용: <span style="color: #90ee90;">💰 ${upgradeCost}</span></p>
                <p>⚔️ 데미지: ${tower.damage} → ${Math.floor(tower.damage * 1.5)}</p>
                <p>📏 사거리: ${tower.range} → ${tower.range + 1}</p>
            `;
        }

        this.towerInfoContent.innerHTML = `
            <h4>${tower.icon} ${tower.name} (레벨 ${tower.level})</h4>
            <p>⚔️ 데미지: ${tower.damage}</p>
            <p>📏 사거리: ${tower.range}</p>
            <p>⚡ 공격속도: ${tower.attackSpeed}초</p>
            <hr style="border-color: #53a8b6; margin: 10px 0;">
            ${upgradeText}
            <p>판매 가격: <span style="color: #ffd700;">💰 ${sellValue}</span></p>
        `;

        this.upgradeBtn.disabled = tower.level >= 3 || this.game.state.gold < upgradeCost;
        this.towerInfoPanel.classList.remove('hidden');
    }

    /**
     * 타워 정보 숨기기
     */
    hideTowerInfo() {
        this.towerInfoPanel.classList.add('hidden');
    }

    /**
     * 게임 오버 표시
     */
    showGameOver(victory, score, wave) {
        if (victory) {
            this.gameOverTitle.textContent = '🎉 승리!';
            this.gameOverMessage.innerHTML = `
                <p>모든 웨이브를 클리어했습니다!</p>
                <p>최종 점수: <strong>${formatNumber(score)}</strong></p>
                <p>도달 웨이브: ${wave}/${CONFIG.TOTAL_WAVES}</p>
            `;
        } else {
            this.gameOverTitle.textContent = '💀 패배';
            this.gameOverMessage.innerHTML = `
                <p>기지가 파괴되었습니다...</p>
                <p>최종 점수: <strong>${formatNumber(score)}</strong></p>
                <p>도달 웨이브: ${wave}/${CONFIG.TOTAL_WAVES}</p>
            `;
        }

        this.gameOverPanel.classList.remove('hidden');
    }

    /**
     * 게임 오버 숨기기
     */
    hideGameOver() {
        this.gameOverPanel.classList.add('hidden');
    }

    /**
     * 툴팁 표시 (캔버스 상)
     */
    showTooltip(ctx, text, x, y) {
        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const padding = 8;
        const metrics = ctx.measureText(text);
        const width = metrics.width + padding * 2;
        const height = 20;

        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x - width / 2, y - height, width, height);

        // 테두리
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width / 2, y - height, width, height);

        // 텍스트
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y - 3);

        ctx.restore();
    }
}
