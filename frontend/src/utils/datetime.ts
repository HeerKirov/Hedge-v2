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
    readonly hours: number
    /**
     * 分钟，取值0~59。
     */
    readonly minutes: number
    /**
     * 秒。取值0~59。
     */
    readonly seconds: number
}

export const date = {
    /**
     * 将一个UTC时间戳转换为LocalDate。字符串时间戳必须符合yyyy-MM-dd的格式。
     */
    of(time: string): LocalDate {
        const match0 = /^(\d+)-(\d+)-(\d+)$/.exec(time)
        if(match0) {
            const year = parseInt(match0[1]), month = parseInt(match0[2]), day = parseInt(match0[3])
            const d = new Date(year, month, day)
            return newDate(year, month, day, d.getDay(), d.getTime())
        }
        const match1 = /^\d+-\d+-\d+T\d+:\d+:\d+Z$/.exec(time)
        if(match1) {
            const d = new Date(time)
            const timestamp = d.getTime()
            return newDate(d.getFullYear(), d.getMonth(), d.getDate(), d.getDay(), timestamp - timestamp % 86400000)
        }
        throw new Error(`dateOf can only accept time with format 'yyyy-MM-ddTHH:mm:ssZ' or 'yyyy-MM-dd', but actual is ${time}.`)
    },
    /**
     * 转换为yyyy-MM-dd的标准时间戳。
     */
    toISOString({ year, month, day }: LocalDate): string {
        return `${year}-${ten(month)}-${ten(day)}`
    }
}

export const datetime = {
    /**
     * 将一个UTC时间戳转换为LocalDateTime。字符串时间戳必须符合yyyy-MM-ddTHH:mm:ssZ的格式。
     */
    of(time: string): LocalDateTime {
        const match = /^\d+-\d+-\d+T\d+:\d+:\d+Z$/.exec(time)
        if (match) {
            const d = new Date(time)
            return newDateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getDay(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getTime())
        }
        throw new Error(`datetimeOf can only accept time with format 'yyyy-MM-ddTHH:mm:ssZ', but actual is ${time}.`)
    },
    /**
     * 转换为yyyy-MM-dd`T`HH:mm:ss`Z`(UTC)的标准时间戳。
     */
    toISOString({ timestamp }: LocalDateTime): string {
        return new Date(timestamp).toISOString()
    },
    /**
     * 转换为yyyy-MM-dd HH:mm:ss的字符串格式。
     */
    toSimpleFormat({ year, month, day, hours, minutes, seconds }: LocalDateTime): string {
        return `${year}-${ten(month)}-${ten(day)} ${ten(hours)}:${ten(minutes)}:${ten(seconds)}`
    }
}

/**
 * 构造LocalDate。
 */
function newDate(year: number, month: number, day: number, dayInWeek: number, timestamp: number): LocalDate {
    return {year, month, day, dayInWeek, timestamp}
}

/**
 * 构造LocalDateTime。
 */
function newDateTime(year: number, month: number, day: number, dayInWeek: number, hours: number, minutes: number, seconds: number, timestamp: number): LocalDateTime {
    return {year, month, day, dayInWeek, hours, minutes, seconds, timestamp}
}

/**
 * 如果数字只有1位，填补0；否则原样输出。
 */
function ten(i: number): string | number {
    return i >= 10 ? i : `0${i}`
}
