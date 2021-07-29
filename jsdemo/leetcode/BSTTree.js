/*
 * @Author: your name
 * @Date: 2021-04-02 17:28:08
 * @LastEditTime: 2021-04-04 20:18:52
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\jsdemo\leetcode\Tree.js
 */
/**
 * @description: BinarySearchTree 二叉排序树
 * @param {*}
 * @return {*}
 */

class Tree {
  constructor(compareFn = defaultCompare) {
    this.compareFn = compareFn
    this.root = undefined
    this.frontArr = null
  }
  /**
   * @description: 添加节点
   * @param {*} key
   * @return {*}
   */
  addNode (key) {
    if (this.root == null) {
      this.root = new Node(key)
    } else {
      this.insertNode(this.root, key)
    }
  }
  insertNode (node, key) {
    if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      if (node.left == null) {
        node.left = new Node(key)
      } else {
        this.insertNode(node.left, key)
      }
    } else {
      if (node.right == null) {
        node.right = new Node(key)
      } else {
        this.insertNode(node.right, key)
      }
    }
  }
  /**
   * @description: 遍历  (type 1先序 2中序 3后序 )
   */
  traverse (type = '1') {
    this.frontArr = []
    this.traverseRecall(this.root, type)
    console.log('frontArr', this.frontArr);
  }
  traverseRecall (node, type) {
    if (node != null) {
      if (type === '1') { this.frontArr.push(node.key) }
      this.traverseRecall(node.left, type)
      if (type === '2') { this.frontArr.push(node.key) }
      this.traverseRecall(node.right, type)
      if (type === '3') { this.frontArr.push(node.key) }
    }
  }
  minNode () {
    let root = this.root
    while (root.left != null) {
      root = root.left
    }
    return root.key
  }
  maxNode () {
    let root = this.root
    while (root.right != null) {
      root = root.right
    }
    return root.key
  }
  indexOf (key) {
    return this.search(this.root, key)
  }
  search (node, key) {
    if (node.key === key) return true
    if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      if (node.left != null) {
        return this.search(node.left, key)
      } else {
        console.log(`没找到${key}`);
        return false
      }
    } else {
      if (node.right != null) {
        return this.search(node.right, key)
      } else {
        console.log(`没找到${key}`);
        return false
      }
    }
    // return true
  }
  delNodeOpt (key) {
    this.delNode(this.root, key)
  }
  delNode (node, key, parentNode = null, mode = 'left') {
    if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      if (node.left != null) {
        return this.delNode(node.left, key, node, 'left')
      } else {
        console.log(`没找到${key}`);
        return false
      }
    } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
      if (node.right != null) {
        return this.delNode(node.right, key, node, 'right')
      } else {
        console.log(`没找到${key}`);
        return false
      }
    } else {
      // 叶子节点
      if (node.left == null && node.right == null) {
        node = null
        if (parentNode) {
          parentNode[mode] = null
        }
      } else if (node.left !== null || node.right != null) { // 有一个子节点
        if (parentNode) {
          parentNode = node
        }
      } else { // 有两个子节点
        parentNode.left.right = JSON.parse(JSON.stringify(parentNode.right))
        parentNode = JSON.parse(JSON.stringify(parentNode.left))
      }

    }
  }
}
class Node {
  constructor(key) {
    this.left = undefined
    this.right = undefined
    this.key = key
  }
}

const Compare = {
  LESS_THAN: -1,
  BIGGER_THAN: 1
};

function defaultCompare (a, b) {
  if (a === b) { // {1} 
    return 0;
  }
  return a < b ? Compare.LESS_THAN : Compare.BIGGER_THAN; // {2} 
}


const tree = new Tree()

tree.addNode(6);
tree.addNode(9);
tree.addNode(8);
tree.addNode(7);
tree.addNode(10);
tree.addNode(5);
tree.addNode(4);
tree.addNode(3);
tree.addNode(2);
tree.addNode(1);

console.log('tree', tree)

tree.traverse('1')
tree.traverse('2')
tree.traverse('3')

console.log('max', tree.maxNode());
console.log('min', tree.minNode());

console.log(tree.indexOf(10))

tree.delNodeOpt(10)

tree.traverse('1')