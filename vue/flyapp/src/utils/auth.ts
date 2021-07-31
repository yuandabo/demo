interface PERMISSION_TREE_MENU_TYPE {
  name: string
  permission: string
  children?: PERMISSION_TREE_MENU_TYPE[]
}

interface PERMISSION_TREE_TYPE {
  system: {
    systemCode: string,
    systemName: string
  }
  menu: PERMISSION_TREE_MENU_TYPE
}

const PERMISSION_TREE: PERMISSION_TREE_TYPE = {
  system: {
    systemCode: 'AUTH',
    systemName: '权限系统'
  },
  menu: {
    name: 'AUTH根节点',
    permission: 'AUTH:auth',
    children: [
      {
        name: '用户管理',
        permission: 'web:personnelManage',
        children: [
          {
            name: '新增用户',
            permission: 'AUTH:auth:user:add'
          },
          {
            name: '分配角色',
            permission: 'AUTH:auth:user:addUserRoles'
          },
          {
            name: '删除用户',
            permission: 'AUTH:auth:user:delete'
          },
          {
            name: '用户列表',
            permission: 'AUTH:auth:user:list'
          },
          {
            name: '编辑用户',
            permission: 'AUTH:auth:user:update'
          },
          {
            name: '启用/禁用',
            permission: 'AUTH:auth:user:updateStatus'
          }
        ]
      },
      {
        name: '角色管理',
        permission: 'web:roleManage',
        children: [
          {
            name: '获取角色列表',
            permission: 'AUTH:auth:role:list'
          },
          {
            name: '新增角色',
            permission: 'AUTH:auth:role:add'
          },
          {
            name: '编辑-启用/禁用',
            permission: 'AUTH:auth:role:editRoleStatus'
          },
          {
            name: '删除角色',
            permission: 'AUTH:auth:role:delete'
          },
          {
            name: '更新角色',
            permission: 'AUTH:auth:role:updateRole'
          },
          {
            name: '查询授权角色用户列表',
            permission: 'AUTH:auth:role:roleUserList'
          },
          {
            name: '分配功能权限',
            permission: 'AUTH:auth:role:allotRoleMenu'
          },
          {
            name: '分配数据权限',
            permission: 'AUTH:auth:role:allotRoleDataScope'
          },
          {
            name: '角色分配用户',
            permission: 'AUTH:auth:role:allotRoleUser'
          }
        ]
      }
    ]
  }
}

export default PERMISSION_TREE
