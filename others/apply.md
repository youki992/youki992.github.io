## SMTP Mailing Queue

Cross-Site Scripting (XSS) vulnerability in WP SMTP Mailing Queue Plugin <= 2.0.0 at WordPress.

[![pSztOQe.png](https://s1.ax1x.com/2023/02/24/pSztOQe.png)](https://imgse.com/i/pSztOQe)
 - [ ] STEPS:
 
1.After installing the plugin, click Settings
[![pSztxeA.png](https://s1.ax1x.com/2023/02/24/pSztxeA.png)](https://imgse.com/i/pSztxeA)
2.click Tools, jump to the following page
[![pSzBhpq.png](https://s1.ax1x.com/2023/02/24/pSzBhpq.png)](https://imgse.com/i/pSzBhpq)
Put poc in Message text then click Send Test Email

POC：

    </textarea><img src=1 onerror=alert(/xss/)><textarea>

  

Then XSS vulnerability triggered
[![pSzszj0.png](https://s1.ax1x.com/2023/02/24/pSzszj0.png)](https://imgse.com/i/pSzszj0)
[![pSzsRtH.png](https://s1.ax1x.com/2023/02/24/pSzsRtH.png)](https://imgse.com/i/pSzsRtH)
