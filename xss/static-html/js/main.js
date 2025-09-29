/**
 * XSS挑战靶场 - 简化版JavaScript逻辑
 * 移除进度管理，所有关卡可直接访问
 */

// 显示XSS成功消息
function showXSSSuccess() {
    // 创建成功提示框
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success xss-success-alert';
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.animation = 'slideInRight 0.5s ease';
    alertDiv.innerHTML = `
        <strong>🎉 XSS攻击成功！</strong>
        <p>恭喜您成功执行了XSS代码！</p>
        <button type="button" class="close" onclick="this.parentElement.remove()">
            <span>&times;</span>
        </button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 5秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// XSS成功回调函数（保持兼容性）
function xssSuccess() {
    showXSSSuccess();
}

// 页面加载动画
function initPageAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'all 0.6s ease';
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面动画
    initPageAnimations();
});

// 导出全局函数
window.xssSuccess = xssSuccess;
window.showXSSSuccess = showXSSSuccess;