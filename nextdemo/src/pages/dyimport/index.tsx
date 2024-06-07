
import dynamic from 'next/dynamic'

const DyComponent = dynamic(() => import('@/components/DyComponent'), { loading: () => <>...</> });
console.log('Dyimport', DyComponent);

export default function DyimportTest() {
    return <>
        <DyComponent />
    </>
}


