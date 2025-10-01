// 游戏变量
let canvas, ctx;
let player, enemies = [], bullets = [], particles = [], powerUps = [];
let enemyBullets = []; // 敌人子弹数组
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
    powerUpSpawnRate: 8000, // 减少道具生成间隔，从10秒改为8秒
    bulletCooldown: 200, // 毫秒
    particleCount: 20
};

// 玩家类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = GAME_CONFIG.playerSpeed;
        this.health = 100;
        this.maxHealth = 100;
        this.lastShot = 0;
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
        if (keys[' ']) {
            this.lastShot += deltaTime;
            if (this.lastShot >= GAME_CONFIG.bulletCooldown) {
                this.shoot();
                this.lastShot = 0;
            }
        }
    }
    
    shoot() {
        bullets.push(new Bullet(this.x, this.y - this.height/2, 0, -GAME_CONFIG.bulletSpeed));
        
        // 播放射击音效
        if (soundEnabled) {
            playSound('shoot');
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            gameOver(false);
        } else {
            // 受伤闪烁效果
            this.invulnerable = true;
            setTimeout(() => {
                this.invulnerable = false;
            }, 1000);
            
            // 播放受伤音效
            if (soundEnabled) {
                playSound('hit');
            }
        }
        // 立即更新HUD显示
        updateHUD();
    }
    
    draw() {
        ctx.save();
        
        // 受伤时闪烁效果
        if (this.invulnerable) {
            ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        }
        
        // 绘制玩家飞船
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // 绘制引擎光效
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(this.x - 3, this.y + this.height/2, 6, 10);
        
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
        this.height = 8;
        this.active = true;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 移除超出边界的子弹
        if (this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.active = false;
        }
    }
    
    // 碰撞检测方法
    checkCollision(other) {
        return Math.abs(this.x - other.x) < (this.width + other.width) / 2 &&
               Math.abs(this.y - other.y) < (this.height + other.height) / 2;
    }
    
    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // 子弹光效
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// 敌人类
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'sql', 'xss', 'command', 'elite', 'kamikaze', 'bomber', 'clone'
        this.width = 30;
        this.height = 30;
        this.speed = GAME_CONFIG.enemySpeed + Math.random() * 2;
        this.active = true;
        this.health = type === 'command' ? 3 : (type === 'elite' ? 8 : (type === 'kamikaze' ? 1 : (type === 'bomber' ? 5 : (type === 'clone' ? 4 : 2)))); // 分身怪中等血量
        this.maxHealth = this.health;
        this.shootTimer = 0;
        this.movePattern = Math.random() * Math.PI * 2;
        
        // 精英怪特殊属性
        if (type === 'elite') {
            this.width = 50;
            this.height = 30;
            this.speed = 1.5; // 较慢的移动速度
            this.direction = Math.random() < 0.5 ? -1 : 1; // 左右移动方向
            this.shootCooldown = 2000; // 增加射击冷却时间（毫秒）
            this.lastShot = 0;
        }
        
        // 自爆怪特殊属性
        if (type === 'kamikaze') {
            this.width = 25;
            this.height = 25;
            this.speed = 3; // 较快的移动速度
            this.targetX = player.x; // 锁定玩家X位置
            this.hasTargeted = false; // 是否已经锁定目标
        }
        
        // 投弹怪特殊属性
        if (type === 'bomber') {
            this.width = 40;
            this.height = 35;
            this.speed = 1.8; // 中等移动速度
            this.shootCooldown = 2500; // 增加射击冷却时间（毫秒）
            this.lastShot = 0;
            this.direction = Math.random() < 0.5 ? -1 : 1; // 左右移动方向
        }
        
        // 分身怪特殊属性
        if (type === 'clone') {
            this.width = 35;
            this.height = 35;
            this.speed = 2.2; // 中等偏快的移动速度
            this.canSplit = true; // 是否可以分裂
            this.splitCount = 0; // 分裂次数（最多分裂一次）
            this.targetX = player.x; // 锁定玩家X位置
            this.targetY = player.y; // 锁定玩家Y位置
            this.hasTargeted = false; // 是否已经锁定目标
            this.chargeSpeed = 4; // 冲刺速度
            this.isCharging = false; // 是否正在冲刺
        }
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
            case 'elite':
                // 精英怪：在屏幕顶部左右飞行并发射子弹
                this.x += this.direction * this.speed;
                
                // 到达边界时改变方向
                if (this.x <= this.width/2 || this.x >= canvas.width - this.width/2) {
                    this.direction *= -1;
                }
                
                // 保持在屏幕顶部
                this.y = Math.max(50, this.y);
                
                // 发射子弹
                this.lastShot += deltaTime;
                if (this.lastShot >= this.shootCooldown) {
                    this.shoot();
                    this.lastShot = 0;
                }
                break;
            case 'kamikaze':
                // 自爆怪：追踪玩家向下撞击，但只能落下来撞
                if (!this.hasTargeted) {
                    this.targetX = player.x; // 锁定玩家当前X位置
                    this.hasTargeted = true;
                }
                
                // 只在初始阶段可以调整X位置（前100像素的下降距离）
                const initialTrackingDistance = 100;
                const distanceFallen = this.y - (-30); // 从生成位置开始计算下降距离
                
                if (distanceFallen < initialTrackingDistance) {
                    // 初始追踪阶段：可以调整X位置
                    const targetDx = this.targetX - this.x;
                    if (Math.abs(targetDx) > 2) {
                        this.x += Math.sign(targetDx) * this.speed * 0.3; // 较慢的横向调整
                    }
                } 
                // 超过初始追踪距离后，只能直线向下
                
                this.y += this.speed; // 持续向下移动
                break;
            case 'bomber':
                // 投弹怪：在屏幕上方左右飞行并发射三开子弹
                this.x += this.direction * this.speed;
                
                // 到达边界时改变方向
                if (this.x <= this.width/2 || this.x >= canvas.width - this.width/2) {
                    this.direction *= -1;
                }
                
                // 缓慢向下移动
                this.y += this.speed * 0.3;
                
                // 发射三开子弹
                this.lastShot += deltaTime;
                if (this.lastShot >= this.shootCooldown) {
                    this.shootTriple();
                    this.lastShot = 0;
                }
                break;
            case 'clone':
                // 分身怪：锁定玩家位置后冲刺撞击
                if (!this.hasTargeted) {
                    this.targetX = player.x; // 锁定玩家当前X位置
                    this.targetY = player.y; // 锁定玩家当前Y位置
                    this.hasTargeted = true;
                    
                    // 计算冲刺方向
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        this.chargeVx = (dx / distance) * this.chargeSpeed;
                        this.chargeVy = (dy / distance) * this.chargeSpeed;
                        this.isCharging = true;
                    }
                }
                
                if (this.isCharging) {
                    // 冲刺向目标位置
                    this.x += this.chargeVx;
                    this.y += this.chargeVy;
                } else {
                    // 普通移动（向下）
                    this.y += this.speed;
                }
                break;
        }
        
        // 移除超出边界的敌人
        if (this.y > canvas.height + this.height || 
            (this.type !== 'elite' && this.type !== 'bomber' && this.type !== 'clone' && (this.x < -this.width || this.x > canvas.width + this.width))) {
            this.active = false;
        }
        
        // 碰撞检测（与玩家）
        if (this.checkCollision(player)) {
            if (this.type === 'kamikaze') {
                // 自爆怪造成更大伤害
                player.takeDamage(35);
                createExplosion(this.x, this.y);
                // 创建更大的爆炸效果
                createParticles(this.x, this.y, '#ff4444', 15);
            } else {
                player.takeDamage(20);
                createExplosion(this.x, this.y);
            }
            this.active = false;
        }
    }
    
    // 精英怪射击方法
    shoot() {
        if (this.type === 'elite') {
            // 向玩家方向发射子弹
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const bulletSpeed = 4;
                const vx = (dx / distance) * bulletSpeed;
                const vy = (dy / distance) * bulletSpeed;
                
                // 创建敌人子弹
                enemyBullets.push(new EnemyBullet(this.x, this.y + this.height/2, vx, vy));
            }
        }
    }
    
    // 投弹怪三开子弹射击方法
    shootTriple() {
        if (this.type === 'bomber') {
            const bulletSpeed = 3.5;
            const angleSpread = Math.PI / 6; // 30度扩散角
            
            // 计算向玩家的基础方向
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const baseAngle = Math.atan2(dy, dx);
            
            // 发射三发子弹：中间、左偏、右偏
            for (let i = -1; i <= 1; i++) {
                const angle = baseAngle + (i * angleSpread);
                const vx = Math.cos(angle) * bulletSpeed;
                const vy = Math.sin(angle) * bulletSpeed;
                enemyBullets.push(new EnemyBullet(this.x, this.y + this.height/2, vx, vy));
            }
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            
            // 分身怪分裂机制
            if (this.type === 'clone' && this.canSplit && this.splitCount === 0) {
                this.splitCount = 1;
                // 创建两个较小的分身
                const clone1 = new Enemy(this.x - 20, this.y, 'clone');
                const clone2 = new Enemy(this.x + 20, this.y, 'clone');
                
                // 设置分身属性
                clone1.width = 25;
                clone1.height = 25;
                clone1.health = 2;
                clone1.maxHealth = 2;
                clone1.canSplit = false; // 分身不能再次分裂
                clone1.splitCount = 1;
                clone1.speed = 2.8; // 更快的速度
                
                clone2.width = 25;
                clone2.height = 25;
                clone2.health = 2;
                clone2.maxHealth = 2;
                clone2.canSplit = false; // 分身不能再次分裂
                clone2.splitCount = 1;
                clone2.speed = 2.8; // 更快的速度
                
                // 添加到敌人数组
                enemies.push(clone1);
                enemies.push(clone2);
                
                // 创建分裂效果
                createParticles(this.x, this.y, '#00ffff', 12);
                
                // 播放分裂音效
                if (soundEnabled) {
                    playSound('split');
                }
                
                return; // 不执行后续的死亡逻辑
            }
            
            // 根据敌人类型给予不同分数
            let scoreBonus = 100;
            if (this.type === 'command') scoreBonus = 150;
            else if (this.type === 'elite') scoreBonus = 300;
            else if (this.type === 'kamikaze') scoreBonus = 80;
            else if (this.type === 'bomber') scoreBonus = 200; // 投弹怪分数奖励
            else if (this.type === 'clone') scoreBonus = this.canSplit ? 180 : 90; // 分身怪分数奖励（原体更高）
            
            score += scoreBonus;
            updateHUD();
            createExplosion(this.x, this.y);
            
            // 播放爆炸音效
            if (soundEnabled) {
                playSound('explosion');
            }
            
            // 精英怪、投弹怪和分身怪有更高概率掉落道具
            const dropChance = (this.type === 'elite' || this.type === 'bomber' || (this.type === 'clone' && this.canSplit)) ? 0.6 : 0.3;
            if (Math.random() < dropChance) {
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
        
        // 根据类型设置颜色和绘制方式
        switch (this.type) {
            case 'sql':
                ctx.fillStyle = '#ff6f00';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'xss':
                ctx.fillStyle = '#00ff9d';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.height/2);
                ctx.lineTo(this.x + this.width/2, this.y);
                ctx.lineTo(this.x, this.y + this.height/2);
                ctx.lineTo(this.x - this.width/2, this.y);
                ctx.closePath();
                ctx.fill();
                break;
            case 'command':
                ctx.fillStyle = '#ff1744';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                break;
            case 'elite':
                // 精英怪：更大的飞船形状，带有发光效果
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                
                // 绘制飞船主体
                ctx.beginPath();
                ctx.moveTo(this.x - this.width/2, this.y + this.height/2);
                ctx.lineTo(this.x, this.y - this.height/2);
                ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
                ctx.lineTo(this.x + this.width/4, this.y + this.height/4);
                ctx.lineTo(this.x - this.width/4, this.y + this.height/4);
                ctx.closePath();
                ctx.fill();
                
                // 绘制引擎光效
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(this.x - 8, this.y + this.height/4, 4, 8);
                ctx.fillRect(this.x + 4, this.y + this.height/4, 4, 8);
                
                ctx.shadowBlur = 0;
                break;
            case 'kamikaze':
                // 自爆怪：红色闪烁的圆形
                const flashIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 68, 68, ${0.7 + flashIntensity * 0.3})`;
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 8;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制危险标志
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', this.x, this.y + 4);
                
                ctx.shadowBlur = 0;
                break;
            case 'bomber':
                // 投弹怪：紫色的轰炸机形状，带有脉冲光晕
                const pulseIntensity = 0.5 + 0.3 * Math.sin(Date.now() * 0.005);
                
                // 外发光效果
                ctx.shadowColor = '#8a2be2';
                ctx.shadowBlur = 15 * pulseIntensity;
                
                // 主体（轰炸机机身）
                ctx.fillStyle = '#8a2be2';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                
                // 机翼
                ctx.fillStyle = '#9932cc';
                ctx.fillRect(this.x - this.width/2 - 5, this.y - 5, this.width + 10, 10);
                
                // 弹舱指示器
                ctx.fillStyle = '#ff4500';
                ctx.fillRect(this.x - 8, this.y + 5, 16, 4);
                
                ctx.shadowBlur = 0;
                break;
            case 'clone':
                // 分身怪：青色半透明形状，带有能量波动效果
                const waveEffect = 0.8 + 0.2 * Math.sin(Date.now() * 0.008);
                const glowIntensity = this.canSplit ? 1.0 : 0.5; // 原体更亮
                
                // 外发光效果
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 20 * glowIntensity * waveEffect;
                
                // 主体（菱形）
                ctx.fillStyle = this.canSplit ? 'rgba(0, 255, 255, 0.8)' : 'rgba(0, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.height/2);
                ctx.lineTo(this.x + this.width/2, this.y);
                ctx.lineTo(this.x, this.y + this.height/2);
                ctx.lineTo(this.x - this.width/2, this.y);
                ctx.closePath();
                ctx.fill();
                
                // 内部能量核心
                ctx.fillStyle = this.canSplit ? '#ffffff' : '#ccffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 6 * waveEffect, 0, Math.PI * 2);
                ctx.fill();
                
                // 能量环（仅原体有）
                if (this.canSplit) {
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 15 * waveEffect, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.shadowBlur = 0;
                break;
        }
        
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
        // 增加回血道具的生成概率
        this.type = Math.random() < 0.7 ? 'health' : 'multishot';
        this.rotation = 0;
    }
    
    update() {
        this.y += this.speed;
        this.rotation += 0.1;
        
        // 移除超出边界的道具
        if (this.y > canvas.height + this.height) {
            this.active = false;
        }
        
        // 检测与玩家的碰撞
        if (this.checkCollision(player)) {
            this.applyEffect();
            this.active = false;
        }
    }
    
    applyEffect() {
        if (this.type === 'health') {
            // 回血道具：恢复50点生命值，不超过最大生命值
            player.health = Math.min(player.maxHealth, player.health + 50);
            // 创建回血特效
            createParticles(player.x, player.y, '#00ff00', 15);
        } else if (this.type === 'multishot') {
            // 多重射击效果（暂时简化）
            player.multishot = true;
            setTimeout(() => {
                player.multishot = false;
            }, 5000);
            // 创建多重射击特效
            createParticles(player.x, player.y, '#0080ff', 10);
        }
        updateHUD();
    }
    
    checkCollision(other) {
        return Math.abs(this.x - other.x) < (this.width + other.width) / 2 &&
               Math.abs(this.y - other.y) < (this.height + other.height) / 2;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'health') {
            ctx.fillStyle = '#ff0080';
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -8, 4, 16);
            ctx.fillRect(-8, -2, 16, 4);
        } else {
            ctx.fillStyle = '#0080ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 游戏状态变量
let score = 0;
let currentLevel = 1;
let enemiesKilled = 0;
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
let soundEnabled = true;
let health = 100; // 添加health变量

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    canvas.width = 800;
    canvas.height = 600;
    
    // 创建玩家
    player = new Player(canvas.width / 2, canvas.height - 50);
    
    // 重置游戏状态
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    powerUps = [];
    score = 0;
    currentLevel = 1;
    enemiesKilled = 0;
    
    // 初始化第一关
    initLevel(1);
    
    // 开始游戏循环
    gameState = 'playing';
    gameLoop = requestAnimationFrame(update);
    
    updateHUD();
}

// 初始化关卡
function initLevel(level) {
    currentLevel = level;
    
    // 根据关卡调整难度
    GAME_CONFIG.enemySpawnRate = level === 1 ? 1200 : Math.max(800, 2000 - level * 200);
    GAME_CONFIG.enemySpeed = level === 1 ? 2.5 : 2 + level * 0.5;
    
    // 重置计时器
    enemySpawnTimer = 0;
    powerUpSpawnTimer = 0;
    
    // 第一关开始时立即生成3个敌人增加挑战
    if (level === 1) {
        // 生成初始敌人
        enemies.push(new Enemy(Math.random() * (canvas.width - 60) + 30, -30, 'sql'));
        enemies.push(new Enemy(Math.random() * (canvas.width - 60) + 30, -80, 'kamikaze'));
        enemies.push(new Enemy(Math.random() * (canvas.width - 100) + 50, 30, 'elite')); // 添加精英怪
    }
    
    // 从第二关开始，每关开始时生成一个精英怪
    if (level >= 2) {
        enemies.push(new Enemy(Math.random() * (canvas.width - 100) + 50, 30, 'elite'));
    }
}

// 主游戏循环
function update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState !== 'playing') {
        gameLoop = requestAnimationFrame(update);
        return;
    }
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新玩家
    player.update(deltaTime);
    
    // 更新子弹
    bullets = bullets.filter(bullet => {
        bullet.update();
        return bullet.active;
    });
    
    // 更新敌人子弹
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.update();
        return bullet.active;
    });
    
    // 更新敌人
    enemies = enemies.filter(enemy => {
        enemy.update(deltaTime);
        return enemy.active;
    });
    
    // 更新粒子效果
    particles = particles.filter(particle => {
        particle.update();
        return particle.active;
    });
    
    // 更新道具
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        return powerUp.active;
    });
    
    // 碰撞检测：子弹 vs 敌人
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (bullet.active && enemy.active && bullet.checkCollision(enemy)) {
                bullet.active = false;
                enemy.takeDamage(1);
                createParticles(enemy.x, enemy.y, '#ffff00', 5);
                
                if (!enemy.active) {
                    enemiesKilled++;
                    playSound('explosion');
                }
            }
        });
    });
    
    // 碰撞检测：敌人子弹 vs 玩家
    enemyBullets.forEach(bullet => {
        if (bullet.active && bullet.checkCollision(player)) {
            bullet.active = false;
            player.takeDamage(15);
            createParticles(player.x, player.y, '#ff4444', 8);
        }
    });
    
    // 生成敌人
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= GAME_CONFIG.enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
    
    // 生成道具
    powerUpSpawnTimer += deltaTime;
    if (powerUpSpawnTimer >= GAME_CONFIG.powerUpSpawnRate) {
        powerUps.push(new PowerUp(Math.random() * (canvas.width - 40) + 20, -20));
        powerUpSpawnTimer = 0;
    }
    
    // 绘制所有对象
    player.draw();
    bullets.forEach(bullet => bullet.draw());
    enemyBullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    particles.forEach(particle => particle.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    
    // 检查关卡完成条件
    if (enemiesKilled >= currentLevel * 10) {
        levelComplete();
    }
    
    gameLoop = requestAnimationFrame(update);
}

// 生成敌人
function spawnEnemy() {
    let enemyType = 'sql';
    const rand = Math.random();
    
    if (currentLevel === 1) {
        // 第一关：增加精英怪，提高难度
        if (rand < 0.5) enemyType = 'sql';           // 50% SQL注入怪
        else if (rand < 0.8) enemyType = 'kamikaze'; // 30% 自爆怪
        else enemyType = 'elite';                    // 20% 精英怪
    } else if (currentLevel === 2) {
        // 第二关：引入投弹怪和分身怪
        if (rand < 0.3) enemyType = 'sql';           // 30% SQL注入怪
        else if (rand < 0.5) enemyType = 'xss';      // 20% XSS怪
        else if (rand < 0.65) enemyType = 'kamikaze'; // 15% 自爆怪
        else if (rand < 0.8) enemyType = 'elite';    // 15% 精英怪
        else if (rand < 0.9) enemyType = 'bomber';   // 10% 投弹怪
        else enemyType = 'clone';                    // 10% 分身怪
    } else {
        // 第三关及以后：所有类型，更多高级敌人
        if (rand < 0.2) enemyType = 'sql';           // 20% SQL注入怪
        else if (rand < 0.35) enemyType = 'xss';     // 15% XSS怪
        else if (rand < 0.45) enemyType = 'command'; // 10% 命令执行怪
        else if (rand < 0.55) enemyType = 'kamikaze'; // 10% 自爆怪
        else if (rand < 0.7) enemyType = 'elite';    // 15% 精英怪
        else if (rand < 0.85) enemyType = 'bomber';  // 15% 投弹怪
        else enemyType = 'clone';                    // 15% 分身怪
    }
    
    let x, y;
    if (enemyType === 'elite' || enemyType === 'bomber') {
        // 精英怪和投弹怪从屏幕顶部生成
        x = Math.random() * (canvas.width - 100) + 50;
        y = 30;
    } else if (enemyType === 'clone') {
        // 分身怪从屏幕上方生成，稍微靠下一点
        x = Math.random() * (canvas.width - 80) + 40;
        y = -50;
    } else {
        x = Math.random() * (canvas.width - 60) + 30;
        y = -30;
    }
    
    enemies.push(new Enemy(x, y, enemyType));
}

// 创建爆炸效果
function createExplosion(x, y) {
    createParticles(x, y, '#ff6600', GAME_CONFIG.particleCount);
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
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 4 + 2;
        this.active = true;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        
        if (this.life <= 0) {
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
    
    event.preventDefault();
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

// 暂停/继续游戏
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        lastTime = performance.now();
    }
}

// 更新HUD
function updateHUD() {
    // 检查元素是否存在再更新
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    const levelElement = document.getElementById('currentLevel');
    if (levelElement) {
        levelElement.textContent = currentLevel;
    }
    
    const healthElement = document.getElementById('healthFill');
    if (healthElement && player) {
        // 确保生命值不会低于0%，也不会超过100%
        const healthPercent = Math.max(0, Math.min(100, player.health));
        healthElement.style.width = healthPercent + '%';
        
        // 当生命值为0时，确保健康条完全消失但仍然可见容器
        if (healthPercent === 0) {
            healthElement.style.width = '0%';
        }
    }
}

// 关卡完成
function levelComplete() {
    currentLevel++;
    enemiesKilled = 0;
    
    // 奖励分数
    score += currentLevel * 500;
    
    initLevel(currentLevel);
    updateHUD();
}

// 游戏结束
function gameOver(victory) {
    gameState = 'gameOver';
    // 调用index.html中的showGameOver函数显示游戏结束界面
    if (typeof showGameOver === 'function') {
        showGameOver(victory);
    }
}

// 播放音效（简化版）
function playSound(type) {
    // 这里可以添加实际的音效播放逻辑
}

// 窗口大小调整
window.addEventListener('resize', function() {
    // 可以添加响应式设计逻辑
});

// 游戏初始化
window.addEventListener('load', function() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    initGame();
});

// 敌人子弹类
class EnemyBullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 6;
        this.height = 6;
        this.active = true;
        this.damage = 15;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 移除超出边界的子弹
        if (this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.active = false;
        }
    }
    
    checkCollision(other) {
        return Math.abs(this.x - other.x) < (this.width + other.width) / 2 &&
               Math.abs(this.y - other.y) < (this.height + other.height) / 2;
    }
    
    draw() {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 子弹光效
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
