# Java Class File Viewer

遗留问题：

- Float（32位浮点数）的输出还不完整，比如1.234输出成了1.2339999675750732。这是因为JS中只有Double类型的浮点数，将Float转成Double后，以更高的精度保留下来了。
- 目前只解析了Code、BootstrapMethods、ConstantValue、SourceFile、InnerClasses这几种属性值
- 缺少部分测试

Screenshot:

![hello-world](./hello-world.png)

Run:

```shell script
npm i && npm start
```

> This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
