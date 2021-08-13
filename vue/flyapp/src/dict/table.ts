/*
  表格字典，维护所有表格排序字段、单位字段、拼接字段
*/
import { SORTLISTTYPE } from '@/utils/types'
export const SORTLIST = ():SORTLISTTYPE => (
  {
    ascending: 'asc',
    descending: 'desc',
    normal: null
  }
)

// QAR事件需要增加%单位的字段
export const QARPUVERRUNADDUNITLABEL = ():string[] => (['mildOverrunRate', 'seriousOverrunRate', 'mildFleetOverrunRate', 'seriousFleetOverrunRate'])

// QAR事件需要拼接actypeSeries的字段
export const QAR_OVERRUN_ADDLABEL = ():string[] => (['mildFleetOverrunRate', 'seriousFleetOverrunRate'])
