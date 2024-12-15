// P2P地震情報モニタリングシステム
let lastEarthquakeId = null;
let ws;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5秒

const mainAlert = document.getElementById('main-alert');
const eqDetails = document.getElementById('eq-details');
const intensityInfo = document.getElementById('intensity-info');
const endAlert = document.getElementById('end-alert');
const alertSound = document.getElementById('alert-sound');

console.log("地震情報を取得中...");

// WebSocket接続を確立する関数
function connectWebSocket() {
    if (isConnecting) return;
    isConnecting = true;

    ws = new WebSocket('wss://api.p2pquake.net/v2/ws');

    ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
        isConnecting = false;
        reconnectAttempts = 0;
        playSound(); // 接続確認音
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 地震情報（551）のみを処理
        if (data.code === 551) {
            console.log('地震情報を受信しました:', data);
            showEarthquakeInfo(data);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket接続が切断されました');
        isConnecting = false;
        
        // 再接続を試みる
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`再接続を試みます... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else {
            console.error('最大再接続試行回数に達しました');
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
        isConnecting = false;
    };
}

// 震度情報を整形する関数
function formatIntensityInfo(points) {
    let intensityText = '';
    const intensityGroups = {};
    
    // 震度の変換関数
    function convertIntensity(scale) {
        switch(scale) {
            case 10: return "1";
            case 20: return "2";
            case 30: return "3";
            case 40: return "4";
            case 45: return "5弱";
            case 50: return "5強";
            case 55: return "6弱";
            case 60: return "6強";
            case 70: return "7";
            default: return "不明";
        }
    }

    // Group areas by intensity and remove duplicates
    points.forEach(point => {
        const intensity = convertIntensity(point.scale);
        if (!intensityGroups[intensity]) {
            intensityGroups[intensity] = new Set();
        }
        intensityGroups[intensity].add(point.addr);
    });
    
    // Sort intensities in descending order
    const intensityOrder = ["7", "6強", "6弱", "5強", "5弱", "4", "3", "2", "1"];
    
    // Format each intensity group
    intensityOrder.forEach(intensity => {
        if (intensityGroups[intensity] && intensityGroups[intensity].size > 0) {
            const areas = Array.from(intensityGroups[intensity]).sort().join('　');
            intensityText += `　　<span class="intensity-label">震度${intensity}</span>\n　　　　${areas}\n`;
        }
    });
    
    return intensityText.trim();
}

// 地震情報を表示する関数
async function showEarthquakeInfo(data) {
    try {
        // 音を鳴らす
        playSound();

        // 1. 最初の表示（3秒間点滅）
        mainAlert.classList.remove('hidden');
        await sleep(3000);
        mainAlert.classList.add('hidden');

        // 2. 震源地・マグニチュード・深さを表示（8秒間）
        const eq = data.earthquake;
        const magnitude = eq.hypocenter.magnitude !== -1 ? eq.hypocenter.magnitude.toFixed(1) : 'ー.ー';
        const depth = eq.hypocenter.depth !== -1 ? `${eq.hypocenter.depth}` : '不明';
        const tsunami = eq.domesticTsunami === "None" ? "この地震による津波の心配はありません" :
                       eq.domesticTsunami === "Unknown" ? "津波の有無は不明です" :
                       eq.domesticTsunami === "Checking" ? "津波の有無を調査中です" :
                       eq.domesticTsunami === "NonEffective" ? "若干の海面変動が予想されますが、被害の心配はありません" :
                       eq.domesticTsunami === "Watch" ? "津波注意報が発表されています" :
                       eq.domesticTsunami === "Warning" ? "津波警報が発表されています" : "不明";

        eqDetails.textContent = `震源地：${eq.hypocenter.name}　　マグニチュード：${magnitude}M\n震源の深さ：${depth} km　　${tsunami}`;
        eqDetails.classList.remove('hidden');
        await sleep(8000);
        eqDetails.classList.add('hidden');

        // 3. 各地の震度情報を表示（8秒間）
        const intensityText = formatIntensityInfo(data.points);
        intensityInfo.innerHTML = intensityText;
        intensityInfo.style.textAlign = 'left';
        intensityInfo.style.margin = '0 auto';
        intensityInfo.style.width = 'fit-content';
        intensityInfo.classList.remove('hidden');
        await sleep(8000);
        intensityInfo.classList.add('hidden');

        // 4. 終了表示（3秒間）
        endAlert.classList.remove('hidden');
        await sleep(3000);
        endAlert.classList.add('hidden');
    } catch (error) {
        console.error('地震情報の表示中にエラーが発生しました:', error);
    }
}

// ユーティリティ関数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playSound() {
    const audio = new Audio('nc284095_ピーン・起動音、スタート、アイキャッチ_pibell.wav');
    audio.play().catch(error => console.error('音声の再生に失敗しました:', error));
}

// ページ読み込み時にWebSocket接続を開始
window.addEventListener('load', () => {
    connectWebSocket();
});
