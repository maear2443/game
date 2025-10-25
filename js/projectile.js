// projectile.js - 발사체 클래스

class Projectile {
    constructor(x, y, target, damage, speed, color, effects = {}) {
        this.id = generateId();
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.color = color;

        // 특수 효과
        this.aoe = effects.aoe || false;
        this.aoeRadius = effects.aoeRadius || 0;
        this.slowEffect = effects.slowEffect || false;
        this.slowPercent = effects.slowPercent || 0;
        this.slowDuration = effects.slowDuration || 0;

        // 목표 위치 (타겟이 이동할 수 있으므로)
        this.targetX = target.x;
        this.targetY = target.y;

        // 이동 방향
        this.angle = angle(this, target);
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;

        this.active = true;

        // 애니메이션
        this.trail = [];
        this.maxTrailLength = 5;
    }

    /**
     * 발사체 업데이트 (매 프레임)
     */
    update(deltaTime, zombies) {
        if (!this.active) return false;

        // 타겟이 죽었거나 사라진 경우 마지막 위치로
        if (this.target && this.target.hp > 0) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
            // 방향 재계산 (호밍 미사일 효과)
            this.angle = angle(this, { x: this.targetX, y: this.targetY });
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // 트레일 업데이트
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // 이동
        this.x += this.vx;
        this.y += this.vy;

        // 타겟과의 충돌 체크
        if (this.target && this.target.hp > 0) {
            const dist = distance(this, this.target);
            if (dist < 10) {
                this.hit(zombies);
                return false;
            }
        } else {
            // 타겟이 없으면 목표 지점 도달 시 소멸
            const dist = distance(this, { x: this.targetX, y: this.targetY });
            if (dist < 10) {
                this.hit(zombies);
                return false;
            }
        }

        // 화면 밖으로 나가면 소멸
        if (this.x < 0 || this.x > CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE ||
            this.y < 0 || this.y > CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE) {
            return false;
        }

        return true;
    }

    /**
     * 타겟 적중
     */
    hit(zombies) {
        if (this.aoe) {
            // 범위 공격
            const aoeRange = this.aoeRadius * CONFIG.TILE_SIZE;
            zombies.forEach(zombie => {
                if (zombie.hp > 0) {
                    const dist = distance(this, zombie);
                    if (dist <= aoeRange) {
                        zombie.takeDamage(this.damage);
                        this.applyEffects(zombie);
                    }
                }
            });
        } else if (this.target && this.target.hp > 0) {
            // 단일 공격
            this.target.takeDamage(this.damage);
            this.applyEffects(this.target);
        }

        this.active = false;
    }

    /**
     * 특수 효과 적용
     */
    applyEffects(zombie) {
        if (this.slowEffect) {
            zombie.addEffect('slow', {
                percent: this.slowPercent,
                duration: this.slowDuration
            });
        }
    }

    /**
     * 발사체 렌더링
     */
    render(ctx) {
        // 트레일 그리기
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // 발사체
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // AOE 범위 표시 (도착 시점)
        if (this.aoe && this.target) {
            const dist = distance(this, this.target);
            if (dist < 20) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.aoeRadius * CONFIG.TILE_SIZE, 0, Math.PI * 2);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }
}
