import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** 下拉刷新：触发阈值（阻尼后位移）与橡皮筋参数（ui_m_list.html，UI-IXD-13） */
const PULL_THRESHOLD = 56
const PULL_DAMPING = 0.4
const PULL_MAX = 96

/**
 * m 端下拉刷新（UI-IXD-13，列表页/收藏历史页共用）：
 * 在滚动容器顶部下拉内容根节点，过阈值释放触发 onRefresh；
 * 拖拽位移、armed（箭头回正）、refreshing（请求中自旋）由钩子统一管理，
 * onRefresh 经 ref 取最新闭包、refreshing 期间忽略新拖拽（防重复触发）。
 */
export function usePullToRefresh(
  bodyRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void>,
): { armed: boolean; refreshing: boolean } {
  const [armed, setArmed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const refreshRef = useRef(onRefresh)
  refreshRef.current = onRefresh
  const refreshingRef = useRef(false)
  refreshingRef.current = refreshing

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const scroller = () => el.closest('.scroll')
    let active = false
    let startY = 0
    let dist = 0
    const setTranslate = (y: number) => {
      el.style.transition = y === 0 ? '' : 'none'
      el.style.transform = y > 0 ? `translateY(${y}px)` : ''
    }
    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || (scroller()?.scrollTop ?? 0) > 0) return
      active = true
      startY = e.touches[0].clientY
      dist = 0
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!active) return
      const delta = e.touches[0].clientY - startY
      if (delta <= 0 || (scroller()?.scrollTop ?? 0) > 0) {
        if (dist > 0) {
          dist = 0
          setTranslate(0)
          setArmed(false)
        }
        return
      }
      // 阻尼下拉 + 阻断浏览器原生下拉手势
      e.preventDefault()
      dist = Math.min(Math.round(delta * PULL_DAMPING), PULL_MAX)
      setTranslate(dist)
      setArmed(dist >= PULL_THRESHOLD)
    }
    const onTouchEnd = () => {
      if (!active) return
      active = false
      const shouldRefresh = dist >= PULL_THRESHOLD
      dist = 0
      setTranslate(0)
      setArmed(false)
      if (shouldRefresh) {
        setRefreshing(true)
        void refreshRef.current().finally(() => setRefreshing(false))
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [bodyRef])

  return { armed, refreshing }
}
