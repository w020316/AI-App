<template>
	<view class="result-page">
		<!-- 点状网格背景 -->
		<view class="dot-grid"></view>

		<!-- 状态栏占位 -->
		<view class="status-bar-placeholder"></view>

		<!-- 顶部导航区 -->
		<view class="top-nav">
			<view class="close-btn" @tap="goHome">
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
					<path d="M10 10L22 22M22 10L10 22" stroke="#8E8E93" stroke-width="2.5" stroke-linecap="round" />
				</svg>
			</view>
			<view class="portion-selector" @tap="togglePortion" @click="togglePortion">
				<text class="portion-text">{{ percentage }}%</text>
				<text class="portion-arrow">▼</text>
			</view>
		</view>

		<!-- 中央视觉区 -->
		<view class="visual-area" @touchstart="touchStart" @touchend="touchEnd">
			<!-- 思考中状态 -->
			<view v-if="isThinking" class="thinking-wrap">
				<text class="thinking-text">思考中...</text>
			</view>

			<template v-else>
				<view class="slide-container" :class="slideClass">
					<image
						v-if="prevFood && prevFood.imageUrl"
						class="food-image prev-image"
						:src="prevFood.imageUrl"
						mode="aspectFill"
					></image>
					<image
						v-if="currentFood.imageUrl"
						class="food-image current-image"
						:src="currentFood.imageUrl"
						mode="aspectFill"
					></image>
					<image
						v-if="nextFood && nextFood.imageUrl"
						class="food-image next-image"
						:src="nextFood.imageUrl"
						mode="aspectFill"
					></image>
				</view>
			</template>
		</view>

		<!-- 卡路里数字 -->
		<view v-if="!isThinking" class="calorie-display" :class="{ 'calorie-pop': showCalorieAnim }">
			<text class="calorie-number">{{ actualCalories }}</text>
			<text class="calorie-unit">kcal</text>
		</view>

		<!-- 底部Sheet卡片 -->
		<view v-if="!isThinking" class="bottom-sheet">
			<!-- 标题行 -->
			<view class="sheet-header">
				<text class="food-name">{{ currentFood.foodName }}</text>
				<view class="correct-btn" @tap="openCorrectModal">
					<text class="correct-text">纠正 ✏️</text>
				</view>
			</view>

			<!-- 食物标签 -->
			<view class="result-tag-row">
				<view class="tag-bar"></view>
				<view class="tag-info">
					<view class="tag-name-wrap">
						<text class="tag-name">{{ currentFood.foodName }}</text>
						<text class="tag-delete" @tap="removeFood">✕</text>
					</view>
					<text class="tag-detail">约{{ currentFood.calories }}kcal, {{ currentFood.weight }}g</text>
				</view>
			</view>

			<!-- 备注输入区 -->
			<view class="note-section">
				<textarea
					class="note-input"
					v-model="note"
					placeholder="请输入备注，想写点什么吗？"
					placeholder-class="note-placeholder"
					:maxlength="200"
				></textarea>
			</view>

			<!-- 确认按钮 -->
			<view class="confirm-btn" @tap="confirmRecord" @click="confirmRecord">
				<text class="confirm-text">确认记录</text>
			</view>
		</view>

		<!-- 比例选择弹窗 -->
		<view v-if="showPortionModal" class="modal-overlay" @tap="showPortionModal = false">
			<view class="modal-sheet" @tap.stop>
				<view class="modal-handle"></view>
				<text class="modal-title">选择食用比例</text>
				<view class="portion-options">
					<view
						v-for="p in [50, 80, 100, '自定义']"
						:key="p"
						class="portion-option"
						:class="{ active: percentage === p || (p === '自定义' && isCustomPercent) }"
						@tap="selectPortion(p)"
						@click="selectPortion(p)"
					>
						<text>{{ p === '自定义' ? '自定义' : p + '%' }}</text>
					</view>
				</view>
				<view v-if="isCustomPercent" class="custom-input-wrap">
					<input
						class="custom-input"
						type="digit"
						v-model="customPercentage"
						placeholder="输入百分比"
						@confirm="applyCustomPercent"
					/>
					<text class="custom-suffix">%</text>
				</view>
			</view>
		</view>

		<!-- 纠正弹窗 -->
		<view v-if="showCorrectModal" class="modal-overlay" @tap="showCorrectModal = false">
			<view class="modal-sheet" @tap.stop>
				<view class="modal-handle"></view>
				<text class="modal-title">纠正食物信息</text>
				<view class="correct-form">
					<view class="form-item">
						<text class="form-label">食物名称</text>
						<input class="form-input" v-model="correctFoodName" />
					</view>
					<view class="form-item">
						<text class="form-label">卡路里 (kcal)</text>
						<input class="form-input" v-model="correctCalories" type="digit" />
					</view>
					<view class="form-item">
						<text class="form-label">重量 (g)</text>
						<input class="form-input" v-model="correctWeight" type="digit" />
					</view>
				</view>
				<view class="modal-confirm-btn" @tap="confirmCorrect" @click="confirmCorrect">
					<text class="modal-confirm-text">确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { addFoodRecord } from '@/store/index.js'
	import { getMealType } from '@/utils/index.js'

	export default {
		data() {
			return {
				imageUrl: '',
				isThinking: true,
				showCalorieAnim: false,
				slideClass: '',
				// 多食物数据（支持滑动切换）
				foodList: [],
				currentIndex: 0,
				percentage: 100,
				isCustomPercent: false,
				customPercentage: '',
				note: '',
				showPortionModal: false,
				showCorrectModal: false,
				// 纠正表单
				correctFoodName: '',
				correctCalories: '',
				correctWeight: '',
				// 触摸手势
				touchStartX: 0,
				touchStartY: 0
			}
		},
		computed: {
			currentFood() {
				if (this.foodList.length === 0) {
					return {
						foodName: '巧克力樱桃千层蛋糕',
						calories: 650,
						weight: 180,
						imageUrl: this.imageUrl
					}
				}
				return this.foodList[this.currentIndex]
			},
			prevFood() {
				if (this.foodList.length === 0 || this.currentIndex <= 0) return null
				return this.foodList[this.currentIndex - 1]
			},
			nextFood() {
				if (this.foodList.length === 0 || this.currentIndex >= this.foodList.length - 1) return null
				return this.foodList[this.currentIndex + 1]
			},
			actualCalories() {
				return Math.round(Number(this.currentFood.calories) * this.percentage / 100)
			}
		},
		onLoad(options) {
			if (options.imageUrl) {
				this.imageUrl = decodeURIComponent(options.imageUrl)
			}
			// 首次进入显示思考中，1秒后显示结果
			this.isThinking = true
			this.showCalorieAnim = false
			setTimeout(() => {
				this.isThinking = false
				this.simulateAIResult()
				this.$nextTick(() => {
					this.showCalorieAnim = true
				})
			}, 1000)
		},
		methods: {
			simulateAIResult() {
				// 模拟AI识别结果，可能一次有多图
				const foods = [
					{ name: '巧克力樱桃千层蛋糕', calories: 650, weight: 180, imageUrl: this.imageUrl },
					{ name: '鸡胸肉沙拉', calories: 280, weight: 200, imageUrl: this.imageUrl },
					{ name: '红烧牛肉面', calories: 520, weight: 350, imageUrl: this.imageUrl },
					{ name: '蓝莓酸奶', calories: 150, weight: 200, imageUrl: this.imageUrl },
					{ name: '三明治', calories: 380, weight: 150, imageUrl: this.imageUrl }
				]
				// 随机取1-3个食物
				const count = Math.floor(Math.random() * 3) + 1
				const shuffled = foods.sort(() => 0.5 - Math.random())
				this.foodList = shuffled.slice(0, count).map(f => ({
					foodName: f.name,
					calories: f.calories,
					weight: f.weight,
					imageUrl: f.imageUrl
				}))
				this.currentIndex = 0
				this.correctFoodName = this.currentFood.foodName
				this.correctCalories = String(this.currentFood.calories)
				this.correctWeight = String(this.currentFood.weight)
			},
			goHome() {
				uni.switchTab({ url: '/pages/home/home' })
			},
			togglePortion() {
				this.showPortionModal = true
			},
			selectPortion(p) {
				if (p === '自定义') {
					this.isCustomPercent = true
					return
				}
				this.percentage = p
				this.isCustomPercent = false
				this.showPortionModal = false
			},
			applyCustomPercent() {
				const val = parseFloat(this.customPercentage)
				if (!isNaN(val) && val > 0 && val <= 200) {
					this.percentage = val
					this.showPortionModal = false
				} else {
					uni.showToast({ title: '请输入1-200之间的数字', icon: 'none' })
				}
			},
			openCorrectModal() {
				this.correctFoodName = this.currentFood.foodName
				this.correctCalories = String(this.currentFood.calories)
				this.correctWeight = String(this.currentFood.weight)
				this.showCorrectModal = true
			},
			confirmCorrect() {
				if (this.currentIndex >= 0 && this.currentIndex < this.foodList.length) {
					this.foodList[this.currentIndex] = {
						...this.foodList[this.currentIndex],
						foodName: this.correctFoodName,
						calories: Number(this.correctCalories) || 0,
						weight: Number(this.correctWeight) || 0
					}
				}
				this.showCorrectModal = false
			},
			removeFood() {
				if (this.foodList.length <= 1) {
					uni.showToast({ title: '至少保留一个食物', icon: 'none' })
					return
				}
				this.foodList.splice(this.currentIndex, 1)
				if (this.currentIndex >= this.foodList.length) {
					this.currentIndex = this.foodList.length - 1
				}
				this.correctFoodName = this.currentFood.foodName
				this.correctCalories = String(this.currentFood.calories)
				this.correctWeight = String(this.currentFood.weight)
			},
			confirmRecord() {
				this.foodList.forEach(food => {
					addFoodRecord({
						foodName: food.foodName,
						calories: Number(food.calories),
						weight: Number(food.weight),
						percentage: this.percentage,
						actualCalories: Math.round(Number(food.calories) * this.percentage / 100),
						imageUrl: food.imageUrl,
						note: this.note,
						mealType: getMealType(new Date()),
						aiConfidence: 0.85
					})
				})
				uni.showToast({ title: '记录成功', icon: 'success' })
				setTimeout(() => {
					uni.switchTab({ url: '/pages/home/home' })
				}, 800)
			},
			// 横向滑动手势
			touchStart(e) {
				this.touchStartX = e.changedTouches[0].clientX
				this.touchStartY = e.changedTouches[0].clientY
			},
			touchEnd(e) {
				if (this.isThinking) return
				const endX = e.changedTouches[0].clientX
				const endY = e.changedTouches[0].clientY
				const deltaX = endX - this.touchStartX
				const deltaY = endY - this.touchStartY
				// 水平滑动且位移大于50px
				if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
					if (deltaX < 0 && this.currentIndex < this.foodList.length - 1) {
						// 向左滑，下一张
						this.slideClass = 'sliding-left'
						setTimeout(() => {
							this.currentIndex++
							this.slideClass = ''
							this.correctFoodName = this.currentFood.foodName
							this.correctCalories = String(this.currentFood.calories)
							this.correctWeight = String(this.currentFood.weight)
						}, 350)
					} else if (deltaX > 0 && this.currentIndex > 0) {
						// 向右滑，上一张
						this.slideClass = 'sliding-right'
						setTimeout(() => {
							this.currentIndex--
							this.slideClass = ''
							this.correctFoodName = this.currentFood.foodName
							this.correctCalories = String(this.currentFood.calories)
							this.correctWeight = String(this.currentFood.weight)
						}, 350)
					}
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.result-page {
		min-height: 100vh;
		background-color: #FFFFFF;
		position: relative;
		overflow: hidden;
	}

	/* 点状网格背景 */
	.dot-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: radial-gradient(#E5E5EA 2px, transparent 2px);
		background-size: 20px 20px;
		opacity: 0.8;
		pointer-events: none;
		z-index: 0;
	}

	/* 状态栏占位 */
	.status-bar-placeholder {
		height: 59px;
	}

	/* 顶部导航区 */
	.top-nav {
		position: absolute;
		top: 59px;
		left: 20px;
		right: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 10;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.portion-selector {
		padding: 6px 12px;
		background-color: #F2F2F7;
		border-radius: 16px;
		display: flex;
		align-items: center;
	}

	.portion-text {
		font-size: 13px;
		color: #1C1C1E;
		font-weight: 500;
	}

	.portion-arrow {
		font-size: 9px;
		color: #1C1C1E;
		margin-left: 4px;
	}

	/* 中央视觉区 */
	.visual-area {
		position: absolute;
		top: 140px;
		left: 50%;
		transform: translateX(-50%);
		width: 220px;
		height: 220px;
		z-index: 1;
	}

	.thinking-wrap {
		width: 220px;
		height: 220px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.thinking-text {
		font-size: 18px;
		font-weight: 500;
		color: #FF6B35;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%, 100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	.slide-container {
		position: relative;
		width: 220px;
		height: 220px;
	}

	.food-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 220px;
		height: 220px;
		border: 3px solid #FFFFFF;
		border-radius: 16px;
		object-fit: cover;
		filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12));
		transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
			opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.prev-image {
		transform: translateX(-264px) scale(0.9);
		opacity: 0.4;
		z-index: 1;
	}

	.current-image {
		transform: translateX(0) scale(1);
		opacity: 1;
		z-index: 2;
	}

	.next-image {
		transform: translateX(264px) scale(0.9);
		opacity: 0.4;
		z-index: 1;
	}

	/* 滑动动画状态 */
	.slide-container.sliding-left .current-image {
		transform: translateX(-264px) scale(0.9);
		opacity: 0.4;
		z-index: 1;
	}

	.slide-container.sliding-left .next-image {
		transform: translateX(0) scale(1);
		opacity: 1;
		z-index: 2;
	}

	.slide-container.sliding-right .current-image {
		transform: translateX(264px) scale(0.9);
		opacity: 0.4;
		z-index: 1;
	}

	.slide-container.sliding-right .prev-image {
		transform: translateX(0) scale(1);
		opacity: 1;
		z-index: 2;
	}

	/* 卡路里数据 */
	.calorie-display {
		position: absolute;
		top: 380px;
		left: 0;
		right: 0;
		text-align: center;
		z-index: 1;
	}

	.calorie-display.calorie-pop {
		animation: caloriePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes caloriePop {
		from {
			transform: translateY(16px) scale(0.92);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	.calorie-number {
		font-size: 36px;
		font-weight: 800;
		color: #FF6B35;
		letter-spacing: -0.5px;
	}

	.calorie-unit {
		font-size: 16px;
		font-weight: 500;
		color: #FF6B35;
		margin-left: 2px;
	}

	/* 底部Sheet卡片 */
	.bottom-sheet {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 460px;
		background: #FFFFFF;
		border-radius: 28px 28px 0 0;
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
		padding: 24px 20px;
		display: flex;
		flex-direction: column;
		z-index: 5;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
	}

	.food-name {
		font-size: 20px;
		font-weight: 600;
		color: #1C1C1E;
		flex: 1;
		padding-right: 12px;
	}

	.correct-btn {
		display: flex;
		align-items: center;
	}

	.correct-text {
		font-size: 13px;
		color: #8E8E93;
	}

	/* 识别结果标签 */
	.result-tag-row {
		display: flex;
		align-items: center;
		background: #F1F8E9;
		border-radius: 10px;
		padding: 10px 12px;
		margin-bottom: 16px;
		position: relative;
		overflow: hidden;
	}

	.tag-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: #8BC34A;
	}

	.tag-info {
		margin-left: 8px;
		flex: 1;
	}

	.tag-name-wrap {
		display: flex;
		align-items: center;
	}

	.tag-name {
		font-size: 14px;
		font-weight: 500;
		color: #1C1C1E;
	}

	.tag-delete {
		font-size: 14px;
		color: #C7C7CC;
		margin-left: 6px;
		padding: 2px;
	}

	.tag-detail {
		font-size: 12px;
		color: #8E8E93;
		margin-top: 2px;
		display: block;
	}

	/* 备注输入区 */
	.note-section {
		background: #F2F2F7;
		border-radius: 12px;
		padding: 14px 16px;
		min-height: 80px;
		flex: 1;
		margin-bottom: 16px;
	}

	.note-input {
		width: 100%;
		min-height: 80px;
		font-size: 15px;
		color: #1C1C1E;
		line-height: 1.5;
	}

	.note-placeholder {
		color: #C7C7CC;
		font-size: 15px;
	}

	/* 确认按钮 */
	.confirm-btn {
		background-color: #8BC34A;
		border-radius: 24px;
		padding: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.confirm-btn:active {
		opacity: 0.9;
	}

	.confirm-text {
		color: #FFFFFF;
		font-size: 16px;
		font-weight: 600;
	}

	/* 弹窗遮罩 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 100;
	}

	.modal-sheet {
		width: 100%;
		background-color: #FFFFFF;
		border-top-left-radius: 24px;
		border-top-right-radius: 24px;
		padding: 16px 24px 32px;
		padding-bottom: calc(32px + constant(safe-area-inset-bottom));
		padding-bottom: calc(32px + env(safe-area-inset-bottom));
	}

	.modal-handle {
		width: 36px;
		height: 4px;
		background-color: #E5E5EA;
		border-radius: 2px;
		margin: 0 auto 16px;
	}

	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: #1C1C1E;
		margin-bottom: 20px;
		display: block;
	}

	/* 比例选项 */
	.portion-options {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
	}

	.portion-option {
		flex: 1;
		height: 48px;
		border-radius: 14px;
		background-color: #F2F2F7;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 15px;
		color: #1C1C1E;
		font-weight: 500;
	}

	.portion-option.active {
		background-color: #8BC34A;
		color: #FFFFFF;
	}

	.custom-input-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 4px;
	}

	.custom-input {
		flex: 1;
		height: 48px;
		background-color: #F2F2F7;
		border-radius: 14px;
		padding: 0 16px;
		font-size: 16px;
		color: #1C1C1E;
	}

	.custom-suffix {
		font-size: 16px;
		color: #1C1C1E;
		font-weight: 500;
	}

	/* 纠正表单 */
	.correct-form {
		margin-bottom: 20px;
	}

	.form-item {
		margin-bottom: 14px;
	}

	.form-label {
		font-size: 13px;
		color: #8E8E93;
		margin-bottom: 6px;
		display: block;
	}

	.form-input {
		height: 48px;
		background-color: #F2F2F7;
		border-radius: 14px;
		padding: 0 16px;
		font-size: 16px;
		color: #1C1C1E;
	}

	.modal-confirm-btn {
		height: 52px;
		border-radius: 16px;
		background-color: #8BC34A;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-confirm-btn:active {
		opacity: 0.9;
	}

	.modal-confirm-text {
		color: #FFFFFF;
		font-size: 16px;
		font-weight: 600;
	}
</style>
