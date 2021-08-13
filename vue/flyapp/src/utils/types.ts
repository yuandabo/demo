/**
 * 通用类型
 * 可根据需要添加
 */

/** 弹窗类型枚举量 */
export enum DIALOG_TYPE {
  VIEW,
  ADD,
  EDIT
}

/** 弹窗组件内部使用的弹窗信息 */
export interface DIALOG_INFO_TYPE {
  visible: boolean,
  title?: string,
  type?: DIALOG_TYPE
}

/** 表头数据 */
// eslint-disable-next-line
export interface TABLE_HEADER<T> extends Record<string, any> {
  label: string
  prop: keyof T
}

/** 页码类型 */
export interface PAGINATION_TYPE {
  pageNum: number,
  pageSize: number
}

/** 请求分页数据 */
export interface RESPONCE_PAGINATION_TYPE<T> {
  pageNum: number,
  pageSize: number,
  totalSize: number,
  data: T
}

/** 相应数据的基础接口 */
export interface RESPONSE_DATA_TYPE<T> {
  code: number,
  data: T,
  msg?: string
}

/**
 表头
 */
export type INFOTABLEHEAD = {
  field: string
  name: string,
  orderContent?: string
}

/* APP模块信息接口返回参数 */
export type APP_MODULE_INFO_ITEM = {
  moduleId: string
  name: string
  header: INFOTABLEHEAD[]
  sort:number
  iconUrl?:string
}

/**
 排序
 */
export type SORTLISTTYPE = {
  ascending: string
  descending: string
  normal: null
}

/**
 跳转native携带参数
 */
export type PAGETONATIVEPARAMS = {
  flightId: string
  date: string
  aircraftNumber: string
  flightNumber: string
  takeOff: string
  land: string
}

/**

 */
export type FLIGHTDETAIL = {
  sortDate: string
  flightId: string
  aircraftNumber: string
  depAptIcao: string
  arrAptIcao: string
  takeOffTime: string
  fleetGroup: string
  actLong: string
  flightNumber: string
  actShort: string
  flightDate: string
}

/**
 * 时间
 */
export type Time = {
  startTime?: number | null
  endTime?: number | null
  actype?: string
  fleetId?: string
}
