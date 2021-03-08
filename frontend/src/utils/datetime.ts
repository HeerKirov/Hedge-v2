/**
 * 判断此年是否是闰年。
 * @param year 年份
 */
function isLeapYear(year: number): boolean {
    return !(year % (year % 100 ? 4 : 400))
}

/**
 * 获得此月份的天数。
 * @param year 年
 * @param month 月
 */
export function getDaysOfMonth(year: number, month: number): number {
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] + (month === 2 && (isLeapYear(year)) ? 1 : 0)
}

/**
 * 标准化的当地日期。
 */
export interface LocalDate {
    /**
     * 年份。
     */
    readonly year: number
    /**
     * 月份，取值1~12。
     */
    readonly month: number
    /**
     * 日。取值1~31。
     */
    readonly day: number
    /**
     * 每周中的日。取值0~6，代表周日到周六。
     */
    readonly dayInWeek: number
    /**
     * 此时间的UTC时间戳。
     */
    readonly timestamp: number
}

/**
 * 标准化的当地时间。时区总是取本机时间。
 */
export interface LocalDateTime extends LocalDate {
    /**
     * 小时。取值0~23。
     */
    readonly hour: number
    /**
     * 分钟，取值0~59。
     */
    readonly minutes: number
    /**
     * 秒。取值0~59。
     */
    readonly seconds: number
}

/**
 * 将一个UTC时间戳转换为LocalDate。字符串时间戳必须符合yyyy-MM-dd的格式。
 */
export function dateOf(time: string): LocalDate {
    const match0 = /^(\d+)-(\d+)-(\d+)$/.exec(time)
    if(match0) {
        const year = parseInt(match0[1]), month = parseInt(match0[2]), day = parseInt(match0[3])
        const d = new Date(year, month, day)
        return {year, month, day, dayInWeek: d.getDay(), timestamp: d.getTime()}
    }
    const match1 = /^\d+-\d+-\d+T\d+:\d+:\d+Z$/.exec(time)
    if(match1) {
        const d = new Date(time)
        const timestamp = d.getTime()
        return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), dayInWeek: d.getDay(), timestamp: timestamp - timestamp % 86400000}
    }
    throw new Error(`dateOf can only accept time with format 'yyyy-MM-ddTHH:mm:ssZ' or 'yyyy-MM-dd', but actual is ${time}.`)
}

/**
 * 将一个UTC时间戳转换为LocalDateTime。字符串时间戳必须符合yyyy-MM-ddTHH:mm:ssZ的格式。
 */
export function dateTimeOf(time: string): LocalDateTime {
    const match = /^\d+-\d+-\d+T\d+:\d+:\d+Z$/.exec(time)
    if (match) {
        const d = new Date(time)
        return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), dayInWeek: d.getDay(), timestamp: d.getTime(), hour: d.getHours(), minutes: d.getMinutes(), seconds: d.getSeconds()}
    }
    throw new Error(`datetimeOf can only accept time with format 'yyyy-MM-ddTHH:mm:ssZ', but actual is ${time}.`)
}