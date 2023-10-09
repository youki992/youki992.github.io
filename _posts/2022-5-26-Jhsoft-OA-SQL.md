
# 金和OA C6代码审计

## SQL注入

金和版本C6V3.0的n day，年前同事透露了金和OA这个n day，我眼疾手快截了图下来并记了路径。

由于当时还在实习太菜了，未学习C#的代码审计，因此没有深究漏洞成因。这几天整理去年的材料时发现手上正好有新版的金和OA备份文件，就简单来审计利用链。

[![XZ161A.png](https://s1.ax1x.com/2022/05/26/XZ161A.png)](https://imgtu.com/i/XZ161A)

漏洞在jhsoft.mobileapp/AndroidSevices/HomeService.asmx/GetHomeInfo方法中，其中HomeService为Webservice文件

[![XZ1RnP.png](https://s1.ax1x.com/2022/05/26/XZ1RnP.png)](https://imgtu.com/i/XZ1RnP)

[![XZ1IhQ.png](https://s1.ax1x.com/2022/05/26/XZ1IhQ.png)](https://imgtu.com/i/XZ1IhQ)

在HomeService的GetHomeInfo方法中，首先stringBuilder新建了字符串常量池

[![XZ1Tpj.png](https://s1.ax1x.com/2022/05/26/XZ1Tpj.png)](https://imgtu.com/i/XZ1Tpj)

之后调用GetQuickUserInfo查询userID

[![XZ3ZND.png](https://s1.ax1x.com/2022/05/26/XZ3ZND.png)](https://imgtu.com/i/XZ3ZND)

再return抽象类ExecProcReDataTable，没有可控参数拼接

[![XZ3VAO.png](https://s1.ax1x.com/2022/05/26/XZ3VAO.png)](https://imgtu.com/i/XZ3VAO)

回到GetHomeInfo方法，进入quickUserInfo判断条件，由于quickUserInfo数组并不存在PhotoURL参数，text为空，进入判断MapAndFindFilebyRelativeFilePath方法。

[![XZ3dvn.png](https://s1.ax1x.com/2022/05/26/XZ3dvn.png)](https://imgtu.com/i/XZ3dvn)

判断为false，text设为空，释放类quickUserInfo。

[![XZ3ags.png](https://s1.ax1x.com/2022/05/26/XZ3ags.png)](https://imgtu.com/i/XZ3ags)

text为空进入条件string userSex = GetUserSex(userID);

此处就可以看到userId拼接进了SQL语句中进行处理，造成了SQL注入

> string queryString = "select DossValue from dossiervalue a left join
> users b on a.RegCode=b.userid where a.DossierFieldID='3' and
> b.userid='" + userId + "'";

[![XZ3U3j.png](https://s1.ax1x.com/2022/05/26/XZ3U3j.png)](https://imgtu.com/i/XZ3U3j)

最后它的利用POC是：

http://XXXX/c6/jhsoft.mobileapp/AndroidSevices/HomeService.asmx/GetHomeInfo?userID=payload


##知识星球推广

![image](https://github.com/youki992/youki992.github.io/blob/master/others/x.png)
