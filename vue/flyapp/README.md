# auth

## 注意事项
大模块使用权限控制展示；
内容按接口返回的顺序和内容展示数据，不要写死。

## 单文件组件样式
样式写在各组件内部`style scoped`标签中，配合深度选择器`::v-deep`；
色值只能写在`styles/_variables.scss`中，方便开发后续的主题色切换功能。

## 按需加载
[element-ui](https://element.eleme.cn/#/zh-CN/component/quickstart)
[echarts](https://echarts.apache.org/zh/tutorial.html#%E5%9C%A8%E6%89%93%E5%8C%85%E7%8E%AF%E5%A2%83%E4%B8%AD%E4%BD%BF%E7%94%A8%20ECharts)