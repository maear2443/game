// zombie.js - 좀비 클래스

class Zombie {
    constructor(type, path) {
        this.id = generateId();
        this.type = type;

        // 좀비 데이터 로드
        const data = ZOMBIE_DATA[type];
        this.name = data.name;
        this.icon = data.icon;
        this.maxHp = data.maxHp;
        this.hp = data.maxHp;
        this.baseSpeed = data.speed;
        this.speed = data.speed;
        this.reward = data.reward;
        this.color = data.color;
        this.size = data.size;

        // 경로 및 이동
        this.path = path;
        this.pathIndex = 0;
        this.progress = 0; // 현재 세그먼트 내 진행도 (0-1)

        // 시작 위치
        const startPos = gridToPixel(path[0].x, path[0].y, CONFIG.TILE_SIZE);
        this.x = startPos.x;
        this.y = startPos.y;

        // 효과
        this.effects = [];

        // 애니메이션
        this.walkCycle = 0;
        this.flashEffect = 0;
    }

    /**
     * 좀비 업데이트 (매 프레임)
     */
    update(deltaTime) {
        // 사망 체크
        if (this.hp <= 0) {
            return false;
        }

        // 효과 업데이트
        this.updateEffects(deltaTime);

        // 속도 계산 (효과 적용)
        let currentSpeed = this.baseSpeed;
        const slowEffect = this.effects.find(e => e.type === 'slow');
        if (slowEffect) {
            currentSpeed *= (1 - slowEffect.percent);
        }

        // 이동
        this.move(deltaTime, currentSpeed);

        // 애니메이션 업데이트
        this.walkCycle += deltaTime * currentSpeed * 5;
        if (this.flashEffect > 0) {
            this.flashEffect -= deltaTime * 5;
        }

        return true;
    }

    /**
     * 경로를 따라 이동
     */
    move(deltaTime, speed) {
        if (this.pathIndex >= this.path.length - 1) {
            return; // 도착
        }

        const currentPoint = this.path[this.pathIndex];
        const nextPoint = this.path[this.pathIndex + 1];

        const currentPos = gridToPixel(currentPoint.x, currentPoint.y, CONFIG.TILE_SIZE);
        const nextPos = gridToPixel(nextPoint.x, nextPoint.y, CONFIG.TILE_SIZE);

        // 세그먼트 진행
        const segmentLength = distance(currentPos, nextPos);
        const moveDistance = speed * CONFIG.TILE_SIZE * deltaTime;
        this.progress += moveDistance / segmentLength;

        if (this.progress >= 1) {
            this.progress = 0;
            this.pathIndex++;

            if (this.pathIndex >= this.path.length - 1) {
                // 마지막 지점 도달
                this.x = nextPos.x;
                this.y = nextPos.y;
                return;
            }
        }

        // 선형 보간으로 위치 계산
        this.x = lerp(currentPos.x, nextPos.x, this.progress);
        this.y = lerp(currentPos.y, nextPos.y, this.progress);
    }

    /**
     * 효과 업데이트
     */
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.duration -= deltaTime;
            return effect.duration > 0;
        });
    }

    /**
     * 데미지 받기
     */
    takeDamage(damage) {
        this.hp -= damage;
        this.flashEffect = 1;

        if (this.hp < 0) {
            this.hp = 0;
        }

        return this.hp <= 0;
    }

    /**
     * 효과 추가
     */
    addEffect(type, params) {
        // 기존 동일 효과 제거
        this.effects = this.effects.filter(e => e.type !== type);

        // 새 효과 추가
        this.effects.push({
            type: type,
            ...params
        });
    }

    /**
     * 기지에 도달했는지 확인
     */
    hasReachedBase() {
        return this.pathIndex >= this.path.length - 1 && this.hp > 0;
    }

    /**
     * HP 퍼센트 계산
     */
    getHpPercent() {
        return this.hp / this.maxHp;
    }

    /**
     * 좀비 렌더링
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 걷기 애니메이션 (좌우 흔들림)
        const wobble = Math.sin(this.walkCycle) * 2;
        ctx.translate(wobble, 0);

        // 피격 효과
        if (this.flashEffect > 0) {
            ctx.globalAlpha = 0.5 + this.flashEffect * 0.5;
        }

        // 좀비 몸체
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 아이콘
        ctx.font = `${this.size * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);

        // 슬로우 효과 표시
        const slowEffect = this.effects.find(e => e.type === 'slow');
        if (slowEffect) {
            ctx.font = `${this.size * 0.6}px Arial`;
            ctx.fillText('❄️', this.size * 0.6, -this.size * 0.6);
        }

        ctx.restore();

        // HP 바
        this.renderHealthBar(ctx);
    }

    /**
     * HP 바 렌더링
     */
    renderHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 5;
        const x = this.x - barWidth / 2;
        const y = this.y - this.size - 10;

        // 배경
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

        // HP
        const hpPercent = this.getHpPercent();
        ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        // 테두리
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
