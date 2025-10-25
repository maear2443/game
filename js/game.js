// game.js - 게임 엔진 및 상태 관리

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // 캔버스 크기 설정
        this.canvas.width = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
        this.canvas.height = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;

        // 게임 상태 초기화
        this.initializeState();

        // UI 매니저
        this.ui = new UIManager(this);

        // 웨이브 매니저
        this.waveManager = new WaveManager();

        // 입력 처리
        this.setupInput();

        // 게임 루프
        this.lastTime = 0;
        this.running = false;

        // 배치 모드
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoverGridPos = null;
    }

    /**
     * 게임 상태 초기화
     */
    initializeState() {
        this.state = {
            gold: CONFIG.START_GOLD,
            lives: CONFIG.START_LIVES,
            score: 0,
            isPaused: false,
            gameSpeed: 1,
            isGameOver: false,
            isVictory: false,
            towers: [],
            zombies: [],
            projectiles: [],
            wave: {
                current: 0,
                total: CONFIG.TOTAL_WAVES,
                inProgress: false,
                prepTime: 0,
                prepComplete: false,
                progress: 0,
                zombiesLeft: 0
            }
        };
    }

    /**
     * 입력 처리 설정
     */
    setupInput() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelSelection();
        });
    }

    /**
     * 마우스 클릭 처리
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const gridPos = pixelToGrid(x, y, CONFIG.TILE_SIZE);

        // 타워 선택 모드
        if (this.selectedTowerType) {
            this.placeTower(gridPos.x, gridPos.y);
        } else {
            // 기존 타워 선택
            this.selectExistingTower(gridPos.x, gridPos.y);
        }
    }

    /**
     * 마우스 이동 처리
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.hoverGridPos = pixelToGrid(x, y, CONFIG.TILE_SIZE);
    }

    /**
     * 타워 선택
     */
    selectTower(type) {
        this.selectedTowerType = type;
        this.selectedTower = null;
        this.ui.hideTowerInfo();
    }

    /**
     * 타워 배치
     */
    placeTower(gridX, gridY) {
        // 유효성 검사
        if (!this.canPlaceTower(gridX, gridY)) return;

        const towerData = TOWER_DATA[this.selectedTowerType];

        // 골드 확인
        if (this.state.gold < towerData.cost) {
            console.log('골드 부족!');
            return;
        }

        // 타워 생성
        const tower = new Tower(this.selectedTowerType, gridX, gridY);
        this.state.towers.push(tower);
        this.state.gold -= towerData.cost;

        // 선택 취소
        this.selectedTowerType = null;
        this.ui.updateTowerButtons();
    }

    /**
     * 타워 배치 가능 여부 확인
     */
    canPlaceTower(gridX, gridY) {
        // 그리드 범위 확인
        if (gridX < 0 || gridX >= CONFIG.GRID_WIDTH || gridY < 0 || gridY >= CONFIG.GRID_HEIGHT) {
            return false;
        }

        // 경로 확인
        if (this.isOnPath(gridX, gridY)) {
            return false;
        }

        // 다른 타워 확인
        if (this.state.towers.some(t => t.gridX === gridX && t.gridY === gridY)) {
            return false;
        }

        return true;
    }

    /**
     * 경로 위치 확인
     */
    isOnPath(gridX, gridY) {
        // 경로의 각 세그먼트 확인
        for (let i = 0; i < PATH.length - 1; i++) {
            const p1 = PATH[i];
            const p2 = PATH[i + 1];

            // 수평 경로
            if (p1.y === p2.y && gridY === p1.y) {
                const minX = Math.min(p1.x, p2.x);
                const maxX = Math.max(p1.x, p2.x);
                if (gridX >= minX && gridX <= maxX) return true;
            }

            // 수직 경로
            if (p1.x === p2.x && gridX === p1.x) {
                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);
                if (gridY >= minY && gridY <= maxY) return true;
            }
        }

        return false;
    }

    /**
     * 기존 타워 선택
     */
    selectExistingTower(gridX, gridY) {
        const tower = this.state.towers.find(t => t.gridX === gridX && t.gridY === gridY);

        if (tower) {
            this.selectedTower = tower;
            this.state.towers.forEach(t => t.selected = false);
            tower.selected = true;
            this.ui.showTowerInfo(tower);
        } else {
            this.selectedTower = null;
            this.state.towers.forEach(t => t.selected = false);
            this.ui.hideTowerInfo();
        }
    }

    /**
     * 선택 취소
     */
    cancelSelection() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.state.towers.forEach(t => t.selected = false);
        this.ui.hideTowerInfo();
        this.ui.updateTowerButtons();
    }

    /**
     * 타워 업그레이드
     */
    upgradeTower() {
        if (!this.selectedTower) return;

        const upgradeCost = this.selectedTower.getUpgradeCost();
        if (!upgradeCost || this.state.gold < upgradeCost) return;

        this.selectedTower.upgrade();
        this.state.gold -= upgradeCost;

        this.ui.showTowerInfo(this.selectedTower);
    }

    /**
     * 타워 판매
     */
    sellTower() {
        if (!this.selectedTower) return;

        const sellValue = this.selectedTower.getSellValue();
        this.state.gold += sellValue;

        this.state.towers = this.state.towers.filter(t => t.id !== this.selectedTower.id);
        this.selectedTower = null;

        this.ui.hideTowerInfo();
    }

    /**
     * 웨이브 시작
     */
    startWave() {
        if (this.waveManager.startNextWave()) {
            this.ui.showWaveAnnouncement(this.waveManager.currentWave);
        }
    }

    /**
     * 일시정지 토글
     */
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
    }

    /**
     * 배속 변경
     */
    changeSpeed() {
        const speeds = [1, 2, 3];
        const currentIndex = speeds.indexOf(this.state.gameSpeed);
        this.state.gameSpeed = speeds[(currentIndex + 1) % speeds.length];
    }

    /**
     * 재시작
     */
    restart() {
        this.initializeState();
        this.waveManager.reset();
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.ui.hideGameOver();
        this.ui.hideTowerInfo();
    }

    /**
     * 게임 업데이트
     */
    update(deltaTime) {
        if (this.state.isPaused || this.state.isGameOver) return;

        // 게임 속도 적용
        deltaTime *= this.state.gameSpeed;

        // 웨이브 업데이트
        const zombieType = this.waveManager.update(deltaTime);
        if (zombieType) {
            this.spawnZombie(zombieType);
        }

        // 타워 업데이트
        this.state.towers.forEach(tower => {
            const projectile = tower.update(deltaTime, this.state.zombies);
            if (projectile) {
                this.state.projectiles.push(projectile);
            }
        });

        // 좀비 업데이트
        this.state.zombies = this.state.zombies.filter(zombie => {
            const alive = zombie.update(deltaTime);

            // 기지 도달 체크
            if (zombie.hasReachedBase()) {
                this.state.lives--;
                if (this.state.lives <= 0) {
                    this.gameOver(false);
                }
                return false;
            }

            return alive;
        });

        // 발사체 업데이트
        this.state.projectiles = this.state.projectiles.filter(projectile => {
            return projectile.update(deltaTime, this.state.zombies);
        });

        // 죽은 좀비 처리
        this.state.zombies = this.state.zombies.filter(zombie => {
            if (zombie.hp <= 0) {
                this.state.gold += zombie.reward;
                this.state.score += zombie.reward * 10;
                return false;
            }
            return true;
        });

        // 웨이브 완료 체크
        if (this.waveManager.checkWaveComplete(this.state.zombies.length)) {
            if (this.waveManager.currentWave >= CONFIG.TOTAL_WAVES) {
                this.gameOver(true);
            }
        }

        // 웨이브 정보 업데이트
        const waveInfo = this.waveManager.getWaveInfo();
        this.state.wave = waveInfo;
    }

    /**
     * 좀비 스폰
     */
    spawnZombie(type) {
        const zombie = new Zombie(type, PATH);
        this.state.zombies.push(zombie);
    }

    /**
     * 게임 오버
     */
    gameOver(victory) {
        this.state.isGameOver = true;
        this.state.isVictory = victory;
        this.ui.showGameOver(victory, this.state.score, this.waveManager.currentWave);
    }

    /**
     * 게임 렌더링
     */
    render() {
        // 배경
        this.ctx.fillStyle = '#2d4a3e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드
        this.renderGrid();

        // 경로
        this.renderPath();

        // 배치 가능 영역 표시
        if (this.selectedTowerType && this.hoverGridPos) {
            this.renderPlacementPreview();
        }

        // 타워
        this.state.towers.forEach(tower => tower.render(this.ctx));

        // 좀비
        this.state.zombies.forEach(zombie => zombie.render(this.ctx));

        // 발사체
        this.state.projectiles.forEach(projectile => projectile.render(this.ctx));

        // UI 업데이트
        this.ui.update(this.state);
    }

    /**
     * 그리드 렌더링
     */
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= CONFIG.GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.TILE_SIZE, 0);
            this.ctx.lineTo(x * CONFIG.TILE_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= CONFIG.GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.TILE_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.TILE_SIZE);
            this.ctx.stroke();
        }
    }

    /**
     * 경로 렌더링
     */
    renderPath() {
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = CONFIG.TILE_SIZE * 0.8;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const firstPos = gridToPixel(PATH[0].x, PATH[0].y, CONFIG.TILE_SIZE);
        this.ctx.moveTo(firstPos.x, firstPos.y);

        for (let i = 1; i < PATH.length; i++) {
            const pos = gridToPixel(PATH[i].x, PATH[i].y, CONFIG.TILE_SIZE);
            this.ctx.lineTo(pos.x, pos.y);
        }

        this.ctx.stroke();

        // 스폰 지점 표시
        this.ctx.fillStyle = '#f00';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🚪', firstPos.x, firstPos.y);

        // 기지 표시
        const lastPos = gridToPixel(PATH[PATH.length - 1].x, PATH[PATH.length - 1].y, CONFIG.TILE_SIZE);
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillText('🏠', lastPos.x, lastPos.y);
    }

    /**
     * 배치 미리보기 렌더링
     */
    renderPlacementPreview() {
        const { x, y } = this.hoverGridPos;
        const canPlace = this.canPlaceTower(x, y);
        const pos = gridToPixel(x, y, CONFIG.TILE_SIZE);

        // 타일 하이라이트
        this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

        if (canPlace) {
            // 사거리 미리보기
            const towerData = TOWER_DATA[this.selectedTowerType];
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, towerData.range * CONFIG.TILE_SIZE, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 타워 아이콘 미리보기
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillText(towerData.icon, pos.x, pos.y);
            this.ctx.globalAlpha = 1;
        }
    }

    /**
     * 게임 시작
     */
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    /**
     * 게임 루프
     */
    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}
