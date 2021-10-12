<template>
    <div>
        {{ foo }} --- {{ componentName }}
        <div>
            <teleport to="body">我应该渲染在 body 下</teleport>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
  foo: Number
})

const emit = defineEmits(['change', 'delete'])

const componentName = 'scriptSetup'

defineExpose({
    foo: props.foo
})
</script>

<style>

</style>