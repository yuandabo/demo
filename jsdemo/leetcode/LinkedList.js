/**
 * @description:  链表类
 * @param {*}
 * @return {*}
 */

class LinkedList {
  constructor(equals = equalsFn) {
    this.head = undefined  // 开始节点
    this.count = 0   // 链表长度
    this.equals = equals
  }
  addNode (element) {
    const node = new Node(element)
    if (this.head == null) {
      this.head = node
    } else {
      let current = this.head
      while (current.next != null) {
        current = current.next
      }
      current.next = node
    }
    this.count++
  }
  delNode (index) {
    if (index > this.count) {
      console.log('错误索引！')
      return
    }
    let current = this.head;
    if (index === 0) {
      this.head = current.next
    } else {
      let previous  // 上一节点
      for (let i = 0; i < index; i++) {
        previous = current
        current = current.next || undefined // 下一节点
      }
      previous.next = current.next
    }
    this.count--
    return current
  }
  getCount () {
    return this.count
  }
  indexOf (element) {
    let current = this.head;
    for (let i = 0; i < this.count; i++) {
      if (this.equals(element, current.element)) return i
      current = current.next
    }
  }
}

class Node {
  constructor(element) {
    this.element = element  // 节点存储内容
    this.next = undefined  // 下一节点
  }
}

function equalsFn (a, b) {
  return a === b
}

const linkList = new LinkedList()
linkList.addNode('1')
linkList.addNode('2')
linkList.addNode('3')
console.log(linkList.indexOf('2'))