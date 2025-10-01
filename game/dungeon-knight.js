/**
 * 网络安全地牢骑士游戏
 * 类似元气骑士的HTML5游戏
 */

// 游戏状态
let gameState = 'menu'; // menu, playing, levelComplete, gameComplete
let currentLevel = 1;
let currentRoom = 4; // 中心房间开始 (0-8, 4是中心)
let totalLevels = 3;

// 画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏对象
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let rooms = [];
let walls = []; // 墙壁障碍物

// 输入控制
const keys = {};
const mouse = { x: 0, y: 0, pressed: false };

// 武器系统
const weaponTypes = [
    {
        name: '激光剑',
        damage: [25, 35],
        range: 150,
        attackSpeed: 1.2,
        color: '#00e5ff',
        type: 'melee'
    },
    {
        name: '等离子枪',
        damage: [15, 25],
        range: 300,
        attackSpeed: 2.0,
        color: '#ff4444',
        type: 'ranged'
    },
    {
        name: '电磁炮',
        damage: [35, 50],
        range: 400,
        attackSpeed: 0.8,
        color: '#ffaa00',
        type: 'ranged'
    },
    {
        name: '量子刀',
        damage: [20, 30],
        range: 120,
        attackSpeed: 2.5,
        color: '#aa00ff',
        type: 'melee'
    },
    {
        name: '网络病毒枪',
        damage: [18, 28],
        range: 250,
        attackSpeed: 1.8,
        color: '#00ff00',
        type: 'ranged'
    }
];

/**
 * 玩家类
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 3;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxEnergy = 100;
        this.energy = this.maxEnergy;
        this.weapon = this.getRandomWeapon();
        this.lastAttack = 0;
        this.invulnerable = 0;
        this.facing = 0; // 面向角度
        this.attackAnimation = 0; // 攻击动画计时器
        this.walkAnimation = 0; // 行走动画计时器
        this.isMoving = false; // 是否在移动
        this.dashCooldown = 0; // 冲刺冷却
        this.isDashing = false; // 是否在冲刺
    }

    /**
     * 获取随机武器
     */
    getRandomWeapon() {
        return weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    }

    /**
     * 更新玩家状态
     */
    update() {
        // 移动控制
        let dx = 0, dy = 0;
        this.isMoving = false;
        
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            dy -= this.speed;
            this.isMoving = true;
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            dy += this.speed;
            this.isMoving = true;
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            dx -= this.speed;
            this.isMoving = true;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            dx += this.speed;
            this.isMoving = true;
        }
    
        // 冲刺功能 (空格键)
        if (keys[' '] && this.dashCooldown <= 0 && this.energy >= 20) {
            this.isDashing = true;
            this.energy -= 20;
            this.dashCooldown = 120; // 2秒冷却
            dx *= 3;
            dy *= 3;
        }
    
        // 更新面向方向
        if (dx !== 0 || dy !== 0) {
            this.facing = Math.atan2(dy, dx);
        }
    
        // 边界检测和墙壁碰撞检测
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // 检查X轴移动
        if (newX >= 0 && newX <= canvas.width - this.width && !checkWallCollision(this, dx, 0)) {
            this.x = newX;
        }
        // 检查Y轴移动
        if (newY >= 0 && newY <= canvas.height - this.height && !checkWallCollision(this, 0, dy)) {
            this.y = newY;
        }
    
        // 检查房间切换
        this.checkRoomTransition();
    
        // 攻击控制
        if (mouse.pressed && Date.now() - this.lastAttack > 1000 / this.weapon.attackSpeed) {
            this.attack();
            this.lastAttack = Date.now();
            this.attackAnimation = 20; // 攻击动画持续时间
        }
    
        // 更新动画计时器
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        
        if (this.isMoving) {
            this.walkAnimation += 0.3;
        }
        
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }
        
        if (this.isDashing) {
            this.isDashing = false;
        }
    
        // 无敌时间递减
        if (this.invulnerable > 0) {
            this.invulnerable--;
        }
    
        // 能量恢复
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + 0.3);
        }
    }

    /**
     * 检查房间切换
     */
    checkRoomTransition() {
        const margin = 10;
        let newRoom = currentRoom;

        // 检查边界切换
        if (this.x <= margin && currentRoom % 3 > 0) {
            newRoom = currentRoom - 1;
            this.x = canvas.width - this.width - margin;
        } else if (this.x >= canvas.width - this.width - margin && currentRoom % 3 < 2) {
            newRoom = currentRoom + 1;
            this.x = margin;
        } else if (this.y <= margin && currentRoom >= 3) {
            newRoom = currentRoom - 3;
            this.y = canvas.height - this.height - margin;
        } else if (this.y >= canvas.height - this.height - margin && currentRoom < 6) {
            newRoom = currentRoom + 3;
            this.y = margin;
        }

        if (newRoom !== currentRoom) {
            currentRoom = newRoom;
            this.switchRoom();
        }
    }

    /**
     * 切换房间
     */
    switchRoom() {
        // 清除当前房间的子弹和粒子
        bullets = [];
        particles = [];
        
        // 生成新房间的敌人
        this.generateRoomEnemies();
        
        // 更新小地图
        updateMinimap();
        updateRoomInfo();
    }

    /**
     * 生成房间敌人
     */
    generateRoomEnemies() {
        enemies = [];
        const room = rooms[currentRoom];
        
        if (!room.cleared) {
            const enemyCount = 3 + Math.floor(Math.random() * 4) + currentLevel;
            
            for (let i = 0; i < enemyCount; i++) {
                let x, y;
                do {
                    x = Math.random() * (canvas.width - 40) + 20;
                    y = Math.random() * (canvas.height - 40) + 20;
                } while (this.getDistance(x, y, this.x, this.y) < 100);
                
                enemies.push(new Enemy(x, y, currentLevel));
            }
        }
    }

    /**
     * 攻击
     * 实现远程和近战攻击特效
     */
    attack() {
        if (this.energy < 20) return;
        
        this.energy -= 20;
        
        // 更新武器朝向
        const weaponAngle = Math.atan2(mouse.y - (this.y + this.height/2), mouse.x - (this.x + this.width/2));
        
        if (this.weapon.type === 'ranged') {
            // 根据武器类型确定子弹类型
            let bulletType = 'normal';
            let effectColor = this.weapon.color;
            
            switch(this.weapon.name) {
                case '等离子枪':
                    bulletType = 'plasma';
                    effectColor = '#ff4444';
                    break;
                case '电磁炮':
                    bulletType = 'laser';
                    effectColor = '#00e5ff';
                    break;
                case '网络病毒枪':
                    bulletType = 'energy';
                    effectColor = '#88ff00';
                    break;
            }
            
            // 远程武器发射子弹
            bullets.push(new Bullet(
                this.x + this.width/2,
                this.y + this.height/2,
                weaponAngle,
                Math.floor(Math.random() * (this.weapon.damage[1] - this.weapon.damage[0] + 1)) + this.weapon.damage[0],
                8,
                this.weapon.range,
                bulletType
            ));
            
            // 添加开火闪光特效
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(
                    this.x + this.width/2 + Math.cos(weaponAngle) * 20,
                    this.y + this.height/2 + Math.sin(weaponAngle) * 20,
                    effectColor,
                    'muzzle',
                    8 + Math.random() * 4,
                    0.9
                ));
            }
            
            // 添加后坐力效果
            for (let i = 0; i < 3; i++) {
                const recoilAngle = weaponAngle + Math.PI + (Math.random() - 0.5) * 0.5;
                particles.push(new Particle(
                    this.x + this.width/2 + Math.cos(weaponAngle) * 15,
                    this.y + this.height/2 + Math.sin(weaponAngle) * 15,
                    '#ffffff',
                    'hit',
                    3 + Math.random() * 2,
                    0.85
                ));
            }
            
            // 添加能量波动效果
            if (bulletType === 'energy' || bulletType === 'plasma') {
                for (let i = 0; i < 3; i++) {
                    const waveAngle = weaponAngle + (Math.random() - 0.5) * 0.3;
                    const distance = 30 + Math.random() * 20;
                    particles.push(new Particle(
                        this.x + this.width/2 + Math.cos(waveAngle) * distance,
                        this.y + this.height/2 + Math.sin(waveAngle) * distance,
                        effectColor + '80', // 半透明效果
                        'wave',
                        4 + Math.random() * 3,
                        0.92
                    ));
                }
            }
        } else {
            // 近战武器直接攻击
            this.meleeAttack();
        }
    }

    /**
     * 近战攻击
     * 实现剑气效果和打击特效
     */
    meleeAttack() {
        const attackRange = this.weapon.range;
        const damage = Math.floor(Math.random() * (this.weapon.damage[1] - this.weapon.damage[0] + 1)) + this.weapon.damage[0];
        
        // 获取攻击方向
        const attackAngle = Math.atan2(mouse.y - (this.y + this.height/2), mouse.x - (this.x + this.width/2));
        
        // 添加剑气特效
        for (let i = 0; i < 8; i++) {
            const angle = attackAngle - Math.PI/6 + (Math.PI/3) * (i/7);
            const distance = attackRange * 0.6 + Math.random() * (attackRange * 0.4);
            
            particles.push(new Particle(
                this.x + this.width/2 + Math.cos(angle) * (this.width/2 + i * 5),
                this.y + this.height/2 + Math.sin(angle) * (this.height/2 + i * 5),
                this.weapon.color,
                'slash',
                8 + Math.random() * 4,
                0.92
            ));
        }
        
        // 添加挥舞光效
        const swingPoints = 5;
        for (let i = 0; i < swingPoints; i++) {
            const swingAngle = attackAngle - Math.PI/4 + (Math.PI/2) * (i/(swingPoints-1));
            const swingDist = attackRange * 0.7;
            
            particles.push(new Particle(
                this.x + this.width/2 + Math.cos(swingAngle) * swingDist,
                this.y + this.height/2 + Math.sin(swingAngle) * swingDist,
                this.weapon.color === '#00e5ff' ? '#80f0ff' : '#ffcc00',
                'muzzle',
                6 + Math.random() * 3,
                0.94
            ));
        }
        
        // 检测敌人是否在攻击范围内
        enemies.forEach(enemy => {
            const distance = this.getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance <= attackRange) {
                enemy.takeDamage(damage);
                
                // 添加打击特效
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        enemy.x + enemy.width/2 + (Math.random() - 0.5) * enemy.width,
                        enemy.y + enemy.height/2 + (Math.random() - 0.5) * enemy.height,
                        this.weapon.color,
                        'hit',
                        5 + Math.random() * 3,
                        0.9
                    ));
                }
            }
        });
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        if (this.invulnerable > 0) return;
        
        this.health -= damage;
        this.invulnerable = 60; // 1秒无敌时间
        
        if (this.health <= 0) {
            this.health = 0;
            gameState = 'gameOver';
        }
        
        updatePlayerStats();
    }

    /**
     * 计算距离
     */
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /**
     * 绘制玩家
     */
    draw() {
        ctx.save();
        
        // 无敌时闪烁效果
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 冲刺时的残影效果
        if (this.isDashing) {
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 10;
        }
        
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // 绘制玩家身体 (圆形机器人)
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制玩家内核
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/4, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制方向指示器
        const directionLength = this.width/2 + 5;
        const dirX = centerX + Math.cos(this.facing) * directionLength;
        const dirY = centerY + Math.sin(this.facing) * directionLength;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
        
        // 绘制武器
        const weaponAngle = Math.atan2(mouse.y - centerY, mouse.x - centerX);
        const weaponLength = this.weapon.type === 'melee' ? 30 : 25;
        const weaponX = centerX + Math.cos(weaponAngle) * weaponLength;
        const weaponY = centerY + Math.sin(weaponAngle) * weaponLength;
        
        // 攻击动画效果
        if (this.attackAnimation > 0) {
            ctx.lineWidth = 4 + (this.attackAnimation / 5);
            ctx.shadowColor = this.weapon.color;
            ctx.shadowBlur = 5;
        } else {
            ctx.lineWidth = 3;
            ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = this.weapon.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(weaponX, weaponY);
        ctx.stroke();
        
        // 绘制武器末端
        if (this.weapon.type === 'melee') {
            // 近战武器末端 (剑刃)
            ctx.fillStyle = this.weapon.color;
            ctx.beginPath();
            ctx.arc(weaponX, weaponY, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 远程武器末端 (枪口)
            ctx.fillStyle = this.weapon.color;
            ctx.fillRect(weaponX - 2, weaponY - 2, 4, 4);
        }
        
        // 行走动画 (脚步粒子)
        if (this.isMoving && Math.floor(this.walkAnimation) % 10 === 0) {
            particles.push(new Particle(
                this.x + Math.random() * this.width,
                this.y + this.height,
                '#666666',
                'dust'
            ));
        }
        
        ctx.restore();
    }
}

/**
 * 敌人类
 */
class Enemy {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 1 + level * 0.3;
        this.maxHealth = 30 + level * 10;
        this.health = this.maxHealth;
        this.damage = 8 + level * 3;
        this.lastAttack = 0;
        this.attackCooldown = 1500;
        this.color = this.getEnemyColor();
        this.type = this.getEnemyType();
        this.facing = 0; // 面向角度
        this.attackAnimation = 0; // 攻击动画
        this.moveAnimation = 0; // 移动动画
        this.alertRadius = 120; // 警戒范围
        this.isAlert = false; // 是否警戒状态
        this.isAggressive = false; // 是否被激怒（受到攻击后持续追踪）
    }

    /**
     * 获取敌人颜色
     */
    getEnemyColor() {
        const colors = ['#ff4444', '#ff8800', '#8800ff', '#ff00ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取敌人类型
     */
    getEnemyType() {
        const types = ['virus', 'trojan', 'worm', 'spyware'];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * 更新敌人状态
     */
    update() {
        if (!player) return;
        
        // 计算与玩家的距离
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检查是否进入警戒状态或已被激怒
        this.isAlert = distance <= this.alertRadius || this.isAggressive;
        
        // 移动向玩家
        if (this.isAlert && distance > 0) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            
            // 检查墙壁碰撞
            if (!checkWallCollision(this, moveX, 0)) {
                this.x += moveX;
            }
            if (!checkWallCollision(this, 0, moveY)) {
                this.y += moveY;
            }
            
            // 更新面向方向
            this.facing = Math.atan2(dy, dx);
            
            // 移动动画
            this.moveAnimation += 0.2;
        }
        
        // 攻击玩家
        if (distance < 35 && Date.now() - this.lastAttack > this.attackCooldown) {
            player.takeDamage(this.damage);
            this.lastAttack = Date.now();
            this.attackAnimation = 30; // 攻击动画持续时间
        }
        
        // 更新动画计时器
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        this.health -= damage;
        // 受到攻击后变为激怒状态，持续追踪玩家
        this.isAggressive = true;
        
        if (this.health <= 0) {
            this.destroy();
        }
    }

    /**
     * 销毁敌人
     */
    destroy() {
        const index = enemies.indexOf(this);
        if (index > -1) {
            enemies.splice(index, 1);
            
            // 添加死亡特效
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    this.color
                ));
            }
            
            // 检查房间是否清空
            if (enemies.length === 0) {
                rooms[currentRoom].cleared = true;
                updateMinimap();
                this.checkLevelComplete();
            }
        }
    }

    /**
     * 检查关卡是否完成
     */
    checkLevelComplete() {
        const allCleared = rooms.every(room => room.cleared);
        if (allCleared) {
            gameState = 'levelComplete';
            document.getElementById('levelComplete').style.display = 'flex';
        }
    }

    /**
     * 绘制敌人
     */
    draw() {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        ctx.save();
        
        // 根据类型绘制不同形状的敌人
        switch(this.type) {
            case 'virus':
                this.drawVirus(centerX, centerY);
                break;
            case 'trojan':
                this.drawTrojan(centerX, centerY);
                break;
            case 'worm':
                this.drawWorm(centerX, centerY);
                break;
            case 'spyware':
                this.drawSpyware(centerX, centerY);
                break;
        }
        
        // 警戒状态指示
        if (this.isAlert) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.alertRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 攻击动画效果
        if (this.attackAnimation > 0) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.8 + (this.attackAnimation / 30) * 0.2;
        }
        
        // 绘制血条
        if (this.health < this.maxHealth) {
            const barWidth = this.width + 4;
            const barHeight = 4;
            const barY = this.y - 10;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 2, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x - 2, barY, (this.health / this.maxHealth) * barWidth, barHeight);
        }
        
        ctx.restore();
    }

    /**
     * 绘制病毒类型敌人
     */
    drawVirus(centerX, centerY) {
        // 主体 (带刺的圆形)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 病毒刺
        const spikes = 8;
        for (let i = 0; i < spikes; i++) {
            const angle = (i / spikes) * Math.PI * 2;
            const spikeLength = 6 + Math.sin(this.moveAnimation + i) * 2;
            const spikeX = centerX + Math.cos(angle) * (this.width/2 + spikeLength);
            const spikeY = centerY + Math.sin(angle) * (this.width/2 + spikeLength);
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * this.width/2, centerY + Math.sin(angle) * this.width/2);
            ctx.lineTo(spikeX, spikeY);
            ctx.stroke();
        }
        
        // 核心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制木马类型敌人
     */
    drawTrojan(centerX, centerY) {
        // 主体 (方形)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 伪装外壳
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        
        // 内部恶意代码
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
        
        // 数据流动效果
        if (this.isAlert) {
            for (let i = 0; i < 3; i++) {
                const flowX = this.x + (this.moveAnimation * 2 + i * 5) % this.width;
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(flowX, this.y + 2, 2, this.height - 4);
            }
        }
    }

    /**
     * 绘制蠕虫类型敌人
     */
    drawWorm(centerX, centerY) {
        // 蠕虫身体 (椭圆形)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width/2, this.height/3, this.facing, 0, Math.PI * 2);
        ctx.fill();
        
        // 蠕虫头部
        const headX = centerX + Math.cos(this.facing) * this.width/3;
        const headY = centerY + Math.sin(this.facing) * this.width/3;
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX, headY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 移动轨迹
        if (this.isAlert) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.width + Math.sin(this.moveAnimation) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * 绘制间谍软件类型敌人
     */
    drawSpyware(centerX, centerY) {
        // 主体 (菱形)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - this.height/2);
        ctx.lineTo(centerX + this.width/2, centerY);
        ctx.lineTo(centerX, centerY + this.height/2);
        ctx.lineTo(centerX - this.width/2, centerY);
        ctx.closePath();
        ctx.fill();
        
        // 监视眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/6, 0, Math.PI * 2);
        ctx.fill();
        
        // 扫描线
        if (this.isAlert) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            const scanAngle = this.moveAnimation * 0.1;
            const scanLength = this.alertRadius;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(scanAngle) * scanLength, centerY + Math.sin(scanAngle) * scanLength);
            ctx.stroke();
        }
    }
}

/**
 * 子弹类
 */
class Bullet {
    constructor(x, y, angle, damage, speed, range, type = 'normal') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.speed = speed;
        this.range = range;
        this.type = type;
        this.traveled = 0;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.trail = []; // 子弹轨迹
        this.maxTrailLength = 8; // 最大轨迹长度
        this.size = 3; // 子弹大小
        this.glow = 0; // 发光效果
        this.sparkles = []; // 火花效果
        
        // 根据子弹类型设置不同属性
        switch(type) {
            case 'laser':
                this.size = 2;
                this.maxTrailLength = 12;
                break;
            case 'plasma':
                this.size = 4;
                this.maxTrailLength = 6;
                break;
            case 'energy':
                this.size = 3;
                this.maxTrailLength = 10;
                break;
        }
    }

    update() {
        // 保存当前位置到轨迹
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        this.traveled += this.speed;
        
        // 更新发光效果
        this.glow = (this.glow + 0.2) % (Math.PI * 2);
        
        // 添加火花效果
        if (Math.random() < 0.3) {
            this.sparkles.push({
                x: this.x + (Math.random() - 0.5) * 4,
                y: this.y + (Math.random() - 0.5) * 4,
                life: 10,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
        
        // 更新火花
        this.sparkles = this.sparkles.filter(sparkle => {
            sparkle.x += sparkle.vx;
            sparkle.y += sparkle.vy;
            sparkle.life--;
            sparkle.vx *= 0.95;
            sparkle.vy *= 0.95;
            return sparkle.life > 0;
        });
        
        return this.traveled < this.range;
    }

    draw(ctx) {
        ctx.save();
        
        // 绘制轨迹
        if (this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (i + 1) / this.trail.length * 0.6;
                const size = (i + 1) / this.trail.length * this.size;
                
                ctx.globalAlpha = alpha;
                
                // 根据子弹类型设置轨迹颜色
                switch(this.type) {
                    case 'laser':
                        ctx.fillStyle = '#ff0040';
                        break;
                    case 'plasma':
                        ctx.fillStyle = '#00ff80';
                        break;
                    case 'energy':
                        ctx.fillStyle = '#4080ff';
                        break;
                    default:
                        ctx.fillStyle = '#ffff00';
                }
                
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.globalAlpha = 1;
        
        // 绘制发光效果
        const glowIntensity = 0.5 + Math.sin(this.glow) * 0.3;
        ctx.shadowBlur = 15 * glowIntensity;
        
        // 绘制主子弹
        switch(this.type) {
            case 'laser':
                ctx.shadowColor = '#ff0040';
                ctx.fillStyle = '#ff0040';
                // 激光子弹 - 细长形状
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillRect(-6, -1, 12, 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-4, -0.5, 8, 1);
                ctx.restore();
                break;
                
            case 'plasma':
                ctx.shadowColor = '#00ff80';
                ctx.fillStyle = '#00ff80';
                // 等离子子弹 - 脉动圆形
                const plasmaSize = this.size + Math.sin(this.glow * 2) * 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, plasmaSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, plasmaSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'energy':
                ctx.shadowColor = '#4080ff';
                ctx.fillStyle = '#4080ff';
                // 能量子弹 - 菱形
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle + this.glow * 0.5);
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size, 0);
                ctx.lineTo(0, this.size);
                ctx.lineTo(-this.size, 0);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 0.5);
                ctx.lineTo(this.size * 0.5, 0);
                ctx.lineTo(0, this.size * 0.5);
                ctx.lineTo(-this.size * 0.5, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;
                
            default:
                // 普通子弹
                ctx.shadowColor = '#ffff00';
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
        }
        
        // 绘制火花效果
        ctx.shadowBlur = 5;
        this.sparkles.forEach(sparkle => {
            ctx.globalAlpha = sparkle.life / 10;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

/**
 * 粒子类
 * 用于创建各种视觉特效
 */
class Particle {
    constructor(x, y, color, type = 'normal', size = 5, decay = 0.95) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.color = color;
        this.type = type; // normal, muzzle, swing, wave, hit
        this.size = size;
        this.decay = decay;
        this.life = 30;
        this.maxLife = 30;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        
        // 根据类型设置特殊属性
        switch(type) {
            case 'muzzle':
                this.life = 15;
                this.maxLife = 15;
                this.size = 8 + Math.random() * 4;
                break;
            case 'swing':
                this.life = 20;
                this.maxLife = 20;
                this.vx *= 0.3;
                this.vy *= 0.3;
                break;
            case 'wave':
                this.life = 25;
                this.maxLife = 25;
                this.size = size;
                this.vx *= 1.5;
                this.vy *= 1.5;
                break;
            case 'hit':
                this.life = 20;
                this.maxLife = 20;
                this.size = 3 + Math.random() * 5;
                this.vx *= 2;
                this.vy *= 2;
                break;
        }
    }

    /**
     * 更新粒子
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.decay;
        this.vy *= this.decay;
        this.life--;
        this.rotation += 0.1;
        
        if (this.life <= 0) {
            const index = particles.indexOf(this);
            if (index > -1) {
                particles.splice(index, 1);
            }
        }
    }

    /**
     * 绘制粒子
     */
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        
        // 根据粒子类型绘制不同效果
        switch(this.type) {
            case 'muzzle':
                // 枪口火焰效果
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, this.color);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'swing':
                // 武器挥舞轨迹
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (this.life / this.maxLife), 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'wave':
                // 武器光波效果
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                ctx.globalAlpha = this.life / this.maxLife * 0.7;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (0.5 + 0.5 * (1 - this.life / this.maxLife)), 0, Math.PI * 2);
                ctx.fill();
                
                // 内部光芒
                ctx.globalAlpha = this.life / this.maxLife * 0.9;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.4 * (1 - this.life / this.maxLife * 0.5), 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'hit':
                // 击中效果
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 8;
                
                // 星形粒子
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = Math.PI * 2 / 5 * i;
                    const innerRadius = this.size * 0.4;
                    const outerRadius = this.size;
                    
                    if (i === 0) {
                        ctx.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                    } else {
                        ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                    }
                    
                    const nextAngle = Math.PI * 2 / 5 * (i + 0.5);
                    ctx.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;
                
            default:
                // 默认粒子效果
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size || 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
}

/**
 * 初始化游戏
 */
function initGame() {
    // 初始化房间
    rooms = [];
    for (let i = 0; i < 9; i++) {
        rooms.push({
            id: i,
            cleared: false,
            explored: i === 4 // 只有中心房间被探索
        });
    }
    
    // 创建玩家
    player = new Player(canvas.width / 2, canvas.height / 2);
    
    // 生成房间墙壁
    generateRoomWalls();
    
    // 生成初始房间敌人
    player.generateRoomEnemies();
    
    // 更新UI
    updateMinimap();
    updateWeaponInfo();
    updatePlayerStats();
    updateLevelInfo();
    updateRoomInfo();
}

/**
 * 开始游戏
 */
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameState = 'playing';
    currentLevel = 1;
    currentRoom = 4;
    initGame();
}

/**
 * 下一关
 */
function nextLevel() {
    currentLevel++;
    if (currentLevel > totalLevels) {
        gameState = 'gameComplete';
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('rewardScreen').style.display = 'flex';
    } else {
        document.getElementById('levelComplete').style.display = 'none';
        gameState = 'playing';
        currentRoom = 4;
        
        // 重置玩家状态
        player.health = player.maxHealth;
        player.energy = player.maxEnergy;
        player.weapon = player.getRandomWeapon();
        
        initGame();
    }
}

/**
 * 返回主菜单
 * 隐藏当前界面，显示开始界面
 */
function backToMenu() {
    // 隐藏所有界面
    document.getElementById('instructionsScreen').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    
    // 显示开始界面
    document.getElementById('startScreen').style.display = 'flex';
    
    // 重置游戏状态
    gameState = 'menu';
}

/**
 * 重新开始游戏
 */
function restartGame() {
    gameState = 'menu';
    currentLevel = 1;
    document.getElementById('rewardScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
}

/**
 * 更新小地图
 */
function updateMinimap() {
    const minimapGrid = document.getElementById('minimapGrid');
    minimapGrid.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'minimap-room';
        
        if (i === currentRoom) {
            roomDiv.classList.add('current');
        } else if (rooms[i].cleared) {
            roomDiv.classList.add('cleared');
        } else if (rooms[i].explored) {
            roomDiv.classList.add('explored');
        } else {
            roomDiv.classList.add('unexplored');
        }
        
        minimapGrid.appendChild(roomDiv);
    }
}

/**
 * 更新武器信息
 */
function updateWeaponInfo() {
    if (!player) return;
    
    document.getElementById('weaponName').textContent = player.weapon.name;
    document.getElementById('weaponStats').textContent = 
        `伤害: ${player.weapon.damage[0]}-${player.weapon.damage[1]} | 射程: ${player.weapon.range}px | 攻速: ${player.weapon.attackSpeed}/s`;
}

/**
 * 更新玩家状态
 */
function updatePlayerStats() {
    if (!player) return;
    
    const healthPercent = (player.health / player.maxHealth) * 100;
    const energyPercent = (player.energy / player.maxEnergy) * 100;
    
    document.getElementById('healthFill').style.width = healthPercent + '%';
    document.getElementById('energyFill').style.width = energyPercent + '%';
}

/**
 * 更新关卡信息
 */
function updateLevelInfo() {
    document.getElementById('currentLevel').textContent = currentLevel;
}

/**
 * 更新房间信息
 */
function updateRoomInfo() {
    document.getElementById('roomInfo').textContent = `房间 ${currentRoom + 1}/9`;
}

/**
 * 游戏主循环
 */
function gameLoop() {
    // 清空画布
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        // 绘制墙壁
        walls.forEach(wall => {
            wall.draw();
        });
        
        // 更新游戏对象
        if (player) {
            player.update();
            player.draw();
        }
        
        enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();
        });
        
        // 更新子弹并检查碰撞
        bullets = bullets.filter(bullet => {
            const stillAlive = bullet.update();
            
            // 检查子弹与敌人的碰撞
            let hitEnemy = false;
            enemies.forEach(enemy => {
                const dx = bullet.x - (enemy.x + enemy.width/2);
                const dy = bullet.y - (enemy.y + enemy.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.width/2 + bullet.size) {
                    // 子弹击中敌人
                    enemy.takeDamage(bullet.damage);
                    hitEnemy = true;
                    
                    // 添加击中特效
                    for (let i = 0; i < 5; i++) {
                        particles.push(new Particle(
                            bullet.x,
                            bullet.y,
                            '#ffff00'
                        ));
                    }
                }
            });
            
            // 检查子弹与墙壁的碰撞
            let hitWall = false;
            walls.forEach(wall => {
                if (bullet.x >= wall.x && bullet.x <= wall.x + wall.width &&
                    bullet.y >= wall.y && bullet.y <= wall.y + wall.height) {
                    hitWall = true;
                    
                    // 添加墙壁击中特效
                    for (let i = 0; i < 3; i++) {
                        particles.push(new Particle(
                            bullet.x,
                            bullet.y,
                            '#888888'
                        ));
                    }
                }
            });
            
            // 检查子弹是否超出边界
            const outOfBounds = bullet.x < 0 || bullet.x > canvas.width || 
                              bullet.y < 0 || bullet.y > canvas.height;
            
            if (!hitEnemy && !hitWall && stillAlive && !outOfBounds) {
                bullet.draw(ctx);
                return true;
            }
            return false;
        });
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 更新UI
        updatePlayerStats();
    }
    
    requestAnimationFrame(gameLoop);
}

// 事件监听器
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    mouse.pressed = true;
});

canvas.addEventListener('mouseup', (e) => {
    mouse.pressed = false;
});

// 启动游戏循环
gameLoop();

/**
 * 显示游戏说明界面
 */
function showInstructions() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('instructionsScreen').style.display = 'flex';
}

/**
 * 从游戏说明界面开始游戏
 */
function startGameFromInstructions() {
    document.getElementById('instructionsScreen').style.display = 'none';
    startGame();
}

/**
 * 墙壁类
 */
class Wall {
    constructor(x, y, width, height, type = 'horizontal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'horizontal' 或 'vertical'
        this.color = '#444444';
        this.borderColor = '#666666';
    }

    /**
     * 检查与其他对象的碰撞
     */
    checkCollision(obj) {
        return obj.x < this.x + this.width &&
               obj.x + obj.width > this.x &&
               obj.y < this.y + this.height &&
               obj.y + obj.height > this.y;
    }

    /**
     * 绘制墙壁
     */
    draw() {
        ctx.save();
        
        // 绘制墙壁主体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制墙壁边框
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 添加纹理效果
        ctx.fillStyle = '#555555';
        if (this.type === 'horizontal') {
            // 水平墙壁纹理
            for (let i = 0; i < this.width; i += 20) {
                ctx.fillRect(this.x + i, this.y + 2, 2, this.height - 4);
            }
        } else {
            // 垂直墙壁纹理
            for (let i = 0; i < this.height; i += 20) {
                ctx.fillRect(this.x + 2, this.y + i, this.width - 4, 2);
            }
        }
        
        ctx.restore();
    }
}

/**
 * 生成房间墙壁
 */
function generateRoomWalls() {
    walls = [];
    
    // 根据房间类型生成不同的墙壁布局
    const wallConfigs = [
        // 配置1: 水平墙壁
        [
            { x: 100, y: 200, width: 200, height: 20, type: 'horizontal' },
            { x: 500, y: 300, width: 150, height: 20, type: 'horizontal' }
        ],
        // 配置2: 垂直墙壁
        [
            { x: 200, y: 100, width: 20, height: 200, type: 'vertical' },
            { x: 400, y: 250, width: 20, height: 150, type: 'vertical' }
        ],
        // 配置3: 混合墙壁
        [
            { x: 150, y: 150, width: 180, height: 20, type: 'horizontal' },
            { x: 450, y: 100, width: 20, height: 180, type: 'vertical' },
            { x: 300, y: 350, width: 120, height: 20, type: 'horizontal' }
        ],
        // 配置4: L形墙壁
        [
            { x: 200, y: 200, width: 150, height: 20, type: 'horizontal' },
            { x: 200, y: 200, width: 20, height: 120, type: 'vertical' }
        ],
        // 配置5: 十字形墙壁
        [
            { x: 300, y: 180, width: 20, height: 140, type: 'vertical' },
            { x: 220, y: 240, width: 180, height: 20, type: 'horizontal' }
        ]
    ];
    
    // 随机选择一个墙壁配置
    const config = wallConfigs[Math.floor(Math.random() * wallConfigs.length)];
    
    config.forEach(wallData => {
        walls.push(new Wall(wallData.x, wallData.y, wallData.width, wallData.height, wallData.type));
    });
}

/**
 * 检查对象与墙壁的碰撞
 */
function checkWallCollision(obj, dx, dy) {
    const newX = obj.x + dx;
    const newY = obj.y + dy;
    
    for (let wall of walls) {
        if (newX < wall.x + wall.width &&
            newX + obj.width > wall.x &&
            newY < wall.y + wall.height &&
            newY + obj.height > wall.y) {
            return true;
        }
    }
    return false;
}