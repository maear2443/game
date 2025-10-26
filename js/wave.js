// wave.js - 웨이브 관리 시스템

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.waveInProgress = false;
        this.prepTime = 0;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.zombiesSpawned = 0;
        this.zombiesToSpawn = 0;
    }

    /**
     * 다음 웨이브 시작
     */
    startNextWave() {
        if (this.waveInProgress) return false;

        this.currentWave++;
        this.waveInProgress = true;
        this.prepTime = 0;

        // 웨이브 구성 생성
        this.generateWave();

        return true;
    }

    /**
     * 웨이브 구성 생성
     */
    generateWave() {
        this.spawnQueue = [];
        this.zombiesSpawned = 0;

        const wave = this.currentWave;

        // 기본 좀비
        const basicCount = 10 + wave * 2;
        for (let i = 0; i < basicCount; i++) {
            this.spawnQueue.push('basic');
        }

        // 빠른 좀비 (웨이브 1부터)
        const fastCount = Math.max(0, wave * 1);
        for (let i = 0; i < fastCount; i++) {
            this.spawnQueue.push('fast');
        }

        // 탱크 좀비 (웨이브 3부터)
        const tankCount = Math.floor(wave / 3);
        for (let i = 0; i < tankCount; i++) {
            this.spawnQueue.push('tank');
        }

        // 보스 좀비 (5웨이브마다)
        if (wave % 5 === 0) {
            this.spawnQueue.push('boss');
        }

        // 랜덤 섞기
        this.shuffleArray(this.spawnQueue);

        this.zombiesToSpawn = this.spawnQueue.length;
        this.spawnTimer = 0;
    }

    /**
     * 배열 섞기
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * 스폰 간격 계산
     */
    getSpawnInterval() {
        return Math.max(0.5, 2 - (this.currentWave * 0.05));
    }

    /**
     * 웨이브 업데이트
     */
    update(deltaTime) {
        if (!this.waveInProgress) {
            // 준비 시간
            this.prepTime += deltaTime;
            return null;
        }

        // 좀비 스폰
        if (this.spawnQueue.length > 0) {
            this.spawnTimer += deltaTime;
            const spawnInterval = this.getSpawnInterval();

            if (this.spawnTimer >= spawnInterval) {
                this.spawnTimer = 0;
                const type = this.spawnQueue.shift();
                this.zombiesSpawned++;
                return type;
            }
        }

        return null;
    }

    /**
     * 웨이브 완료 체크
     */
    checkWaveComplete(activeZombies) {
        if (this.waveInProgress && this.spawnQueue.length === 0 && activeZombies === 0) {
            this.waveInProgress = false;
            this.prepTime = 0;
            return true;
        }
        return false;
    }

    /**
     * 준비 시간 남은 시간
     */
    getPrepTimeRemaining() {
        return Math.max(0, CONFIG.WAVE_PREP_TIME - this.prepTime);
    }

    /**
     * 준비 완료 여부
     */
    isPrepComplete() {
        // 첫 웨이브는 바로 시작 가능
        if (this.currentWave === 0) return true;
        return this.prepTime >= CONFIG.WAVE_PREP_TIME;
    }

    /**
     * 웨이브 진행도
     */
    getWaveProgress() {
        if (this.zombiesToSpawn === 0) return 0;
        return (this.zombiesSpawned / this.zombiesToSpawn) * 100;
    }

    /**
     * 현재 웨이브 정보
     */
    getWaveInfo() {
        return {
            current: this.currentWave,
            total: CONFIG.TOTAL_WAVES,
            inProgress: this.waveInProgress,
            prepTime: this.getPrepTimeRemaining(),
            prepComplete: this.isPrepComplete(),
            progress: this.getWaveProgress(),
            zombiesLeft: this.spawnQueue.length
        };
    }

    /**
     * 리셋
     */
    reset() {
        this.currentWave = 0;
        this.waveInProgress = false;
        this.prepTime = 0;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.zombiesSpawned = 0;
        this.zombiesToSpawn = 0;
    }
}
