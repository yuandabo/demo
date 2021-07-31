// 所有的chart数据
type NameTextStyle = {
  rich: {
    a: {
      backgroundColor: string
      color: string
      borderWidth: number
    }
  }
}
type FormatIndicatorType = {
  radarActiveName: string
  nameTextStyle: NameTextStyle
  x: number
  y: number
  name: string
  max: number
  unit: string
}
export type OptionIndicator = {
  radarActiveName: string
  x: number
  y: number
  name: string
  max?: number
  unit: string
  field: string
}

// const colors: string[] = ['#45FFA1', '#73EFFF', 'rgba(255,167,135,.5)']

// 周期汇总雷达图
export const getRadarOpiton = (variables: any, radarData: any) => ({
  triggerEvent: true, // 开启点击事件
  title: {
    text: '雷达图',
    left: 'center',
    textStyle: {
      color: variables.mainFont,
      fontSize: 13,
      fontWeight: 'normal'
    }
  },
  legend: {
    bottom: 0,
    textStyle: {
      color: variables.mainFont
    },
    icon: 'circle',
    itemGap: 25 // 图例每项之间的间隔
  },
  radar: {
    name: {
      padding: 2,
      fontWeight: 500,
      /**
       * @description: formatter 设置背景颜色与回显x、y的数值.
       */
      rich: {
        a: {
          lineHeight: 20,
          padding: [5, 10],
          borderColor: '#73EFFF',
          borderWidth: 0.5,
          borderRadius: 3
        },
        b: {
          color: radarData.color.personal,
          align: 'center',
          padding: [10, 5]
        },
        c: {
          color: radarData.color.withTheModel,
          align: 'center',
          padding: [10, 5]
        }
      },
      formatter: (name: string, indicator: FormatIndicatorType) => {
        if (name === indicator.radarActiveName) {
          indicator.nameTextStyle.rich.a.backgroundColor = '#4ABCF6'
          indicator.nameTextStyle.rich.a.color = '#142928'
          indicator.nameTextStyle.rich.a.borderWidth = 0
        }
        return `{a|${name}}\n{b|${indicator.x}${indicator.unit}};{c|${indicator.y}${indicator.unit}}`
      }
    },
    radius: '70%',
    startAngle: 60,
    axisLine: {
      lineStyle: {
        color: variables.mainFont,
        opacity: 0.1
      }
    },
    splitLine: {
      show: false
    },
    indicator: radarData.indicator as OptionIndicator[]
  },
  series: [
    {
      emphasis: {
        focus: 'self'
      },
      type: 'radar',
      data: radarData.seriesData
    }
  ]
})
// 周期汇总散点图
export const getScatterOption = (
  variables: any,
  scatterData: any,
  title: string,
  color: any
) => ({
  title: {
    text: `“${title}”区间分布`,
    left: 'center',
    textStyle: {
      color: variables.mainFont,
      fontSize: 13,
      fontWeight: 'normal'
    }
  },
  tooltip: {
    formatter: 'Group {a}: ({c})',
    backgroundColor: '#212f44',
    borderColor: 'rgba(0, 0, 0, 0)',
    textStyle: {
      color: variables.mainFont
    }
  },
  xAxis: {
    show: true,
    name: '航班ATD',
    type: 'category',
    // data: barData.xAxisDataList,
    // axisPointer: {
    //   type: 'shadow'
    // },
    axisLine: {
      show: false,
      lineStyle: {
        color: variables.mainFont
      }
    },
    axisTick: {
      show: false
      // lineStyle: {
      //   color: variables.mainFont
      // }
    },
    nameTextStyle: {
      color: variables.mainFont,
      fontSize: 10
    },
    axisLabel: {
      // interval: scatterData.series.data.length
    }
  },
  yAxis: {
    type: 'value',
    name: `单位：${scatterData.unit}`,
    axisLabel: {
      formatter: '{value}'
    },
    axisLine: {
      show: false,
      lineStyle: {
        color: variables.mainFont
      }
    },
    nameTextStyle: {
      color: variables.mainFont
    },
    // 分割线
    splitLine: {
      lineStyle: {
        type: 'dashed',
        color: variables.mainFont,
        opacity: 0.1
      }
    }
    // splitNumber: 6
  },
  series: [
    {
      type: 'scatter',
      data: scatterData.seriesData,
      itemStyle: {
        color: color.personal
      },
      markLine: {
        animation: false,
        label: {
          formatter: 'y = 0.5 * x + 3',
          align: 'right'
        },
        lineStyle: {
          type: 'solid'
        },
        tooltip: {
          formatter: 'y = 0.5 * x + 3',
          backgroundColor: '#212f44',
          borderColor: 'rgba(0, 0, 0, 0)'
        },
        data: [
          [
            {
              coord: [0, 3],
              symbol: 'none'
            },
            {
              coord: [20, 13],
              symbol: 'none'
            }
          ]
        ]
      }
    }
  ]
})

// FRI 趋势 折线图
export const getFRILineOption = (variables: any, lineData: any) => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#212f44',
    borderColor: 'rgba(0, 0, 0, 0)',
    textStyle: {
      color: variables.mainFont
    }
  },
  legend: {
    bottom: 0,
    data: variables.legendData,
    textStyle: {
      color: variables.mainFont
    },
    icon: 'roundRect',
    itemGap: 45
  },
  xAxis: {
    type: 'category',
    data: lineData.xAxisData,
    axisPointer: {
      type: 'shadow'
    },
    axisLine: {
      show: false,
      lineStyle: {
        color: variables.mainFont
      }
    },
    axisTick: {
      show: false
    },
    nameTextStyle: {
      color: variables.mainFont
    }
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: variables.mainFont
      }
    },
    nameTextStyle: {
      color: variables.mainFont
    },
    // 分割线
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        color: variables.mainFont,
        opacity: 0.1
      }
    }
  },
  series: lineData.seriesData
})
// 参数分布柱形图
export const getParamBarOption = (
  variables: any,
  barData: any
) => ({
  title: {
    text: '区间分布',
    left: 'center',
    textStyle: {
      color: variables.mainFont,
      fontSize: 10,
      fontWeight: 'normal'
    }
  },
  xAxis: {
    type: 'category',
    name: barData.unit,
    data: barData.xAxisData,
    axisPointer: {
      type: 'shadow'
    },
    axisLine: {
      show: false,
      lineStyle: {
        color: variables.mainFont
      }
    },
    axisTick: {
      show: false
    },
    nameTextStyle: {
      color: variables.mainFont,
      fontSize: 10
    },
    boundaryGap: ['20%', '20%'],
    axisLabel: {
      interval: 2,
      align: 'right',
      fontSize: 10
    }
  },
  yAxis: {
    type: 'value',
    name: '单位：次',
    axisLine: {
      show: false,
      lineStyle: {
        color: variables.mainFont
      },
      fontSize: 10
    },
    axisTick: {
      show: false
    },
    nameTextStyle: {
      color: variables.mainFont,
      padding: [0, 0, 10, 0],
      fontSize: 10
    },
    // 分割线
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        color: variables.mainFont,
        opacity: 0.1
      }
    },
    axisLabel: {
      fontSize: 10
    }
  },
  label: {
    show: true,
    position: 'top',
    color: '#73EFFF'
  },
  series: barData.seriesData as any
})
// 参数分布盒须图
export const getBoxPlotOption = (
  variables: any,
  boxPlotData: any
) => ({
  title: {
    text: '箱线图分布',
    left: 'center',
    textStyle: {
      color: variables.mainFont,
      fontSize: 10,
      fontWeight: 'normal'
    }
  },
  legend: {
    top: 20,
    right: 0,
    textStyle: {
      color: variables.mainFont,
      fontSize: 10
    },
    icon: 'circle',
    itemGap: 25, // 图例每项之间的间隔
    data: ['个人', '同机型']
  },
  tooltip: {
    trigger: 'item',
    axisPointer: {
      type: 'shadow'
    },
    backgroundColor: '#212f44',
    textStyle: {
      color: variables.mainFont
    },
    borderColor: 'rgba(0, 0, 0, 0)'
  },
  xAxis: {
    type: 'category',
    axisPointer: {
      type: 'shadow'
    },
    axisLine: {
      show: false,
      lineStyle: {
        color: variables.mainFont
      }
    },
    axisTick: {
      show: false
    },
    nameTextStyle: {
      color: variables.mainFont
    },
    min: -1,
    axisLabel: {
      fontSize: 10
    }
  },
  yAxis: {
    type: 'value',
    max: boxPlotData.boxplotMax + 1,
    name: `单位：${boxPlotData.unit}`,
    axisLine: {
      lineStyle: {
        color: variables.mainFont
      }
    },
    nameTextStyle: {
      color: variables.mainFont,
      padding: [0, 0, 10, 0]
    },
    // 分割线
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        color: variables.mainFont,
        opacity: 0.1,
        fontSize: 10
      }
    },
    axisLabel: {
      fontSize: 10
    }
  },
  series: boxPlotData.seriesData as any

  // [min,  Q1,  median (or Q2),  Q3,  max]
})
// 超限事件 折线图
export const getOverRunBarOption = (variables: any, barData: any) => (
  {
    legend: {
      data: barData.legendList,
      bottom: 0,
      textStyle: {
        color: variables.mainFont
      },
      icon: 'circle',
      formatter: function (name: string) {
        return name + '事件'
      },
      itemGap: 25 // 图例每项之间的间隔
    },
    tooltip: {
      trigger: 'axis',
      // axisPointer: {
      //   type: 'cross',
      //   crossStyle: {
      //     color: variables.mainFont
      //   }
      // },
      textStyle: {
        color: variables.mainFont
      },
      backgroundColor: '#212f44',
      borderColor: 'rgba(0, 0, 0, 0)',
      formatter: function (params: Array<Record<string, string | number>>) {
        // console.log(params)
        const axisValue = params[0].axisValue
        let htmlStr = `
        <table style="text-align:center">
        <tr style="text-align:left">
          <td>${axisValue}</td>
        </tr>
        <tr>
            <td><div style="margin-left:10px;">事件等级</div></td>
            <td>发生次数</td>
            <td>发生率</td>
        </tr>
        `
        params.forEach((v) => {
          const { color, seriesName, componentSubType } = v
          const { rate, num } = v.data as any
          if (componentSubType !== 'bar') return
          htmlStr += `
          <tr>
              <td>
                <span style="display: inline-block;width:0;height:8px;padding:0 4px;border-radius: 50%;background-color:${color};margin-right:10px;"></span>
              ${seriesName}</td>
              <td>${num}次</td>
              <td>${rate}%</td>
          </tr>
          `
        })
        return htmlStr + '</table>'
      }
    },
    xAxis: {
      type: 'category',
      data: barData.xAxisDataList,
      axisPointer: {
        type: 'shadow'
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false,
        lineStyle: {
          color: variables.mainFont
        }
      },
      nameTextStyle: {
        color: variables.mainFont
      }
    },
    yAxis: {
      type: 'value',
      name: '单位：次',
      min: 0,
      // max: 100,
      // interval: 20,
      axisLabel: {
        formatter: '{value}'
      },
      axisLine: {
        lineStyle: {
          color: variables.mainFont
        }
      },
      axisTick: {
        show: false
      },
      nameTextStyle: {
        color: variables.mainFont
      },
      splitNumber: 5,
      // 分割线
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: variables.mainFont,
          opacity: 0.1
        }
      }
      // splitNumber: 6
    },
    series: barData.series as any
  }
)
// 资质数据 四大维度雷达图
export const getFourRadarOption = (variables: any, radarOption: any) => (
  {
    triggerEvent: true, // 开启点击事件
    title: {
      text: radarOption.title,
      left: 'center',
      textStyle: {
        color: variables.mainFont,
        fontSize: 14,
        fontWeight: 500
      }
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: variables.mainFont
      },
      icon: 'circle',
      itemGap: 25 // 图例每项之间的间隔
    },
    radar: {
      name: {
        fontWeight: 500,
        /**
         * @description: formatter 设置背景颜色与回显x、y的数值.
         */
        rich: {
          a: {
            color: '#ffffff'
          }
        },
        formatter: (name: string, indicator: FormatIndicatorType) => {
          return `{a|${indicator.name}：${indicator.x}}`
        }
      },
      radius: '70%',
      axisLine: {
        lineStyle: {
          color: variables.mainFont,
          opacity: 0.1
        }
      },
      splitLine: {
        show: false
      },
      indicator: radarOption.indicator as OptionIndicator[]
    },
    series: [{
      emphasis: {
        focus: 'self'
      },
      type: 'radar',
      data: radarOption.seriesData
    }]
  }
)
