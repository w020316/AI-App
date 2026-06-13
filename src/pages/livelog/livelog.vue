<template>
	<view class="livelog-page">
		<!-- 顶部标题区 -->
		<view class="header">
			<view class="title-row">
				<view class="title-group">
					<text class="main-title">今日LiveLog</text>
					<text v-if="elementCount > 0" class="count-badge">{{ elementCount }}</text>
				</view>
				<text class="save-action" @tap="saveToAlbum">保存至相册</text>
			</view>
			<text class="sub-title">可自由拖动图片，将其保存为实况</text>
		</view>

		<!-- 主画布 -->
		<view class="canvas-wrap">
			<view
				class="canvas-area"
				:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', backgroundColor: backgroundColor }"
				@touchstart="onCanvasTouchStart"
				@touchmove="onCanvasTouchMove"
				@touchend="onCanvasTouchEnd"
				@mousedown="onCanvasMouseDown"
				@mousemove="onCanvasMouseMove"
				@mouseup="onCanvasMouseUp"
			>
				<!-- 涂鸦Canvas -->
				<canvas
					canvas-id="doodleCanvas"
					id="doodleCanvas"
					class="doodle-canvas"
					:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
				></canvas>

				<!-- 实况标签 -->
				<view class="live-tag">
					<view class="live-icon">
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<circle cx="7" cy="7" r="6" stroke="#FFFFFF" stroke-width="2.5"/>
							<circle cx="7" cy="7" r="2.5" fill="#FFFFFF"/>
						</svg>
					</view>
					<text class="live-text">实况</text>
				</view>

				<!-- 贴纸层 -->
				<view
					v-for="(sticker, index) in stickers"
					:key="sticker.id"
					class="sticker-item"
					:style="getStickerStyle(sticker)"
					@touchstart.stop="onStickerTouchStart($event, index)"
					@touchmove.stop="onStickerTouchMove($event, index)"
					@touchend.stop="onStickerTouchEnd"
					@mousedown.stop="onStickerMouseDown($event, index)"
					@mousemove.stop="onStickerMouseMove($event, index)"
					@mouseup.stop="onStickerMouseUp"
				>
					<image class="sticker-img" :src="sticker.imageUrl" mode="aspectFill"></image>
				</view>

				<!-- 文字层 -->
				<view
					v-for="(text, index) in texts"
					:key="text.id"
					class="text-item"
					:style="getTextStyle(text)"
					@touchstart.stop="onTextTouchStart($event, index)"
					@touchmove.stop="onTextTouchMove($event, index)"
					@touchend.stop="onTextTouchEnd"
					@mousedown.stop="onTextMouseDown($event, index)"
					@mousemove.stop="onTextMouseMove($event, index)"
					@mouseup.stop="onTextMouseUp"
				>
					<text class="handwrite-text" :style="text.style">{{ text.content }}</text>
				</view>

				<!-- 装饰层 -->
				<view
					v-for="(deco, index) in decorations"
					:key="deco.id"
					class="deco-item"
					:style="getDecoStyle(deco)"
					@touchstart.stop="onDecoTouchStart($event, index)"
					@touchmove.stop="onDecoTouchMove($event, index)"
					@touchend.stop="onDecoTouchEnd"
					@mousedown.stop="onDecoMouseDown($event, index)"
					@mousemove.stop="onDecoMouseMove($event, index)"
					@mouseup.stop="onDecoMouseUp"
				>
					<text class="deco-emoji">{{ deco.content }}</text>
				</view>
			</view>

			<!-- 底部悬浮工具栏 -->
			<view class="float-toolbar" :class="{ 'toolbar-visible': toolbarVisible }">
				<view class="tool-item" @tap="selectDuration">
					<text class="tool-label duration-label">5s ▾</text>
				</view>
				<view class="tool-item" @tap="addText">
					<text class="tool-label text-label">Aa</text>
				</view>
				<view class="tool-item" @tap="addDecoration">
					<text class="tool-label star-label">✦</text>
				</view>
				<view class="tool-item" @tap="changeBackground">
					<text class="tool-label">背景</text>
				</view>
				<view class="tool-item" @tap="goToDoodle">
					<text class="tool-label">涂鸦</text>
				</view>
				<view class="tool-item" @tap="toggleMute">
					<text class="tool-label mute-label">{{ isMuted ? '🔇' : '🔊' }}</text>
				</view>
			</view>
		</view>

		<!-- 导出用隐藏canvas -->
		<canvas
			canvas-id="exportCanvas"
			id="exportCanvas"
			class="export-canvas"
			:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
		></canvas>
	</view>

	<!-- 文字输入弹窗 -->
	<view v-if="showTextModal" class="modal-overlay" @tap="showTextModal = false">
		<view class="modal-content" @tap.stop>
			<text class="modal-title">添加文字</text>
			<input
				class="text-input"
				v-model="textInput"
				placeholder="输入文字..."
				placeholder-class="placeholder-style"
				focus
			/>
			<view class="modal-btn" @tap="confirmAddText">
				<text class="modal-btn-text">添加</text>
			</view>
		</view>
	</view>

	<!-- 装饰选择弹窗 -->
	<view v-if="showDecoModal" class="modal-overlay" @tap="showDecoModal = false">
		<view class="modal-content" @tap.stop>
			<text class="modal-title">选择装饰</text>
			<view class="deco-grid">
				<view
					v-for="deco in decorationOptions"
					:key="deco"
					class="deco-grid-item"
					@tap="confirmAddDecoration(deco)"
				>
					<text class="deco-grid-emoji">{{ deco }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getFoodRecords, saveLiveLog, getLiveLogs, initMockData } from '@/store/index.js'

	export default {
		data() {
			return {
				canvasWidth: 353,
				canvasHeight: 470,
				backgroundColor: '#000000',
				stickers: [],
				texts: [],
				decorations: [],
				doodlePaths: [],
				logId: '',
				isMuted: false,
				toolbarVisible: false,
				showTextModal: false,
				showDecoModal: false,
				textInput: '',
				decorationOptions: ['⭐', '❤️', '🌸', '✨', '🌈', '🎀', '💫', '🌻', '🦋', '🌙', '😊', '🌟'],
				// 拖拽状态
				dragType: '',
				dragIndex: -1,
				dragStartX: 0,
				dragStartY: 0,
				dragOffsetX: 0,
				dragOffsetY: 0,
				_mouseDragging: false,
				_mouseType: '',
				_mouseIndex: -1
			}
		},
		computed: {
			elementCount() {
				return this.stickers.length + this.texts.length + this.decorations.length
			}
		},
		onLoad(options) {
			initMockData()
			const sysInfo = uni.getSystemInfoSync()
			this.canvasWidth = sysInfo.windowWidth - 40
			this.canvasHeight = 470

			// 加载已有LiveLog或生成新贴纸
			this.loadLiveLog()

			// 如果从食物详情跳转，添加对应贴纸
			if (options.foodId) {
				this.addFoodSticker(options.foodId)
			}

			// 延迟显示工具栏动画
			setTimeout(() => {
				this.toolbarVisible = true
			}, 100)
		},
		onReady() {
			this.redrawDoodles()
		},
		methods: {
			// ========== 数据加载 ==========
			loadLiveLog() {
				const logs = getLiveLogs(new Date())
				if (logs.length > 0) {
					const log = logs[0]
					this.logId = log.id || ''
					this.backgroundColor = log.background || '#000000'
					this.stickers = log.stickers || []
					this.texts = log.texts || []
					this.decorations = log.decorations || []
					this.doodlePaths = log.doodlePaths || []
				} else {
					this.generateStickersFromRecords()
				}
			},
			generateStickersFromRecords() {
				const records = getFoodRecords(new Date())
				this.stickers = records.map((r, i) => ({
					id: 'sticker_' + r.id,
					imageUrl: r.imageUrl || '',
					x: 30 + (i % 3) * 90,
					y: 30 + Math.floor(i / 3) * 100,
					width: 80,
					height: 80,
					rotation: (Math.random() - 0.5) * 20
				}))
			},
			addFoodSticker(foodId) {
				const records = getFoodRecords(new Date())
				const record = records.find(r => r.id === foodId)
				if (record && record.imageUrl) {
					const exists = this.stickers.find(s => s.id === 'sticker_' + record.id)
					if (!exists) {
						this.stickers.push({
							id: 'sticker_' + record.id,
							imageUrl: record.imageUrl,
							x: 50 + Math.random() * (this.canvasWidth - 150),
							y: 50 + Math.random() * (this.canvasHeight - 150),
							width: 80,
							height: 80,
							rotation: (Math.random() - 0.5) * 20
						})
					}
				}
			},

			// ========== 样式计算 ==========
			getStickerStyle(sticker) {
				return {
					left: sticker.x + 'px',
					top: sticker.y + 'px',
					width: (sticker.width || 80) + 'px',
					height: (sticker.height || 80) + 'px',
					transform: `rotate(${sticker.rotation || 0}deg)`
				}
			},
			getTextStyle(text) {
				return {
					left: text.x + 'px',
					top: text.y + 'px',
					transform: `rotate(${text.rotation || 0}deg)`
				}
			},
			getDecoStyle(deco) {
				return {
					left: deco.x + 'px',
					top: deco.y + 'px',
					transform: `rotate(${deco.rotation || 0}deg) scale(${deco.scale || 1})`
				}
			},

			// ========== 拖拽通用逻辑 ==========
			startDrag(type, index, clientX, clientY) {
				let target
				if (type === 'sticker') target = this.stickers[index]
				else if (type === 'text') target = this.texts[index]
				else if (type === 'deco') target = this.decorations[index]
				else return

				this.dragType = type
				this.dragIndex = index
				this.dragStartX = clientX
				this.dragStartY = clientY
				this.dragOffsetX = target.x
				this.dragOffsetY = target.y
			},
			doDrag(clientX, clientY) {
				if (this.dragIndex === -1 || !this.dragType) return
				const dx = clientX - this.dragStartX
				const dy = clientY - this.dragStartY
				let target
				if (this.dragType === 'sticker') target = this.stickers[this.dragIndex]
				else if (this.dragType === 'text') target = this.texts[this.dragIndex]
				else if (this.dragType === 'deco') target = this.decorations[this.dragIndex]
				if (target) {
					target.x = this.dragOffsetX + dx
					target.y = this.dragOffsetY + dy
				}
			},
			endDrag() {
				this.dragType = ''
				this.dragIndex = -1
			},

			// ========== 贴纸拖拽（touch） ==========
			onStickerTouchStart(e, index) {
				const touch = e.touches[0]
				this.startDrag('sticker', index, touch.clientX, touch.clientY)
			},
			onStickerTouchMove(e, index) {
				const touch = e.touches[0]
				this.doDrag(touch.clientX, touch.clientY)
			},
			onStickerTouchEnd() {
				this.endDrag()
			},
			// 贴纸拖拽（mouse H5）
			onStickerMouseDown(e, index) {
				this._mouseDragging = true
				this._mouseType = 'sticker'
				this._mouseIndex = index
				this.startDrag('sticker', index, e.clientX, e.clientY)
			},
			onStickerMouseMove(e, index) {
				if (!this._mouseDragging) return
				this.doDrag(e.clientX, e.clientY)
			},
			onStickerMouseUp() {
				this._mouseDragging = false
				this.endDrag()
			},

			// ========== 文字拖拽（touch） ==========
			onTextTouchStart(e, index) {
				const touch = e.touches[0]
				this.startDrag('text', index, touch.clientX, touch.clientY)
			},
			onTextTouchMove(e, index) {
				const touch = e.touches[0]
				this.doDrag(touch.clientX, touch.clientY)
			},
			onTextTouchEnd() {
				this.endDrag()
			},
			// 文字拖拽（mouse H5）
			onTextMouseDown(e, index) {
				this._mouseDragging = true
				this._mouseType = 'text'
				this._mouseIndex = index
				this.startDrag('text', index, e.clientX, e.clientY)
			},
			onTextMouseMove(e, index) {
				if (!this._mouseDragging) return
				this.doDrag(e.clientX, e.clientY)
			},
			onTextMouseUp() {
				this._mouseDragging = false
				this.endDrag()
			},

			// ========== 装饰拖拽（touch） ==========
			onDecoTouchStart(e, index) {
				const touch = e.touches[0]
				this.startDrag('deco', index, touch.clientX, touch.clientY)
			},
			onDecoTouchMove(e, index) {
				const touch = e.touches[0]
				this.doDrag(touch.clientX, touch.clientY)
			},
			onDecoTouchEnd() {
				this.endDrag()
			},
			// 装饰拖拽（mouse H5）
			onDecoMouseDown(e, index) {
				this._mouseDragging = true
				this._mouseType = 'deco'
				this._mouseIndex = index
				this.startDrag('deco', index, e.clientX, e.clientY)
			},
			onDecoMouseMove(e, index) {
				if (!this._mouseDragging) return
				this.doDrag(e.clientX, e.clientY)
			},
			onDecoMouseUp() {
				this._mouseDragging = false
				this.endDrag()
			},

			// ========== 画布触摸（防止穿透） ==========
			onCanvasTouchStart() {},
			onCanvasTouchMove() {},
			onCanvasTouchEnd() {},
			onCanvasMouseDown() {},
			onCanvasMouseMove() {},
			onCanvasMouseUp() {},

			// ========== 工具栏操作 ==========
			selectDuration() {
				uni.showActionSheet({
					itemList: ['3秒', '5秒', '10秒'],
					success: () => {}
				})
			},
			addText() {
				this.textInput = ''
				this.showTextModal = true
			},
			confirmAddText() {
				if (!this.textInput.trim()) {
					this.showTextModal = false
					return
				}
				this.texts.push({
					id: 'text_' + Date.now(),
					content: this.textInput.trim(),
					x: 60,
					y: this.canvasHeight / 2,
					rotation: (Math.random() - 0.5) * 10,
					style: {
						fontFamily: 'cursive, -apple-system, sans-serif',
						fontSize: '22px',
						color: '#FFFFFF',
						fontWeight: 'bold',
						textShadow: '0 1px 3px rgba(0,0,0,0.5)'
					}
				})
				this.textInput = ''
				this.showTextModal = false
			},
			addDecoration() {
				this.showDecoModal = true
			},
			confirmAddDecoration(deco) {
				this.decorations.push({
					id: 'deco_' + Date.now(),
					content: deco,
					x: 40 + Math.random() * (this.canvasWidth - 80),
					y: 40 + Math.random() * (this.canvasHeight - 80),
					rotation: (Math.random() - 0.5) * 30,
					scale: 0.8 + Math.random() * 0.5
				})
				this.showDecoModal = false
			},
			changeBackground() {
				const options = ['#000000', '#1C1C1E', '#FFFFFF', '#F5F5F0', '#2C1810', '#0A1929']
				const currentIndex = options.indexOf(this.backgroundColor)
				const nextIndex = (currentIndex + 1) % options.length
				this.backgroundColor = options[nextIndex]
				this.redrawDoodles()
			},
			goToDoodle() {
				// 保存当前状态
				this.saveLiveLogData()
				// 传递画布数据到doodle页面
				const canvasData = {
					backgroundColor: this.backgroundColor,
					canvasWidth: this.canvasWidth,
					canvasHeight: this.canvasHeight,
					doodlePaths: this.doodlePaths
				}
				uni.navigateTo({
					url: '/pages/doodle/doodle',
					success: (res) => {
						res.eventChannel.emit('acceptCanvasData', canvasData)
						res.eventChannel.on('doodleComplete', (data) => {
							if (data && data.doodlePaths) {
								this.doodlePaths = data.doodlePaths
								this.redrawDoodles()
							}
						})
					}
				})
			},
			toggleMute() {
				this.isMuted = !this.isMuted
			},

			// ========== 涂鸦绘制 ==========
			redrawDoodles() {
				const ctx = uni.createCanvasContext('doodleCanvas', this)
				ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
				this.doodlePaths.forEach(path => {
					this.drawPath(ctx, path)
				})
				ctx.draw()
			},
			drawPath(ctx, path) {
				if (!path.points || path.points.length < 2) return
				ctx.beginPath()
				ctx.moveTo(path.points[0].x, path.points[0].y)
				for (let i = 1; i < path.points.length; i++) {
					ctx.lineTo(path.points[i].x, path.points[i].y)
				}
				ctx.setStrokeStyle(path.color || '#FFFFFF')
				ctx.setLineWidth(path.width || 3)
				ctx.setLineCap('round')
				ctx.setLineJoin('round')
				if (path.shadow) {
					ctx.setShadow(0, 0, path.shadowBlur || 0, path.shadowColor || 'transparent')
				}
				ctx.stroke()
				ctx.setShadow(0, 0, 0, 'transparent')
			},

			// ========== 保存 ==========
			saveToAlbum() {
				this.saveLiveLogData()
				uni.showLoading({ title: '保存中...' })

				// 使用导出canvas绘制完整内容
				const ctx = uni.createCanvasContext('exportCanvas', this)

				// 背景
				ctx.setFillStyle(this.backgroundColor)
				ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

				// 绘制贴纸（简化：用占位矩形代替异步图片加载）
				this.stickers.forEach(s => {
					ctx.setFillStyle('rgba(255,255,255,0.2)')
					ctx.fillRect(s.x, s.y, s.width || 80, s.height || 80)
				})

				// 绘制文字
				this.texts.forEach(t => {
					ctx.save()
					ctx.translate(t.x, t.y)
					ctx.rotate((t.rotation || 0) * Math.PI / 180)
					ctx.setFillStyle(t.style && t.style.color ? t.style.color : '#FFFFFF')
					ctx.setFontSize(22)
					ctx.fillText(t.content, 0, 0)
					ctx.restore()
				})

				// 绘制装饰
				this.decorations.forEach(d => {
					ctx.save()
					ctx.translate(d.x, d.y)
					ctx.rotate((d.rotation || 0) * Math.PI / 180)
					ctx.setFontSize(24 * (d.scale || 1))
					ctx.fillText(d.content, 0, 0)
					ctx.restore()
				})

				// 绘制涂鸦
				this.doodlePaths.forEach(path => {
					this.drawPath(ctx, path)
				})

				ctx.draw(false, () => {
					uni.canvasToTempFilePath({
						canvasId: 'exportCanvas',
						success: (res) => {
							// #ifdef H5
							// H5不支持saveImageToPhotosAlbum，改为下载
							const a = document.createElement('a')
							a.href = res.tempFilePath
							a.download = 'LiveLog_' + Date.now() + '.png'
							a.click()
							uni.hideLoading()
							uni.showToast({ title: '已下载', icon: 'success' })
							// #endif
							// #ifndef H5
							uni.saveImageToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									uni.hideLoading()
									uni.showToast({ title: '已保存至相册', icon: 'success' })
								},
								fail: () => {
									uni.hideLoading()
									uni.showToast({ title: '保存失败', icon: 'none' })
								}
							})
							// #endif
						},
						fail: () => {
							uni.hideLoading()
							uni.showToast({ title: '导出失败', icon: 'none' })
						}
					}, this)
				})
			},
			saveLiveLogData() {
				saveLiveLog({
					id: this.logId,
					date: new Date(),
					background: this.backgroundColor,
					stickers: this.stickers,
					texts: this.texts,
					decorations: this.decorations,
					doodlePaths: this.doodlePaths
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.livelog-page {
		min-height: 100vh;
		background-color: #FFFFFF;
		padding-top: 59px;
		box-sizing: border-box;
	}

	/* 顶部导航 */
	.header {
		width: 100%;
		padding: 0 20px;
		box-sizing: border-box;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.main-title {
		font-size: 22px;
		font-weight: 700;
		color: #1C1C1E;
		margin: 0;
	}

	.count-badge {
		font-size: 20px;
		font-weight: 700;
		color: #8BC34A;
	}

	.save-action {
		font-size: 14px;
		color: #8E8E93;
		font-weight: 400;
	}

	.sub-title {
		font-size: 13px;
		color: #C7C7CC;
		margin-top: 4px;
		display: block;
	}

	/* 画布外框 */
	.canvas-wrap {
		position: relative;
		margin: 16px 20px 0;
	}

	/* 画布区域 */
	.canvas-area {
		width: calc(100vw - 40px);
		height: 470px;
		border-radius: 24px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.doodle-canvas {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 1;
	}

	/* 实况标签 */
	.live-tag {
		position: absolute;
		top: 12px;
		left: 12px;
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(8px);
		padding: 4px 10px;
		border-radius: 12px;
		z-index: 5;
	}

	.live-icon {
		width: 14px;
		height: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.live-text {
		color: #FFFFFF;
		font-size: 11px;
		font-weight: 500;
	}

	/* 贴纸 */
	.sticker-item {
		position: absolute;
		z-index: 3;
		width: 80px;
		height: 80px;
		cursor: grab;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.sticker-img {
		width: 100%;
		height: 100%;
		border-radius: 12px;
		border: 2.5px solid #FFFFFF;
		object-fit: cover;
		display: block;
	}

	/* 文字 */
	.text-item {
		position: absolute;
		z-index: 4;
		cursor: grab;
	}

	.handwrite-text {
		font-family: cursive, -apple-system, sans-serif;
		white-space: nowrap;
	}

	/* 装饰 */
	.deco-item {
		position: absolute;
		z-index: 3;
		cursor: grab;
	}

	.deco-emoji {
		font-size: 28px;
		display: block;
	}

	/* 悬浮工具栏 */
	.float-toolbar {
		position: absolute;
		bottom: 34px;
		left: 0;
		width: 100%;
		height: 48px;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(16px);
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: space-around;
		z-index: 10;
		transform: translateY(20px);
		opacity: 0;
		transition: all 0.3s ease-out;
	}

	.float-toolbar.toolbar-visible {
		transform: translateY(0);
		opacity: 1;
	}

	.tool-item {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tool-label {
		color: #FFFFFF;
		font-size: 13px;
		font-weight: 500;
	}

	.duration-label {
		font-size: 13px;
		font-weight: 500;
	}

	.text-label {
		font-size: 16px;
		font-weight: 600;
		font-family: serif;
	}

	.star-label {
		font-size: 18px;
	}

	.mute-label {
		font-size: 18px;
	}

	/* 导出隐藏canvas */
	.export-canvas {
		position: fixed;
		left: -9999px;
		top: -9999px;
	}

	/* 弹窗 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 100;
	}

	.modal-content {
		width: 100%;
		background-color: #FFFFFF;
		border-top-left-radius: 24px;
		border-top-right-radius: 24px;
		padding: 24px;
		padding-bottom: calc(24px + constant(safe-area-inset-bottom));
		padding-bottom: calc(24px + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: #1C1C1E;
		display: block;
		margin-bottom: 16px;
	}

	.text-input {
		height: 48px;
		background-color: #F5F5F0;
		border-radius: 16px;
		padding: 0 16px;
		font-size: 16px;
		margin-bottom: 16px;
		width: 100%;
		box-sizing: border-box;
	}

	.placeholder-style {
		color: #8E8E93;
	}

	.modal-btn {
		height: 52px;
		border-radius: 16px;
		background-color: #1C1C1E;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-btn-text {
		color: #FFFFFF;
		font-size: 16px;
		font-weight: 600;
	}

	.deco-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.deco-grid-item {
		width: 56px;
		height: 56px;
		border-radius: 16px;
		background-color: #F5F5F0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.deco-grid-emoji {
		font-size: 28px;
	}
</style>
