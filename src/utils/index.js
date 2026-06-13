/**
 * 工具函数
 */

/**
 * 格式化时间
 */
export function formatTime(date, format = 'HH:mm') {
	const d = date instanceof Date ? date : new Date(date)
	const hours = String(d.getHours()).padStart(2, '0')
	const minutes = String(d.getMinutes()).padStart(2, '0')
	const seconds = String(d.getSeconds()).padStart(2, '0')

	return format
		.replace('HH', hours)
		.replace('mm', minutes)
		.replace('ss', seconds)
}

/**
 * 格式化日期
 */
export function formatDateCN(date) {
	const d = date instanceof Date ? date : new Date(date)
	const month = d.getMonth() + 1
	const day = d.getDate()
	return `${month}月${day}日`
}

/**
 * 获取星期几
 */
export function getWeekDay(date) {
	const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
	const d = date instanceof Date ? date : new Date(date)
	return days[d.getDay()]
}

/**
 * 获取一周日期列表
 * 返回dateStr而不是Date对象，避免Vue响应式性能问题
 */
export function getWeekDates(selectedDate = new Date()) {
	const d = selectedDate instanceof Date ? new Date(selectedDate) : new Date(selectedDate)
	const day = d.getDay()
	const monday = new Date(d)
	monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))

	const dates = []
	for (let i = 0; i < 7; i++) {
		const date = new Date(monday)
		date.setDate(monday.getDate() + i)
		const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		dates.push({
			dateStr: dateStr,
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			weekDay: getWeekDay(date),
			isToday: isToday(dateStr),
			isSelected: isSameDay(dateStr, selectedDate)
		})
	}
	return dates
}

/**
 * 判断是否是今天
 */
export function isToday(date) {
	const d = date instanceof Date ? date : new Date(date)
	const now = new Date()
	return d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate()
}

/**
 * 判断是否同一天
 */
export function isSameDay(date1, date2) {
	const d1 = date1 instanceof Date ? date1 : new Date(date1)
	const d2 = date2 instanceof Date ? date2 : new Date(date2)
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
}

/**
 * 计算BMI
 */
export function calculateBMI(weight, height) {
	if (!weight || !height) return 0
	return (weight / ((height / 100) ** 2)).toFixed(1)
}

/**
 * BMI等级
 */
export function getBMILevel(bmi) {
	if (bmi < 18.5) return { label: '偏瘦', color: '#6BB3E0' }
	if (bmi < 24) return { label: '正常', color: '#8B9A6B' }
	if (bmi < 28) return { label: '偏胖', color: '#E8A838' }
	return { label: '肥胖', color: '#E05D5D' }
}

/**
 * 餐次类型
 */
export function getMealType(date) {
	const d = date instanceof Date ? date : new Date(date)
	const hour = d.getHours()
	if (hour >= 5 && hour < 10) return '早餐'
	if (hour >= 10 && hour < 14) return '午餐'
	if (hour >= 14 && hour < 17) return '下午茶'
	if (hour >= 17 && hour < 21) return '晚餐'
	return '夜宵'
}

/**
 * 获取问候语
 */
export function getGreeting() {
	const hour = new Date().getHours()
	if (hour >= 5 && hour < 9) return '早上好'
	if (hour >= 9 && hour < 12) return '上午好'
	if (hour >= 12 && hour < 14) return '中午好'
	if (hour >= 14 && hour < 18) return '下午好'
	if (hour >= 18 && hour < 22) return '晚上好'
	return '夜深了'
}

/**
 * 水量描述
 */
export function getWaterDescription(amount) {
	if (amount <= 100) return '一小口'
	if (amount <= 250) return '约一杯水'
	if (amount <= 500) return '约半瓶矿泉水'
	if (amount <= 750) return '约一瓶矿泉水'
	return '约一大瓶水'
}

/**
 * 防抖
 */
export function debounce(fn, delay = 300) {
	let timer = null
	return function(...args) {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => fn.apply(this, args), delay)
	}
}

/**
 * 节流
 */
export function throttle(fn, delay = 300) {
	let last = 0
	return function(...args) {
		const now = Date.now()
		if (now - last >= delay) {
			last = now
			fn.apply(this, args)
		}
	}
}
