/**
 * @description: BinarySearchTree 二叉排序树
 * @param {*}
 * @return {*}
 */

class Tree {
  constructor(compareFn = defaultCompare) {
    this.compareFn = compareFn
    this.root = undefined
  }
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

tree.addNode(7);
tree.addNode(15);
tree.addNode(5);
tree.addNode(3);
tree.addNode(9);
tree.addNode(8);
tree.addNode(10);
tree.addNode(13);
tree.addNode(12);
tree.addNode(14);
tree.addNode(20);
tree.addNode(18);
tree.addNode(25);

console.log(tree)