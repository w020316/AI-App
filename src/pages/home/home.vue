<template>
	<view class="home-page">
		<!-- 状态栏占位 -->
		<view :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 日期选择器 -->
		<view class="date-picker">
			<scroll-view scroll-x class="date-scroll" :scroll-into-view="scrollIntoId" scroll-with-animation>
				<view class="date-list">
					<view
						v-for="item in weekDates"
						:key="item.dateStr"
						:id="'date-' + item.day"
						class="date-item"
					:class="{ active: item.isSelected, completed: item.hasRecord && !item.isSelected }"
					@tap="selectDate(item)"
					@click="selectDate(item)"
					>
						<view v-if="item.hasRecord && !item.isSelected" class="date-check-wrap">
							<text class="date-check">&#10003;</text>
						</view>
						<text class="date-weekday">{{ item.weekDay }}</text>
						<text class="date-day">{{ item.day }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 统计栏 -->
		<view class="stats-bar">
			<view class="stats-left">
				<view class="stats-calorie">
					<text class="calorie-number">{{ daySummary.totalCalories }}</text>
					<text class="calorie-unit">kcal</text>
				</view>
				<view class="refresh-icon" @tap="refreshData">
					<view class="refresh-svg"></view>
				</view>
			</view>
			<view class="stats-mid">
				<text class="stats-weight">{{ weightDisplay }} kg</text>
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
			</view>
			<view class="stats-right">
				<view class="add-btn-small" @tap="openCamera" @click="openCamera">
					<text class="add-btn-icon">+</text>
				</view>
			</view>
		</view>

		<!-- 活动水平分段控件 -->
		<view class="activity-segment">
			<view
				v-for="level in activityLevels"
				:key="level"
				class="activity-pill"
				:class="{ active: currentActivity === level }"
				@tap="setActivity(level)"
				@click="setActivity(level)"
			>
				<text>{{ level }}</text>
			</view>
		</view>

		<!-- 体重卡片 -->
		<view class="weight-card">
			<view class="weight-main">
				<view class="weight-text-group">
					<text class="weight-number">{{ weightDisplay }}</text>
					<text class="weight-unit">kg</text>
				</view>
				<text class="weight-bmi">BMI: {{ bmiDisplay }} &#8250;</text>
				<view class="weight-progress-bar">
					<view class="weight-progress-fill" :style="{ width: bmiProgress + '%' }"></view>
				</view>
			</view>
			<view class="weight-right">
				<view class="weight-add-btn" @tap="openWeight" @click="openWeight">
					<text class="weight-add-icon">+</text>
				</view>
			</view>
		</view>

		<!-- 时间线列表 -->
		<scroll-view scroll-y class="timeline-scroll" :style="{ height: timelineHeight + 'px' }">
			<view class="timeline-list">
				<view
					v-for="(record, index) in foodRecords"
					:key="record.id"
					class="timeline-item"
					@tap="openFoodDetail(record)"
					@click="openFoodDetail(record)"
				>
					<!-- 时间轴节点 -->
					<view class="timeline-node">
						<view class="node-dot" :class="{ today: isToday(record.recordedAt), other: !isToday(record.recordedAt) }"></view>
						<view v-if="index < foodRecords.length - 1" class="node-line"></view>
					</view>

					<!-- 内容区 -->
					<view class="timeline-content">
						<text class="content-time">{{ formatRecordTime(record.recordedAt) }}</text>
						<text class="content-name">{{ record.foodName }}</text>
						<text class="content-sub">{{ record.foodNameEN || getFoodSubName(record.foodName) }}</text>
					</view>

					<!-- 右侧图片与数据 -->
					<view class="timeline-media">
						<image
							v-if="record.imageUrl"
							class="content-thumb"
							:src="record.imageUrl"
							mode="aspectFill"
						></image>
						<view v-else class="content-thumb-placeholder">
							<text>&#127860;</text>
						</view>
						<view class="content-calorie-wrap">
							<text class="content-calorie">{{ record.actualCalories }}</text>
							<text class="content-calorie-unit">kcal</text>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="foodRecords.length === 0" class="empty-state">
					<text class="empty-icon">&#127860;</text>
					<text class="empty-text">今天还没有记录哦</text>
					<text class="empty-hint">点击下方相机按钮开始记录</text>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="tabbar-placeholder"></view>
		</scroll-view>

		<!-- 底部导航栏 -->
		<TabBar current="home" />
	</view>
</template>

<script>
	import TabBar from '@/components/TabBar.vue'
	import { getFoodRecords, getWeightRecords, getDayCalorieTotal, getUser, initMockData, updateWeightRecord, getSettings, saveSettings } from '@/store/index.js'
	import { getWeekDates, isToday as checkIsToday, isSameDay, formatTime } from '@/utils/index.js'

	export default {
		components: { TabBar },
		data() {
			return {
				statusBarHeight: 0,
				timelineHeight: 500,
				selectedDate: '',
				weekDates: [],
				foodRecords: [],
				daySummary: {
					totalCalories: 0,
					targetCalories: 2000
				},
				weightRecord: null,
				currentActivity: '久坐',
				activityLevels: ['久坐', '轻活动', '中等活动', '高活动'],
				scrollIntoId: ''
			}
		},
		computed: {
			progressPercent() {
				const target = this.daySummary.targetCalories || 2000
				return Math.min((this.daySummary.totalCalories / target) * 100, 100)
			},
			weightDisplay() {
				return this.weightRecord ? this.weightRecord.weight.toFixed(2) : '\u2014\u2014'
			},
			bmiDisplay() {
				return this.weightRecord ? this.weightRecord.bmi : '\u2014\u2014'
			},
			bmiProgress() {
				if (!this.weightRecord || !this.weightRecord.bmi) return 0
				const bmi = parseFloat(this.weightRecord.bmi)
				return Math.min(Math.max((bmi - 15) / 20 * 100, 0), 100)
			}
		},
		onLoad() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 20
		},
		onShow() {
			initMockData()
			this.refreshData()
		},
		methods: {
			refreshData() {
				if (!this.selectedDate) {
					const now = new Date()
					this.selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
				}
				this.weekDates = getWeekDates(this.selectedDate)
				const dateStr = this.selectedDate
				this.foodRecords = getFoodRecords(dateStr)
				this.daySummary = {
					totalCalories: getDayCalorieTotal(dateStr),
					targetCalories: getUser().targetCalories || 2000
				}
				const weightRecords = getWeightRecords(dateStr)
				this.weightRecord = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null
				if (this.weightRecord) {
					this.currentActivity = this.weightRecord.activityLevel
				}
				this.checkRecordDates()
				this.calcTimelineHeight()
				this.initScrollIntoView()
			},
			checkRecordDates() {
				this.weekDates = this.weekDates.map(d => ({
					...d,
					hasRecord: getFoodRecords(d.dateStr).length > 0
				}))
			},
			calcTimelineHeight() {
				const sysInfo = uni.getSystemInfoSync()
				const windowHeight = sysInfo.windowHeight
				const tabBarHeight = 80
				const safeAreaBottom = sysInfo.safeAreaInsets ? sysInfo.safeAreaInsets.bottom : 0
				const topAreaHeight = this.statusBarHeight + 90 + 48 + 44 + 100
				this.timelineHeight = windowHeight - topAreaHeight - tabBarHeight - safeAreaBottom
			},
			initScrollIntoView() {
				const selectedItem = this.weekDates.find(d => d.isSelected)
				if (selectedItem) {
					this.scrollIntoId = 'date-' + selectedItem.day
				}
			},
			selectDate(item) {
				this.selectedDate = item.dateStr
				this.weekDates = this.weekDates.map(d => ({
					...d,
					isSelected: isSameDay(d.dateStr, this.selectedDate)
				}))
				const dateStr = this.selectedDate
				this.foodRecords = getFoodRecords(dateStr)
				this.daySummary = {
					totalCalories: getDayCalorieTotal(dateStr),
					targetCalories: getUser().targetCalories || 2000
				}
				const weightRecords = getWeightRecords(dateStr)
				this.weightRecord = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null
				if (this.weightRecord) {
					this.currentActivity = this.weightRecord.activityLevel
				}
				this.checkRecordDates()
			},
			isToday(dateStr) {
				return checkIsToday(dateStr)
			},
			formatRecordTime(dateStr) {
				const d = new Date(dateStr)
				const now = new Date()
				const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
				const diffDays = Math.round((todayStart - dStart) / (1000 * 60 * 60 * 24))

				let prefix
				if (diffDays === 0) {
					prefix = '今天'
				} else if (diffDays === 1) {
					prefix = '昨天'
				} else {
					const month = String(d.getMonth() + 1).padStart(2, '0')
					const day = String(d.getDate()).padStart(2, '0')
					return `${month}-${day} ${formatTime(d)}`
				}
				return `${prefix} ${formatTime(d)}`
			},
			openFoodDetail(record) {
				uni.navigateTo({
					url: `/pages/food-detail/food-detail?id=${record.id}&date=${this.selectedDate}`
				})
			},
			openWeight() {
				uni.navigateTo({ url: '/pages/weight/weight' })
			},
			openCamera() {
				uni.navigateTo({ url: '/pages/food-camera/food-camera' })
			},
			setActivity(level) {
				this.currentActivity = level
				if (this.weightRecord && this.weightRecord.id) {
					updateWeightRecord(this.weightRecord.id, { activityLevel: level })
					this.weightRecord.activityLevel = level
				} else {
					const settings = getSettings()
					settings.activityLevel = level
					saveSettings(settings)
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.home-page {
		min-height: 100vh;
		background-color: #F9F9F9;
	}

	/* ========== 日期选择器 ========== */
	.date-picker {
		padding-top: 16px;
		height: 90px;
	}

	.date-scroll {
		white-space: nowrap;
	}

	.date-list {
		display: flex;
		padding: 0 16px;
		gap: 10px;
	}

	.date-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 64px;
		border-radius: 16px;
		position: relative;
		transition: all 0.3s ease;
		border: 1.5px solid transparent;
	}

	.date-item.active {
		border: 1.5px solid #FF9500;
	}

	.date-item.active .date-weekday,
	.date-item.active .date-day {
		color: #FF9500;
	}

	.date-weekday {
		font-size: 11px;
		color: #8E8E93;
		line-height: 1.2;
	}

	.date-day {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
		margin-top: 4px;
		line-height: 1.3;
	}

	.date-check-wrap {
		position: absolute;
		top: 2px;
		left: 50%;
		transform: translateX(-50%);
	}

	.date-check {
		font-size: 12px;
		color: #8BC34A;
		line-height: 1;
	}

	/* ========== 统计栏 ========== */
	.stats-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		height: 48px;
	}

	.stats-left {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.stats-calorie {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.calorie-number {
		font-size: 24px;
		font-weight: 700;
		color: #8BC34A;
	}

	.calorie-unit {
		font-size: 13px;
		font-weight: 500;
		color: #8BC34A;
	}

	.refresh-icon {
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 4px;
	}

	.refresh-svg {
		width: 14px;
		height: 14px;
		border: 2px solid #C7C7CC;
		border-radius: 50%;
		border-top-color: transparent;
	}

	.stats-mid {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stats-weight {
		font-size: 18px;
		font-weight: 600;
		color: #C7C7CC;
	}

	.progress-bar {
		width: 80px;
		height: 4px;
		background-color: #E5E5EA;
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: #FF9500;
		border-radius: 2px;
		transition: width 0.6s ease;
	}

	.stats-right {
		flex-shrink: 0;
	}

	.add-btn-small {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background-color: #E8F5E9;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-btn-icon {
		color: #4CAF50;
		font-size: 20px;
		font-weight: 300;
		line-height: 1;
	}

	/* ========== 活动水平分段控件 ========== */
	.activity-segment {
		display: flex;
		gap: 8px;
		padding: 8px 20px;
		overflow-x: auto;
	}

	.activity-pill {
		padding: 7px 16px;
		border-radius: 16px;
		font-size: 13px;
		color: #8E8E93;
		background-color: #F2F2F7;
		border: 1px solid #E5E5EA;
		white-space: nowrap;
		transition: all 0.3s ease;
	}

	.activity-pill.active {
		background-color: #AED581;
		color: #FFFFFF;
		font-weight: 500;
		border: 1px solid transparent;
	}

	/* ========== 体重卡片 ========== */
	.weight-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 16px 20px;
		padding: 16px 20px;
		background-color: #FFFFFF;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
	}

	.weight-main {
		display: flex;
		flex-direction: column;
	}

	.weight-text-group {
		display: flex;
		align-items: baseline;
	}

	.weight-number {
		font-size: 28px;
		font-weight: 700;
		color: #1C1C1E;
	}

	.weight-unit {
		font-size: 16px;
		color: #8E8E93;
		margin-left: 2px;
	}

	.weight-bmi {
		font-size: 13px;
		color: #8E8E93;
		margin-top: 2px;
	}

	.weight-progress-bar {
		width: 60px;
		height: 3px;
		background-color: #FF9500;
		border-radius: 1.5px;
		margin-top: 4px;
		overflow: hidden;
	}

	.weight-progress-fill {
		height: 100%;
		background-color: #FF9500;
		border-radius: 1.5px;
		transition: width 0.6s ease;
	}

	.weight-right {
		display: flex;
		align-items: center;
	}

	.weight-add-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: #E8F5E9;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.weight-add-icon {
		color: #4CAF50;
		font-size: 24px;
		font-weight: 300;
		line-height: 1;
	}

	/* ========== 时间线列表 ========== */
	.timeline-scroll {
		padding-top: 8px;
	}

	.timeline-list {
		padding: 0 20px 100px;
	}

	.timeline-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 20px;
	}

	/* 时间轴节点 */
	.timeline-node {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 24px;
		flex-shrink: 0;
	}

	.node-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 6px;
	}

	.node-dot.today {
		background-color: #8BC34A;
	}

	.node-dot.other {
		background-color: #C7C7CC;
	}

	.node-line {
		width: 1.5px;
		flex: 1;
		background-color: #E5E5EA;
		margin-top: 4px;
		min-height: 20px;
	}

	/* 内容区 */
	.timeline-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		margin-left: 8px;
	}

	.content-time {
		font-size: 13px;
		font-weight: 500;
		color: #8BC34A;
	}

	.content-name {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
		margin-top: 2px;
	}

	.content-sub {
		font-size: 13px;
		color: #8E8E93;
	}

	/* 右侧图片与数据 */
	.timeline-media {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-left: 12px;
		flex-shrink: 0;
	}

	.content-thumb {
		width: 64px;
		height: 64px;
		object-fit: cover;
		border: 2px solid #FFFFFF;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
		animation: imageEnter 0.3s ease forwards;
	}

	@keyframes imageEnter {
		from {
			transform: translateY(10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.content-thumb-placeholder {
		width: 64px;
		height: 64px;
		border-radius: 12px;
		background-color: #F2F2F7;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		border: 2px solid #FFFFFF;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.content-calorie-wrap {
		display: flex;
		align-items: baseline;
		margin-top: 4px;
	}

	.content-calorie {
		font-size: 18px;
		font-weight: 700;
		color: #FF6B35;
	}

	.content-calorie-unit {
		font-size: 12px;
		color: #FF6B35;
		margin-left: 2px;
	}

	/* ========== 空状态 ========== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60px 0;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.empty-text {
		font-size: 16px;
		color: #1C1C1E;
		margin-bottom: 8px;
	}

	.empty-hint {
		font-size: 12px;
		color: #8E8E93;
	}

	/* 底部TabBar占位 */
	.tabbar-placeholder {
		height: 80px;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
