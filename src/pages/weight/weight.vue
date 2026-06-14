<template>
	<view class="weight-page">
		<!-- 状态栏占位 -->
		<view :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="goBack" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">体重记录</text>
			<view class="nav-right"></view>
		</view>

		<!-- 活动量选择 -->
		<view class="section">
			<text class="section-title">今日活动量</text>
			<view class="activity-selector">
				<view
					v-for="level in activityLevels"
					:key="level.value"
					class="activity-pill"
					:class="{ active: selectedActivity === level.value }"
					@tap="selectedActivity = level.value"
					@click="selectedActivity = level.value"
				>
					<text class="activity-label">{{ level.label }}</text>
				</view>
			</view>
		</view>

		<!-- 体重输入 -->
		<view class="section">
			<text class="section-title">体重</text>
			<view class="weight-input-area">
				<view class="weight-display">
					<text class="weight-number">{{ weightInput || '0.00' }}</text>
					<text class="weight-unit">kg</text>
				</view>
				<view class="weight-keypad">
					<view class="keypad-row">
						<view class="key" @tap="inputKey('1')" @click="inputKey('1')"><text>1</text></view>
						<view class="key" @tap="inputKey('2')" @click="inputKey('2')"><text>2</text></view>
						<view class="key" @tap="inputKey('3')" @click="inputKey('3')"><text>3</text></view>
					</view>
					<view class="keypad-row">
						<view class="key" @tap="inputKey('4')" @click="inputKey('4')"><text>4</text></view>
						<view class="key" @tap="inputKey('5')" @click="inputKey('5')"><text>5</text></view>
						<view class="key" @tap="inputKey('6')" @click="inputKey('6')"><text>6</text></view>
					</view>
					<view class="keypad-row">
						<view class="key" @tap="inputKey('7')" @click="inputKey('7')"><text>7</text></view>
						<view class="key" @tap="inputKey('8')" @click="inputKey('8')"><text>8</text></view>
						<view class="key" @tap="inputKey('9')" @click="inputKey('9')"><text>9</text></view>
					</view>
					<view class="keypad-row">
						<view class="key" @tap="inputKey('.')"><text>.</text></view>
						<view class="key" @tap="inputKey('0')"><text>0</text></view>
						<view class="key key-delete" @tap="deleteKey"><text>⌫</text></view>
					</view>
				</view>
			</view>
		</view>

		<!-- BMI展示 -->
		<view class="section">
			<text class="section-title">BMI</text>
			<view class="bmi-card">
				<view class="bmi-display">
					<text class="bmi-number" :style="{ color: bmiLevel.color }">{{ bmiValue }}</text>
					<text class="bmi-level" :style="{ color: bmiLevel.color }">{{ bmiLevel.label }}</text>
				</view>
				<view class="bmi-bar">
					<view class="bmi-range" v-for="range in bmiRanges" :key="range.label"
						:style="{ flex: range.flex, backgroundColor: range.color }">
					</view>
				</view>
				<view class="bmi-labels">
					<text class="bmi-label">偏瘦</text>
					<text class="bmi-label">正常</text>
					<text class="bmi-label">偏胖</text>
					<text class="bmi-label">肥胖</text>
				</view>
			</view>
		</view>

		<!-- 保存按钮 -->
		<view class="save-area">
			<view class="save-btn" @tap="saveWeight" @click="saveWeight">
				<text class="save-text">保存记录</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { addWeightRecord, getUser, getWeightRecords } from '@/store/index.js'
	import { calculateBMI, getBMILevel } from '@/utils/index.js'

	export default {
		data() {
			return {
				statusBarHeight: 0,
				weightInput: '',
				selectedActivity: '久坐',
				activityLevels: [
					{ value: '久坐', label: '久坐' },
					{ value: '轻活动', label: '轻活动' },
					{ value: '中等活动', label: '中等活动' },
					{ value: '高活动', label: '高活动' }
				],
				bmiRanges: [
					{ label: '偏瘦', color: '#6BB3E0', flex: 2 },
					{ label: '正常', color: '#8B9A6B', flex: 3 },
					{ label: '偏胖', color: '#E8A838', flex: 2 },
					{ label: '肥胖', color: '#E05D5D', flex: 2 }
				]
			}
		},
		computed: {
			bmiValue() {
				const weight = parseFloat(this.weightInput)
				if (!weight) return '——'
				const user = getUser()
				const height = user.height || 170
				return calculateBMI(weight, height)
			},
			bmiLevel() {
				const bmi = parseFloat(this.bmiValue)
				if (isNaN(bmi)) return { label: '——', color: '#8A8A8A' }
				return getBMILevel(bmi)
			}
		},
		onLoad() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 20
			this.loadLatestWeight()
		},
		methods: {
			loadLatestWeight() {
				const records = getWeightRecords(new Date())
				if (records.length > 0) {
					const latest = records[records.length - 1]
					this.weightInput = latest.weight.toString()
					this.selectedActivity = latest.activityLevel
				}
			},
			inputKey(key) {
				if (key === '.' && this.weightInput.includes('.')) return
				if (this.weightInput.includes('.') && this.weightInput.split('.')[1].length >= 2) return
				this.weightInput += key
			},
			deleteKey() {
				this.weightInput = this.weightInput.slice(0, -1)
			},
			saveWeight() {
				const weight = parseFloat(this.weightInput)
				if (!weight || weight <= 0) {
					uni.showToast({ title: '请输入体重', icon: 'none' })
					return
				}
				addWeightRecord({
					weight: weight,
					activityLevel: this.selectedActivity
				})
				uni.showToast({ title: '记录成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 800)
			},
			goBack() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.weight-page {
		min-height: 100vh;
		background-color: #F5F5F0;
	}

	/* 导航栏 */
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
	}

	.nav-back {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		font-size: 24px;
		color: #2C2C2C;
	}

	.nav-title {
		font-size: 17px;
		font-weight: 600;
		color: #2C2C2C;
	}

	.nav-right {
		width: 36px;
	}

	/* 区块 */
	.section {
		padding: 16px 20px;
	}

	.section-title {
		font-size: 14px;
		color: #8A8A8A;
		margin-bottom: 12px;
		display: block;
	}

	/* 活动量选择 */
	.activity-selector {
		display: flex;
		gap: 10px;
	}

	.activity-pill {
		flex: 1;
		height: 40px;
		border-radius: 16px;
		background-color: #E8E8E0;
		display: flex;
		align-items: center;
		justify-content: center;

		&.active {
			background-color: #8B9A6B;
		}
	}

	.activity-label {
		font-size: 13px;
		color: #8A8A8A;
	}

	.activity-pill.active .activity-label {
		color: #FFFFFF;
	}

	/* 体重输入 */
	.weight-input-area {
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 20px;
	}

	.weight-display {
		display: flex;
		align-items: baseline;
		justify-content: center;
		margin-bottom: 20px;
	}

	.weight-number {
		font-size: 48px;
		font-weight: 700;
		color: #2C2C2C;
	}

	.weight-unit {
		font-size: 16px;
		color: #8A8A8A;
		margin-left: 8px;
	}

	.weight-keypad {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.keypad-row {
		display: flex;
		gap: 8px;
	}

	.key {
		flex: 1;
		height: 48px;
		border-radius: 12px;
		background-color: #F5F5F0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		color: #2C2C2C;
		font-weight: 500;

		&:active {
			background-color: #E8E8E0;
		}
	}

	.key-delete {
		background-color: #E8E8E0;

		&:active {
			background-color: #D8D8D0;
		}
	}

	/* BMI卡片 */
	.bmi-card {
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 20px;
	}

	.bmi-display {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 16px;
	}

	.bmi-number {
		font-size: 36px;
		font-weight: 700;
	}

	.bmi-level {
		font-size: 16px;
		font-weight: 500;
	}

	.bmi-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.bmi-range {
		height: 100%;
	}

	.bmi-labels {
		display: flex;
		justify-content: space-between;
	}

	.bmi-label {
		font-size: 10px;
		color: #8A8A8A;
	}

	/* 保存按钮 */
	.save-area {
		padding: 20px;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.save-btn {
		height: 52px;
		border-radius: 16px;
		background-color: #8B9A6B;
		display: flex;
		align-items: center;
		justify-content: center;

		&:active {
			opacity: 0.85;
		}
	}

	.save-text {
		color: #FFFFFF;
		font-size: 16px;
		font-weight: 600;
	}
</style>
