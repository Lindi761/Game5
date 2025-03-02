const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 玩家属性
const player = {
    x: 50,
    y: 200,
    width: 30,
    height: 30,
    speed: 2,
    jumpForce: 15,
    gravity: 0.2,
    velocityY: 0,
    isJumping: false,
    isCrouching: false,
    trail: [], // 存储最近的位置
    maxTrailLength: 10 // 轨迹长度
};

// 当前关卡
let currentLevel = 0;

// 在文件开头添加游戏状态控制
let gameStarted = false;

// 添加关卡留言
const levelMessages = [
    "跳跳乐园开业啦！往上面的平台跳就对了～",  // 第1关
    "小红尖尖说：'碰我一下，你就得重新开始！'",  // 第2关
    "从这关开始，难度会一点点上升哦，加油！",  // 第3关
    "咦？平台会动？坐上去兜个风吧！",  // 第4关
    "这么多尖刺？别怕，找准空隙慢慢跳~",  // 第5关
    "踩到灰色平台会消失，快速通过才是王道！",  // 第6关
    "蹲下可以降低重心，跳起来也不会那么高哦",  // 第7关
    "垂直升降台，等它下来再上去比较容易！",  // 第8关
    "看到托尾特效没？跳跃轨迹清清楚楚呢！",  // 第9关
    "已经通过9关啦！休息一下，准备冲刺！",  // 第10关
    "提示：移动平台可以带着你一起走哦～",  // 第11关
    "平台变窄了？没事，你已经很熟练了！",  // 第12关
    "连续跳跃时，按住方向键会更容易！",  // 第13关
    "这关有点绕？先观察一下路线吧！",  // 第14关
    "记住：按跳跃键的时间越长，跳得越高！",  // 第15关
    "有些平台是陷阱，不是每个都要踩哦～",  // 第16关
    "别着急，稳住！发现规律就容易了！",  // 第17关
    "来了来了！高能关卡，准备接招！",  // 第18关
    "落地点在哪？预判一下就知道啦！",  // 第19关
    "冲刺阶段！相信自己，你已经很厉害了！",  // 第20关
    "倒数第二关！让托尾特效来记录你的精彩表现！",  // 第21关
    "最终关卡！展现你的实力，一飞冲天吧！"  // 第22关
];

// 关卡设计
const levels = Array(22).fill(null).map((_, index) => {
    if (index === 0) {  // 第一个适应关卡
        return {
            platforms: [
                { x: 0, y: 350, width: 800, height: 50 },  // 地面
                { x: 300, y: 250, width: 200, height: 20 }, // 一个简单的平台
            ],
            spikes: [],  // 没有尖刺
            movingPlatforms: [],
            disappearingPlatforms: [],
            goal: { x: 400, y: 200, width: 30, height: 30 }  // 终点位置较低
        };
    } else if (index === 1) {  // 第二个适应关卡
        return {
            platforms: [
                { x: 0, y: 350, width: 800, height: 50 },
                { x: 200, y: 280, width: 100, height: 20 },
                { x: 400, y: 220, width: 100, height: 20 }
            ],
            spikes: [
                { x: 350, y: 330, width: 20, height: 20 }  // 只有一个尖刺
            ],
            movingPlatforms: [],
            disappearingPlatforms: [],
            goal: { x: 500, y: 170, width: 30, height: 30 }
        };
    }

    // 原有的关卡生成逻辑
    const difficulty = Math.floor((index - 2) / 4); // 调整难度计算
    const levelType = (index - 2) % 6;
    let platforms, spikes, movingPlatforms, disappearingPlatforms;
    
    // 基础配置
    const baseHeight = 350 - (difficulty * 20); // 随难度升高，平台整体升高
    const spikeCount = 3 + difficulty; // 随难度增加尖刺数量
    const platformSpeed = 2 + (difficulty * 0.5); // 随难度增加平台速度
    
    switch(levelType) {
        case 0: // 基础跳跃关卡
            platforms = [
                { x: 0, y: 350, width: 800, height: 50 },
                { x: 200, y: baseHeight, width: 80 - difficulty * 5, height: 20 },
                { x: 400, y: baseHeight - 50, width: 80 - difficulty * 5, height: 20 },
                { x: 600, y: baseHeight - 100, width: 80 - difficulty * 5, height: 20 }
            ];
            spikes = Array(spikeCount).fill(null).map((_, i) => ({
                x: 250 + i * (400 / spikeCount), y: 330, width: 20, height: 20
            }));
            movingPlatforms = [];
            disappearingPlatforms = [];
            break;
            
        case 1: // 移动平台关卡
            platforms = [{ x: 0, y: 350, width: 800, height: 50 }];
            spikes = Array(spikeCount).fill(null).map((_, i) => ({
                x: 200 + i * 100, y: 330, width: 20, height: 20
            }));
            movingPlatforms = [
                { 
                    x: 200, 
                    y: baseHeight, 
                    width: 100, 
                    height: 20,
                    startX: 200, 
                    endX: 350 + difficulty * 30, 
                    speed: platformSpeed, 
                    direction: 1 
                },
                { 
                    x: 500, 
                    y: baseHeight - 70, 
                    width: 100, 
                    height: 20,
                    startX: 450, 
                    endX: 650 + difficulty * 20, 
                    speed: platformSpeed * 1.2, 
                    direction: -1 
                }
            ];
            disappearingPlatforms = [];
            break;
            
        case 2: // 密集尖刺关卡
            const platformWidth = 70 - difficulty * 5;
            platforms = [
                { x: 0, y: 350, width: 800, height: 50 },
                { x: 150, y: baseHeight, width: platformWidth, height: 20 },
                { x: 350, y: baseHeight - 40, width: platformWidth, height: 20 },
                { x: 550, y: baseHeight - 80, width: platformWidth, height: 20 }
            ];
            spikes = Array(12 + difficulty).fill(null).map((_, i) => ({
                x: 50 + i * 55, y: 330, width: 15, height: 20
            }));
            movingPlatforms = [];
            disappearingPlatforms = [];
            break;
            
        case 3: // 消失平台关卡
            platforms = [{ x: 0, y: 350, width: 800, height: 50 }];
            spikes = Array(spikeCount - 1).fill(null).map((_, i) => ({
                x: 300 + i * 120, y: 330, width: 20, height: 20
            }));
            movingPlatforms = [];
            disappearingPlatforms = [
                { 
                    x: 200, 
                    y: baseHeight, 
                    width: 80, 
                    height: 20, 
                    timeToDisappear: 1200 - difficulty * 100
                },
                { 
                    x: 400, 
                    y: baseHeight - 50, 
                    width: 80, 
                    height: 20, 
                    timeToDisappear: 1000 - difficulty * 100
                },
                { 
                    x: 600, 
                    y: baseHeight - 100, 
                    width: 80, 
                    height: 20, 
                    timeToDisappear: 800 - difficulty * 100
                }
            ];
            break;

        case 4: // 垂直移动平台关卡
            platforms = [{ x: 0, y: 350, width: 800, height: 50 }];
            spikes = Array(spikeCount).fill(null).map((_, i) => ({
                x: 250 + i * 100, y: 330, width: 20, height: 20
            }));
            movingPlatforms = [
                { 
                    x: 250, 
                    y: 200, 
                    width: 100, 
                    height: 20,
                    startY: 150 - difficulty * 10, 
                    endY: 280 + difficulty * 5, 
                    speed: platformSpeed, 
                    direction: 1, 
                    vertical: true 
                },
                { 
                    x: 550, 
                    y: 200, 
                    width: 100, 
                    height: 20,
                    startY: 120 - difficulty * 10, 
                    endY: 250 + difficulty * 5, 
                    speed: platformSpeed * 1.3, 
                    direction: -1, 
                    vertical: true 
                }
            ];
            disappearingPlatforms = [];
            break;

        case 5: // 综合关卡
            platforms = [{ x: 0, y: 350, width: 800, height: 50 }];
            spikes = Array(spikeCount + 1).fill(null).map((_, i) => ({
                x: 200 + i * 90, y: 330, width: 20, height: 20
            }));
            movingPlatforms = [
                { 
                    x: 200, 
                    y: baseHeight, 
                    width: 80, 
                    height: 20,
                    startX: 200, 
                    endX: 400 + difficulty * 20, 
                    speed: platformSpeed, 
                    direction: 1 
                }
            ];
            disappearingPlatforms = [
                { 
                    x: 500, 
                    y: baseHeight - 50 - difficulty * 10, 
                    width: 80, 
                    height: 20, 
                    timeToDisappear: 1100 - difficulty * 100
                },
                { 
                    x: 650, 
                    y: baseHeight - 100 - difficulty * 10, 
                    width: 80, 
                    height: 20, 
                    timeToDisappear: 900 - difficulty * 100
                }
            ];
            break;
    }
    
    // 根据难度调整目标位置
    const goalY = Math.max(50, 100 - difficulty * 10);
    
    return {
        platforms,
        spikes,
        movingPlatforms,
        disappearingPlatforms,
        goal: { x: 700, y: goalY, width: 30, height: 30 }
    };
});

// 键盘控制
const keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

// 事件监听
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft': keys.left = true; break;
        case 'ArrowRight': keys.right = true; break;
        case 'ArrowUp': keys.up = true; break;
        case 'ArrowDown': keys.down = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft': keys.left = false; break;
        case 'ArrowRight': keys.right = false; break;
        case 'ArrowUp': keys.up = false; break;
        case 'ArrowDown': keys.down = false; break;
    }
});

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 更新游戏状态
function update() {
    // 在移动更新之前记录当前位置
    player.trail.unshift({ x: player.x, y: player.y, height: player.height });
    if (player.trail.length > player.maxTrailLength) {
        player.trail.pop();
    }

    // 水平移动
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    
    // 跳跃
    if (keys.up && !player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
    }

    // 重力
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // 蹲下
    player.isCrouching = keys.down;
    player.height = keys.down ? 15 : 30;

    // 更新移动平台
    levels[currentLevel].movingPlatforms.forEach(platform => {
        if (platform.vertical) {
            platform.y += platform.speed * platform.direction;
            if (platform.y >= platform.endY || platform.y <= platform.startY) {
                platform.direction *= -1;
            }
            // 检查玩家是否在垂直移动平台上
            if (checkCollision(player, platform)) {
                if (player.velocityY > 0) {
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                }
            }
        } else {
            platform.x += platform.speed * platform.direction;
            if (platform.x >= platform.endX || platform.x <= platform.startX) {
                platform.direction *= -1;
            }
            // 检查玩家是否在水平移动平台上
            if (checkCollision(player, platform)) {
                if (player.velocityY > 0) {
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                    player.x += platform.speed * platform.direction;
                }
            }
        }
    });

    // 更新消失平台
    levels[currentLevel].disappearingPlatforms.forEach(platform => {
        if (!platform.timer && checkCollision(player, platform)) {
            platform.timer = setTimeout(() => {
                platform.disappeared = true;
                setTimeout(() => {
                    platform.disappeared = false;
                    platform.timer = null;
                }, 2000);
            }, platform.timeToDisappear);
        }
    });

    // 碰撞检测
    let onGround = false;
    levels[currentLevel].platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            if (player.velocityY > 0) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onGround = true;
            } else if (player.velocityY < 0) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    });

    // 检查是否碰到尖刺
    levels[currentLevel].spikes.forEach(spike => {
        if (checkCollision(player, spike)) {
            // 重置玩家位置
            player.x = 50;
            player.y = 200;
            player.velocityY = 0;
        }
    });

    // 检查是否到达目标
    if (checkCollision(player, levels[currentLevel].goal)) {
        currentLevel++;
        if (currentLevel >= levels.length) {
            alert('恭喜你通关了！');
            currentLevel = 0;
        }
        player.x = 50;
        player.y = 200;
    }

    // 边界检查
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) {
        player.y = 200;
        player.x = 50;
    }
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制托尾效果
    player.trail.forEach((pos, index) => {
        const alpha = (player.maxTrailLength - index) / player.maxTrailLength * 0.3;
        ctx.fillStyle = `rgba(0, 0, 255, ${alpha})`;
        ctx.fillRect(pos.x, pos.y, player.width, pos.height);
    });

    // 绘制玩家
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // 绘制平台
    ctx.fillStyle = '#888';
    levels[currentLevel].platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // 绘制尖刺
    ctx.fillStyle = '#f00';
    levels[currentLevel].spikes.forEach(spike => {
        ctx.beginPath();
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width/2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
    });

    // 绘制移动平台
    ctx.fillStyle = '#666';
    levels[currentLevel].movingPlatforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // 绘制消失平台
    ctx.fillStyle = '#444';
    levels[currentLevel].disappearingPlatforms.forEach(platform => {
        if (!platform.disappeared) {
            if (platform.timer) {
                ctx.globalAlpha = 0.5;
            }
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.globalAlpha = 1.0;
        }
    });

    // 绘制目标
    ctx.fillStyle = '#0f0';
    const goal = levels[currentLevel].goal;
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

    // 显示文字信息
    ctx.fillStyle = '#000';
    
    // 左上角显示关卡数
    ctx.font = '20px Arial';
    ctx.fillText(`关卡: ${currentLevel + 1}`, 10, 30);
    
    // 右上角显示游戏标题
    ctx.font = '16px Arial';
    const titleText = '一蹦三尺高（落地点吗？预判呗）';
    ctx.fillText(titleText, canvas.width - 250, 60);
    
    // 中间上方显示关卡留言
    ctx.font = '18px Arial';
    ctx.fillStyle = '#444';
    const messageText = levelMessages[currentLevel];
    const messageWidth = ctx.measureText(messageText).width;
    ctx.fillText(messageText, (canvas.width - messageWidth) / 2, 30);
}

// 添加开始游戏函数
function startGame() {
    gameStarted = true;
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
    // 重置游戏状态
    currentLevel = 0;
    player.x = 50;
    player.y = 200;
    player.velocityY = 0;
    // 开始游戏循环
    gameLoop();
}

// 修改游戏循环函数
function gameLoop() {
    if (!gameStarted) return; // 如果游戏未开始，不执行游戏循环
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
} 