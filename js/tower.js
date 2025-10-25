// tower.js - 타워 클래스

class Tower {
    constructor(type, gridX, gridY) {
        this.id = generateId();
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;

        // 타워 데이터 로드
        const data = TOWER_DATA[type];
        this.name = data.name;
        this.icon = data.icon;
        this.level = 1;
        this.damage = data.damage;
        this.range = data.range;
        this.attackSpeed = data.attackSpeed;
        this.projectileSpeed = data.projectileSpeed;
        this.color = data.color;
        this.projectileColor = data.projectileColor;

        // 특수 속성
        this.aoe = data.aoe || false;
        this.aoeRadius = data.aoeRadius || 0;
        this.slowEffect = data.slowEffect || false;
        this.slowPercent = data.slowPercent || 0;
        this.slowDuration = data.slowDuration || 0;

        // 타워 비용 및 가치
        this.baseCost = data.cost;
        this.totalCost = data.cost;

        // 전투 상태
        this.cooldown = 0;
        this.target = null;

        // 픽셀 좌표
        const pos = gridToPixel(gridX, gridY, CONFIG.TILE_SIZE);
        this.x = pos.x;
        this.y = pos.y;

        // 애니메이션
        this.shootAnimation = 0;
    }

    /**
     * 타워 업데이트 (매 프레임)
     */
    update(deltaTime, zombies) {
        // 쿨다운 감소
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        // 애니메이션 업데이트
        if (this.shootAnimation > 0) {
            this.shootAnimation -= deltaTime * 5;
        }

        // 타겟 찾기 및 공격
        if (this.cooldown <= 0) {
            this.target = this.findTarget(zombies);
            if (this.target) {
                return this.shoot();
            }
        }

        return null;
    }

    /**
     * 타겟 찾기 (경로에서 가장 앞선 적)
     */
    findTarget(zombies) {
        const inRange = zombies.filter(zombie => {
            const dist = distance(this, zombie);
            return dist <= this.range * CONFIG.TILE_SIZE && zombie.hp > 0;
        });

        if (inRange.length === 0) return null;

        // 경로상 가장 앞선 적 선택
        inRange.sort((a, b) => b.pathIndex - a.pathIndex);
        return inRange[0];
    }

    /**
     * 발사체 생성
     */
    shoot() {
        this.cooldown = this.attackSpeed;
        this.shootAnimation = 1;

        return new Projectile(
            this.x,
            this.y,
            this.target,
            this.damage,
            this.projectileSpeed,
            this.projectileColor,
            {
                aoe: this.aoe,
                aoeRadius: this.aoeRadius,
                slowEffect: this.slowEffect,
                slowPercent: this.slowPercent,
                slowDuration: this.slowDuration
            }
        );
    }

    /**
     * 타워 업그레이드
     */
    upgrade() {
        if (this.level >= 3) return false;

        this.level++;
        this.damage = Math.floor(this.damage * 1.5);
        this.range += 1;

        const upgradeCost = Math.floor(this.baseCost * CONFIG.UPGRADE_COST_MULTIPLIER);
        this.totalCost += upgradeCost;

        return upgradeCost;
    }

    /**
     * 업그레이드 비용 계산
     */
    getUpgradeCost() {
        if (this.level >= 3) return null;
        return Math.floor(this.baseCost * CONFIG.UPGRADE_COST_MULTIPLIER);
    }

    /**
     * 판매 가격 계산
     */
    getSellValue() {
        return Math.floor(this.totalCost * CONFIG.SELL_VALUE_PERCENT);
    }

    /**
     * 타워 렌더링
     */
    render(ctx) {
        // 사거리 표시 (선택된 타워만)
        if (this.selected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range * CONFIG.TILE_SIZE, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 타워 베이스
        const size = CONFIG.TILE_SIZE * 0.6;
        const animScale = 1 + this.shootAnimation * 0.2;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(animScale, animScale);

        // 타워 원형 베이스
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 레벨 표시
        if (this.level > 1) {
            ctx.beginPath();
            ctx.arc(size / 3, -size / 3, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.level, size / 3, -size / 3);
        }

        // 아이콘
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);

        ctx.restore();

        // 타겟 라인 (디버그/시각 효과)
        if (this.target && this.shootAnimation > 0.5) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.shootAnimation * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
