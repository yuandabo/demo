import { Router } from 'express'
import auth from './auth.js'
import misc from './misc.js'
import favorites from './favorites.js'
import histories from './histories.js'
import feedbacks from './feedbacks.js'
import categories from './categories.js'
import tutorials from './tutorials.js'
import stats from './stats.js'
import system from './system.js'

const apiRouter = Router()

// ── 公开路由组（免鉴权）──────────────────────────────────────
// 登录 / 选角色登录等公开端点；列表/详情/推荐游客可读，
// 互动类端点在各路由内部自行 requireAuth。
apiRouter.use('/auth', auth)
apiRouter.use('/', misc) // GET /api/recommend、GET /api/messages
apiRouter.use('/tutorials', tutorials) // 列表/详情/share 公开，管理参数内部鉴权
apiRouter.use('/categories', categories) // 树公开（GET），管理端点内部鉴权
apiRouter.use('/favorites', favorites)
apiRouter.use('/histories', histories)
apiRouter.use('/feedbacks', feedbacks)
apiRouter.use('/stats', stats) // admin/operator（内部鉴权）
apiRouter.use('/system', system) // reset（内部 admin 鉴权）

export default apiRouter
