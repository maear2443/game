// utils.js - 유틸리티 함수들

/**
 * 두 점 사이의 거리 계산
 */
function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * 두 점 사이의 각도 계산 (라디안)
 */
function angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * 고유 ID 생성
 */
let nextId = 1;
function generateId() {
    return nextId++;
}

/**
 * 그리드 좌표를 픽셀 좌표로 변환
 */
function gridToPixel(gridX, gridY, tileSize) {
    return {
        x: gridX * tileSize + tileSize / 2,
        y: gridY * tileSize + tileSize / 2
    };
}

/**
 * 픽셀 좌표를 그리드 좌표로 변환
 */
function pixelToGrid(pixelX, pixelY, tileSize) {
    return {
        x: Math.floor(pixelX / tileSize),
        y: Math.floor(pixelY / tileSize)
    };
}

/**
 * 범위 내 랜덤 정수
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 배열에서 랜덤 요소 선택
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 숫자를 천 단위 쉼표로 포맷
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 선형 보간
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * 값을 범위 내로 제한
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 경로 정의 (좀비가 이동할 경로)
 */
const PATH = [
    { x: 0, y: 5 },
    { x: 3, y: 5 },
    { x: 3, y: 2 },
    { x: 7, y: 2 },
    { x: 7, y: 7 },
    { x: 11, y: 7 },
    { x: 11, y: 4 },
    { x: 14, y: 4 }
];

/**
 * 타워 데이터 정의
 */
const TOWER_DATA = {
    shooter: {
        name: '총잡이',
        icon: '🔫',
        cost: 100,
        damage: 20,
        range: 3,
        attackSpeed: 0.5,
        projectileSpeed: 8,
        color: '#ff6b6b',
        projectileColor: '#ffd700'
    },
    sniper: {
        name: '스나이퍼',
        icon: '🎯',
        cost: 200,
        damage: 80,
        range: 6,
        attackSpeed: 2,
        projectileSpeed: 15,
        color: '#4ecdc4',
        projectileColor: '#00d4ff'
    },
    flame: {
        name: '화염',
        icon: '🔥',
        cost: 150,
        damage: 15,
        range: 2,
        attackSpeed: 0.3,
        projectileSpeed: 6,
        color: '#ff8c42',
        projectileColor: '#ff4500',
        aoe: true,
        aoeRadius: 1.5
    },
    slow: {
        name: '슬로우',
        icon: '❄️',
        cost: 120,
        damage: 5,
        range: 3,
        attackSpeed: 1,
        projectileSpeed: 7,
        color: '#95e1d3',
        projectileColor: '#00ffff',
        slowEffect: true,
        slowPercent: 0.5,
        slowDuration: 3
    }
};

/**
 * 좀비 데이터 정의
 */
const ZOMBIE_DATA = {
    basic: {
        name: '일반 좀비',
        icon: '🧟',
        maxHp: 100,
        speed: 1,
        reward: 10,
        color: '#7cb342',
        size: 15
    },
    fast: {
        name: '빠른 좀비',
        icon: '🧟‍♂️',
        maxHp: 50,
        speed: 2,
        reward: 15,
        color: '#ffa726',
        size: 12
    },
    tank: {
        name: '탱크 좀비',
        icon: '🧟‍♀️',
        maxHp: 500,
        speed: 0.5,
        reward: 50,
        color: '#e53935',
        size: 20
    },
    boss: {
        name: '보스 좀비',
        icon: '👹',
        maxHp: 2000,
        speed: 0.7,
        reward: 200,
        color: '#8e24aa',
        size: 30
    }
};

/**
 * 게임 설정
 */
const CONFIG = {
    GRID_WIDTH: 15,
    GRID_HEIGHT: 10,
    TILE_SIZE: 50,
    START_GOLD: 150,
    START_LIVES: 20,
    TOTAL_WAVES: 10,
    WAVE_PREP_TIME: 5, // 웨이브 사이 준비 시간 (초)
    UPGRADE_COST_MULTIPLIER: 1.5,
    SELL_VALUE_PERCENT: 0.7
};
