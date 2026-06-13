<template>
	<view class="water-page">
		<!-- 顶部区域 -->
		<view class="header">
			<view class="back-btn" @tap="goBack">
				<text class="back-icon">−</text>
			</view>
			<text class="target-text">{{ formatNumber(targetWater) }}ml</text>
		</view>

		<!-- 人形容器 -->
		<view class="human-container">
			<svg class="human-svg" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" style="stop-color:#E1F5FE;stop-opacity:1" />
						<stop offset="100%" style="stop-color:#81D4FA;stop-opacity:1" />
					</linearGradient>
					<clipPath id="bodyClip">
						<path d="M90,60 C90,30 110,10 150,10 C190,10 210,30 210,60 C210,80 230,90 240,110 C250,130 245,160 235,180 C220,210 210,250 210,300 C210,360 230,380 250,400 L50,400 C70,380 90,360 90,300 C90,250 80,210 65,180 C55,160 50,130 60,110 C70,90 90,80 90,60 Z" />
					</clipPath>
				</defs>

				<!-- 水体填充 -->
				<g clip-path="url(#bodyClip)">
					<rect
						class="water-rect"
						:x="0"
						:y="420 - waterHeight"
						:width="300"
						:height="waterHeight"
						fill="url(#waterGrad)"
						opacity="0.75"
					/>
					<!-- 波浪 -->
					<g :transform="`translate(0, ${420 - waterHeight})`">
						<path
							class="wave"
							d="M-100,0 Q-75,-8 -50,0 T0,0 T50,0 T100,0 T150,0 T200,0 T250,0 T300,0 T350,0 T400,0 V15 H-100 Z"
							fill="rgba(225,245,254,0.6)"
						/>
					</g>
					<!-- 气泡 -->
					<circle
						v-for="(b, i) in bubbles"
						:key="'b-'+i"
						class="bubble"
						:cx="b.x"
						:cy="b.y"
						:r="b.r"
						fill="rgba(255,255,255,0.6)"
						:style="{ animationDelay: b.delay + 's' }"
					/>
				</g>

				<!-- 容器轮廓 -->
				<path
					class="body-outline"
					d="M90,60 C90,30 110,10 150,10 C190,10 210,30 210,60 C210,80 230,90 240,110 C250,130 245,160 235,180 C220,210 210,250 210,300 C210,360 230,380 250,400 L50,400 C70,380 90,360 90,300 C90,250 80,210 65,180 C55,160 50,130 60,110 C70,90 90,80 90,60 Z"
					fill="none"
					stroke="rgba(255,255,255,0.6)"
					stroke-width="3"
				/>
			</svg>
		</view>

		<!-- 刻度系统 -->
		<view class="scale-system">
			<view v-for="s in scales" :key="s" class="scale-item">
				<view class="scale-line" :class="{ major: s % 500 === 0, minor: s % 500 !== 0 }"></view>
				<text class="scale-label">{{ s }}ml</text>
			</view>
		</view>

		<!-- 中央添加按钮 -->
		<view class="fab" :class="{ pressing: fabPressing }" @touchstart="onFabDown" @touchend="onFabUp" @tap="openAddModal">
			<text class="fab-icon">+</text>
		</view>

		<!-- 饮水记录列表 -->
		<scroll-view scroll-y class="records-scroll">
			<view class="records">
				<view v-for="r in waterRecords" :key="r.id" class="record-item">
					<text class="r-time">{{ formatRecordTime(r.recordedAt) }}</text>
					<text class="r-amount">{{ r.amount }}ml</text>
					<view class="r-del" @tap="deleteRecord(r.id)">
						<text class="r-del-icon">×</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部控制区 -->
		<view class="bottom-controls">
			<view class="ctrl-left">
				<text class="ctrl-title">{{ selectedAmount ? selectedAmount + 'ml' : '请选择喝水量' }}</text>
				<text class="ctrl-desc">{{ waterDescription }}</text>
			</view>
			<view class="ctrl-right" @tap="openTimePicker">
				<text class="ctrl-time">现在 {{ currentTime }}</text>
				<text class="ctrl-arrow">▾</text>
			</view>
		</view>

		<!-- 水量选择弹窗 -->
		<view v-if="showAddModal" class="modal-overlay" @tap="closeAddModal">
			<view class="modal-sheet" @tap.stop>
				<view class="modal-handle"></view>
				<text class="modal-title">选择喝水量</text>
				<view class="amount-grid">
					<view
						v-for="opt in amountOptions"
						:key="opt"
						class="amount-opt"
						:class="{ active: selectedAmount === opt && !isCustom }"
						@tap="selectAmount(opt)"
					>
						<text class="amount-opt-text">{{ opt }}ml</text>
					</view>
					<view
						class="amount-opt"
						:class="{ active: isCustom }"
						@tap="selectCustom"
					>
						<text class="amount-opt-text">自定义</text>
					</view>
				</view>
				<view v-if="isCustom" class="custom-wrap">
					<input class="custom-input" v-model="customAmount" type="digit" placeholder="输入水量(ml)" />
				</view>
				<view class="modal-btn" @tap="confirmAddWater">
					<text class="modal-btn-text">确认</text>
				</view>
			</view>
		</view>

		<!-- 时间选择弹窗 -->
		<view v-if="showTimePicker" class="modal-overlay" @tap="showTimePicker = false">
			<view class="modal-sheet" @tap.stop>
				<view class="modal-handle"></view>
				<text class="modal-title">选择时间</text>
				<picker-view class="time-picker" :value="timePickerValue" @change="onTimeChange">
					<picker-view-column>
						<view v-for="h in 24" :key="'h'+h" class="picker-item">{{ String(h-1).padStart(2,'0') }}</view>
					</picker-view-column>
					<picker-view-column>
						<view v-for="m in 60" :key="'m'+m" class="picker-item">{{ String(m-1).padStart(2,'0') }}</view>
					</picker-view-column>
				</picker-view>
				<view class="modal-btn" @tap="confirmTime">
					<text class="modal-btn-text">确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getWaterRecords, addWaterRecord, getDayWaterTotal, getSettings, initMockData } from '@/store/index.js'
	import { formatTime, getWaterDescription } from '@/utils/index.js'

	export default {
		data() {
			return {
				totalWater: 0,
				targetWater: 2000,
				waterRecords: [],
				showAddModal: false,
				showTimePicker: false,
				selectedAmount: 0,
				customAmount: '',
				amountOptions: [100, 150, 200, 250, 500],
				isCustom: false,
				currentTime: '',
				selectedHour: 0,
				selectedMinute: 0,
				fabPressing: false,
				bubbles: Array.from({ length: 12 }, (_, i) => ({
					x: 80 + Math.random() * 140,
					y: 300 + Math.random() * 80,
					r: 2 + Math.random() * 3,
					delay: Math.random() * 3
				}))
			}
		},
		computed: {
			waterHeight() {
				return Math.min((this.totalWater / this.targetWater) * 420, 420)
			},
			waterDescription() {
				const amount = this.isCustom ? (parseInt(this.customAmount) || 0) : this.selectedAmount
				return getWaterDescription(amount)
			},
			scales() {
				const list = []
				const step = 250
				for (let v = step; v <= this.targetWater; v += step) {
					list.push(v)
				}
				return list.reverse()
			},
			timePickerValue() {
				return [this.selectedHour, this.selectedMinute]
			}
		},
		onLoad() {
			initMockData()
			const now = new Date()
			this.selectedHour = now.getHours()
			this.selectedMinute = now.getMinutes()
			this.currentTime = formatTime(now)
		},
		onShow() {
			this.refreshData()
		},
		methods: {
			refreshData() {
				const settings = getSettings()
				this.targetWater = settings.targetWater || 2000
				this.totalWater = getDayWaterTotal(new Date())
				this.waterRecords = getWaterRecords(new Date())
			},
			formatNumber(n) {
				return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
			},
			goBack() {
			uni.switchTab({ url: '/pages/home/home' })
		},
			onFabDown() {
				this.fabPressing = true
			},
			onFabUp() {
				this.fabPressing = false
			},
			openAddModal() {
				this.showAddModal = true
				this.isCustom = false
				this.selectedAmount = 250
				this.customAmount = ''
			},
			closeAddModal() {
				this.showAddModal = false
			},
			selectAmount(amount) {
				this.selectedAmount = amount
				this.isCustom = false
				this.confirmAddWater()
			},
			selectCustom() {
				this.isCustom = true
				this.selectedAmount = 0
				this.customAmount = ''
			},
			confirmAddWater() {
				const amount = this.isCustom ? (parseInt(this.customAmount) || 0) : this.selectedAmount
				if (!amount || amount <= 0) {
					uni.showToast({ title: '请输入有效水量', icon: 'none' })
					return
				}
				const now = new Date()
				now.setHours(this.selectedHour)
				now.setMinutes(this.selectedMinute)
				now.setSeconds(0)
				const record = {
					amount: amount,
					description: getWaterDescription(amount),
					recordedAt: now.toISOString()
				}
				addWaterRecord(record)
				this.showAddModal = false
				this.customAmount = ''
				uni.showToast({ title: '记录成功', icon: 'success' })
				this.refreshData()
			},
			deleteRecord(id) {
				uni.showModal({
					title: '删除记录',
					content: '确认删除这条饮水记录？',
					success: (res) => {
						if (res.confirm) {
							const key = 'livelog_water_records'
							const all = uni.getStorageSync(key) || []
							const filtered = all.filter(r => r.id !== id)
							uni.setStorageSync(key, filtered)
							this.refreshData()
						}
					}
				})
			},
			openTimePicker() {
				this.showTimePicker = true
			},
			onTimeChange(e) {
				const val = e.detail.value
				this.selectedHour = val[0]
				this.selectedMinute = val[1]
			},
			confirmTime() {
				this.currentTime = String(this.selectedHour).padStart(2, '0') + ':' + String(this.selectedMinute).padStart(2, '0')
				this.showTimePicker = false
			},
			formatRecordTime(dateStr) {
				return formatTime(new Date(dateStr))
			}
		}
	}
</script>

<style lang="scss" scoped>
	.water-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #FFFFFF 0%, #F0F8FF 100%);
		padding-top: 59px;
		position: relative;
		overflow: hidden;
	}

	.header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		z-index: 10;
	}

	.back-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		font-size: 18px;
		color: #8E8E93;
		line-height: 1;
	}

	.target-text {
		font-size: 14px;
		color: #C7C7CC;
		font-weight: 500;
	}

	.human-container {
		position: absolute;
		top: 140px;
		left: 50%;
		transform: translateX(-50%);
		width: 300px;
		height: 420px;
		z-index: 2;
	}

	.human-svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.body-outline {
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
	}

	.water-rect {
		transition: y 0.8s ease-out, height 0.8s ease-out;
	}

	.wave {
		animation: waveMove 0.4s linear infinite;
	}

	@keyframes waveMove {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50px); }
	}

	.bubble {
		animation: bubbleFloat 1.5s linear infinite;
		opacity: 0;
	}

	@keyframes bubbleFloat {
		0% { transform: translateY(0); opacity: 0; }
		20% { opacity: 1; }
		80% { opacity: 0.6; }
		100% { transform: translateY(-100px); opacity: 0; }
	}

	.scale-system {
		position: absolute;
		top: 200px;
		right: 20px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 24px;
		z-index: 5;
	}

	.scale-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.scale-label {
		font-size: 11px;
		font-weight: 600;
		color: #4FC3F7;
	}

	.scale-line {
		height: 2px;
		border-radius: 1px;
	}

	.scale-line.major {
		width: 12px;
		background: #4FC3F7;
	}

	.scale-line.minor {
		width: 8px;
		background: #81D4FA;
	}

	.fab {
		position: absolute;
		top: 480px;
		left: 50%;
		transform: translateX(-50%);
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: #FFFFFF;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	.fab.pressing {
		animation: fabPress 0.2s ease;
	}

	@keyframes fabPress {
		0% { transform: translateX(-50%) scale(1); }
		50% { transform: translateX(-50%) scale(0.88); }
		100% { transform: translateX(-50%) scale(1); }
	}

	.fab-icon {
		font-size: 32px;
		color: #8BC34A;
		font-weight: 300;
		line-height: 1;
	}

	.records-scroll {
		position: absolute;
		top: 560px;
		left: 0;
		right: 0;
		bottom: 140px;
		z-index: 5;
	}

	.records {
		padding: 0 20px;
	}

	.record-item {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background: #FFFFFF;
		border-radius: 12px;
		margin-bottom: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.r-time {
		flex: 1;
		font-size: 14px;
		color: #8E8E93;
	}

	.r-amount {
		font-size: 16px;
		font-weight: 600;
		color: #4FC3F7;
		margin-right: 12px;
	}

	.r-del {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #FFEBEE;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.r-del-icon {
		font-size: 16px;
		color: #E05D5D;
		line-height: 1;
	}

	.bottom-controls {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 140px;
		background: #FFFFFF;
		border-radius: 24px 24px 0 0;
		padding: 20px;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.04);
		z-index: 10;
	}

	.ctrl-left {
		display: flex;
		flex-direction: column;
	}

	.ctrl-title {
		font-size: 16px;
		font-weight: 600;
		color: #1C1C1E;
	}

	.ctrl-desc {
		font-size: 13px;
		color: #8E8E93;
		margin-top: 4px;
	}

	.ctrl-right {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 4px 0;
	}

	.ctrl-time {
		font-size: 14px;
		color: #1C1C1E;
	}

	.ctrl-arrow {
		font-size: 10px;
		color: #8E8E93;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: flex-end;
		z-index: 100;
	}

	.modal-sheet {
		width: 100%;
		background: #FFFFFF;
		border-top-left-radius: 24px;
		border-top-right-radius: 24px;
		padding: 12px 24px 32px;
		animation: sheetUp 0.3s ease-out;
	}

	@keyframes sheetUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	.modal-handle {
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: #E5E5EA;
		margin: 0 auto 16px;
	}

	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: #1C1C1E;
		margin-bottom: 16px;
		display: block;
	}

	.amount-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 16px;
	}

	.amount-opt {
		width: calc(33.333% - 7px);
		height: 48px;
		border-radius: 12px;
		background: #F2F2F7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.amount-opt.active {
		background: #4FC3F7;
	}

	.amount-opt.active .amount-opt-text {
		color: #FFFFFF;
	}

	.amount-opt-text {
		font-size: 15px;
		color: #1C1C1E;
	}

	.custom-wrap {
		margin-bottom: 16px;
	}

	.custom-input {
		height: 48px;
		background: #F2F2F7;
		border-radius: 12px;
		padding: 0 16px;
		font-size: 15px;
		color: #1C1C1E;
	}

	.modal-btn {
		height: 52px;
		border-radius: 16px;
		background: #4FC3F7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-btn:active {
		opacity: 0.9;
	}

	.modal-btn-text {
		font-size: 16px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.time-picker {
		height: 200px;
		margin-bottom: 16px;
	}

	.picker-item {
		line-height: 40px;
		text-align: center;
		font-size: 16px;
		color: #1C1C1E;
	}
</style>
