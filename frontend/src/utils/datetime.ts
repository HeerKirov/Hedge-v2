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