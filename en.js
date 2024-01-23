// 走時表データのクラス
class TravelTimeTable {
    constructor(p, s, depth, distance) {
        this.P = p;
        this.S = s;
        this.Depth = depth;
        this.Distance = distance;
    }
}

// 走時表データの解析
function parseTravelTimeTable(text) {
    return text.split('\n').map(line => {
        const parts = line.split(/\s+/);
        return new TravelTimeTable(
            parseFloat(parts[1]),
            parseFloat(parts[3]),
            parseInt(parts[4]),
            parseInt(parts[5])
        );
    });
}

// 特定の深さと時間に基づいてP波とS波の半径を計算
function getWaveRadii(table, depth, time) {
    const values = table.filter(x => x.Depth === depth);
    if (values.length === 0) return [NaN, NaN];

    // P波とS波の半径を計算
    const pRadius = interpolateWave(values, time, 'P');
    const sRadius = interpolateWave(values, time, 'S');
    
    return [pRadius, sRadius];
}

function interpolateWave(values, time, waveType) {
    const wave1 = values.find(x => x[waveType] >= time);
    const wave2 = values.reverse().find(x => x[waveType] <= time);
    
    if (!wave1 || !wave2) return NaN;
    return (time - wave2[waveType]) / (wave1[waveType] - wave2[waveType]) * (wave1.Distance - wave2.Distance) + wave2.Distance;
}

// 地震波のアニメーション
function animateWaves(map, table, depth, startTime) {
    const currentTime = new Date().getTime();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); // 経過時間（秒）

    const [pRadius, sRadius] = getWaveRadii(table, depth, elapsedTime);

    // 地図上のP波とS波の半径を更新（NaNの場合は更新しない）
    map.eachLayer(layer => {
        if (layer instanceof L.Circle) {
            if (layer.options.color === 'blue' && !isNaN(pRadius)) {
                layer.setRadius(pRadius * 1000); // P波
            } else if (layer.options.color === '#dc143c' && !isNaN(sRadius)) {
                layer.setRadius(sRadius * 1000); // S波
            }
        }
    });

    // 次のフレームのために再帰的に呼び出し
    if (elapsedTime < 2000) { // 例えば2000秒で終了
        requestAnimationFrame(() => animateWaves(map, table, depth, startTime));
    }
}


// 地震波を地図上に描画する初期設定
function initializeMap() {
    var map = L.map('map', {
        center: [35.6895, 139.6917], // 例として東京
        zoom: 5
    });

    L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // P波とS波の初期化
    L.circle([35.6895, 139.6917], { radius: 0, color: 'blue', fillColor: '#399ade', fillOpacity: 0.5 }).addTo(map);
    L.circle([35.6895, 139.6917], { radius: 0, color: '#dc143c', fillColor: '#dc143c', fillOpacity: 0.1 }).addTo(map);

    return map;
}

// 走時表データを読み込み、地震波のアニメーションを開始
async function startEarthquakeAnimation(url, depth) {
    const response = await fetch(url);
    const text = await response.text();
    const table = parseTravelTimeTable(text);

    const map = initializeMap();
    const startTime = new Date().getTime();
    animateWaves(map, table, depth, startTime);
}

startEarthquakeAnimation('tjma2001', 10); // 例: 深さ300km
