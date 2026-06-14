<template>
	<view class="settings-page">
		<view class="page-header">
			<text class="page-title">设置</text>
		</view>

		<scroll-view scroll-y class="settings-scroll">
			<!-- 分组1 - 个人信息 -->
			<view class="section">
				<text class="section-title">个人信息</text>
				<view class="setting-card">
					<view class="setting-item">
						<text class="item-label">昵称</text>
						<input class="item-input" v-model="settings.nickname" placeholder="请输入昵称" @blur="save" />
					</view>
					<view class="setting-item">
						<text class="item-label">身高(cm)</text>
						<input class="item-input" v-model="settings.height" type="digit" placeholder="170" @blur="save" />
					</view>
					<view class="setting-item" @tap="goToWeight">
						<text class="item-label">体重(kg)</text>
						<view class="item-right">
							<text class="item-value">{{ settings.weight ? settings.weight + 'kg' : '未设置' }}</text>
							<text class="item-arrow">›</text>
						</view>
					</view>
					<view class="setting-item">
						<text class="item-label">生日</text>
						<picker mode="date" :value="settings.birthday || ''" @change="onBirthdayChange">
							<view class="item-right">
								<text class="item-value">{{ settings.birthday || '请选择' }}</text>
								<text class="item-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="setting-item">
						<text class="item-label">性别</text>
						<view class="gender-options">
							<view class="gender-btn" :class="{ active: settings.gender === '男' }" @tap="setGender('男')">
								<text class="gender-text">男</text>
							</view>
							<view class="gender-btn" :class="{ active: settings.gender === '女' }" @tap="setGender('女')">
								<text class="gender-text">女</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 分组2 - 目标设置 -->
			<view class="section">
				<text class="section-title">目标设置</text>
				<view class="setting-card">
					<view class="setting-item">
						<text class="item-label">每日卡路里目标</text>
						<input class="item-input" v-model="settings.targetCalories" type="digit" placeholder="2000" @blur="save" />
					</view>
					<view class="setting-item">
						<text class="item-label">每日饮水目标</text>
						<input class="item-input" v-model="settings.targetWater" type="digit" placeholder="2000" @blur="save" />
					</view>
					<view class="setting-item">
						<text class="item-label">体重目标</text>
						<input class="item-input" v-model="settings.targetWeight" type="digit" placeholder="未设置" @blur="save" />
					</view>
				</view>
			</view>

			<!-- 分组3 - 活动水平 -->
			<view class="section">
				<text class="section-title">活动水平</text>
				<view class="setting-card">
					<view class="activity-control">
						<view
							v-for="level in activityLevels"
							:key="level"
							class="activity-item"
							:class="{ active: settings.activityLevel === level }"
							@tap="setActivityLevel(level)"
						>
							<text class="activity-text">{{ level }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 分组4 - 提醒设置 -->
			<view class="section">
				<text class="section-title">提醒设置</text>
				<view class="setting-card">
					<view class="setting-item">
						<text class="item-label">饮食记录提醒</text>
						<switch :checked="settings.foodReminder" @change="toggleSetting('foodReminder', $event)" color="#AED581" />
					</view>
					<view class="setting-item">
						<text class="item-label">饮水提醒</text>
						<switch :checked="settings.waterReminder" @change="toggleSetting('waterReminder', $event)" color="#AED581" />
					</view>
					<view class="setting-item">
						<text class="item-label">体重记录提醒</text>
						<switch :checked="settings.weightReminder" @change="toggleSetting('weightReminder', $event)" color="#AED581" />
					</view>
				</view>
			</view>

			<!-- 分组5 - 其他 -->
			<view class="section">
				<text class="section-title">其他</text>
				<view class="setting-card">
					<view class="setting-item danger" @tap="clearData" @click="clearData">
						<text class="item-label danger-text">清除所有数据</text>
					</view>
					<view class="setting-item">
						<text class="item-label">关于</text>
						<text class="item-value">v1.0.0</text>
					</view>
				</view>
			</view>

			<view style="height: 80px;"></view>
		</scroll-view>

		<TabBar current="settings" />
	</view>
</template>

<script>
	import TabBar from '@/components/TabBar.vue'
	import { getSettings, saveSettings, initMockData } from '@/store/index.js'

	export default {
		components: { TabBar },
		data() {
			return {
				settings: {
					nickname: '',
					height: '',
					weight: '',
					birthday: '',
					gender: '',
					targetCalories: 2000,
					targetWater: 2000,
					targetWeight: '',
					activityLevel: '久坐',
					foodReminder: false,
					waterReminder: false,
					weightReminder: false
				},
				activityLevels: ['久坐', '轻活动', '中等活动', '高活动'],
				isLoaded: false
			}
		},
		onShow() {
			if (!this.isLoaded) {
				initMockData()
				const saved = getSettings()
				this.settings = { ...this.settings, ...saved }
				this.isLoaded = true
			}
		},
		methods: {
			save() {
				saveSettings(this.settings)
			},
			onBirthdayChange(e) {
				this.settings.birthday = e.detail.value
				this.save()
			},
			setGender(gender) {
				this.settings.gender = gender
				this.save()
			},
			goToWeight() {
				uni.navigateTo({ url: '/pages/weight/weight' })
			},
			setActivityLevel(level) {
				this.settings.activityLevel = level
				this.save()
			},
			toggleSetting(key, e) {
				this.settings[key] = e.detail.value
				this.save()
			},
			clearData() {
				uni.showModal({
					title: '确认清除',
					content: '将清除所有记录数据，此操作不可恢复',
					confirmColor: '#FF6B35',
					success: (res) => {
						if (res.confirm) {
							uni.clearStorageSync()
							this.settings = {
								nickname: '',
								height: '',
								weight: '',
								birthday: '',
								gender: '',
								targetCalories: 2000,
								targetWater: 2000,
								targetWeight: '',
								activityLevel: '久坐',
								foodReminder: false,
								waterReminder: false,
								weightReminder: false
							}
							saveSettings(this.settings)
							uni.showToast({ title: '已清除', icon: 'success' })
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.settings-page {
		min-height: 100vh;
		background-color: #F9F9F9;
		padding-top: 59px;
		display: flex;
		flex-direction: column;
	}

	.page-header {
		padding: 20px;
	}

	.page-title {
		font-size: 22px;
		font-weight: 700;
		color: #1C1C1E;
	}

	.settings-scroll {
		flex: 1;
		overflow: hidden;
	}

	.section {
		margin-bottom: 8px;
	}

	.section-title {
		font-size: 12px;
		color: #8E8E93;
		font-weight: 400;
		padding: 24px 20px 8px;
		display: block;
	}

	.setting-card {
		background-color: #FFFFFF;
		border-radius: 12px;
		margin: 0 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 0.5px solid #E5E5EA;
	}

	.setting-item:last-child {
		border-bottom: none;
	}

	.item-label {
		font-size: 16px;
		color: #1C1C1E;
	}

	.item-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.item-value {
		font-size: 14px;
		color: #8E8E93;
	}

	.item-arrow {
		font-size: 18px;
		color: #C8C8C8;
	}

	.item-input {
		flex: 1;
		text-align: right;
		font-size: 14px;
		color: #8E8E93;
		height: 24px;
	}

	.danger-text {
		color: #FF6B35;
	}

	.gender-options {
		display: flex;
		gap: 12px;
	}

	.gender-btn {
		width: 60px;
		height: 32px;
		border-radius: 8px;
		background-color: #F2F2F7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gender-btn.active {
		background-color: #AED581;
	}

	.gender-text {
		font-size: 14px;
		color: #8E8E93;
	}

	.gender-btn.active .gender-text {
		color: #FFFFFF;
	}

	.activity-control {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px;
		padding: 16px 12px;
	}

	.activity-item {
		border-radius: 16px;
		padding: 7px 16px;
		background: #F2F2F7;
		border: 1px solid #E5E5EA;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.activity-item.active {
		background: #AED581;
		border-color: #AED581;
	}

	.activity-text {
		font-size: 14px;
		color: #8E8E93;
	}

	.activity-item.active .activity-text {
		color: #FFFFFF;
	}
</style>
