/**
 * 数据存储层 - 基于uni.storage的封装
 * 管理所有本地数据持久化
 */

const STORAGE_KEYS = {
	USER: 'livelog_user',
	FOOD_RECORDS: 'livelog_food_records',
	WATER_RECORDS: 'livelog_water_records',
	WEIGHT_RECORDS: 'livelog_weight_records',
	LIVELOGS: 'livelog_livelogs',
	SETTINGS: 'livelog_settings'
}

// ==================== 通用方法 ====================

function getStorage(key) {
	try {
		const data = uni.getStorageSync(key)
		return data || null
	} catch (e) {
		console.error('Storage get error:', key, e)
		return null
	}
}

function setStorage(key, data) {
	try {
		uni.setStorageSync(key, data)
		return true
	} catch (e) {
		console.error('Storage set error:', key, e)
		return false
	}
}

function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function formatDate(date) {
	const d = date instanceof Date ? date : new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// ==================== 用户数据 ====================

export function getUser() {
	let user = getStorage(STORAGE_KEYS.USER)
	if (!user) {
		user = {
			id: generateId(),
			nickname: '',
			avatar: '',
			height: 0,
			targetCalories: 2000,
			createdAt: new Date().toISOString()
		}
		setStorage(STORAGE_KEYS.USER, user)
	}
	return user
}

export function saveUser(user) {
	return setStorage(STORAGE_KEYS.USER, user)
}

// ==================== 食物记录 ====================

export function getFoodRecords(date) {
	const allRecords = getStorage(STORAGE_KEYS.FOOD_RECORDS) || []
	if (date) {
		const dateStr = formatDate(new Date(date))
		return allRecords.filter(r => formatDate(new Date(r.recordedAt)) === dateStr)
	}
	return allRecords
}

export function addFoodRecord(record) {
	const allRecords = getStorage(STORAGE_KEYS.FOOD_RECORDS) || []
	const newRecord = {
		id: generateId(),
		userId: getUser().id,
		foodName: '',
		foodNameEN: '',
		calories: 0,
		weight: 0,
		percentage: 100,
		actualCalories: 0,
		imageUrl: '',
		stickerImage: '',
		note: '',
		mealType: '加餐',
		recordedAt: new Date().toISOString(),
		aiConfidence: 0,
		...record
	}
	newRecord.actualCalories = Math.round(newRecord.calories * newRecord.percentage / 100)
	allRecords.push(newRecord)
	setStorage(STORAGE_KEYS.FOOD_RECORDS, allRecords)
	return newRecord
}

export function updateFoodRecord(id, updates) {
	const allRecords = getStorage(STORAGE_KEYS.FOOD_RECORDS) || []
	const index = allRecords.findIndex(r => r.id === id)
	if (index !== -1) {
		allRecords[index] = { ...allRecords[index], ...updates }
		if (updates.calories !== undefined || updates.percentage !== undefined) {
			allRecords[index].actualCalories = Math.round(
				allRecords[index].calories * allRecords[index].percentage / 100
			)
		}
		setStorage(STORAGE_KEYS.FOOD_RECORDS, allRecords)
		return allRecords[index]
	}
	return null
}

export function deleteFoodRecord(id) {
	const allRecords = getStorage(STORAGE_KEYS.FOOD_RECORDS) || []
	const filtered = allRecords.filter(r => r.id !== id)
	setStorage(STORAGE_KEYS.FOOD_RECORDS, filtered)
}

// ==================== 饮水记录 ====================

export function getWaterRecords(date) {
	const allRecords = getStorage(STORAGE_KEYS.WATER_RECORDS) || []
	if (date) {
		const dateStr = formatDate(new Date(date))
		return allRecords.filter(r => formatDate(new Date(r.recordedAt)) === dateStr)
	}
	return allRecords
}

export function addWaterRecord(record) {
	const allRecords = getStorage(STORAGE_KEYS.WATER_RECORDS) || []
	const newRecord = {
		id: generateId(),
		userId: getUser().id,
		amount: 0,
		recordedAt: new Date().toISOString(),
		description: '',
		...record
	}
	allRecords.push(newRecord)
	setStorage(STORAGE_KEYS.WATER_RECORDS, allRecords)
	return newRecord
}

export function getDayWaterTotal(date) {
	const records = getWaterRecords(date)
	return records.reduce((sum, r) => sum + r.amount, 0)
}

// ==================== 体重记录 ====================

export function getWeightRecords(date) {
	const allRecords = getStorage(STORAGE_KEYS.WEIGHT_RECORDS) || []
	if (date) {
		const dateStr = formatDate(new Date(date))
		return allRecords.filter(r => formatDate(new Date(r.recordedAt)) === dateStr)
	}
	return allRecords
}

export function addWeightRecord(record) {
	const allRecords = getStorage(STORAGE_KEYS.WEIGHT_RECORDS) || []
	const user = getUser()
	const weight = record.weight || 0
	const height = user.height || 170
	const bmi = height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : 0
	const newRecord = {
		id: generateId(),
		userId: user.id,
		weight: 0,
		bmi: bmi,
		activityLevel: '久坐',
		recordedAt: new Date().toISOString(),
		...record,
		bmi: record.weight ? (record.weight / ((height / 100) ** 2)).toFixed(1) : 0
	}
	allRecords.push(newRecord)
	setStorage(STORAGE_KEYS.WEIGHT_RECORDS, allRecords)
	return newRecord
}

export function updateWeightRecord(id, updates) {
	const allRecords = getStorage(STORAGE_KEYS.WEIGHT_RECORDS) || []
	const index = allRecords.findIndex(r => r.id === id)
	if (index !== -1) {
		allRecords[index] = { ...allRecords[index], ...updates }
		setStorage(STORAGE_KEYS.WEIGHT_RECORDS, allRecords)
		return allRecords[index]
	}
	return null
}

// ==================== LiveLog ====================

export function getLiveLogs(date) {
	const allLogs = getStorage(STORAGE_KEYS.LIVELOGS) || []
	if (date) {
		const dateStr = formatDate(new Date(date))
		return allLogs.filter(l => formatDate(new Date(l.date)) === dateStr)
	}
	return allLogs
}

export function saveLiveLog(log) {
	const allLogs = getStorage(STORAGE_KEYS.LIVELOGS) || []
	const index = allLogs.findIndex(l => l.id === log.id)
	if (index !== -1) {
		allLogs[index] = log
	} else {
		allLogs.push({
			id: generateId(),
			userId: getUser().id,
			date: formatDate(new Date()),
			background: '#000000',
			stickers: [],
			texts: [],
			decorations: [],
			doodlePaths: [],
			livePhotoUrl: '',
			createdAt: new Date().toISOString(),
			...log
		})
	}
	setStorage(STORAGE_KEYS.LIVELOGS, allLogs)
	return allLogs[index !== -1 ? index : allLogs.length - 1]
}

// ==================== 设置 ====================

export function getSettings() {
	return getStorage(STORAGE_KEYS.SETTINGS) || {
		targetCalories: 2000,
		targetWater: 2000,
		height: 170,
		nickname: '',
		avatar: '',
		reminderEnabled: false,
		reminderTime: '08:00'
	}
}

export function saveSettings(settings) {
	return setStorage(STORAGE_KEYS.SETTINGS, settings)
}

// ==================== 统计 ====================

export function getDayCalorieTotal(date) {
	const dateStr = date ? formatDate(new Date(date)) : formatDate(new Date())
	const records = getFoodRecords(dateStr)
	return records.reduce((sum, r) => sum + (r.actualCalories || 0), 0)
}

export function getDaySummary(date) {
	const dateStr = date ? formatDate(new Date(date)) : formatDate(new Date())
	return {
		date: dateStr,
		totalCalories: getDayCalorieTotal(dateStr),
		targetCalories: getUser().targetCalories || 2000,
		totalWater: getDayWaterTotal(dateStr),
		targetWater: getSettings().targetWater || 2000,
		foodCount: getFoodRecords(dateStr).length,
		waterCount: getWaterRecords(dateStr).length,
		weightRecord: getWeightRecords(dateStr)[0] || null
	}
}

// ==================== Mock数据初始化 ====================

const MOCK_FOODS = [
	{ name: '巧克力樱桃千层蛋糕', nameEN: 'Chocolate Cherry Crepe Cake', calories: 650, weight: 180, mealType: '晚餐', emoji: '🍰', color: '#D4A574' },
	{ name: '西瓜块', nameEN: 'Watermelon Chunks', calories: 52, weight: 200, mealType: '加餐', emoji: '🍉', color: '#FF6B6B' },
	{ name: '红烧牛肉面', nameEN: 'Braised Beef Noodles', calories: 520, weight: 350, mealType: '午餐', emoji: '🍜', color: '#C75B39' },
	{ name: '珍珠奶茶', nameEN: 'Bubble Milk Tea', calories: 380, weight: 500, mealType: '下午茶', emoji: '🧋', color: '#C8956C' },
	{ name: '鸡胸肉沙拉', nameEN: 'Chicken Breast Salad', calories: 280, weight: 200, mealType: '午餐', emoji: '🥗', color: '#7CB342' },
	{ name: '麦当劳脆鸡卷', nameEN: "McDonald's Chicken Wrap", calories: 480, weight: 150, mealType: '早餐', emoji: '🌯', color: '#F5A623' },
	{ name: '豆腐脑', nameEN: 'Tofu Pudding', calories: 120, weight: 300, mealType: '早餐', emoji: '🥣', color: '#F5F5DC' },
	{ name: '蓝莓酸奶', nameEN: 'Blueberry Yogurt', calories: 150, weight: 200, mealType: '加餐', emoji: '🫐', color: '#7B68EE' }
]

function generatePlaceholderImage(emoji, color) {
	// 生成SVG data URI作为占位图
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
		<rect width="120" height="120" fill="${color}" rx="16"/>
		<text x="60" y="75" font-size="56" text-anchor="middle">${emoji}</text>
	</svg>`
	return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

export function initMockData() {
	const existingRecords = getStorage(STORAGE_KEYS.FOOD_RECORDS) || []
	if (existingRecords.length > 0) return // 已有数据则不覆盖

	const today = new Date()
	const todayStr = formatDate(today)
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	const yesterdayStr = formatDate(yesterday)

	// 生成今天的记录
	const todayRecords = [
		{ ...MOCK_FOODS[0], hour: 20, minute: 54 },
		{ ...MOCK_FOODS[1], hour: 20, minute: 56 },
		{ ...MOCK_FOODS[2], hour: 12, minute: 30 },
		{ ...MOCK_FOODS[3], hour: 15, minute: 18 },
		{ ...MOCK_FOODS[5], hour: 9, minute: 22 }
	]

	// 生成昨天的记录
	const yesterdayRecords = [
		{ ...MOCK_FOODS[4], hour: 18, minute: 0 },
		{ ...MOCK_FOODS[6], hour: 8, minute: 30 }
	]

	const allRecords = []

	// 添加今天的记录
	todayRecords.forEach((food, i) => {
		const recordedAt = new Date(today)
		recordedAt.setHours(food.hour, food.minute + i * 2, 0)
		allRecords.push({
			id: generateId(),
			userId: 'mock-user',
			foodName: food.name,
			foodNameEN: food.nameEN,
			calories: food.calories,
			weight: food.weight,
			percentage: 100,
			actualCalories: food.calories,
			imageUrl: generatePlaceholderImage(food.emoji, food.color),
			stickerImage: generatePlaceholderImage(food.emoji, food.color),
			note: '',
			mealType: food.mealType,
			recordedAt: recordedAt.toISOString(),
			aiConfidence: 0.92
		})
	})

	// 添加昨天的记录
	yesterdayRecords.forEach((food, i) => {
		const recordedAt = new Date(yesterday)
		recordedAt.setHours(food.hour, food.minute + i * 3, 0)
		allRecords.push({
			id: generateId(),
			userId: 'mock-user',
			foodName: food.name,
			foodNameEN: food.nameEN,
			calories: food.calories,
			weight: food.weight,
			percentage: 100,
			actualCalories: food.calories,
			imageUrl: generatePlaceholderImage(food.emoji, food.color),
			stickerImage: generatePlaceholderImage(food.emoji, food.color),
			note: '',
			mealType: food.mealType,
			recordedAt: recordedAt.toISOString(),
			aiConfidence: 0.88
		})
	})

	setStorage(STORAGE_KEYS.FOOD_RECORDS, allRecords)

	// 添加今天的体重记录
	setStorage(STORAGE_KEYS.WEIGHT_RECORDS, [{
		id: generateId(),
		userId: 'mock-user',
		weight: 50.20,
		bmi: '18.9',
		activityLevel: '久坐',
		recordedAt: new Date(today.setHours(8, 0, 0)).toISOString()
	}])

	// 添加今天的饮水记录
	setStorage(STORAGE_KEYS.WATER_RECORDS, [
		{ id: generateId(), userId: 'mock-user', amount: 250, recordedAt: new Date(today.setHours(9, 0, 0)).toISOString(), description: '早晨一杯水' },
		{ id: generateId(), userId: 'mock-user', amount: 500, recordedAt: new Date(today.setHours(12, 30, 0)).toISOString(), description: '午餐后' },
		{ id: generateId(), userId: 'mock-user', amount: 250, recordedAt: new Date(today.setHours(15, 0, 0)).toISOString(), description: '下午茶' }
	])

	// 初始化用户
	setStorage(STORAGE_KEYS.USER, {
		id: 'mock-user',
		nickname: '小明',
		avatar: '',
		height: 165,
		targetCalories: 2000,
		createdAt: new Date().toISOString()
	})

	// 初始化设置
	setStorage(STORAGE_KEYS.SETTINGS, {
		targetCalories: 2000,
		targetWater: 2000,
		height: 165,
		nickname: '小明',
		avatar: '',
		reminderEnabled: true,
		reminderTime: '08:00'
	})
}
