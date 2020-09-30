/*
 * @Author: your name
 * @Date: 2020-09-28 16:59:11
 * @LastEditTime: 2020-09-28 17:00:42
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \blogdemo\plugins\components.js
 */
import Vue from 'vue'
// import Comment from '../components/comment.vue'
// import EditorEdit from '../components/editor-edit.vue'
import EditorPreview from '../components/editor-preview.vue'
// import BlogList from '../components/blog-list.vue'
// import BlogNav from '../components/blog-nav.vue'

[EditorPreview].forEach((component) => {
  Vue.component(component.name, component)
})
