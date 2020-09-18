const datas = require("data/sample.js")
/**
 * 1.定期
 * 2.追低
 * 3.追高
 * 4.追杀
 */

/**
 * 问题：
 *  1.什么时候买
 *  2.什么时候卖
 *  3.买多少
 *  4.卖多少
 * 打破规则的因素
 *  1.流动资金量不足
 *  2.意外使用资金
 */

const max = 10000 // 资金量

const ss = [s1, s2, s3, s4]

function run() {
    datas.map(data => {
        console.log(`${data.name}-起始价:${Math.round(data.data[0][0])}\t终止价: ${data.data[data.data.length-1][0]}\t涨幅:${Math.round(((data.data[data.data.length-1][0]-data.data[0][0])/data.data[0][0])*10000)/100}%`)
        ss.map(s => {
            let res = s(data.data)
            console.log(`   ${res.name}-投入:${Math.round(res.total)}\t结算:${res.settlement}\t买入次数:${res.buyCount}\t卖出次数:${res.sellCount}\t盈利:${res.profit}\t盈利率:${res.profitRate}%\t`)
        })
    })
}

// run()
function format(num) {
    return Math.round(num*100)/100
}

function s1(data, len) {
    let split = 1 // 定投周期/次
    let col = max / Math.floor(len / split) // 每次进场金额
    let total = 0 // 总投入数
    let vol = 0 // 份额
    let count = 0
    // 策略
    for (let i = 0; i < data.length; i++) {
        if (i % split == 0 && total < max) {
            total += col
            vol += col / data[i][0]
            count++
        }
    }

    return {
        name: "定投",
        total: max,
        volume: format(vol),
        circulatingFund: format(max-total), 
        buyCount: count,
        sellCount: 0,
        settlement: Math.round(data[data.length - 1][0] * vol),
        profit: Math.round(data[data.length - 1][0] * vol - total),
        profitRate: format((data[data.length - 1][0] * vol - total) / total * 100)
    }
}

function s2(data, len) {
    let col = max / len
    let total = 0
    let vol = 0
    let count = 0
    for (let i = 0; i < data.length; i++) {
        if (data[i][1] < 0 && total < max) {
            total += col
            vol += col / data[i][0]
            count++
        }
    }
    return {
        name: "追跌",
        total: max,
        volume: format(vol),
        circulatingFund: format(max - total), 
        buyCount: count,
        sellCount: 0,
        settlement: Math.round(data[data.length - 1][0] * vol),
        profit: Math.round(data[data.length - 1][0] * vol - total),
        profitRate: ((data[data.length - 1][0] * vol - total) / total * 100).toFixed(2)
    }
}

function s3(data, len) {
    let col = max / len
    let total = 0
    let vol = 0
    let count = 0
    for (let i = 0; i < data.length; i++) {
        if (data[i][1] > 0 && total < max) {
            total += col
            vol += col / data[i][0]
            count++
        }
    }
    return {
        name: "追涨",
        total: max,
        volume: format(vol),
        circulatingFund: format(max - total), 
        buyCount: count,
        sellCount: 0,
        settlement: Math.round(data[data.length - 1][0] * vol),
        profit: Math.round(data[data.length - 1][0] * vol - total),
        profitRate: ((data[data.length - 1][0] * vol - total) / total * 100).toFixed(2)
    }
}


/**
 * 策略：追跌涨卖
 * 问题
 * 1.持续资金如何合理有效的注入市场
 * 2.复利设计
 * 3.考量参数
 *  1.振幅
 *  2.涨幅
 *  3.买卖次数
 *  4.买卖比重
 * 4.交易手续费，管理费
 * 5.如何配置才能使投入金额最大且流动资金充足
 * *？为什么初始市值会影响盈利率？
 * 任务
 * 1.计算参数对结果的影响比重
 * 2.对真实历史数据进行演练测试
 * 3.使用遗传算法计算最适合的参数配置
 * 4.编写可视化演练跟踪
 * 
 * 附注
 * 1.惯性
 * 2.缓冲
 */

function s4(data) {
    /**
     * 26000
     */
    let INVESTMENT = max * 0.01 // 初始投入
    let t = INVESTMENT / data[0][0]
    let z = max - INVESTMENT
    let buyCount = 0
    let sellCount = 0
    let total = INVESTMENT
    let buyRate = 1
    let sellRate = 1

    // console.log(`当前份额:${Math.round(t*100)/100},当前流动资金:${Math.round(z*100)/100},当前价格:${Math.round(data[0][0]*100)/100},当前涨幅:${Math.round(data[0][1]*10000)/100}%,盈利率:${((data[0][0]*t+z-max)/max*100).toFixed(2)}%`)
    for (let i = 1; i < data.length; i++) {
        // if (i%split!=0) continue
        if (data[i][1] > 0) {
            let sel = t * data[i][1] * sellRate
            if (t < sel) {
                console.warn("缺少份额")
                continue
            }
            t -= sel
            z += sel * data[i][0]
            sellCount++
        } else if (data[i][1] < 0) {
            let buy = z * data[i][1] * -1 * buyRate
            if (z < (buy)) {
                console.warn("缺少资产")
                continue
            }
            t += buy / data[i][0]
            z -= (buy)
            total = max - z > total ? max - z : total
            buyCount++

        }
        // console.log(`当前份额:${Math.round(t*100)/100},当前流动资金:${Math.round(z*100)/100},当前价格:${Math.round(data[i][0]*100)/100},当前涨幅:${Math.round(data[i][1]*10000)/100}%,盈利率:${((data[i][0]*t+z-max)/max*100).toFixed(2)}%`)
    }
    // console.log(`当前份额:${Math.round(t*100)/100},当前流动资金:${Math.round(z*100)/100}`)
    return {
        name: "追跌杀涨",
        total: max,
        volume: format(t),
        circulatingFund: format(z), 
        buyCount: buyCount,
        sellCount: sellCount,
        settlement: Math.round(data[data.length - 1][0] * t + z),
        profit: Math.round(data[data.length - 1][0] * t + z - max),
        profitRate: ((data[data.length - 1][0] * t + z - max) / max * 100).toFixed(2)

    }
}


module.exports = () => {
    return {
        run(cb) {
            data = datas[datas.length - 1].data
            data.map((d,i)=> {
                let res = ss.map(s => {
                    return s(data.slice(0,i+1), data.length)
                })
                cb({
                    date: i,
                    basic: {
                        price: d[0],
                        rate: d[1]
                    },
                    s1: res[0],
                    s2: res[1],
                    s3: res[2],
                    s: res[3]
                })
            })
        },
        props: {}
    }
}