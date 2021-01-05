/*
 * @Author: your name
 * @Date: 2021-01-05 15:08:27
 * @LastEditTime: 2021-01-05 17:23:00
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\vue\d2-admin-elemeManage\src\menu\index.js
 */
import { uniqueId } from 'lodash'

/**
 * @description 给菜单数据补充上 path 字段
 * @description https://github.com/d2-projects/d2-admin/issues/209
 * @param {Array} menu 原始的菜单数据
 */
function supplementPath (menu) {
  return menu.map(e => ({
    ...e,
    path: e.path || uniqueId('d2-menu-empty-'),
    ...e.children ? {
      children: supplementPath(e.children)
    } : {}
  }))
}

export const menuHeader = supplementPath([
  { path: '/index', title: '首页', icon: 'home' },
  {
    title: '查看',
    icon: 'folder-o',
    children: [
      { path: '/all', title: '全部' },
      { path: '/cooking', title: '未上菜' },
      { path: '/finishing', title: '已上菜' }
    ]
  }
])

export const menuAside = supplementPath([
  { path: '/index', title: '首页', icon: 'home' },
  {
    title: '查看',
    icon: 'folder-o',
    children: [
      { path: '/all', title: '全部' },
      { path: '/cooking', title: '未上菜' },
      { path: '/finishing', title: '已上菜' }
    ]
  },
  {
    title: '管理',
    icon: 'folder-o',
    children: [
      { path: '/new', title: '新建菜品' },
      { path: '/del', title: '删除菜品' },
      { path: '/newType', title: '新建分类' },
      { path: '/allType', title: '所有分类' }
    ]
  }
])
