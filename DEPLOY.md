# shtashen.cn 上线部署手册

把本仓库网站部署到阿里云服务器（上海）并绑定域名 shtashen.cn 的完整流程。

## 重要顺序（不可颠倒）

```
① 备案（1~3周） → ② 替换页脚备案号 → ③ 部署网站 → ④ DNS解析 → ⑤ HTTPS证书
```

**备案期间 shtashen.cn 不要做任何解析**（既不要指向阿里云服务器，也不要指向
GitHub Pages）——备案初审会检查域名可访问性，能被打开的域名会被驳回。
过渡期继续用 GitHub Pages 预览地址：
https://yeqifang0.github.io/tashen-website/

## ① 提交 ICP 备案（现在就可以做）

1. 阿里云控制台 → ECS/轻量应用服务器实例详情页 → 申请**备案服务码**
   （该服务器额度支持多个域名备案，已用 1 个，shtashen.cn 为第 2 个）
2. 打开 [阿里云ICP代备案系统](https://beian.aliyun.com/) → 开始备案
   - 主办单位：**上海塔伸科技有限公司**（企业备案）
   - 需要材料：营业执照、法定代表人身份证、网站负责人身份证、
     负责人核验（阿里云 App 人脸拍照）、核验单电子签
   - 网站名称：服务器压力测试任务编排调度软件
   - 网站域名：shtashen.cn（+ www.shtashen.cn）
   - 接入方式：填写备案服务码，指向已购服务器
3. 阿里云初审（1~2 个工作日）→ 提交管局审核（上海管局一般 1~3 周）
4. 通过后短信/邮件收到**备案号**（格式：沪ICP备XXXXXXXX号-X）

## ② 替换页脚备案号

拿到备案号后，全站 7 个页面页脚替换：
搜索 `沪ICP备XXXXXXXX号-X（备案通过后请替换）` → `沪ICP备XXXXXXXX号-X`
（链接已指向工信部 beian.miit.gov.cn，无需改动）

## ③ 部署网站到服务器

在服务器上执行（或让 ZCode 帮你部署）：

```bash
# 1) 安装 git 并拉取网站（或用 scp 上传）
sudo mkdir -p /var/www/tashen-website
sudo git clone https://github.com/yeqifang0/tashen-website.git /tmp/tashen-site
sudo rsync -a --exclude '.git' --exclude 'deploy' /tmp/tashen-site/ /var/www/tashen-website/

# 2) 配置 nginx（服务器上已有 nginx，追加站点即可）
sudo cp /var/www/tashen-website/deploy/nginx-tashen.conf /etc/nginx/conf.d/shtashen.conf
sudo nginx -t && sudo systemctl reload nginx

# 3) 开放端口：阿里云安全组确认 80/443 对 0.0.0.0/0 放行
```

nginx 配置文件在 `deploy/nginx-tashen.conf`（与服务器上已有站点互不影响，
通过 server_name 区分）。

## ④ DNS 解析（部署完成后）

阿里云域名控制台 → shtashen.cn → 解析设置，添加：

| 记录类型 | 主机记录 | 记录值 |
|---|---|---|
| A | @ | <服务器公网IP> |
| A | www | <服务器公网IP> |
（或 www 用 CNAME → shtashen.cn）

解析生效（约 10 分钟）后即可通过 http://shtashen.cn 访问。

## ⑤ HTTPS 免费证书

1. 阿里云控制台 → 数字证书管理服务（SSL 证书）→ 免费测试证书
   （个人测试 DV 证书，每年 20 张免费额度）→ 申请时绑定 shtashen.cn
2. 签发后下载 **nginx 版**证书，上传到服务器 `/etc/nginx/cert/`
3. 按 `deploy/nginx-tashen.conf` 中注释的 443 配置放开并 reload
4. 启用 80 → 443 的 301 跳转（配置文件中已写好）

## 验收清单

- [ ] http://shtashen.cn 和 https://shtashen.cn 均可访问
- [ ] 页脚显示真实备案号且可点击跳转工信部
- [ ] 在线下单流程正常（演示模式）
- [ ] GitHub Pages 旧链接 301 到新域名后，可在仓库 Settings → Pages
      移除 Custom domain（如果设置过）停用旧地址

## 后续：接入真实支付

备案 + 正式域名上线后，即可申请：
- 微信支付商户号（产品选 Native 扫码支付）
- 支付宝（当面付 / 电脑网站支付）

申请材料：营业执照、法人身份证、备案完成的 shtashen.cn、对公账户。
技术接入点已标注在 `js/order.js` 的【接入点】注释处。
