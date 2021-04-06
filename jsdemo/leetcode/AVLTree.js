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
      return node
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

const BalanceFactor = {
  UNBALANCED_RIGHT: 1,
  SLIGHTLY_UNBALANCED_RIGHT: 2,
  BALANCED: 3,
  SLIGHTLY_UNBALANCED_LEFT: 4,
  UNBALANCED_LEFT: 5
};

class AVLTree extends Tree {
  constructor(compareFn = defaultCompare) {
    super(compareFn)
    this.compareFn = compareFn
    this.root = null
  }
  getHeight () {
    return this.getHeightopt(this.root)
  }
  getHeightopt (node) {
    if (node == null) {
      return -1
    }
    return Math.max(this.getHeightopt(node.left), this.getHeightopt(node.right)) + 1
  }
  getBalance () {
    return this.getBalanceFactor(this.root)
  }
  getBalanceFactor (node) {
    // console.log('left', this.getHeightopt(node.left))
    // console.log('right', this.getHeightopt(node.right))
    const heightDifference = this.getHeightopt(node.left) -
      this.getHeightopt(node.right);
    switch (heightDifference) {
      case -2:
        return BalanceFactor.UNBALANCED_RIGHT;
      case -1:
        return BalanceFactor.SLIGHTLY_UNBALANCED_RIGHT;
      case 1:
        return BalanceFactor.SLIGHTLY_UNBALANCED_LEFT;
      case 2:
        return BalanceFactor.UNBALANCED_LEFT;
      default:
        return BalanceFactor.BALANCED;
    }
  }
  rotationLL (node) {
    let left = node.left
    node.left = left.right
    left.right = node
    return left
  }
  rotationRR (node) {
    let right = node.right
    node.right = right.left
    right.left = node
    return right
  }
  rotationLR (node) {
    node.left = this.rotationRR(node.left);
    return this.rotationLL(node);
  }
  rotationRL (node) {
    node.right = this.rotationLL(node.right);
    return this.rotationRR(node);
  }
  insert (key) {
    this.root = this.insertNode(this.root, key);
  }
  insertNode (node, key) {
    // 像在 BST 树中一样插入节点
    if (node == null) {
      return new Node(key);
    } else if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
      node.left = this.insertNode(node.left, key);
    } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
      node.right = this.insertNode(node.right, key);
    } else {
      return node; // 重复的键
    }
    // 如果需要，将树进行平衡操作
    const balanceFactor = this.getBalanceFactor(node); // {1} 
    if (balanceFactor === BalanceFactor.UNBALANCED_LEFT) { // {2} 
      if (this.compareFn(key, node.left.key) === Compare.LESS_THAN) { // {3} 
        node = this.rotationLL(node); // {4} 
      } else {
        return this.rotationLR(node); // {5} 
      }
    }
    if (balanceFactor === BalanceFactor.UNBALANCED_RIGHT) { // {6} 
      if (
        this.compareFn(key, node.right.key) === Compare.BIGGER_THAN
      ) { // {7} 
        node = this.rotationRR(node); // {8} 
      } else {
        return this.rotationRL(node); // {9} 
      }
    }
    return node;
  }
  removeNode (node, key) {
    node = super.removeNode(node, key); // {1} 
    if (node == null) {
      return node; // null，不需要进行平衡
    }
    // 检测树是否平衡
    const balanceFactor = this.getBalanceFactor(node); // {2} 
    if (balanceFactor === BalanceFactor.UNBALANCED_LEFT) { // {3} 
      const balanceFactorLeft = this.getBalanceFactor(node.left); // {4} 
      if (
        balanceFactorLeft === BalanceFactor.BALANCED ||
        balanceFactorLeft === BalanceFactor.SLIGHTLY_UNBALANCED_LEFT
      ) { // {5} 
        return this.rotationLL(node); // {6} 
      }
      if (
        balanceFactorLeft === BalanceFactor.SLIGHTLY_UNBALANCED_RIGHT
      ) { // {7} 
        return this.rotationLR(node.left); // {8} 
      }
    }
    if (balanceFactor === BalanceFactor.UNBALANCED_RIGHT) { // {9} 
      const balanceFactorRight = this.getBalanceFactor(node.right); // {10} 
      if (
        balanceFactorRight === BalanceFactor.BALANCED ||
        balanceFactorRight === BalanceFactor.SLIGHTLY_UNBALANCED_RIGHT
      ) { // {11} 
        return this.rotationRR(node); // {12} 
      }
      if (
        balanceFactorRight === BalanceFactor.SLIGHTLY_UNBALANCED_LEFT
      ) { // {13} 
        return this.rotationRL(node.right); // {14} 
      }
    }
    return node;
  }
}


const tree = new AVLTree()

tree.insert(50);
tree.insert(30);
tree.insert(10);
tree.insert(40);
// tree.insert(5);
// tree.insert(11);
tree.insert(40);
// tree.insert(31);
// tree.insert(42);
tree.insert(70);
tree.insert(31);

console.log(tree.getHeight())

// console.log(tree.getBalance())

// tree.insert(11)
// tree.insert(12)

// console.log(tree.getHeight(this.root));
// console.log(tree.getBalance())