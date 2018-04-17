# passport-qyweixin v1.0.3


##支持功能

* 企业微信登录

## 安装

    $ npm install passport-qyweixin

## 使用
#### Configure  Strategy

```js

 passport.use(new QYStrategy({
        appID: {APPID}, // corpid
        agentID: {agentID},
        secretKey: {secretKey}, // corpsecret
        state: {state} || 'login' // 默认 login
        redirectUrl: {redirectUrl},
        getuserdetail: {getuserdetail} || false // 获取用户相信信息
        passReqToCallback: {passReqToCallback} || false // 默认false
      },
      function(user, done) {
          if (user && user.userid) {
              done(null, user)
          } else {
              done(null, false)
          }
      }
));

```

#### Authenticate Requests

```js
  router.get('/auth/xx', passport.authenticate('qyweixin', {
    failureRedirect: '/auth/fail',
    successReturnToOrRedirect: '/'
  }));
```


If no callbackURL is specified, the same request url will be used.

#### Authentication Callback

```js
  router.get('/auth/wechat/qyweixin', passport.authenticate('qyweixin', {
    failureRedirect: '/auth/fail',
    successReturnToOrRedirect: '/'
  }));
```

## License

Copyright (c) 2016 Sharkseven  
Licensed under the MIT license.
