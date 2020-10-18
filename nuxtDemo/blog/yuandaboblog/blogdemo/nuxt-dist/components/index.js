export { default as EditorPreview } from '../..\\components\\editor-preview.vue'
export { default as VCart } from '../..\\components\\v-cart.vue'

export const LazyEditorPreview = import('../..\\components\\editor-preview.vue' /* webpackChunkName: "components_editor-preview" */).then(c => c.default || c)
export const LazyVCart = import('../..\\components\\v-cart.vue' /* webpackChunkName: "components_v-cart" */).then(c => c.default || c)
