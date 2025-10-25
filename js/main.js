// main.js - 게임 초기화 및 실행

// 페이지 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧟 좀비 타워 디펜스 게임 로딩...');

    // 캔버스 가져오기
    const canvas = document.getElementById('game-canvas');

    if (!canvas) {
        console.error('캔버스를 찾을 수 없습니다!');
        return;
    }

    // 게임 인스턴스 생성
    const game = new Game(canvas);

    // 게임 시작
    game.start();

    console.log('✅ 게임 준비 완료!');
    console.log('📝 조작법:');
    console.log('  - 타워 버튼을 클릭하여 선택');
    console.log('  - 맵에서 원하는 위치를 클릭하여 배치');
    console.log('  - 우클릭으로 선택 취소');
    console.log('  - 배치된 타워를 클릭하여 업그레이드/판매');
    console.log('  - "웨이브 시작" 버튼으로 다음 웨이브 시작');
    console.log('');
    console.log('🎯 목표: 10웨이브를 모두 클리어하세요!');
    console.log('💡 팁: 경로의 굴곡 지점에 타워를 배치하면 효과적입니다!');

    // 전역 접근을 위한 참조 (디버깅용)
    window.game = game;

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                game.togglePause();
                break;
            case 'Escape':
                game.cancelSelection();
                break;
            case '1':
                game.selectTower('shooter');
                game.ui.updateTowerButtons();
                break;
            case '2':
                game.selectTower('sniper');
                game.ui.updateTowerButtons();
                break;
            case '3':
                game.selectTower('flame');
                game.ui.updateTowerButtons();
                break;
            case '4':
                game.selectTower('slow');
                game.ui.updateTowerButtons();
                break;
            case 's':
            case 'S':
                if (!game.waveManager.waveInProgress && game.waveManager.isPrepComplete()) {
                    game.startWave();
                }
                break;
            case '+':
            case '=':
                game.changeSpeed();
                break;
        }
    });

    // 디버그 정보 (개발자 콘솔)
    console.log('🔧 디버그 명령:');
    console.log('  - game.state.gold += 1000  // 골드 추가');
    console.log('  - game.state.lives += 10   // 생명력 추가');
    console.log('  - game.startWave()         // 웨이브 강제 시작');
});
