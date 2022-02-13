import { reactive, toRefs } from 'vue'
export const useFeatureX = () => {
    const state = reactive({
        foo: 1,
        bar: 2
    })
    return toRefs(state)
}