// 游戏核心变量
let canvas, ctx;
let player, enemies = [], bullets = [], particles = [], powerUps = [];
let keys = {};
let gameLoop;
let lastTime = 0;
let enemySpawnTimer = 0;
let powerUpSpawnTimer = 0;

// 游戏配置
const GAME_CONFIG = {
    playerSpeed: 5,
    bulletSpeed: 8,
    enemySpeed: 2,
    enemySpawnRate: 2000, // 毫秒
    powerUpSpawnRate: 10000, // 毫秒
    bulletCooldown: 200, // 毫秒
    particleCount: 20
};

// 玩家类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = GAME_CONFIG.playerSpeed;
        this.lastShot = 0;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
    }
    
    update(deltaTime) {
        // 移动控制
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.x = Math.max(this.width/2, this.x - this.speed);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.x = Math.min(canvas.width - this.width/2, this.x + this.speed);
        }
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.y = Math.max(this.height/2, this.y - this.speed);
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.y = Math.min(canvas.height - this.height/2, this.y + this.speed);
        }
        
        // 射击控制
        if (keys[' '] && Date.now() - this.lastShot > GAME_CONFIG.bulletCooldown) {
            this.shoot();
            this.lastShot = Date.now();
        }
        
        // 无敌时间更新
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    shoot() {
        bullets.push(new Bullet(this.x, this.y - this.height/2, 0, -GAME_CONFIG.bulletSpeed));
        
        // 播放射击音效
        if (soundEnabled) {
            playSound('shoot');
        }
        
        // 创建射击粒子效果
        createParticles(this.x, this.y - this.height/2, '#00e5ff', 5);
    }
    
    takeDamage(damage) {
        if (!this.invulnerable) {
            health -= damage;
            updateHUD();
            
            if (health <= 0) {
                gameOver(false);
            } else {
                this.invulnerable = true;
                this.invulnerabilityTime = 1000; // 1秒无敌时间
                
                // 播放受伤音效
                if (soundEnabled) {
                    playSound('hit');
                }
            }
        }
    }
    
    draw() {
        ctx.save();
        
        // 无敌时闪烁效果
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 绘制飞船
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // 绘制护盾效果
        if (this.invulnerable) {
            ctx.strokeStyle = '#00ff9d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// 子弹类
class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 4;
        this.height = 10;
        this.active = true;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 移除超出边界的子弹
        if (this.y < -this.height || this.y > canvas.height + this.height ||
            this.x < -this.width || this.x > canvas.width + this.width) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // 子弹光晕效果
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// 敌人类
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'sql', 'xss', 'command'
        this.width = 30;
        this.height = 30;
        this.speed = GAME_CONFIG.enemySpeed + Math.random() * 2;
        this.active = true;
        this.health = type === 'command' ? 3 : 2; // 命令执行怪物更耐打
        this.maxHealth = this.health;
        this.shootTimer = 0;
        this.movePattern = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime) {
        // 不同的移动模式
        switch (this.type) {
            case 'sql':
                // SQL注入怪物：直线下降
                this.y += this.speed;
                break;
            case 'xss':
                // XSS怪物：左右摆动下降
                this.movePattern += 0.05;
                this.x += Math.sin(this.movePattern) * 2;
                this.y += this.speed * 0.8;
                break;
            case 'command':
                // 命令执行怪物：追踪玩家
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    this.x += (dx / distance) * this.speed * 0.5;
                    this.y += (dy / distance) * this.speed * 0.5 + this.speed * 0.3;
                }
                break;
        }
        
        // 移除超出边界的敌人
        if (this.y > canvas.height + this.height) {
            this.active = false;
        }
        
        // 碰撞检测（与玩家）
        if (this.checkCollision(player)) {
            player.takeDamage(20);
            this.active = false;
            createExplosion(this.x, this.y);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            score += this.type === 'command' ? 150 : 100;
            updateHUD();
            createExplosion(this.x, this.y);
            
            // 播放爆炸音效
            if (soundEnabled) {
                playSound('explosion');
            }
            
            // 随机掉落道具
            if (Math.random() < 0.3) {
                powerUps.push(new PowerUp(this.x, this.y));
            }
        }
    }
    
    checkCollision(other) {
        return Math.abs(this.x - other.x) < (this.width + other.width) / 2 &&
               Math.abs(this.y - other.y) < (this.height + other.height) / 2;
    }
    
    draw() {
        ctx.save();
        
        // 根据类型设置颜色
        switch (this.type) {
            case 'sql':
                ctx.fillStyle = '#ff6f00';
                break;
            case 'xss':
                ctx.fillStyle = '#00ff9d';
                break;
            case 'command':
                ctx.fillStyle = '#ff1744';
                break;
        }
        
        // 绘制敌人（简单的几何形状）
        ctx.beginPath();
        if (this.type === 'sql') {
            // SQL怪物：圆形
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        } else if (this.type === 'xss') {
            // XSS怪物：菱形
            ctx.moveTo(this.x, this.y - this.height/2);
            ctx.lineTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x, this.y + this.height/2);
            ctx.lineTo(this.x - this.width/2, this.y);
        } else {
            // 命令执行怪物：方形
            ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        ctx.fill();
        
        // 绘制生命条
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2 - 8, this.width, 4);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2 - 8, this.width * (this.health / this.maxHealth), 4);
        }
        
        ctx.restore();
    }
}

// 道具类
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.active = true;
        this.type = Math.random() < 0.5 ? 'health' : 'weapon'; // 生命值或武器升级
    }
    
    update() {
        this.y += this.speed;
        
        // 移除超出边界的道具
        if (this.y > canvas.height + this.height) {
            this.active = false;
        }
        
        // 碰撞检测（与玩家）
        if (this.checkCollision(player)) {
            this.applyEffect();
            this.active = false;
        }
    }
    
    applyEffect() {
        if (this.type === 'health') {
            health = Math.min(100, health + 20);
            updateHUD();
        } else {
            // 武器升级效果（增加射速）
            // 这里可以实现更复杂的武器系统
        }
        
        // 播放道具获取音效
        if (soundEnabled) {
            playSound('powerup');
        }
        
        // 创建道具获取粒子效果
        createParticles(this.x, this.y, '#00ff9d', 10);
    }
    
    checkCollision(other) {
        return Math.abs(this.x - other.x) < (this.width + other.width) / 2 &&
               Math.abs(this.y - other.y) < (this.height + other.height) / 2;
    }
    
    draw() {
        ctx.save();
        
        // 根据类型设置颜色
        ctx.fillStyle = this.type === 'health' ? '#00ff9d' : '#ff6f00';
        
        // 绘制道具（星形）
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5;
            const x = this.x + Math.cos(angle) * this.width/2;
            const y = this.y + Math.sin(angle) * this.height/2;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 创建玩家
    player = new Player(canvas.width / 2, canvas.height - 60);
    
    // 重置游戏状态
    enemies = [];
    bullets = [];
    particles = [];
    powerUps = [];
    score = 0;
    health = 100;
    enemySpawnTimer = 0;
    powerUpSpawnTimer = 0;
    
    updateHUD();
    
    // 开始游戏循环
    lastTime = Date.now();
    gameLoop = requestAnimationFrame(update);
}

// 初始化关卡
function initLevel(level) {
    // 根据关卡调整难度
    GAME_CONFIG.enemySpawnRate = Math.max(1000, 2000 - (level - 1) * 300);
    GAME_CONFIG.enemySpeed = 2 + (level - 1) * 0.5;
    
    // 重置游戏状态
    enemies = [];
    bullets = [];
    particles = [];
    powerUps = [];
    enemySpawnTimer = 0;
    powerUpSpawnTimer = 0;
    
    // 继续游戏循环
    gameLoop = requestAnimationFrame(update);
}

// 游戏主循环
function update() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // 清空画布
    ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新玩家
    player.update(deltaTime);
    
    // 生成敌人
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= GAME_CONFIG.enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
    
    // 生成道具
    powerUpSpawnTimer += deltaTime;
    if (powerUpSpawnTimer >= GAME_CONFIG.powerUpSpawnRate) {
        // 道具生成逻辑在敌人死亡时处理
        powerUpSpawnTimer = 0;
    }
    
    // 更新和绘制子弹
    bullets = bullets.filter(bullet => {
        bullet.update();
        bullet.draw();
        return bullet.active;
    });
    
    // 更新和绘制敌人
    enemies = enemies.filter(enemy => {
        enemy.update(deltaTime);
        enemy.draw();
        return enemy.active;
    });
    
    // 更新和绘制道具
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        powerUp.draw();
        return powerUp.active;
    });
    
    // 更新和绘制粒子
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.active;
    });
    
    // 绘制玩家
    player.draw();
    
    // 碰撞检测（子弹与敌人）
    bullets.forEach(bullet => {
        if (!bullet.active) return;
        
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            if (Math.abs(bullet.x - enemy.x) < (bullet.width + enemy.width) / 2 &&
                Math.abs(bullet.y - enemy.y) < (bullet.height + enemy.height) / 2) {
                bullet.active = false;
                enemy.takeDamage(1);
            }
        });
    });
    
    // 检查关卡完成条件
    if (enemies.length === 0 && enemySpawnTimer > 5000) {
        levelComplete();
        return;
    }
    
    // 继续游戏循环
    if (gameState === 'playing') {
        gameLoop = requestAnimationFrame(update);
    }
}

// 生成敌人
function spawnEnemy() {
    const x = Math.random() * (canvas.width - 60) + 30;
    const y = -30;
    
    // 根据当前关卡决定敌人类型
    let enemyType;
    if (currentLevel === 1) {
        enemyType = 'sql'; // 第一关：SQL注入
    } else if (currentLevel === 2) {
        enemyType = Math.random() < 0.7 ? 'sql' : 'xss'; // 第二关：SQL + XSS
    } else {
        const rand = Math.random();
        if (rand < 0.5) enemyType = 'sql';
        else if (rand < 0.8) enemyType = 'xss';
        else enemyType = 'command'; // 第三关：三种都有
    }
    
    enemies.push(new Enemy(x, y, enemyType));
}

// 创建爆炸效果
function createExplosion(x, y) {
    createParticles(x, y, '#ff6f00', 15);
}

// 创建粒子效果
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// 粒子类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 4 + 2;
        this.active = true;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
        
        if (this.life <= 0 || this.size < 0.5) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 键盘事件处理
function handleKeyDown(event) {
    keys[event.key] = true;
    
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
    }
    
    if (event.key === 'Escape') {
        backToMenu();
    }
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

// 暂停游戏
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        cancelAnimationFrame(gameLoop);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        lastTime = Date.now();
        gameLoop = requestAnimationFrame(update);
    }
}

// 关卡完成
function levelComplete() {
    gameState = 'gameover';
    cancelAnimationFrame(gameLoop);
    
    // 显示关卡完成界面
    showGameOver(true);
    
    // 跳转到教程页面（延迟2秒）
    setTimeout(() => {
        window.location.href = `tutorial.html?level=${currentLevel}`;
    }, 2000);
}

// 游戏结束
function gameOver(victory) {
    gameState = 'gameover';
    cancelAnimationFrame(gameLoop);
    showGameOver(victory);
}

// 音效播放（占位符函数）
function playSound(type) {
    // 这里可以添加实际的音效播放逻辑
    console.log(`Playing sound: ${type}`);
}

// 窗口大小调整
window.addEventListener('resize', function() {
    if (canvas) {
        canvas.width = Math.min(800, window.innerWidth - 40);
        canvas.height = Math.min(600, window.innerHeight - 100);
    }
});

// 初始化画布大小
window.addEventListener('load', function() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = Math.min(800, window.innerWidth - 40);
        canvas.height = Math.min(600, window.innerHeight - 100);
    }
});