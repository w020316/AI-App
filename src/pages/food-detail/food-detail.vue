<template>
	<view class="detail-page">
		<!-- 关闭按钮 -->
		<view class="close-btn" @tap="goBack" @click="goBack">
			<text class="close-icon">✕</text>
		</view>

		<!-- 边缘预览 - 左侧 -->
		<image
			v-if="prevRecord && prevRecord.imageUrl"
			class="edge-preview edge-preview-left"
			:src="prevRecord.imageUrl"
			mode="aspectFill"
		></image>
		<view v-else-if="prevRecord" class="edge-preview edge-preview-left placeholder-preview">
			<text class="preview-icon">🍽️</text>
		</view>

		<!-- 边缘预览 - 右侧 -->
		<image
			v-if="nextRecord && nextRecord.imageUrl"
			class="edge-preview edge-preview-right"
			:src="nextRecord.imageUrl"
			mode="aspectFill"
		></image>
		<view v-else-if="nextRecord" class="edge-preview edge-preview-right placeholder-preview">
			<text class="preview-icon">🍽️</text>
		</view>

		<!-- 空状态 -->
		<view v-if="records.length === 0" class="empty-state">
			<text class="empty-icon">🍽️</text>
			<text class="empty-text">暂无食物记录</text>
			<text class="empty-hint">返回首页添加记录</text>
		</view>

		<!-- 全屏横向轮播 -->
		<swiper
			v-else
			class="food-swiper"
			:current="currentIndex"
			@change="onSwiperChange"
			:previous-margin="previousMargin"
			:next-margin="nextMargin"
		>
			<swiper-item
				v-for="(record, index) in records"
				:key="record.id"
				class="swiper-item"
			>
				<view
					class="food-card"
					:class="{ 'card-active': index === currentIndex }"
				>
					<!-- 食物大图 -->
					<image
						v-if="record.imageUrl"
						class="card-image"
						:src="record.imageUrl"
						mode="aspectFill"
					></image>
					<view v-else class="card-image card-image-placeholder">
						<text class="placeholder-icon">🍽️</text>
					</view>

					<!-- 信息区域 -->
					<view class="info-wrap">
						<view class="calorie-row">
							<text class="calorie-num">{{ record.actualCalories }}</text>
							<text class="calorie-unit">kcal</text>
						</view>
						<text class="food-name">{{ record.foodName }}</text>
						<text class="meta-percentage">食用比例 {{ record.percentage }}%</text>
						<text class="meta-time">{{ formatRecordTime(record.recordedAt) }}</text>
					</view>
				</view>
			</swiper-item>
		</swiper>

		<!-- 底部操作 -->
		<view v-if="records.length > 0" class="bottom-actions">
			<view class="action-delete" @tap="deleteRecord" @click="deleteRecord">
				<text class="action-text-delete">删除</text>
			</view>
			<view class="action-livelog" @tap="addToLiveLog" @click="addToLiveLog">
				<text class="action-text-livelog">添加到 LiveLog</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getFoodRecords, deleteFoodRecord } from '@/store/index.js'
	import { formatTime, isToday } from '@/utils/index.js'

	function formatDate(date) {
		const d = date instanceof Date ? date : new Date(date)
		const year = d.getFullYear()
		const month = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	export default {
		data() {
			return {
				currentIndex: 0,
				records: [],
				targetIndex: -1,
				targetId: '',
				targetDate: '',
				previousMargin: '40px',
				nextMargin: '40px'
			}
		},
		computed: {
			prevRecord() {
				if (this.records.length === 0 || this.currentIndex <= 0) return null
				return this.records[this.currentIndex - 1]
			},
			nextRecord() {
				if (this.records.length === 0 || this.currentIndex >= this.records.length - 1) return null
				return this.records[this.currentIndex + 1]
			}
		},
		onLoad(options) {
			this.targetId = options.id || ''
			if (options.index !== undefined) {
				this.targetIndex = parseInt(options.index) || 0
			}
			this.targetDate = options.date || formatDate(new Date())
			this.loadRecords()
		},
		methods: {
			loadRecords() {
				this.records = getFoodRecords(this.targetDate)
				if (this.targetIndex >= 0 && this.targetIndex < this.records.length) {
					this.currentIndex = this.targetIndex
				} else if (this.targetId) {
					const index = this.records.findIndex(r => r.id === this.targetId)
					if (index !== -1) {
						this.currentIndex = index
					}
				}
			},
			onSwiperChange(e) {
				this.currentIndex = e.detail.current
			},
			formatRecordTime(dateStr) {
				const d = new Date(dateStr)
				const prefix = isToday(d) ? '今天' : ''
				return `${prefix} ${formatTime(d)}`
			},
			goBack() {
				uni.switchTab({ url: '/pages/home/home' })
			},
			deleteRecord() {
				const record = this.records[this.currentIndex]
				if (!record) return
				uni.showModal({
					title: '确认删除',
					content: `删除"${record.foodName}"的记录？`,
					success: (res) => {
						if (res.confirm) {
							deleteFoodRecord(record.id)
							uni.showToast({ title: '已删除', icon: 'success' })
							setTimeout(() => uni.switchTab({ url: '/pages/home/home' }), 800)
						}
					}
				})
			},
			addToLiveLog() {
				const record = this.records[this.currentIndex]
				if (!record) return
				uni.navigateTo({
					url: `/pages/livelog/livelog?foodId=${record.id}`
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.detail-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%);
		position: relative;
		overflow: hidden;
	}

	/* 关闭按钮 */
	.close-btn {
		position: absolute;
		top: 59px;
		left: 20px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.close-icon {
		color: #8E8E93;
		font-size: 20px;
		line-height: 1;
	}

	/* 边缘预览 */
	.edge-preview {
		position: absolute;
		top: 200px;
		width: 200px;
		height: 200px;
		opacity: 0.5;
		transform: scale(0.85);
		filter: blur(2px);
		border-radius: 16px;
		overflow: hidden;
		z-index: 1;
	}

	.edge-preview-left {
		left: -40px;
	}

	.edge-preview-right {
		right: -40px;
	}

	.placeholder-preview {
		background-color: #F2F2F7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-icon {
		font-size: 48px;
	}

	/* 空状态 */
	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	.empty-text {
		font-size: 18px;
		color: #1C1C1E;
		margin-bottom: 8px;
		font-weight: 500;
	}

	.empty-hint {
		font-size: 14px;
		color: #8E8E93;
	}

	/* 轮播 */
	.food-swiper {
		width: 100%;
		height: 100vh;
	}

	.swiper-item {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.food-card {
		position: absolute;
		top: 180px;
		left: 50%;
		transform: translateX(-50%) scale(0.85);
		text-align: center;
		width: 280px;
		opacity: 0.5;
		filter: blur(2px);
		transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
			opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
			filter 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.food-card.card-active {
		transform: translateX(-50%) scale(1);
		opacity: 1;
		filter: blur(0);
	}

	/* 大图 */
	.card-image {
		width: 240px;
		height: 240px;
		object-fit: cover;
		border: 3px solid #FFFFFF;
		border-radius: 20px;
		filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.12));
	}

	.card-image-placeholder {
		background-color: #F2F2F7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon {
		font-size: 64px;
	}

	/* 信息区域 */
	.info-wrap {
		margin-top: 24px;
	}

	.calorie-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
	}

	.calorie-num {
		font-size: 40px;
		font-weight: 800;
		color: #FF6B35;
		line-height: 1;
	}

	.calorie-unit {
		font-size: 18px;
		font-weight: 500;
		color: #FF6B35;
		margin-left: 4px;
	}

	.food-name {
		margin: 16px 0 0;
		font-size: 22px;
		font-weight: 600;
		color: #1C1C1E;
		display: block;
	}

	.meta-percentage {
		font-size: 14px;
		color: #8BC34A;
		font-weight: 500;
		margin-top: 8px;
		display: block;
	}

	.meta-time {
		font-size: 14px;
		color: #8E8E93;
		margin-top: 4px;
		display: block;
	}

	/* 底部操作 */
	.bottom-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		gap: 12px;
		padding: 16px 20px;
		padding-bottom: calc(16px + constant(safe-area-inset-bottom));
		padding-bottom: calc(16px + env(safe-area-inset-bottom));
		background-color: #FFFFFF;
		z-index: 10;
	}

	.action-delete {
		flex: 1;
		height: 48px;
		border-radius: 16px;
		background-color: rgba(224, 93, 93, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-text-delete {
		color: #E05D5D;
		font-size: 15px;
		font-weight: 500;
	}

	.action-livelog {
		flex: 2;
		height: 48px;
		border-radius: 16px;
		background-color: #1C1C1E;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-text-livelog {
		color: #FFFFFF;
		font-size: 15px;
		font-weight: 500;
	}
</style>
