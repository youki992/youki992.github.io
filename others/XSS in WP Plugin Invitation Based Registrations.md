
WP Plugin Link : https://wordpress.org/plugins/invitation-based-registrations/
Invitation Based Registrations, WordPress plugin before 2.2.83 does not fully filter the content of the POST input, resulting in a stored XSS vulnerability.
[![X2gwJU.png](https://s1.ax1x.com/2022/06/13/X2gwJU.png)](https://imgtu.com/i/X2gwJU)
Install the plugin,  click one of the settings and post XSS POC
[![X2g2o6.png](https://s1.ax1x.com/2022/06/13/X2g2o6.png)](https://imgtu.com/i/X2g2o6)
The POC is :
```Plaintext
" onmouseleave=alert(/xss/)>
```
Save settings
Then the XSS vulnerability is triggered when your mouse leaves the input box
[![X2goyd.jpg](https://s1.ax1x.com/2022/06/13/X2goyd.jpg)](https://imgtu.com/i/X2goyd)